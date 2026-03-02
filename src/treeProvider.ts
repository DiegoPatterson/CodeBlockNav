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
		public readonly blockType: 'BLOCK' | 'SUBBLOCK'
	) {
		super(label, collapsibleState);

		// Set up the click-to-jump command
		this.command = {
			command: 'block-navigator.revealLine',
			title: 'Reveal Block',
			arguments: [lineNumber]
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
 * Tree Data Provider for the Block Map View
 */
export class BlockTreeDataProvider implements vscode.TreeDataProvider<BlockTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<BlockTreeItem | undefined | null | void> = 
		new vscode.EventEmitter<BlockTreeItem | undefined | null | void>();
	
	readonly onDidChangeTreeData: vscode.Event<BlockTreeItem | undefined | null | void> = 
		this._onDidChangeTreeData.event;

	private blocks: ParsedBlock[] = [];
	private blockItems: Map<number, BlockTreeItem> = new Map();

	constructor() {
		// Refresh when active editor changes
		vscode.window.onDidChangeActiveTextEditor(() => this.refresh());

		// Refresh when document changes
		vscode.workspace.onDidChangeTextDocument((e) => {
			if (e.document === vscode.window.activeTextEditor?.document) {
				this.refresh();
			}
		});
	}

	refresh(): void {
		this.loadBlocks();
		this._onDidChangeTreeData.fire(null);
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
		this.blocks = BlockParser.parse(text);
		this.blockItems.clear();

		// Create tree items from blocks
		for (const block of this.blocks) {
			const collapsibleState = this.hasChildren(block) 
				? vscode.TreeItemCollapsibleState.Collapsed 
				: vscode.TreeItemCollapsibleState.None;

			const treeItem = new BlockTreeItem(
				block.name,
				block.id,
				block.parentId,
				block.depth,
				block.lineNumber,
				collapsibleState,
				block.blockType
			);

			this.blockItems.set(block.id, treeItem);
		}
	}

	private hasChildren(block: ParsedBlock): boolean {
		return this.blocks.some(b => b.parentId === block.id);
	}

	getTreeItem(element: BlockTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: BlockTreeItem): vscode.ProviderResult<BlockTreeItem[]> {
		if (!element) {
			// Return root-level blocks (depth 0)
			return this.blocks
				.filter(b => b.depth === 0)
				.map(b => this.blockItems.get(b.id)!)
				.filter(item => item !== undefined);
		}

		// Return children of the given element
		return this.blocks
			.filter(b => b.parentId === element.blockId)
			.map(b => this.blockItems.get(b.id)!)
			.filter(item => item !== undefined);
	}

	getParent?(element: BlockTreeItem): vscode.ProviderResult<BlockTreeItem> {
		if (element.parentId === -1) {
			return undefined;
		}
		return this.blockItems.get(element.parentId);
	}
}
