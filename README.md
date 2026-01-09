# FocusFlow

FocusFlow is a beautiful, privacy-focused, local Kanban board application designed for maximum productivity and data portability. Built with React and modern web technologies, it offers a premium user experience without sending your data to the cloud.

## Features

-   **Local-First Architecture:** All data (boards, tasks, files) is stored locally in your browser (IndexedDB). No sign-up, no cloud, no tracking.
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
-   **State/Storage:** Dexie.js (IndexedDB wrapper)
-   **Editor:** Tiptap (Headless wrapper for ProseMirror)
-   **Drag & Drop:** @hello-pangea/dnd

## getting Started

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

## Development

-   `src/components`: UI components (Sidebar, BoardView, TaskCard, etc.)
-   `src/db.ts`: Database schema definition.

## License

MIT
