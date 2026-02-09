// Type declarations for Electron API exposed via preload script

export interface FocusFlowData {
    boards: Array<{
        id: number;
        title: string;
        createdAt: string;
    }>;
    columns: Array<{
        id: number;
        boardId: number;
        title: string;
        order: number;
    }>;
    labels: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    tasks: Array<{
        id: number;
        boardId: number;
        title: string;
        description: string;
        urgency: number;
        importance: number;
        columnId: number;
        labelIds: number[];
        checklist: Array<{ id: string; text: string; done: boolean }>;
        comments: Array<{ id: string; text: string; createdAt: number }>;
        attachments: Array<{
            id: string;
            name: string;
            type: string;
            size: number;
            uploadedAt: string;
            data: string;
        }>;
        order: number;
    }>;
    version: number;
    lastModified: string;
}

export interface FocusFlowSettings {
    windowBounds: { width: number; height: number; x?: number; y?: number };
    lastOpenedBoardId: number | null;
    theme: 'dark' | 'light';
}

export interface ElectronAPI {
    loadData: () => Promise<FocusFlowData>;
    saveData: (data: FocusFlowData) => Promise<boolean>;
    loadSettings: () => Promise<FocusFlowSettings>;
    saveSettings: (settings: FocusFlowSettings) => Promise<boolean>;
    getDataPath: () => Promise<string>;
    getSettingsPath: () => Promise<string>;
    exportAll: () => Promise<{
        data: FocusFlowData;
        settings: FocusFlowSettings;
        exportDate: string;
        appVersion: string;
    }>;
    importAll: (importData: { data?: FocusFlowData; settings?: FocusFlowSettings }) => Promise<{
        success: boolean;
        error?: string;
    }>;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export {};
