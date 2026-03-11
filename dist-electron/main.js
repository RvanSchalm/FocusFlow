import { ipcMain, app, BrowserWindow } from "electron";
import { dirname, join } from "path";
import { existsSync, promises, mkdirSync } from "fs";
import { fileURLToPath } from "url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
const getDataPath = () => {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "focusflow-data.json");
};
const getSettingsPath = () => {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "focusflow-settings.json");
};
const ensureDataDir = () => {
  const userDataPath = app.getPath("userData");
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }
};
const getDefaultData = () => ({
  boards: [],
  columns: [],
  tasks: [],
  labels: [],
  version: 1,
  lastModified: (/* @__PURE__ */ new Date()).toISOString()
});
const getDefaultSettings = () => ({
  windowBounds: { width: 1200, height: 800 },
  lastOpenedBoardId: null,
  theme: "dark"
});
const loadData = async () => {
  try {
    ensureDataDir();
    const dataPath = getDataPath();
    if (existsSync(dataPath)) {
      const content = await promises.readFile(dataPath, "utf-8");
      return JSON.parse(content);
    }
    return getDefaultData();
  } catch (error) {
    console.error("Failed to load data:", error);
    return getDefaultData();
  }
};
const saveData = async (data) => {
  try {
    ensureDataDir();
    const dataPath = getDataPath();
    const dataWithMeta = {
      ...data,
      lastModified: (/* @__PURE__ */ new Date()).toISOString()
    };
    await promises.writeFile(dataPath, JSON.stringify(dataWithMeta, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save data:", error);
    return false;
  }
};
const loadSettings = async () => {
  try {
    ensureDataDir();
    const settingsPath = getSettingsPath();
    if (existsSync(settingsPath)) {
      const content = await promises.readFile(settingsPath, "utf-8");
      return JSON.parse(content);
    }
    return getDefaultSettings();
  } catch (error) {
    console.error("Failed to load settings:", error);
    return getDefaultSettings();
  }
};
const saveSettings = async (settings) => {
  try {
    ensureDataDir();
    const settingsPath = getSettingsPath();
    await promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save settings:", error);
    return false;
  }
};
let mainWindow = null;
const createWindow = async () => {
  const settings = await loadSettings();
  const bounds = settings.windowBounds || { width: 1200, height: 800 };
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: "#09090b",
    // zinc-950
    titleBarStyle: "hiddenInset",
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("close", async () => {
    if (mainWindow) {
      const bounds2 = mainWindow.getBounds();
      const currentSettings = await loadSettings();
      await saveSettings({ ...currentSettings, windowBounds: bounds2 });
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname$1, "../dist/index.html"));
  }
};
ipcMain.handle("data:load", () => loadData());
ipcMain.handle("data:save", (_event, data) => saveData(data));
ipcMain.handle("settings:load", () => loadSettings());
ipcMain.handle("settings:save", (_event, settings) => saveSettings(settings));
ipcMain.handle("app:getDataPath", () => getDataPath());
ipcMain.handle("app:getSettingsPath", () => getSettingsPath());
ipcMain.handle("data:exportAll", async () => {
  const data = await loadData();
  const settings = await loadSettings();
  return {
    data,
    settings,
    exportDate: (/* @__PURE__ */ new Date()).toISOString(),
    appVersion: app.getVersion()
  };
});
ipcMain.handle("data:importAll", async (_event, importData) => {
  try {
    if (importData.data) {
      await saveData(importData.data);
    }
    if (importData.settings) {
      await saveSettings(importData.settings);
    }
    return { success: true };
  } catch (error) {
    console.error("Import failed:", error);
    return { success: false, error: String(error) };
  }
});
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
