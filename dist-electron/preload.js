import { contextBridge, ipcRenderer } from "electron";
const electronAPI = {
  // Data operations
  loadData: () => ipcRenderer.invoke("data:load"),
  saveData: (data) => ipcRenderer.invoke("data:save", data),
  // Settings operations
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  // Paths
  getDataPath: () => ipcRenderer.invoke("app:getDataPath"),
  getSettingsPath: () => ipcRenderer.invoke("app:getSettingsPath"),
  // Import/Export
  exportAll: () => ipcRenderer.invoke("data:exportAll"),
  importAll: (importData) => ipcRenderer.invoke("data:importAll", importData)
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
