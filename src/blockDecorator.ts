import * as vscode from 'vscode';
import { BlockParser } from './blockParser';

/**
 * Handles visual decorations for BLOCK and SUBBLOCK comments in the editor
 */
export class BlockDecorator {
	private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
	private activeEditor: vscode.TextEditor | undefined;

	constructor() {
		this.initializeDecorationTypes();
	}

	/**
	 * Initialize decoration types for BLOCK and SUBBLOCKn
	 */
	private initializeDecorationTypes(): void {
		// BLOCK decoration - subtle blue tint
		this.decorationTypes.set('BLOCK', vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(30, 144, 255, 0.08)',
			color: '#1E90FF',
			isWholeLine: false,
			overviewRulerColor: '#1E90FF',
			overviewRulerLane: vscode.OverviewRulerLane.Left,
		}));

		// SUBBLOCK depth-based colors - subtle tints (will cycle through with modulo)
		const colors = [
			{ bg: 'rgba(34, 177, 76, 0.08)', color: '#22B14C', name: 'SUBBLOCK1' },    // Green
			{ bg: 'rgba(255, 165, 0, 0.08)', color: '#FFA500', name: 'SUBBLOCK2' },    // Orange
			{ bg: 'rgba(0, 188, 212, 0.08)', color: '#00BCD4', name: 'SUBBLOCK3' },    // Cyan
			{ bg: 'rgba(128, 0, 128, 0.08)', color: '#800080', name: 'SUBBLOCK4' },    // Purple
			{ bg: 'rgba(255, 215, 0, 0.08)', color: '#FFD700', name: 'SUBBLOCK5' },    // Gold
			{ bg: 'rgba(244, 67, 54, 0.08)', color: '#F44336', name: 'SUBBLOCK6' },    // Rose
			{ bg: 'rgba(233, 30, 99, 0.08)', color: '#E91E63', name: 'SUBBLOCK7' },    // Pink
			{ bg: 'rgba(103, 58, 183, 0.08)', color: '#673AB7', name: 'SUBBLOCK8' },   // Deep Purple
			{ bg: 'rgba(0, 150, 136, 0.08)', color: '#009688', name: 'SUBBLOCK9' },    // Teal
			{ bg: 'rgba(255, 87, 34, 0.08)', color: '#FF5722', name: 'SUBBLOCK10' },   // Deep Orange
		];

		for (const { bg, color, name } of colors) {
			this.decorationTypes.set(name, vscode.window.createTextEditorDecorationType({
				backgroundColor: bg,
				color: color,
				isWholeLine: false,
				overviewRulerColor: color,
				overviewRulerLane: vscode.OverviewRulerLane.Left,
			}));
		}
	}

	/**
	 * Update decorations for the active editor
	 */
	updateDecorations(editor: vscode.TextEditor): void {
		this.activeEditor = editor;
		this.applyDecorations(editor);
	}

	/**
	 * Apply decorations to the editor based on parsed blocks
	 */
	private applyDecorations(editor: vscode.TextEditor): void {
		const text = editor.document.getText();
		const blocks = BlockParser.parse(text);

		// Clear all decorations first
		for (const decorationType of this.decorationTypes.values()) {
			editor.setDecorations(decorationType, []);
		}

		// Group blocks by their type for batch decoration
		const decorationsByType: Map<string, vscode.Range[]> = new Map(
			Array.from(this.decorationTypes.keys()).map(key => [key, []])
		);

		// Find decoration ranges for each block
		for (const block of blocks) {
			const line = editor.document.lineAt(block.lineNumber);
			const lineText = line.text;

			// Find the BLOCK or SUBBLOCKn pattern in the line across comment styles
			const blockPattern = /(\/\/|#|--|<!--)\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+?)(?:\s*-->)?$/;
			const match = lineText.match(blockPattern);

			if (match) {
				const fullMatch = match[0];
				const startChar = lineText.indexOf(fullMatch);
				const endChar = startChar + fullMatch.length;

				const range = new vscode.Range(
					new vscode.Position(block.lineNumber, startChar),
					new vscode.Position(block.lineNumber, endChar)
				);

				// Determine decoration type with cycling
				let decorationType = block.blockType === 'BLOCK' ? 'BLOCK' : `SUBBLOCK${((block.depth - 1) % 10) + 1}`;

				if (decorationsByType.has(decorationType)) {
					decorationsByType.get(decorationType)!.push(range);
				}
			}
		}

		// Apply all decorations
		for (const [type, ranges] of decorationsByType.entries()) {
			const decorationType = this.decorationTypes.get(type);
			if (decorationType && ranges.length > 0) {
				editor.setDecorations(decorationType, ranges);
			}
		}
	}

	/**
	 * Dispose of all decoration types (call on deactivate)
	 */
	dispose(): void {
		for (const decorationType of this.decorationTypes.values()) {
			decorationType.dispose();
		}
		this.decorationTypes.clear();
	}
}
