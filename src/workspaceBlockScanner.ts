import * as vscode from 'vscode';
import { BlockParser, ParsedBlock } from './blockParser';
import * as path from 'path';

/**
 * Scans the entire workspace for BLOCK/SUBBLOCK comments
 */
export class WorkspaceBlockScanner {
	/**
	 * Scan all files in the workspace for blocks
	 * This approach scans all file types and lets the BlockParser detect supported comment styles
	 * Supports: // (JS/TS/Java/etc), # (Python/Ruby/TTL/etc), -- (SQL/Lua/etc), <!-- --> (HTML/XML/etc)
	 * @returns Map of file paths to their parsed blocks
	 */
	static async scanWorkspace(): Promise<Map<string, ParsedBlock[]>> {
		const blocksByFile = new Map<string, ParsedBlock[]>();
		
		let filesScanned = 0;
		let filesWithBlocks = 0;
		let filesSkipped = 0;
		
		try {
			// Find all files (excluding common non-source directories)
			// This approach works with ANY file type that contains supported comment styles
			const files = await vscode.workspace.findFiles(
				'**/*',  // Match all files
				'**/node_modules/**|**/.git/**|**/.vscode/**|**/dist/**|**/build/**|**/.angular/**|**/coverage/**',
				1000  // Increased limit to scan more files
			);
			
			for (const fileUri of files) {
				filesScanned++;
				try {
					let document: vscode.TextDocument;
					try {
						document = await vscode.workspace.openTextDocument(fileUri);
					} catch (openError) {
						filesSkipped++;
						continue;
					}
					
					let text: string;
					try {
						text = document.getText();
					} catch (textError) {
						filesSkipped++;
						continue;
					}
					
					// Skip binary files (rough heuristic: check if document is likely text)
					if (text.length === 0 || !this.looksLikeTextFile(text)) {
						filesSkipped++;
						continue;
					}
					
					const filePath = document.uri.fsPath;
					
					let blocks: ParsedBlock[];
					try {
						blocks = BlockParser.parse(text, filePath);
					} catch (parseError) {
						filesSkipped++;
						continue;
					}
					
					// Only add files that have blocks (any supported comment style)
					if (blocks.length > 0) {
						blocksByFile.set(filePath, blocks);
						filesWithBlocks++;
					}
				} catch (error) {
					// Unexpected error - log it but continue scanning
					console.error(`Unexpected error processing file ${fileUri.fsPath}:`, error);
					filesSkipped++;
				}
			}
			console.log(`Workspace scan completed: ${filesScanned} files scanned, ${filesWithBlocks} files with blocks, ${filesSkipped} files skipped`);
		} catch (error) {
			console.error('Critical error during workspace scan:', error);
			vscode.window.showErrorMessage(`Error scanning workspace for blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
		
		return blocksByFile;
	}

	/**
	 * Simple heuristic to detect if content looks like text (not binary)
	 * Checks for presence of null bytes which indicate binary files
	 */
	private static looksLikeTextFile(text: string): boolean {
		// Check for null bytes which indicate binary files
		return !text.includes('\0');
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
