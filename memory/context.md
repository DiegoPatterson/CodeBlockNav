# CodeBlock Navigator - Context & User Preferences

## Project Identity
- **Project Name**: CodeBlock Navigator
- **Target**: VS Code Extension
- **Language**: TypeScript
- **Version**: 0.0.1
- **Start Date**: 2026-03-02

## User Preferences

### Comment Syntax (LOCKED)
- ✅ Use `// BLOCK:` for root-level sections
- ✅ Use `// SUBBLOCKn:` for nested sections (n = integer depth)
- ✅ NO Markdown `#` syntax (this is code-only)
- Rationale: Keeps comments within source files, no separate documentation needed

### Code Style
- Language: TypeScript (strict mode enabled)
- Target: ES2020
- Formatting: Follow VS Code extension best practices
- File organization: Separation of concerns
  - `blockParser.ts`: Pure parsing logic
  - `treeProvider.ts`: UI layer (TreeDataProvider)
  - `extension.ts`: Extension lifecycle and command orchestration

### Tree Display Behavior
- Collapse state: Default COLLAPSED for better overview
- Expand on demand: User manually expands blocks as needed
- Color scheme: Based on block depth (not fixed to specific colors)

### Supported File Types
Currently supported:
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- C# (`.cs`)

Can be extended in `fileWatcher` pattern in `src/extension.ts`

## Design Decisions

### Why Inline Comments Over Markdown?
1. **No context switching**: Developers work within their code editor
2. **Version control friendly**: Comments travel with code in git
3. **Scalable**: Works for any language that supports `//` comments
4. **No maintenance**: Doesn't require separate documentation files

### Why n-Depth Logic?
1. **Flexibility**: Handle arbitrary nesting levels without configuration
2. **Simplicity**: No predefined depth limits (unlike SUBBLOCK1-5)
3. **Framework agnostic**: Works with Flutter's deep component trees, React hooks chains, etc.
4. **Future proof**: Scales with code complexity

### Why Tree View in Sidebar?
1. **Discoverability**: Always visible, doesn't clutter editor
2. **Navigation**: One-click jump to any section
3. **Overview**: Quick code structure understanding
4. **Non-intrusive**: Doesn't modify source files

## Memory Protocol Rules

All project decisions, learnings, and preferences are stored in `/memory`:
- `/memory/architecture.md`: Technical design and data structures
- `/memory/changelog.md`: Features added, bugs fixed, timeline
- `/memory/context.md`: This file - user preferences and design rationale

### Why This Matters
As the project grows (v0.2 → v1.0 → maintenance phase), the `/memory` folder serves as:
- **LTM (Long-Term Memory)**: Prevents "forgetting" design decisions
- **Quick reference**: New developers onboard faster
- **Decision tracking**: Know WHY something was built a certain way
- **Consistency**: Maintains preference for `// BLOCK:` syntax even if other options emerge

## Current Status
- ✅ Initial scaffolding complete
- ✅ Parser functional (basic testing in debug console)
- ⏳ Awaiting first code sample test
- 📋 Ready for feature expansion

---

*This file should be updated whenever significant decisions are made or preferences change.*
