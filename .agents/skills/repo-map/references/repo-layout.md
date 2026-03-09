# FocusFlow Repo Layout

## Core Paths

- `src/`: Renderer app code (React UI and composition).
- `src/services/dataService.ts`: Renderer data operations and persistence calls.
- `src/services/useData.ts`: Reactive data hooks/subscription behavior.
- `electron/main.ts`: Electron main process window lifecycle and IPC handlers.
- `electron/preload.ts`: Secure API bridge exposed to renderer.
- `ELECTRON_GUIDE.md`: Desktop run/build guidance.

## Typical Change Mapping

- UI behavior changes: `src/components/*`
- Data model and persistence logic: `src/services/dataService.ts` + Electron IPC handlers
- Desktop lifecycle/storage wiring: `electron/main.ts` and `electron/preload.ts`