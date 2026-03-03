import * as vscode from 'vscode';
import { BlockParser, ParsedBlock } from './blockParser';

/**
 * Tree Item representing a code block in the sidebar
 */
export class BlockTreeItem extends vscode.TreeItem {
	constructor(
		label: string,
		public readonly blockId: number,
		public readonly parentId: number,
		public readonly depth: number,
		public readonly lineNumber: number,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly blockType: 'BLOCK' | 'SUBBLOCK',
		public readonly filePath?: string
	) {
		super(label, collapsibleState);

		// Set up the click-to-jump command
		this.command = {
			command: 'block-navigator.openAndRevealLine',
			title: 'Open and Reveal Block',
			arguments: [filePath, lineNumber]
		};

		// Add tooltip showing line number
		this.tooltip = `Line ${lineNumber + 1}`;

		// Add description for SUBBLOCKs
		this.description = blockType === 'SUBBLOCK' ? `[${blockType}${depth}]` : undefined;

		// Apply color coding based on block type and depth
		this.iconPath = this.getIconPath();
	}

	private getIconPath(): vscode.ThemeIcon | undefined {
		if (this.blockType === 'BLOCK') {
			return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
		} else {
			// Color based on depth for SUBBLOCKs
			const colors = ['charts.green', 'charts.orange', 'charts.red', 'charts.purple', 'charts.yellow'];
			const colorIndex = (this.depth - 1) % colors.length;
			return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor(colors[colorIndex]));
		}
	}
}

/**
 * Tree Item representing a file with blocks in workspace view
 */
export class FileBlockNode extends vscode.TreeItem {
	constructor(
		public readonly filePath: string,
		public readonly relativeLabel: string,
		public readonly blockCount: number
	) {
		super(relativeLabel, vscode.TreeItemCollapsibleState.Collapsed);
		this.iconPath = new vscode.ThemeIcon('file-code');
		this.tooltip = filePath;
		this.description = `${blockCount} block${blockCount !== 1 ? 's' : ''}`;
		this.contextValue = 'fileNode';
	}
}

/**
 * Tree Data Provider for the Block Map View
 */
