# CodeBlock Navigator - Architecture

## Overview
CodeBlock Navigator is a VS Code extension that parses hierarchical comment syntax to build a nested code map in the Primary Sidebar.

## Tree Data Structure

### Block Types
1. **BLOCK** (Depth 0): Root-level code sections
   - Syntax: `// BLOCK: [Name]`
   - Example: `// BLOCK: Main Application Setup`

2. **SUBBLOCKn** (Depth n): Nested code sections where n ≥ 1
   - Syntax: `// SUBBLOCKn: [Name]` (e.g., SUBBLOCK1, SUBBLOCK2, SUBBLOCK3...)
   - Example: `// SUBBLOCK1: API Handler`
   - Example: `// SUBBLOCK2: Error Middleware`

### N-Depth Logic

The parser maintains a **depth stack** to track parent-child relationships:

```typescript
interface ParsedBlock {
  id: number;                    // Unique block identifier
  name: string;                  // Display name
  depth: number;                 // Nesting depth (0 for BLOCK, n for SUBBLOCKn)
  lineNumber: number;            // Source file line number
  parentId: number;              // Reference to parent block (-1 for root)
  blockType: 'BLOCK' | 'SUBBLOCK';
}
```

### Hierarchy Rules

1. A `SUBBLOCK1` becomes a child of the most recent `BLOCK` or `SUBBLOCK0` (if exists)
2. A `SUBBLOCK2` becomes a child of the most recent `SUBBLOCK1`
3. A `SUBBLOCK3` becomes a child of the most recent `SUBBLOCK2`
4. **Pattern**: `SUBBLOCKn` is a child of the most recent `SUBBLOCKn-1` above it
5. When a lower depth block is encountered (e.g., `SUBBLOCK1` after `SUBBLOCK3`), the depth stack is popped to the appropriate level

### Example Structure

```
// BLOCK: Authentication System
  // SUBBLOCK1: Login Handler
    // SUBBLOCK2: Validate Credentials
    // SUBBLOCK2: Hash Password
  // SUBBLOCK1: Logout Handler
    // SUBBLOCK2: Clear Session
// BLOCK: Database Layer
  // SUBBLOCK1: Connection Pool
    // SUBBLOCK2: Initialize Connections
    // SUBBLOCK2: Monitor Health
```

Tree representation:
```
Authentication System
├── Login Handler
│   ├── Validate Credentials
│   └── Hash Password
└── Logout Handler
    └── Clear Session
Database Layer
├── Connection Pool
│   ├── Initialize Connections
│   └── Monitor Health
```

## Core Components

### 1. BlockParser (`src/blockParser.ts`)
- Uses regex pattern: `/\/\/\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+)/g`
- Processes line-by-line
- Maintains depth stack for parent tracking
- Returns sorted ParsedBlock array

### 2. BlockTreeDataProvider (`src/treeProvider.ts`)
- Implements `vscode.TreeDataProvider` interface
- Manages `BlockTreeItem` instances
- Triggers refresh on file changes
- Provides hierarchy via `getChildren()` and `getParent()`

### 3. Extension (`src/extension.ts`)
- Main entry point
- Registers sidebar view container
- Sets up commands and event listeners
- Instantiates BlockTreeDataProvider

## Key Features

### Click-to-Jump
- Each tree item has a command handler pointing to `block-navigator.revealLine`
- Clicking jumps editor to the block's line with `editor.revealRange()`

### Visual Decorations
- BLOCK items: Blue icon (symbol-class)
- SUBBLOCK items: Color-coded icons based on depth
  - SUBBLOCK1: Green
  - SUBBLOCK2: Orange
  - SUBBLOCK3: Red
  - SUBBLOCK4+: Cycling through purple, yellow

### Supported File Types
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- C# (`.cs`)

## Future Enhancements

- [ ] Decorator integration to highlight blocks in editor
- [ ] Breadcrumb navigation
- [ ] Search/filter in sidebar
- [ ] Export block map as outline
- [ ] Support for custom comment markers
