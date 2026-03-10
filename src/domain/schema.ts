// Domain models and strict data schemas for FocusFlow

export interface Board {
    id: number;
    title: string;
    createdAt: Date | string;
    order?: number;
}

export interface Label {
    id: number;
    name: string;
    color: string;
    order?: number;
}

export interface Column {
    id: number;
    boardId: number;
    title: string;
    order: number;
}

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date | string;
    data: string; // Base64 encoded in file storage
}

export interface Task {
    id: number;
    boardId: number;
    title: string;
    description: string;
    urgency: number;
    importance: number;
    columnId: number;
    labelIds: number[];
    checklist: { id: string; text: string; done: boolean }[];
    comments: { id: string; text: string; createdAt: number }[];
    attachments: Attachment[];
    order: number;
}

export interface FocusFlowData {
    boards: Board[];
    columns: Column[];
    labels: Label[];
    tasks: Task[];
    version: number;
    lastModified: string;
}

export interface FocusFlowSettings {
    windowBounds: { width: number; height: number; x?: number; y?: number };
    lastOpenedBoardId: number | null;
    theme: 'dark' | 'light';
}
