---
name: data-layer
description: Instructions for safely modifying the Electron IPC layer and JSON storage without corrupting user data. Use when modifying `dataService.ts`, `electron/main.ts`, or anything touching disk I/O.
---

# Data Layer & IPC Rules

FocusFlow relies on an Electron backend to read and write JSON data to the local disk. Modifying this layer must be done with extreme care to avoid data loss or UI freezes.

## Core Rules

1. **Async Only**: Never use synchronous Node.js file operations (e.g., `fs.writeFileSync`). Always use the `fs/promises` equivalents to avoid blocking the Electron main thread.
2. **Data Validation Boundary**: Do not trust data coming from disk. Validate the loaded JSON against the `src/domain/schema.ts` rules before pushing it into the application state.
3. **Debounced Saves**: Because FocusFlow uses JSON file persistence, writing the entire application state on every keystroke (e.g., typing in a task card) will destroy performance. The `dataService.ts` to IPC bridge MUST debounce rapidly firing save requests.
4. **Safe Failures**: If writing to disk fails (e.g., permissions problem), catch the error gracefully, emit a warning via IPC, and do not crash the application.

## The Architecture
- **State -> `dataService.ts`**: The UI triggers state changes and tells `dataService` to save.
- **`dataService.ts` -> `preload.ts`**: The service invokes the `window.electron` bridge API.
- **`preload.ts` -> `main.ts`**: The bridge uses `ipcRenderer.invoke` to send the payload.
- **`main.ts` -> Disk**: The `ipcMain.handle` callback writes the JSON file using `fs.promises.writeFile`.
