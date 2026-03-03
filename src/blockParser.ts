/**
 * Block Parser Module
 * Handles parsing of BLOCK and SUBBLOCK comments from source code
 */

export interface ParsedBlock {
	id: number;
	name: string;
	depth: number;
	lineNumber: number;
	parentId: number;
	blockType: 'BLOCK' | 'SUBBLOCK';
	filePath?: string; // Optional file path for multi-file support
}

/**
 * Regex pattern for matching block comments across multiple languages
 * Supports: // (JS/TS/Java/C#/C++/Go/Rust/Dart), # (Python/Ruby/Shell), -- (SQL/Lua/Haskell), <!-- --> (HTML/XML)
 * Matches: [comment-style] BLOCK: [Name] or [comment-style] SUBBLOCKn: [Name]
 */
const BLOCK_PATTERN = /(\/\/|#|--|<!--)\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+?)(?:\s*-->)?$/gm;

export class BlockParser {
	/**
	 * Parse blocks from text content
	 * @param text Full document text
	 * @param filePath Optional file path for the document
	 * @returns Array of parsed blocks in hierarchical order
	 */
	static parse(text: string, filePath?: string): ParsedBlock[] {
		const lines = text.split('\n');
		const blocks: ParsedBlock[] = [];
		const depthStack: { depth: number; id: number }[] = [];
		let blockId = 0;

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			const matches = this.findBlocksInLine(line);

			for (const match of matches) {
				const { blockType, depth, name } = match;
				let parentId = -1;

				if (blockType === 'BLOCK') {
					depthStack.length = 0;
				} else {
					// Handle SUBBLOCK depth tracking
					while (depthStack.length > 0 && depthStack[depthStack.length - 1].depth >= depth) {
						depthStack.pop();
					}
					if (depthStack.length > 0) {
						parentId = depthStack[depthStack.length - 1].id;
					}
				}

				const block: ParsedBlock = {
					id: blockId,
					name,
					depth,
					lineNumber: lineIndex,
					parentId,
					blockType,
					filePath
				};

				blocks.push(block);
				depthStack.push({ depth, id: blockId });
				blockId++;
			}
		}

		return blocks;
	}

	/**
	 * Find all block matches in a single line
	 */
	private static findBlocksInLine(line: string): Array<{ blockType: 'BLOCK' | 'SUBBLOCK'; depth: number; name: string }> {
		const matches: Array<{ blockType: 'BLOCK' | 'SUBBLOCK'; depth: number; name: string }> = [];
		let match;
		BLOCK_PATTERN.lastIndex = 0;

		while ((match = BLOCK_PATTERN.exec(line)) !== null) {
			// match[1] = comment style (// or # or -- or <!--)
			const blockTypeStr = match[2];
			const subblockDepthStr = match[3];
			const name = match[4].trim();

			if (blockTypeStr === 'BLOCK') {
				matches.push({
					blockType: 'BLOCK',
					depth: 0,
					name
				});
			} else {
				matches.push({
					blockType: 'SUBBLOCK',
					depth: parseInt(subblockDepthStr, 10),
					name
				});
			}
		}

		return matches;
	}
}
