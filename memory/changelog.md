# CodeBlock Navigator - Changelog

## [0.0.1] - 2026-03-02

### Initial Setup
- ✅ Project scaffolding: TypeScript VS Code extension initialized
- ✅ Directory structure: `src/`, `memory/`, `.vscode/`, `out/`
- ✅ Package configuration: `package.json` with dependencies and contributions
- ✅ TypeScript configuration: `tsconfig.json` for compilation

### Features Implemented
- ✅ BlockParser module (`src/blockParser.ts`)
  - Regex pattern: `/\/\/\s*(BLOCK|SUBBLOCK(\d+)):\s*(.+)/g`
  - Line-by-line parsing with depth tracking
  - Parent-child relationship computation
  
- ✅ BlockTreeDataProvider (`src/treeProvider.ts`)
  - Tree data provider implementation
  - Dynamic tree item generation
  - View refresh on file changes
  - Color-coded icons based on block depth

- ✅ Extension entry point (`src/extension.ts`)
  - Sidebar view registration
  - Command handlers (revealLine, refresh)
  - File watcher for real-time updates
  - Event listeners for editor changes

- ✅ Memory Protocol
  - `memory/architecture.md`: Design documentation with n-depth logic
  - `memory/changelog.md`: Feature tracking
  - `memory/context.md`: User preferences storage

- ✅ Debug Console Output
  - Block parsing results logged during parsing
  - Format: `Found [TYPE] at line [N]: "[NAME]" (ID: [ID], Depth: [D], Parent: [P])`

### Known Limitations
- No visual decorations in editor yet (deferred to v0.1)
- No breadcrumb support (deferred to v0.1)
- Limited file type support (TS, JS, Python, Java, C#)

---

## Future Releases

### v0.1.0 - Editor Decorations
- [ ] DecorationRenderOptions for colored comment highlights
- [ ] Breadcrumb navigation support
- [ ] Search/filter in sidebar

### v0.2.0 - Advanced Features
- [ ] Export block map as outline
- [ ] Custom comment marker support
- [ ] Settings configuration

### v1.0.0 - Production Release
- [ ] Complete test coverage
- [ ] Marketplace publication
- [ ] Performance optimization for large files
