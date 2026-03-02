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
}

/**
 * Regex pattern for matching block comments
 * Matches: // BLOCK: [Name] or // SUBBLOCKn: [Name]
 */
const BLOCK_PATTERN = /\/\/\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+)/g;

export class BlockParser {
	/**
	 * Parse blocks from text content
	 * @param text Full document text
	 * @returns Array of parsed blocks in hierarchical order
	 */
	static parse(text: string): ParsedBlock[] {
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
					blockType
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
			const blockTypeStr = match[1];
			const subblockDepthStr = match[2];
			const name = match[3].trim();

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
