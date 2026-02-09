// Data service for Electron - replaces Dexie with JSON file storage
// Uses IPC to communicate with the main process for file operations

import '../types/electron.d.ts';

export interface Board {
    id: number;
    title: string;
    createdAt: Date | string;
}

export interface Label {
    id: number;
    name: string;
    color: string;
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

// Event system for reactive updates
type DataChangeListener = () => void;
const listeners: Set<DataChangeListener> = new Set();

export const subscribeToDataChanges = (listener: DataChangeListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const notifyListeners = () => {
    listeners.forEach(listener => listener());
};

// Check if running in Electron and return the API
const getElectronAPI = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
        return window.electronAPI;
    }
    return null;
};

// In-memory cache for faster access
let dataCache: FocusFlowData | null = null;
let settingsCache: FocusFlowSettings | null = null;

// Default data
const getDefaultData = (): FocusFlowData => ({
    boards: [],
    columns: [],
    labels: [],
    tasks: [],
    version: 1,
    lastModified: new Date().toISOString()
});

const getDefaultSettings = (): FocusFlowSettings => ({
    windowBounds: { width: 1200, height: 800 },
    lastOpenedBoardId: null,
    theme: 'dark'
});

// Initialize data from storage
export const initializeData = async (): Promise<FocusFlowData> => {
    if (dataCache) return dataCache;
    
    const api = getElectronAPI();
    if (api) {
        dataCache = await api.loadData() as FocusFlowData;
    } else {
        // Fallback to localStorage for web development
        const stored = localStorage.getItem('focusflow-data');
        dataCache = stored ? JSON.parse(stored) : getDefaultData();
    }
    
    return dataCache || getDefaultData();
};

// Save data to storage
const persistData = async (): Promise<boolean> => {
    if (!dataCache) return false;
    
    dataCache.lastModified = new Date().toISOString();
    
    const api = getElectronAPI();
    if (api) {
        // Convert dates to strings for JSON storage
        const dataForStorage = JSON.parse(JSON.stringify(dataCache));
        return await api.saveData(dataForStorage);
    } else {
        // Fallback to localStorage for web development
        localStorage.setItem('focusflow-data', JSON.stringify(dataCache));
        return true;
    }
};

// Generate next ID for a collection
const getNextId = (items: { id: number }[]): number => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
};

// ==================== BOARDS ====================

export const getBoards = async (): Promise<Board[]> => {
    const data = await initializeData();
    return data.boards;
};

export const getBoard = async (id: number): Promise<Board | undefined> => {
    const data = await initializeData();
    return data.boards.find(b => b.id === id);
};

export const addBoard = async (board: Omit<Board, 'id'>): Promise<number> => {
    const data = await initializeData();
    const newId = getNextId(data.boards);
    const newBoard: Board = { ...board, id: newId };
    data.boards.push(newBoard);
    await persistData();
    notifyListeners();
    return newId;
};

export const updateBoard = async (id: number, updates: Partial<Omit<Board, 'id'>>): Promise<void> => {
    const data = await initializeData();
    const index = data.boards.findIndex(b => b.id === id);
    if (index !== -1) {
        data.boards[index] = { ...data.boards[index], ...updates };
        await persistData();
        notifyListeners();
    }
};

export const deleteBoard = async (id: number): Promise<void> => {
    const data = await initializeData();
    data.boards = data.boards.filter(b => b.id !== id);
    // Also delete associated columns and tasks
    data.columns = data.columns.filter(c => c.boardId !== id);
    data.tasks = data.tasks.filter(t => t.boardId !== id);
    await persistData();
    notifyListeners();
};

// ==================== COLUMNS ====================

export const getColumns = async (boardId?: number): Promise<Column[]> => {
    const data = await initializeData();
    if (boardId !== undefined) {
        return data.columns.filter(c => c.boardId === boardId);
    }
    return data.columns;
};

export const getColumn = async (id: number): Promise<Column | undefined> => {
    const data = await initializeData();
    return data.columns.find(c => c.id === id);
};

export const addColumn = async (column: Omit<Column, 'id'>): Promise<number> => {
    const data = await initializeData();
    const newId = getNextId(data.columns);
    const newColumn: Column = { ...column, id: newId };
    data.columns.push(newColumn);
    await persistData();
    notifyListeners();
    return newId;
};

export const updateColumn = async (id: number, updates: Partial<Omit<Column, 'id'>>): Promise<void> => {
    const data = await initializeData();
    const index = data.columns.findIndex(c => c.id === id);
    if (index !== -1) {
        data.columns[index] = { ...data.columns[index], ...updates };
        await persistData();
        notifyListeners();
    }
};

export const deleteColumn = async (id: number): Promise<void> => {
    const data = await initializeData();
    data.columns = data.columns.filter(c => c.id !== id);
    // Also delete associated tasks
    data.tasks = data.tasks.filter(t => t.columnId !== id);
    await persistData();
    notifyListeners();
};

export const bulkUpdateColumns = async (updates: { id: number; changes: Partial<Column> }[]): Promise<void> => {
    const data = await initializeData();
    for (const update of updates) {
        const index = data.columns.findIndex(c => c.id === update.id);
        if (index !== -1) {
            data.columns[index] = { ...data.columns[index], ...update.changes };
        }
    }
    await persistData();
    notifyListeners();
};

// ==================== LABELS ====================

export const getLabels = async (): Promise<Label[]> => {
    const data = await initializeData();
    return data.labels;
};

export const getLabel = async (id: number): Promise<Label | undefined> => {
    const data = await initializeData();
    return data.labels.find(l => l.id === id);
};

