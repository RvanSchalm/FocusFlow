import '../types/electron.d.ts';
import type { FocusFlowData, FocusFlowSettings, Board, Column, Task, Label } from '../domain/schema';
import { validateFocusFlowData, validateFocusFlowSettings } from '../domain/validation';

// Check if running in Electron and return the API
const getElectronAPI = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
        return window.electronAPI;
    }
    return null;
};

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
    let dataCache: FocusFlowData | null = null;
    const api = getElectronAPI();

    if (api) {
        dataCache = await api.loadData() as FocusFlowData;
    } else {
        // Fallback to localStorage for web development
        const stored = localStorage.getItem('focusflow-data');
        dataCache = stored ? JSON.parse(stored) : getDefaultData();
    }

    if (dataCache) {
        const validation = validateFocusFlowData(dataCache);
        if (!validation.isValid) {
            console.error('Data validation failed:', validation.error);
            dataCache = getDefaultData();
        }
    }

    return dataCache || getDefaultData();
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Save data to storage with debouncing
export const saveDataDebounced = (data: FocusFlowData, onSaveStart?: () => void, onSaveEnd?: () => void): void => {
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
        try {
            saveTimeout = null;
            if (onSaveStart) onSaveStart();
            const api = getElectronAPI();
            if (api) {
                // Pre-process for IPC
                const dataForStorage = JSON.parse(JSON.stringify(data));
                await api.saveData(dataForStorage);
            } else {
                localStorage.setItem('focusflow-data', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to save data asynchronously:', error);
        } finally {
            if (onSaveEnd) onSaveEnd();
        }
    }, 500);
};

export const getSettings = async (): Promise<FocusFlowSettings> => {
    let settingsCache: FocusFlowSettings | null = null;
    const api = getElectronAPI();

    if (api) {
        settingsCache = await api.loadSettings();
    } else {
        const stored = localStorage.getItem('focusflow-settings');
        settingsCache = stored ? JSON.parse(stored) : getDefaultSettings();
    }

    if (settingsCache) {
        const validation = validateFocusFlowSettings(settingsCache);
        if (!validation.isValid) {
            console.error('Settings validation failed:', validation.error);
            settingsCache = getDefaultSettings();
        }
    }

    return settingsCache || getDefaultSettings();
};

let settingsSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const saveSettingsDebounced = (settings: FocusFlowSettings, onSaveStart?: () => void, onSaveEnd?: () => void): void => {
    if (settingsSaveTimeout) clearTimeout(settingsSaveTimeout);

    settingsSaveTimeout = setTimeout(async () => {
        try {
            settingsSaveTimeout = null;
            if (onSaveStart) onSaveStart();
            const api = getElectronAPI();
            if (api) {
                await api.saveSettings(settings);
            } else {
                localStorage.setItem('focusflow-settings', JSON.stringify(settings));
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            if (onSaveEnd) onSaveEnd();
        }
    }, 500);
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
    boards?: Board[];
    columns?: Column[];
    tasks?: Task[];
    labels?: Label[];
}): Promise<{ success: boolean; dataProcessed?: FocusFlowData; settingsProcessed?: FocusFlowSettings; error?: string }> => {
    try {
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

        const validation = validateFocusFlowData(dataToImport);
        if (!validation.isValid) {
            return { success: false, error: `Invalid import data: ${validation.error}` };
        }

        const api = getElectronAPI();
        if (api) {
            const dataForStorage = JSON.parse(JSON.stringify(dataToImport));
            const result = await api.importAll({
                data: dataForStorage,
                settings: importData.settings
            });
            return { ...result, dataProcessed: dataToImport, settingsProcessed: importData.settings };
        } else {
            localStorage.setItem('focusflow-data', JSON.stringify(dataToImport));
            if (importData.settings) {
                localStorage.setItem('focusflow-settings', JSON.stringify(importData.settings));
            }
            return { success: true, dataProcessed: dataToImport, settingsProcessed: importData.settings };
        }
    } catch (error) {
        return { success: false, error: String(error) };
    }
};
