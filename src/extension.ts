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
