import { contextBridge as a, ipcRenderer as t } from "electron";
const o = {
  // Data operations
  loadData: () => t.invoke("data:load"),
  saveData: (e) => t.invoke("data:save", e),
  // Settings operations
  loadSettings: () => t.invoke("settings:load"),
  saveSettings: (e) => t.invoke("settings:save", e),
  // Paths
  getDataPath: () => t.invoke("app:getDataPath"),
  getSettingsPath: () => t.invoke("app:getSettingsPath"),
  // Import/Export
  exportAll: () => t.invoke("data:exportAll"),
  importAll: (e) => t.invoke("data:importAll", e)
};
a.exposeInMainWorld("electronAPI", o);
