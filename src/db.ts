import Dexie, { type EntityTable } from 'dexie';

interface Board {
    id: number;
    title: string;
    createdAt: Date;
}

interface Label {
    id: number;
    name: string;
    color: string;
}

interface Column {
    id: number;
    boardId: number;
    title: string;
    order: number;
}

interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
    data: Blob;
}

interface Task {
    id: number;
    boardId: number;
    title: string;
    description: string;
    urgency: number; // 0-10
    importance: number; // 0-10
    columnId: number;
    labelIds: number[];
    checklist: { id: string; text: string; done: boolean }[];
    comments: { id: string; text: string; createdAt: number }[];
    attachments: Attachment[];
    order: number;
}

const db = new Dexie('FocusFlowDatabase') as Dexie & {
    boards: EntityTable<Board, 'id'>;
    columns: EntityTable<Column, 'id'>;
    labels: EntityTable<Label, 'id'>;
    tasks: EntityTable<Task, 'id'>;
};

// Note: In Dexie, you only need to specify the indexed fields, not all fields.
// Each version upgrade should include all tables that exist at that version.

db.version(1).stores({
    boards: '++id, title',
    labels: '++id, name, color',
    tasks: '++id, boardId, columnId, *labelIds',
});

db.version(2).stores({
    boards: '++id, title',
    columns: '++id, boardId, order',
    labels: '++id, name, color',
    tasks: '++id, boardId, columnId, *labelIds',
});

db.version(3).stores({
    boards: '++id, title',
    columns: '++id, boardId, order',
    labels: '++id, name, color',
    tasks: '++id, boardId, columnId, order, *labelIds',
});

export { db };
export type { Board, Column, Label, Task };
