import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage path
const getDataPath = () => {
    const userDataPath = app.getPath('userData');
    return join(userDataPath, 'focusflow-data.json');
};

const getSettingsPath = () => {
    const userDataPath = app.getPath('userData');
    return join(userDataPath, 'focusflow-settings.json');
};

// Ensure data directory exists
const ensureDataDir = () => {
    const userDataPath = app.getPath('userData');
    if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true });
    }
};

// Default data structure
const getDefaultData = () => ({
    boards: [],
    columns: [],
    tasks: [],
    labels: [],
    version: 1,
    lastModified: new Date().toISOString()
});

// Default settings structure
const getDefaultSettings = () => ({
    windowBounds: { width: 1200, height: 800 },
    lastOpenedBoardId: null,
    theme: 'dark'
});

// Load data from file
const loadData = (): object => {
    try {
        ensureDataDir();
        const dataPath = getDataPath();
        if (existsSync(dataPath)) {
            const content = readFileSync(dataPath, 'utf-8');
            return JSON.parse(content);
        }
        return getDefaultData();
    } catch (error) {
        console.error('Failed to load data:', error);
        return getDefaultData();
    }
};

// Save data to file
const saveData = (data: object): boolean => {
    try {
        ensureDataDir();
        const dataPath = getDataPath();
        const dataWithMeta = {
            ...data,
            lastModified: new Date().toISOString()
        };
        writeFileSync(dataPath, JSON.stringify(dataWithMeta, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Failed to save data:', error);
        return false;
    }
};

// Load settings
const loadSettings = (): object => {
    try {
        ensureDataDir();
        const settingsPath = getSettingsPath();
        if (existsSync(settingsPath)) {
            const content = readFileSync(settingsPath, 'utf-8');
            return JSON.parse(content);
        }
        return getDefaultSettings();
    } catch (error) {
        console.error('Failed to load settings:', error);
        return getDefaultSettings();
    }
};

// Save settings
const saveSettings = (settings: object): boolean => {
    try {
        ensureDataDir();
        const settingsPath = getSettingsPath();
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
};

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    const settings = loadSettings() as { windowBounds?: { width: number; height: number; x?: number; y?: number } };
    const bounds = settings.windowBounds || { width: 1200, height: 800 };

    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#09090b', // zinc-950
        titleBarStyle: 'hiddenInset',
        show: false,
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Save window bounds on close
    mainWindow.on('close', () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds();
            const currentSettings = loadSettings() as object;
            saveSettings({ ...currentSettings, windowBounds: bounds });
        }
    });

    // Load the app
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    }
};

// IPC Handlers
ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_event, data: object) => saveData(data));
ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (_event, settings: object) => saveSettings(settings));
ipcMain.handle('app:getDataPath', () => getDataPath());
ipcMain.handle('app:getSettingsPath', () => getSettingsPath());

// Export all data (for backup)
ipcMain.handle('data:exportAll', () => {
    const data = loadData();
    const settings = loadSettings();
    return {
        data,
        settings,
        exportDate: new Date().toISOString(),
        appVersion: app.getVersion()
    };
});

// Import all data (from backup)
ipcMain.handle('data:importAll', (_event, importData: { data?: object; settings?: object }) => {
    try {
        if (importData.data) {
            saveData(importData.data);
        }
        if (importData.settings) {
            saveSettings(importData.settings);
        }
        return { success: true };
    } catch (error) {
        console.error('Import failed:', error);
        return { success: false, error: String(error) };
    }
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
