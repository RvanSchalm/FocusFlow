# FocusFlow

FocusFlow is a beautiful, privacy-focused, local Kanban board application designed for maximum productivity and data portability. Built with React and modern web technologies, it offers a premium user experience without sending your data to the cloud.

## Features

-   **Desktop-First Architecture:** All data (boards, tasks, files) is stored locally using Electron JSON file storage via IPC. No sign-up, no cloud, no tracking. A localStorage fallback exists for browser development.
-   **Rich Task Management:**
    -   Create multiple boards and columns.
    -   Drag-and-drop tasks and checklist items.
    -   Rich text description editor.
    -   Urgency & Importance matrix categorization.
    -   Color-coded labels.
-   **File Attachments:** using Blob storage
    -   Upload images, PDFs, and documents directly to tasks.
    -   Image previews and immediate access.
-   **Full Data Portability:**
    -   **Export:** Backup your entire environment (including large file attachments) to a single JSON file.
    -   **Import:** Restore your workspace on any device effortlessly.
-   **Modern UI/UX:**
    -   Sleek dark mode interface.
    -   Fluid animations and interactions.
    -   Keyboard accessible.

## Tech Stack

-   **Frontend:** React 19, TypeScript, Vite
-   **Styling:** TailwindCSS 4
-   **State/Storage:** Zustand (State), Electron JSON IPC (Storage)
-   **Editor:** Tiptap (Headless wrapper for ProseMirror)
-   **Drag & Drop:** @hello-pangea/dnd

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd FocusFlow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## Agent Instructions

- Global agent guidance lives in `AGENTS.md`.
- Reusable agent skills live in `.agents/skills/`.
- Each skill uses this structure:

```text
.agents/skills/<skill-name>/
  SKILL.md
  scripts/      (optional)
  references/   (optional)
  assets/       (optional)
```

## Development

-   `src/components`: UI components (Sidebar, BoardView, TaskCard, etc.)
-   `src/domain`: Domain logic, schema, and validation rules.
-   `src/store`: Zustand state management.
-   `src/services/dataService.ts`: Data access layer and IPC bridge.

## License

MIT