export class BlockTreeDataProvider implements vscode.TreeDataProvider<BlockTreeItem | FileBlockNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<BlockTreeItem | FileBlockNode | undefined | null | void> = 
		new vscode.EventEmitter<BlockTreeItem | FileBlockNode | undefined | null | void>();
	
	readonly onDidChangeTreeData: vscode.Event<BlockTreeItem | FileBlockNode | undefined | null | void> = 
		this._onDidChangeTreeData.event;

	private blocks: ParsedBlock[] = [];
	private blockItems: Map<number, BlockTreeItem> = new Map();
	private searchQuery: string = '';
	private matchingBlockIds: Set<string> = new Set();
	private expandedItems: Set<number> = new Set(); // Track which items are expanded
	
	// Workspace mode support
	private workspaceMode: boolean = false;
	private workspaceBlocks: Map<string, ParsedBlock[]> = new Map(); // filePath -> blocks
	private fileNodes: Map<string, FileBlockNode> = new Map(); // filePath -> FileBlockNode
	private disposables: vscode.Disposable[] = [];

	constructor() {
		// Refresh when active editor changes
		this.disposables.push(
			vscode.window.onDidChangeActiveTextEditor(() => this.refresh())
		);

		// Refresh when document changes
		this.disposables.push(
			vscode.workspace.onDidChangeTextDocument((e) => {
				if (e.document === vscode.window.activeTextEditor?.document) {
					this.refresh();
				}
			})
		);
	}

	refresh(): void {
		this.loadBlocks();
		this._onDidChangeTreeData.fire(null);
	}

	getSearchQuery(): string {
		return this.searchQuery;
	}

	setSearchQuery(query: string): void {
		this.searchQuery = query.toLowerCase();
		this.updateMatchingBlocks();
	}

	getMatchCount(): number {
		return this.matchingBlockIds.size;
	}

	setExpandAll(expand: boolean): void {
		if (expand) {
			// Expand all items with children
			for (const block of this.blocks) {
				if (this.hasChildren(block)) {
					this.expandedItems.add(block.id);
				}
			}
		} else {
			// Collapse all items
			this.expandedItems.clear();
		}
	}

	getAllVisibleTreeItems(): BlockTreeItem[] {
		return Array.from(this.blockItems.values());
	}

	async setWorkspaceMode(enabled: boolean): Promise<void> {
		this.workspaceMode = enabled;
		if (enabled) {
			await this.loadWorkspaceBlocks();
		} else {
			this.workspaceBlocks.clear();
			this.fileNodes.clear();
			this.loadBlocks(); // Go back to editor mode
		}
		this.refresh();
	}

	private async loadWorkspaceBlocks(): Promise<void> {
		const { WorkspaceBlockScanner } = await import('./workspaceBlockScanner');
		this.workspaceBlocks = await WorkspaceBlockScanner.scanWorkspace();
		
		// Create file nodes
		this.fileNodes.clear();
		for (const [filePath, blocks] of this.workspaceBlocks) {
			const relativeLabel = WorkspaceBlockScanner.getRelativePath(filePath);
			this.fileNodes.set(filePath, new FileBlockNode(filePath, relativeLabel, blocks.length));
		}
	}

	private updateMatchingBlocks(): void {
		this.matchingBlockIds.clear();

		if (!this.searchQuery) {
			this.expandedItems.clear(); // Clear expansions when search is cleared
			return; // No search, show all
		}

		// Get all blocks to search through (either workspace or editor mode)
		const blocksToSearch = this.workspaceMode 
			? Array.from(this.workspaceBlocks.values()).flat()
			: this.blocks;

		// Find all blocks that match the search query
		for (const block of blocksToSearch) {
			if (block.name.toLowerCase().includes(this.searchQuery)) {
				this.matchingBlockIds.add(this.getBlockKey(block));
				
				// Auto-expand all ancestors of matching blocks
				let currentBlock = block;
				while (currentBlock.parentId !== -1) {
					this.expandedItems.add(currentBlock.parentId);
					const parentBlock = blocksToSearch.find(
						b => b.id === currentBlock.parentId && b.filePath === currentBlock.filePath
					);
					if (!parentBlock) break;
					currentBlock = parentBlock;
				}
			}
		}
	}

	private getBlockKey(block: ParsedBlock): string {
		return `${block.filePath ?? ''}::${block.id}`;
	}

	private shouldShowBlock(block: ParsedBlock, blocks: ParsedBlock[]): boolean {
		if (!this.searchQuery) {
			return true; // No search active, show all
		}

		// If this block matches, show it
		if (this.matchingBlockIds.has(this.getBlockKey(block))) {
			return true;
		}

		// If any child matches, show this block (it's an ancestor)
		for (const candidate of blocks) {
			if (
				this.matchingBlockIds.has(this.getBlockKey(candidate)) &&
				this.isAncestor(block.id, candidate.id, blocks)
			) {
				return true;
			}
		}

		return false;
	}

	private isAncestor(potentialAncestorId: number, blockId: number, blocks: ParsedBlock[]): boolean {
		let current = blocks.find(b => b.id === blockId);
		while (current) {
			if (current.parentId === potentialAncestorId) {
				return true;
			}
			current = blocks.find(b => b.id === current!.parentId);
		}
		return false;
	}

	private loadBlocks(): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			this.blocks = [];
			this.blockItems.clear();
			return;
		}

		const document = editor.document;
		const text = document.getText();
		const filePath = document.uri.fsPath;
		this.blocks = BlockParser.parse(text, filePath);
		this.blockItems.clear();
		this.updateMatchingBlocks();

		// Create tree items from blocks
		for (const block of this.blocks) {
			// Determine collapsible state based on expandedItems tracking
			let collapsibleState = vscode.TreeItemCollapsibleState.None;
			if (this.hasChildren(block)) {
				collapsibleState = this.expandedItems.has(block.id)
					? vscode.TreeItemCollapsibleState.Expanded 
					: vscode.TreeItemCollapsibleState.Collapsed;
			}

			const treeItem = new BlockTreeItem(
				block.name,
				block.id,
				block.parentId,
				block.depth,
				block.lineNumber,
				collapsibleState,
				block.blockType,
				filePath
			);

			// Add search indicator
			if (this.searchQuery && this.matchingBlockIds.has(this.getBlockKey(block))) {
				treeItem.label = `✓ ${block.name}`;
			}

			this.blockItems.set(block.id, treeItem);
		}
	}

	private hasChildren(block: ParsedBlock): boolean {
		return this.blocks.some(b => b.parentId === block.id && this.shouldShowBlock(b, this.blocks));
	}

	getTreeItem(element: BlockTreeItem | FileBlockNode): vscode.TreeItem {
		return element;
	}

	getChildren(element?: BlockTreeItem | FileBlockNode): vscode.ProviderResult<(BlockTreeItem | FileBlockNode)[]> {
		// Workspace mode: show file nodes at root
		if (this.workspaceMode) {
			if (!element) {
				// Return file nodes at root
				return Array.from(this.fileNodes.values());
			}
			
			// If element is a file node, return its blocks
			if (element instanceof FileBlockNode) {
				const blocks = this.workspaceBlocks.get(element.filePath) || [];
				return blocks
					.filter(b => b.depth === 0 && this.shouldShowBlock(b, blocks))
					.map(b => {
						const blockItem = new BlockTreeItem(
							b.name,
							b.id,
							b.parentId,
							b.depth,
							b.lineNumber,
							this.getCollapsibleState(b),
							b.blockType,
							b.filePath || ''
						);
						if (this.searchQuery && this.matchingBlockIds.has(this.getBlockKey(b))) {
							blockItem.label = `✓ ${b.name}`;
						}
						return blockItem;
					});
			}
			
			// If element is a block, return its children
			if (element instanceof BlockTreeItem && element.filePath) {
				const blocks = this.workspaceBlocks.get(element.filePath) || [];
				return blocks
					.filter(b => b.parentId === element.blockId && this.shouldShowBlock(b, blocks))
					.map(b => {
						const blockItem = new BlockTreeItem(
							b.name,
							b.id,
							b.parentId,
							b.depth,
							b.lineNumber,
							this.getCollapsibleState(b),
							b.blockType,
							b.filePath || ''
						);
						if (this.searchQuery && this.matchingBlockIds.has(this.getBlockKey(b))) {
							blockItem.label = `✓ ${b.name}`;
						}
						return blockItem;
					});
			}
		}
		
		// Editor mode: original behavior (single file)
		if (!element) {
			// Return root-level blocks
			return this.blocks
				.filter(b => b.depth === 0 && this.shouldShowBlock(b, this.blocks))
				.map(b => this.blockItems.get(b.id)!)
				.filter(item => item !== undefined);
		}

		// Return children of the given element
		if (element instanceof BlockTreeItem) {
			return this.blocks
				.filter(b => b.parentId === element.blockId && this.shouldShowBlock(b, this.blocks))
				.map(b => this.blockItems.get(b.id)!)
				.filter(item => item !== undefined);
		}
		
		return [];
	}

	getParent?(element: BlockTreeItem | FileBlockNode): vscode.ProviderResult<BlockTreeItem | FileBlockNode | undefined> {
		if (element instanceof FileBlockNode) {
			return undefined;
		}
		
		if (this.workspaceMode && element instanceof BlockTreeItem && element.filePath) {
			if (element.parentId === -1) {
				// Return the file node as parent for root blocks
				return this.fileNodes.get(element.filePath);
			}
			// Return the parent block
			const blocks = this.workspaceBlocks.get(element.filePath) || [];
			const parentBlock = blocks.find(b => b.id === element.parentId);
			if (parentBlock) {
				return new BlockTreeItem(
					parentBlock.name,
					parentBlock.id,
					parentBlock.parentId,
					parentBlock.depth,
					parentBlock.lineNumber,
					this.getCollapsibleState(parentBlock),
					parentBlock.blockType,
					parentBlock.filePath || ''
				);
			}
		}
		
		if (element instanceof BlockTreeItem) {
			if (element.parentId === -1) {
				return undefined;
			}
			return this.blockItems.get(element.parentId);
		}
		
		return undefined;
	}

	private getCollapsibleState(block: ParsedBlock): vscode.TreeItemCollapsibleState {
		const blocks = this.workspaceMode 
			? (this.workspaceBlocks.get(block.filePath || '') || [])
			: this.blocks;
		
		const hasChildren = blocks.some(b => b.parentId === block.id && this.shouldShowBlock(b, blocks));
		if (!hasChildren) {
			return vscode.TreeItemCollapsibleState.None;
		}
		
		return this.expandedItems.has(block.id)
			? vscode.TreeItemCollapsibleState.Expanded
			: vscode.TreeItemCollapsibleState.Collapsed;
	}

	/**
	 * Dispose of all event listeners
	 */
	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables = [];
	}
}
