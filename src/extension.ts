import * as vscode from 'vscode';
import { BlockTreeDataProvider, BlockTreeItem } from './treeProvider';
import { BlockDecorator } from './blockDecorator';

let blockMapProvider: BlockTreeDataProvider;
let treeView: vscode.TreeView<BlockTreeItem>;
let blockDecorator: BlockDecorator;

export function activate(context: vscode.ExtensionContext) {
	console.log('CodeBlock Navigator is now active!');

	// Initialize the decorator
	blockDecorator = new BlockDecorator();

	// Register the tree data provider and create tree view
	blockMapProvider = new BlockTreeDataProvider();
	treeView = vscode.window.createTreeView('block-map-view', {
		treeDataProvider: blockMapProvider
	});

	// Track which items are expanded by listening to expansion events
	const expandedBlockIds = new Set<number>();
	
	treeView.onDidExpandElement(e => {
		expandedBlockIds.add(e.element.blockId);
	});
	
	treeView.onDidCollapseElement(e => {
		expandedBlockIds.delete(e.element.blockId);
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

	// Watch for file changes and refresh the tree
	const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,tsx,jsx,py,java,cs}');
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
}
