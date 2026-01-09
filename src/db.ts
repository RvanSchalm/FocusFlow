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

db.version(1).stores({
    boards: '++id, title',
    labels: '++id, name, color',
    tasks: '++id, boardId, title, description, urgency, importance, columnId, *labelIds',
});

db.version(2).stores({
    columns: '++id, boardId, title, order',
    tasks: '++id, boardId, title, description, urgency, importance, columnId, *labelIds'
});

db.version(3).stores({
    tasks: '++id, boardId, title, description, urgency, importance, columnId, *labelIds, order'
});

export { db };
export type { Board, Column, Label, Task };
