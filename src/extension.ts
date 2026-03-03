import * as vscode from 'vscode';
import { BlockTreeDataProvider, BlockTreeItem, FileBlockNode } from './treeProvider';
import { BlockDecorator } from './blockDecorator';
import { BlockSymbolProvider } from './blockSymbolProvider';

let blockMapProvider: BlockTreeDataProvider;
let treeView: vscode.TreeView<BlockTreeItem | FileBlockNode>;
let blockDecorator: BlockDecorator;

export function activate(context: vscode.ExtensionContext) {
	console.log('CodeBlock Navigator is now active!');

	// Initialize the decorator
	blockDecorator = new BlockDecorator();

	// Register the tree data provider and create tree view
	blockMapProvider = new BlockTreeDataProvider();
	treeView = vscode.window.createTreeView('block-map-view', {
		treeDataProvider: blockMapProvider
	}) as vscode.TreeView<BlockTreeItem | FileBlockNode>;

	// Register the symbol provider for breadcrumb navigation
	const blockSymbolProvider = new BlockSymbolProvider();
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			[
				// TypeScript/JavaScript (// comments)
				{ scheme: 'file', language: 'typescript' },
				{ scheme: 'file', language: 'javascript' },
				{ scheme: 'file', language: 'typescriptreact' },
				{ scheme: 'file', language: 'javascriptreact' },
				// Java/C#/C++ (// comments)
				{ scheme: 'file', language: 'java' },
				{ scheme: 'file', language: 'csharp' },
				{ scheme: 'file', language: 'c' },
				{ scheme: 'file', language: 'cpp' },
				// Modern languages (// comments)
				{ scheme: 'file', language: 'dart' },
				{ scheme: 'file', language: 'go' },
				{ scheme: 'file', language: 'rust' },
				{ scheme: 'file', language: 'swift' },
				{ scheme: 'file', language: 'kotlin' },
				// Scripting languages (# comments)
				{ scheme: 'file', language: 'python' },
				{ scheme: 'file', language: 'ruby' },
				{ scheme: 'file', language: 'shellscript' },
				{ scheme: 'file', language: 'perl' },
				{ scheme: 'file', language: 'r' },
				{ scheme: 'file', language: 'yaml' },
				{ scheme: 'file', language: 'toml' },
				// SQL/Database (-- comments)
				{ scheme: 'file', language: 'sql' },
				{ scheme: 'file', language: 'plsql' },
				{ scheme: 'file', language: 'lua' },
				{ scheme: 'file', language: 'haskell' },
				// Markup (<!-- --> comments)
				{ scheme: 'file', language: 'html' },
				{ scheme: 'file', language: 'xml' },
				{ scheme: 'file', language: 'markdown' }
			],
			blockSymbolProvider
		)
	);

	// Track which items are expanded by listening to expansion events
	const expandedBlockIds = new Set<number>();
	
	treeView.onDidExpandElement(e => {
		if (e.element instanceof BlockTreeItem || (e.element as any).blockId !== undefined) {
			expandedBlockIds.add((e.element as BlockTreeItem).blockId);
		}
	});
	
	treeView.onDidCollapseElement(e => {
		if (e.element instanceof BlockTreeItem || (e.element as any).blockId !== undefined) {
			expandedBlockIds.delete((e.element as BlockTreeItem).blockId);
		}
	});

	// Register the reveal command
	vscode.commands.registerCommand('block-navigator.revealLine', (lineNumber: number) => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const position = new vscode.Position(lineNumber, 0);
			editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
			editor.selection = new vscode.Selection(position, position);
		}
	});

	// Register the open and reveal command (for jumping between files)
	vscode.commands.registerCommand('block-navigator.openAndRevealLine', async (filePath: string, lineNumber: number) => {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document);
			
			const position = new vscode.Position(lineNumber, 0);
			editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
			editor.selection = new vscode.Selection(position, position);
		} catch (error) {
			vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
		}
	});

	// Register the refresh command
	vscode.commands.registerCommand('block-navigator.refresh', () => {
		blockMapProvider.refresh();
	});

	// Register expand all command
	vscode.commands.registerCommand('block-navigator.expandAll', async () => {
		blockMapProvider.setExpandAll(true);
		blockMapProvider.refresh();
		
		// Wait a bit for the tree to render
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Expand visible items via reveal API
		const items = blockMapProvider.getAllVisibleTreeItems();
		for (const item of items) {
			if (item.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
				try {
					await treeView.reveal(item, { expand: true, focus: false, select: false });
					expandedBlockIds.add(item.blockId);
					await new Promise(resolve => setTimeout(resolve, 5));
				} catch (e) {
					// Ignore reveal errors
				}
			}
		}
		vscode.window.showInformationMessage('✓ Expanded all blocks');
	});

	// Register collapse all command
	vscode.commands.registerCommand('block-navigator.collapseAll', async () => {
		expandedBlockIds.clear();
		// Focus the tree
		await vscode.commands.executeCommand('block-map-view.focus');
		await new Promise(resolve => setTimeout(resolve, 50));
		// Use keyboard shortcut for collapse all (works for focused tree)
		await vscode.commands.executeCommand('list.collapseAll');
		vscode.window.showInformationMessage('✗ Collapsed all blocks');
	});

	// Register the search command
	vscode.commands.registerCommand('block-navigator.search', async () => {
		const currentQuery = blockMapProvider.getSearchQuery();
		const query = await vscode.window.showInputBox({
			placeHolder: 'Search blocks by name...',
			prompt: 'Enter block name to search (or clear to show all)',
			value: currentQuery,
			title: 'Search Blocks'
		});

		if (query !== undefined) {
			blockMapProvider.setSearchQuery(query);
			blockMapProvider.refresh();
			
			if (query) {
				const matchCount = blockMapProvider.getMatchCount();
				if (matchCount > 0) {
					vscode.window.showInformationMessage(`✓ Found ${matchCount} matching block(s)`);
				} else {
					vscode.window.showWarningMessage(`✗ No blocks match "${query}"`);
				}
			} else {
				vscode.window.showInformationMessage('Search cleared - showing all blocks');
			}
		}
	});

	// Register workspace mode toggle command
	vscode.commands.registerCommand('block-navigator.toggleWorkspaceMode', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('Workspace mode requires an open folder');
			return;
		}
		
		await blockMapProvider.setWorkspaceMode(true);
		vscode.window.showInformationMessage('✓ Workspace mode enabled - showing all blocks');
	});

	// Register editor mode toggle command
	vscode.commands.registerCommand('block-navigator.toggleEditorMode', async () => {
		await blockMapProvider.setWorkspaceMode(false);
		vscode.window.showInformationMessage('✓ Editor mode enabled - showing current file blocks');
	});

	// Register copy block name command
	vscode.commands.registerCommand('block-navigator.copyBlockName', async (item: BlockTreeItem | FileBlockNode) => {
		if (item instanceof BlockTreeItem) {
			// Get the block name with type info
			const blockName = item.label as string;
			const typeLabel = item.blockType === 'BLOCK' 
				? 'BLOCK' 
				: `SUBBLOCK${item.depth}`;
			const fullName = `${typeLabel}: ${blockName}`;
			
			// Copy to clipboard
			await vscode.env.clipboard.writeText(fullName);
			vscode.window.showInformationMessage(`✓ Copied: ${fullName}`);
		} else if ((item as any).filePath) {
			// File node - copy the filename
			const fileName = (item as any).label as string;
			await vscode.env.clipboard.writeText(fileName);
			vscode.window.showInformationMessage(`✓ Copied: ${fileName}`);
		}
	});

	// Watch for file changes and refresh the tree
	const fileWatcher = vscode.workspace.createFileSystemWatcher(
		'**/*.{ts,js,tsx,jsx,py,java,cs,c,cpp,dart,go,rs,swift,kt,kts,rb,sh,bash,zsh,pl,r,yaml,yml,toml,sql,psql,mysql,lua,hs,html,htm,xhtml,xml,md}'
	);
	fileWatcher.onDidChange(() => {
		blockMapProvider.refresh();
		if (vscode.window.activeTextEditor) {
			blockDecorator.updateDecorations(vscode.window.activeTextEditor);
		}
	});
	fileWatcher.onDidCreate(() => blockMapProvider.refresh());
	fileWatcher.onDidDelete(() => blockMapProvider.refresh());

	// Update decorations when active editor changes
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			blockDecorator.updateDecorations(editor);
		}
	});

	// Update decorations when document content changes
	vscode.workspace.onDidChangeTextDocument(e => {
		if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
			blockDecorator.updateDecorations(vscode.window.activeTextEditor);
		}
	});

	// Apply decorations to the current editor on startup
	if (vscode.window.activeTextEditor) {
		blockDecorator.updateDecorations(vscode.window.activeTextEditor);
	}

	context.subscriptions.push(fileWatcher);
}

export function deactivate() {
	console.log('CodeBlock Navigator is now deactivated!');
	blockDecorator.dispose();
	blockMapProvider.dispose();
}
