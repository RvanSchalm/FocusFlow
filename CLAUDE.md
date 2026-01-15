# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusFlow is a local-first Kanban board application with rich task management features, built with React 19 and TypeScript. All data is stored locally in IndexedDB with no cloud dependencies.

Key features:
- Multiple boards with drag-and-drop columns and tasks
- Rich text editing (Tiptap/ProseMirror)
- Eisenhower Matrix view (urgency/importance quadrants)
- File attachments stored as Blobs
- Full import/export with data portability
- Color-coded labels

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Database Layer (src/db.ts)

The app uses Dexie.js as an IndexedDB wrapper with versioned schema migrations:

- **boards**: Top-level containers with title and creation date
- **columns**: Belong to boards, have order for drag-and-drop
- **tasks**: Belong to both board and column, contain urgency/importance scores, checklists, comments, and blob attachments
- **labels**: Global color-coded tags that can be applied to tasks

**Database Migrations**: The schema uses `.version()` for migrations. When adding new fields or tables, increment the version and include all tables that exist at that version. Only indexed fields need to be specified in the stores configuration.

**Important**: Tasks store attachments as Blob objects inline (not references). Export converts blobs to Base64 data URLs for JSON serialization; import converts them back.

### State Management

State is managed using:
- `useLiveQuery()` from dexie-react-hooks for reactive database queries
- React's `useState` for local component state
- React Router for navigation between boards

No global state management library is used. Database queries are reactive and update components automatically when data changes.

### Routing Structure

- `/` - Home page (prompts to select a board)
- `/board/:boardId` - Board view (Kanban or Matrix mode)
- `*` - 404 page

### Component Hierarchy

```
App.tsx (Router + ConfirmProvider)
├── Sidebar.tsx (Board list, labels, import/export)
└── BoardView.tsx (Main view controller)
    ├── Column.tsx (Kanban columns with drag-and-drop)
    │   └── TaskCard.tsx (Individual task cards)
    ├── MatrixView.tsx (Eisenhower Matrix scatter plot)
    └── Modal > TaskModal.tsx (Task editor)
        ├── RichTextEditor.tsx (Tiptap editor)
        ├── LabelManager.tsx (Label CRUD)
        └── ConfirmDialog.tsx (Confirmation prompts)
```

### Key Patterns

**Drag and Drop**: Uses `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd). Column and task reordering uses database transactions to update order fields atomically.

**Transactions**: Use `db.transaction("rw", [tables], async () => {...})` for operations that must be atomic (e.g., deleting a board and all its tasks/columns, or reordering multiple items).

**Live Queries**: Use `useLiveQuery(() => db.table.query(), [deps])` for reactive data. These automatically re-run when database changes occur.

**Confirmations**: The app uses a context-based confirmation system (`ConfirmProvider` + `useConfirm`) for destructive actions. Call `await confirm({title, message, confirmText, variant})` to show a confirmation dialog.

**Matrix View**: The Eisenhower Matrix plots tasks on a 2D plane based on urgency (x-axis) and importance (y-axis). Uses deterministic pseudo-random jitter based on task ID to prevent overlapping dots.

## Code Guidelines

- Use TypeScript strict mode
- Components should be functional with hooks
- Database updates should use transactions for multi-step operations
- Don't store derived state - use live queries instead
- Use meaningful default values ("New Board", "New Column") when creating entities
- Clean up Blob URLs with `URL.revokeObjectURL()` in useEffect cleanup

## File Attachments

Attachments are stored inline in the task object as Blob data. When uploading:
1. Read file as Blob
2. Store in task.attachments array with metadata (name, type, size, uploadedAt)
3. Create object URLs with `URL.createObjectURL()` for display
4. Clean up URLs when component unmounts

For export/import:
- Export converts Blobs to Base64 data URLs using FileReader
- Import converts Base64 back to Blobs using fetch API

## Styling

- TailwindCSS 4 with dark theme (zinc color palette)
- Gradient backgrounds and effects for visual polish
- Custom glass-morphism effects with backdrop-blur
- Gradient text using `bg-gradient-to-r bg-clip-text text-transparent`
