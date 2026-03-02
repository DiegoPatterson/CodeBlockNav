import * as vscode from 'vscode';
import { BlockParser, ParsedBlock } from './blockParser';
import * as path from 'path';

/**
 * Scans the entire workspace for BLOCK/SUBBLOCK comments
 */
export class WorkspaceBlockScanner {
	/**
	 * Scan all relevant files in the workspace for blocks
	 * @returns Map of file paths to their parsed blocks
	 */
	static async scanWorkspace(): Promise<Map<string, ParsedBlock[]>> {
		const blocksByFile = new Map<string, ParsedBlock[]>();
		
		// File patterns to search
		const patterns = ['**/*.{ts,js,tsx,jsx,py,java,cs}'];
		
		try {
			for (const pattern of patterns) {
				const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 500);
				
				for (const fileUri of files) {
					try {
						const document = await vscode.workspace.openTextDocument(fileUri);
						const text = document.getText();
						const filePath = document.uri.fsPath;
						
						const blocks = BlockParser.parse(text, filePath);
						
						// Only add files that have blocks
						if (blocks.length > 0) {
							blocksByFile.set(filePath, blocks);
						}
					} catch (error) {
						// Skip files that can't be read
						console.log(`Could not read file: ${fileUri.fsPath}`);
					}
				}
			}
		} catch (error) {
			console.error('Error scanning workspace:', error);
		}
		
		return blocksByFile;
	}

	/**
	 * Get relative path for display
	 */
	static getRelativePath(absolutePath: string): string {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			return path.relative(workspaceFolder.uri.fsPath, absolutePath);
		}
		return path.basename(absolutePath);
	}
}
