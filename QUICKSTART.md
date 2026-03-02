# CodeBlock Navigator - Quick Start Guide

## Project Structure

```
CodeBlockNav/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── blockParser.ts        # Regex parser for BLOCK/SUBBLOCK syntax
│   └── treeProvider.ts       # Tree data provider for sidebar
├── memory/
│   ├── architecture.md       # Technical design documentation
│   ├── changelog.md          # Feature tracking & version history
│   └── context.md            # User preferences & design decisions
├── .vscode/
│   └── launch.json           # Debug configuration
├── out/                      # Compiled JavaScript (auto-generated)
├── package.json              # Project manifest & dependencies
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Main documentation
└── test-sample.ts            # Example file with BLOCK/SUBBLOCK syntax
```

## What's Been Built

### ✅ Complete
1. **TypeScript Extension Scaffolding**
   - Full TypeScript configuration (strict mode enabled)
   - Compiled to JavaScript in `out/` folder
   - Ready for F5 debugging

2. **Regex Parser** (`src/blockParser.ts`)
   - Regex: `/\/\/\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+)/g`
   - Handles infinite nesting: BLOCK → SUBBLOCK1 → SUBBLOCK2 → SUBBLOCK3 → ...
   - Automatic parent-child relationship tracking
   - Debug console output shows each block found

3. **Tree View Provider** (`src/treeProvider.ts`)
   - Implements `vscode.TreeDataProvider` interface
   - Hierarchical tree rendering with collapsible items
   - Color-coded by depth (Blue for BLOCK, Green/Orange/Red for SUBBLOCKs)
   - Real-time refresh on file changes

4. **Extension Integration** (`src/extension.ts`)
   - Registers sidebar view container (id: `block-navigator`)
   - Registers tree view (id: `block-map-view`)
   - Click-to-jump command jumps to block line
   - File watcher auto-refreshes on changes

5. **Memory System**
   - `memory/architecture.md`: N-depth logic & data structures
   - `memory/changelog.md`: Feature tracking & version history
   - `memory/context.md`: User preferences & rationale

## Testing It Out

### Step 1: Run in Debug Mode
```bash
cd "c:\personal fun\CodeBlockNav"
npm run compile  # (Already done)
# Then press F5 in VS Code to launch extension in debug window
```

### Step 2: Open the Test File
In the debug VS Code window:
1. Open `test-sample.ts`
2. Look at the Activity Bar (left sidebar)
3. Click the "CodeBlock Navigator" icon (should appear)
4. You'll see the block tree!

### Step 3: Test Click-to-Jump
- Click any item in the sidebar tree
- The editor should scroll to that line

### Step 4: Verify Debug Output
- Open Terminal → Debug Console in the debug window
- Look for logs like: `Found BLOCK at line 10: "Authentication System" (ID: 0, Depth: 0, Parent: -1)`
- Each block is logged as it's discovered

## How to Use This in Your Own Code

Add these comments to any file:

```typescript
// BLOCK: My Feature Name
function doSomething() {
  // SUBBLOCK1: Part A
  partA();
  
  // SUBBLOCK2: Sub-part A1
  subPartA1();
  
  // SUBBLOCK2: Sub-part A2
  subPartA2();
  
  // SUBBLOCK1: Part B
  partB();
}
```

Then open the CodeBlock Navigator sidebar to see the hierarchy!

## Next Steps (Not Yet Implemented)

- [ ] **Visual Decorations** - Color the comments in the editor itself
- [ ] **Breadcrumb Navigation** - Show path from root to current block
- [ ] **Search/Filter** - Find blocks by name in sidebar
- [ ] **Export** - Export block map as markdown outline
- [ ] **Settings** - Allow custom comment patterns

## Development Commands

```bash
# Watch mode (recompile on changes)
npm run watch

# Manual compile
npm run compile

# Debug in VS Code
Press F5
```

## Key Files to Remember

- **Parser Logic**: [src/blockParser.ts](src/blockParser.ts)
- **Design Decisions**: [memory/context.md](memory/context.md)
- **Feature Roadmap**: [memory/changelog.md](memory/changelog.md)
- **Technical Details**: [memory/architecture.md](memory/architecture.md)

## Troubleshooting

**Sidebar not appearing?**
- Make sure you're in the debug window (launched with F5)
- Check that the extension has activated (look for "CodeBlock Navigator is now active!" in debug console)

**Blocks not showing?**
- Verify the file contains valid `// BLOCK:` or `// SUBBLOCKn:` comments
- Check debug console for parsing output

**Click-to-jump not working?**
- The line number should be in parentheses in the command: `revealLine(lineNumber)`
- Verify the editor is focused before clicking

## Memory Protocol Reminder

This project uses Long-Term Memory to stay consistent as it grows:
- All decisions are documented in `/memory`
- Before making changes, check `memory/context.md` for preferences
- After adding features, update `memory/changelog.md`
- Keep `memory/architecture.md` in sync with code changes

---

**You're all set!** Press F5 to launch and test the extension. 🚀
