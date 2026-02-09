import { contextBridge, ipcRenderer } from 'electron';

// Types for the API
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
            data: string; // Base64 encoded
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
    // Data operations
    loadData: () => Promise<FocusFlowData>;
    saveData: (data: FocusFlowData) => Promise<boolean>;
    
    // Settings operations
    loadSettings: () => Promise<FocusFlowSettings>;
    saveSettings: (settings: FocusFlowSettings) => Promise<boolean>;
    
    // Paths
    getDataPath: () => Promise<string>;
    getSettingsPath: () => Promise<string>;
    
    // Import/Export
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

// Expose API to renderer
const electronAPI: ElectronAPI = {
    // Data operations
    loadData: () => ipcRenderer.invoke('data:load'),
    saveData: (data) => ipcRenderer.invoke('data:save', data),
    
    // Settings operations
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
    
    // Paths
    getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
    getSettingsPath: () => ipcRenderer.invoke('app:getSettingsPath'),
    
    // Import/Export
    exportAll: () => ipcRenderer.invoke('data:exportAll'),
    importAll: (importData) => ipcRenderer.invoke('data:importAll', importData),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for window object
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
