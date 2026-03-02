import * as vscode from 'vscode';
import { BlockTreeDataProvider } from './treeProvider';

let blockMapProvider: BlockTreeDataProvider;

export function activate(context: vscode.ExtensionContext) {
	console.log('CodeBlock Navigator is now active!');

	// Register the tree data provider
	blockMapProvider = new BlockTreeDataProvider();
	vscode.window.registerTreeDataProvider('block-map-view', blockMapProvider);

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
	fileWatcher.onDidChange(() => blockMapProvider.refresh());
	fileWatcher.onDidCreate(() => blockMapProvider.refresh());
	fileWatcher.onDidDelete(() => blockMapProvider.refresh());

	context.subscriptions.push(fileWatcher);
}

export function deactivate() {
	console.log('CodeBlock Navigator is now deactivated!');
}
