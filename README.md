# CodeBlock Navigator

A VS Code extension that parses hierarchical comment syntax to build a nested "Map" of your code's logic in the Primary Sidebar.

## Overview

CodeBlock Navigator helps developers navigate complex codebases by creating an interactive tree view of code sections defined through simple comment markers. Perfect for understanding the structure of large files, frameworks like Flutter, or deeply nested component hierarchies.

## Features

✅ **Hierarchical Code Mapping** - Create n-depth nested block structures with simple comments
✅ **Click-to-Jump Navigation** - Single click jumps to any code block
✅ **Real-time Updates** - Sidebar refreshes as you edit
✅ **Color-Coded Blocks** - Different colors for different nesting levels
✅ **Multi-Language Support** - Works with 30+ languages including:
  - `//` style: JavaScript, TypeScript, Java, C#, C++, Go, Rust, Dart, Swift, Kotlin
  - `#` style: Python, Ruby, Shell scripts, Perl, R, YAML
  - `--` style: SQL, Lua, Haskell
  - `<!-- -->` style: HTML, XML, Markdown

## Syntax

### Root Level
```typescript
// BLOCK: Authentication System
```

### Nested Levels
```typescript
// SUBBLOCK1: Login Handler
// SUBBLOCK2: Validate Credentials
// SUBBLOCK3: Token Generation
```

### Language-Specific Comment Styles

**JavaScript/TypeScript/Java/C#/C++/Go/Rust/Dart:**
```typescript
// BLOCK: Main Section
// SUBBLOCK1: Subsection
```

**Python/Ruby/Shell:**
```python
# BLOCK: Main Section
# SUBBLOCK1: Subsection
```

**SQL/Lua/Haskell:**
```sql
-- BLOCK: Main Section
-- SUBBLOCK1: Subsection
```

**HTML/XML:**
```html
<!-- BLOCK: Main Section -->
<!-- SUBBLOCK1: Subsection -->
```

## Example

Input file:
```typescript
// BLOCK: Main Application
function app() {
  // SUBBLOCK1: Setup
  initializeRoutes();
  
  // SUBBLOCK2: Database
  connectDatabase();
  
  // SUBBLOCK1: Handlers
  setupHandlers();
}
```

Output in Sidebar:
```
Main Application
├── Setup
├── Database
└── Handlers
```

## Getting Started

1. Install the extension from VS Code Marketplace
2. Add comment markers to your code files
3. Open the "CodeBlock Navigator" view in the Activity Bar
4. Click any block to jump to that section

## Commands

- **Reveal Block in Editor** - Jump to a specific block (automatic on click)
- **Refresh Block Map** - Manually refresh the sidebar view

## Installation

### Development

```bash
git clone https://github.com/yourusername/codeblock-navigator
cd codeblock-navigator
npm install
npm run compile
```

Then press `F5` in VS Code to launch the extension in debug mode.

### Build

```bash
npm run compile
npx vsce package
```

## Architecture

See [memory/architecture.md](memory/architecture.md) for:
- Detailed design documentation
- Tree data structure explanation
- N-depth logic and hierarchy rules
- Component architecture

## Memory Protocol

This project uses a structured memory system to maintain long-term knowledge:

- **[memory/architecture.md](memory/architecture.md)** - Technical design and data structures
- **[memory/changelog.md](memory/changelog.md)** - Feature tracking and version history
- **[memory/context.md](memory/context.md)** - User preferences and design rationale

This prevents knowledge loss as the project evolves and helps maintain consistency across versions.

## Roadmap

- **v0.1.0** - Editor decorations and breadcrumb support
- **v0.2.0** - Advanced features (search, filters, export)
- **v1.0.0** - Production release with full feature set

## License

MIT

## Contributing

Contributions welcome! Please ensure:
1. Updates to code include updates to memory files
2. Follow TypeScript strict mode
3. Add tests for new features