export const addLabel = async (label: Omit<Label, 'id'>): Promise<number> => {
    const data = await initializeData();
    const newId = getNextId(data.labels);
    const newLabel: Label = { ...label, id: newId };
    data.labels.push(newLabel);
    await persistData();
    notifyListeners();
    return newId;
};

export const updateLabel = async (id: number, updates: Partial<Omit<Label, 'id'>>): Promise<void> => {
    const data = await initializeData();
    const index = data.labels.findIndex(l => l.id === id);
    if (index !== -1) {
        data.labels[index] = { ...data.labels[index], ...updates };
        await persistData();
        notifyListeners();
    }
};

export const deleteLabel = async (id: number): Promise<void> => {
    const data = await initializeData();
    data.labels = data.labels.filter(l => l.id !== id);
    // Also remove label from tasks
    data.tasks.forEach(task => {
        task.labelIds = task.labelIds.filter(lid => lid !== id);
    });
    await persistData();
    notifyListeners();
};

// ==================== TASKS ====================

export const getTasks = async (boardId?: number): Promise<Task[]> => {
    const data = await initializeData();
    if (boardId !== undefined) {
        return data.tasks.filter(t => t.boardId === boardId);
    }
    return data.tasks;
};

export const getTask = async (id: number): Promise<Task | undefined> => {
    const data = await initializeData();
    return data.tasks.find(t => t.id === id);
};

export const addTask = async (task: Omit<Task, 'id'>): Promise<number> => {
    const data = await initializeData();
    const newId = getNextId(data.tasks);
    const newTask: Task = { ...task, id: newId };
    data.tasks.push(newTask);
    await persistData();
    notifyListeners();
    return newId;
};

export const updateTask = async (id: number, updates: Partial<Omit<Task, 'id'>>): Promise<void> => {
    const data = await initializeData();
    const index = data.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        data.tasks[index] = { ...data.tasks[index], ...updates };
        await persistData();
        notifyListeners();
    }
};

export const deleteTask = async (id: number): Promise<void> => {
    const data = await initializeData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    await persistData();
    notifyListeners();
};

export const bulkUpdateTasks = async (updates: { id: number; changes: Partial<Task> }[]): Promise<void> => {
    const data = await initializeData();
    for (const update of updates) {
        const index = data.tasks.findIndex(t => t.id === update.id);
        if (index !== -1) {
            data.tasks[index] = { ...data.tasks[index], ...update.changes };
        }
    }
    await persistData();
    notifyListeners();
};

// ==================== IMPORT / EXPORT ====================

export const exportAllData = async (): Promise<{
    data: FocusFlowData;
    settings: FocusFlowSettings;
    exportDate: string;
    appVersion: string;
}> => {
    const api = getElectronAPI();
    if (api) {
        return await api.exportAll();
    } else {
        const data = await initializeData();
        const storedSettings = localStorage.getItem('focusflow-settings');
        const settings = storedSettings ? JSON.parse(storedSettings) : getDefaultSettings();
        return {
            data,
            settings,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0'
        };
    }
};

export const importAllData = async (importData: { 
    data?: FocusFlowData; 
    settings?: FocusFlowSettings;
    // Support legacy format with boards/columns/tasks/labels at root
    boards?: Board[];
    columns?: Column[];
    tasks?: Task[];
    labels?: Label[];
}): Promise<{ success: boolean; error?: string }> => {
    try {
        // Handle legacy format (boards/columns/tasks/labels at root level)
        let dataToImport: FocusFlowData;
        if (importData.data) {
            dataToImport = importData.data;
        } else if (importData.boards || importData.columns || importData.tasks || importData.labels) {
            dataToImport = {
                boards: importData.boards || [],
                columns: importData.columns || [],
                tasks: importData.tasks || [],
                labels: importData.labels || [],
                version: 1,
                lastModified: new Date().toISOString()
            };
        } else {
            return { success: false, error: 'No valid data found in import file' };
        }

        const api = getElectronAPI();
        if (api) {
            // Convert dates to strings for JSON storage
            const dataForStorage = JSON.parse(JSON.stringify(dataToImport));
            const result = await api.importAll({
                data: dataForStorage,
                settings: importData.settings
            });
            if (result.success) {
                // Refresh cache
                dataCache = await api.loadData() as FocusFlowData;
                notifyListeners();
            }
            return result;
        } else {
            // Fallback to localStorage
            localStorage.setItem('focusflow-data', JSON.stringify(dataToImport));
            if (importData.settings) {
                localStorage.setItem('focusflow-settings', JSON.stringify(importData.settings));
            }
            dataCache = dataToImport;
            notifyListeners();
            return { success: true };
        }
    } catch (error) {
        return { success: false, error: String(error) };
    }
};

// ==================== SETTINGS ====================

export const getSettings = async (): Promise<FocusFlowSettings> => {
    if (settingsCache) return settingsCache;
    
    const api = getElectronAPI();
    if (api) {
        settingsCache = await api.loadSettings();
    } else {
        const stored = localStorage.getItem('focusflow-settings');
        settingsCache = stored ? JSON.parse(stored) : getDefaultSettings();
    }
    
    return settingsCache || getDefaultSettings();
};

export const updateSettings = async (updates: Partial<FocusFlowSettings>): Promise<void> => {
    const current = await getSettings();
    settingsCache = { ...current, ...updates };
    
    const api = getElectronAPI();
    if (api) {
        await api.saveSettings(settingsCache);
    } else {
        localStorage.setItem('focusflow-settings', JSON.stringify(settingsCache));
    }
};

// ==================== CLEAR ALL DATA ====================

export const clearAllData = async (): Promise<void> => {
    dataCache = getDefaultData();
    await persistData();
    notifyListeners();
};
