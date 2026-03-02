import * as vscode from 'vscode';
import { BlockParser } from './blockParser';

/**
 * Provides document symbols for breadcrumb navigation
 * VS Code automatically shows breadcrumbs based on cursor position in these symbols
 */
export class BlockSymbolProvider implements vscode.DocumentSymbolProvider {
	provideDocumentSymbols(
		document: vscode.TextDocument,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.DocumentSymbol[]> {
		const text = document.getText();
		const blocks = BlockParser.parse(text, document.uri.fsPath);
		
		if (blocks.length === 0) {
			return [];
		}

		// Convert parsed blocks to DocumentSymbols
		const symbols: vscode.DocumentSymbol[] = [];
		const symbolMap = new Map<number, vscode.DocumentSymbol>();

		for (const block of blocks) {
			// Create a symbol for this block
			const symbol = new vscode.DocumentSymbol(
				block.name,
				this.getSymbolDetail(block),
				vscode.SymbolKind.Namespace,
				new vscode.Range(block.lineNumber, 0, block.lineNumber, 1000),
				new vscode.Range(block.lineNumber, 0, block.lineNumber, 1000)
			);

			symbolMap.set(block.id, symbol);
			symbol.children = [];

			// If this is a root block, add to top-level symbols
			if (block.parentId === -1) {
				symbols.push(symbol);
			} else {
				// Otherwise, add as child to parent
				const parent = symbolMap.get(block.parentId);
				if (parent) {
					parent.children!.push(symbol);
				}
			}
		}

		return symbols;
	}

	private getSymbolDetail(block: any): string {
		if (block.blockType === 'BLOCK') {
			return 'BLOCK';
		}
		return `SUBBLOCK${block.depth}`;
	}
}
