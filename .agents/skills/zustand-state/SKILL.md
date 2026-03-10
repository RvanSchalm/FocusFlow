---
name: zustand-state
description: Guidelines on how to properly slice React state and use scoped selectors in Zustand to prevent React over-rendering. Use when creating or modifying state stores.
---

# Zustand State Management

We use `zustand` to manage application state to prevent the "prop-drilling" and "over-rendering" issues inherent in wide React Contexts. Note that Zustand handles local application state; persistence to disk is handled separately via the `dataService` / IPC layer.

## Guidelines for State Slices

1. **Keep it flat**: Avoid deeply nested objects in the store where possible. 
2. **Separate Actions from State**: Put action functions inside the store, but consumers should select them specifically to avoid unnecessary renders.

## Scoped Selectors (CRITICAL)

The primary reason we use Zustand is performance. **NEVER** select the entire store or a massive object if you only need a specific property. Doing so causes the component to re-render every time *any* property changes.

**BAD:**
```typescript
// Component re-renders on ANY task change, even if it's not this task!
const store = useStore() 
const myTask = store.tasks.find(t => t.id === taskId);
```

**GOOD:**
```typescript
// Component ONLY re-renders when `myTask` itself changes.
const myTask = useStore(state => state.tasks.find(t => t.id === taskId));
```

## Creating Store Slices
For a large application, use the "slice pattern". Instead of one massive file, break the store into logical slices (e.g., `createBoardSlice`, `createTaskSlice`) and combine them in `useStore.ts`.

**Example Pattern:**
```typescript
import { create } from 'zustand';

interface BoardSlice {
    boards: Board[];
    addBoard: (b: Board) => void;
}

export const useStore = create<BoardSlice>()((set) => ({
    boards: [],
    addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
}));
```
