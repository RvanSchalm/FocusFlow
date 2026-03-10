---
name: git-flow
description: Guidelines for standardized branch naming, conventional commits (e.g., feat:, fix:, chore:), and PR structure. Use when creating branches, writing commit messages, or opening pull requests.
---

# Git Flow & Conventions

## Branch Naming
Follow these prefixes for branch names:
- `feature/<ticket-or-short-desc>` - For new features
- `fix/<ticket-or-short-desc>` - For bug fixes
- `chore/<short-desc>` - For maintenance tasks (e.g., dependency updates, refactoring)
- `docs/<short-desc>` - For documentation updates

## Commit Messages
We use Conventional Commits. Format:
`<type>(<optional scope>): <description>`

**Types**:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools and libraries

**Example**:
`feat(sidebar): add drag-and-drop for board reordering`

## Pull Request Structure
When generating PR descriptions, include:
1. **Goal**: What does this PR accomplish?
2. **Changes**: High-level list of technical changes.
3. **Risks/Testing**: What could break, and how was it tested?
