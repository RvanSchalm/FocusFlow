---
name: repo-map
description: Map repository structure and identify likely touch points, risks, and validation steps for a requested change. Use when asked for codebase orientation, impact analysis, or where-to-edit guidance.
---

# Repo Map

FocusFlow is an Electron + React application.

Before making changes, map the repository structure using tools like `find_by_name` and `grep_search`.

## Typical Structure
- **UI Components**: `src/components/*.tsx` (React)
- **State Management**: `src/store/*.ts` (Zustand) or `src/services/`
- **Data Persistence**: `src/services/dataService.ts` (Renderer bridge)
- **Electron Logic**: `electron/main.ts` (Main Process) and `electron/preload.ts` (Preload Context Bridge)
- **Business Logic**: `src/domain/*.ts` (Data validation, schema rules)

## Risk Points to Map Before Editing
1. **IPC Boundary**: Changing a function signature in `dataService.ts` requires updating `preload.ts` and `main.ts` to match.
2. **Component Re-renders**: If touching massive components like `BoardView` or `TaskModal`, check the hooks to ensure you don't break Drag-and-Drop libraries or trigger infinite re-renders.
3. **Storage Format**: If changing how Boards/Tasks are structured, check `import-export` logic or `validation.ts` to see if they'll break.

## Guidance format

When advising a user:
1. Identify the files to modify (with paths). 
2. Recommend the sequence of changes (e.g., Update Schema -> Update IPC -> Update UI). 
3. Note any necessary automated tests to run.