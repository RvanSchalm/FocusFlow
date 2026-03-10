---
name: ui-refactor
description: Guidelines for splitting large React components while maintaining performance and avoiding re-renders. Use when decomposing components like `BoardView` or `TaskModal`.
---

# UI Refactoring Rules

When decomposing massive React components (often >20k bytes) into smaller, more maintainable pieces, adherence to performance hygiene is critical. Splitting components poorly can actually increase the number of expensive React re-renders.

## Component Decomposition Rules

1. **Extract Complex Hooks**: Move complex `useEffect` chains, data fetching, and event listener setups into custom hooks (e.g., `useBoardDnD`, `useTaskFilters`) rather than keeping them inside the visual component.
2. **Prop Drilling Awareness**: When you break a large component into `Header`, `Body`, and `Sidebar`, avoid passing dozens of props down the tree. Instead, standard UI components should read what they need directly from `useStore()` (using scoped Zustand selectors!).
3. **Memoization**: While React 19 reduces the need for this, be aware of passing newly created objects or inline functions into child components that rely on `React.memo` or are otherwise heavy to render, as this breaks reference equality.
4. **CSS & Styling**: When extracting a component, ensure its related CSS is either modularized or clearly labeled in the global `index.css`. Do not leave orphaned styles behind.
5. **Preserve Behavior**: A UI refactor (Phase 1) should not introduce new User Experience changes. The goal is identical behavior with cleaner code. Tests must pass and Drag-and-Drop functionality must still work perfectly.
