import { ipcMain as s, app as n, BrowserWindow as S } from "electron";
import { dirname as v, join as r } from "path";
import { existsSync as c, promises as d, mkdirSync as _ } from "fs";
import { fileURLToPath as I } from "url";
const F = I(import.meta.url), w = v(F), u = () => {
  const e = n.getPath("userData");
  return r(e, "focusflow-data.json");
}, h = () => {
  const e = n.getPath("userData");
  return r(e, "focusflow-settings.json");
}, l = () => {
  const e = n.getPath("userData");
  c(e) || _(e, { recursive: !0 });
}, f = () => ({
  boards: [],
  columns: [],
  tasks: [],
  labels: [],
  version: 1,
  lastModified: (/* @__PURE__ */ new Date()).toISOString()
}), p = () => ({
  windowBounds: { width: 1200, height: 800 },
  lastOpenedBoardId: null,
  theme: "dark"
}), m = async () => {
  try {
    l();
    const e = u();
    if (c(e)) {
      const t = await d.readFile(e, "utf-8");
      return JSON.parse(t);
    }
    return f();
  } catch (e) {
    return console.error("Failed to load data:", e), f();
  }
}, D = async (e) => {
  try {
    l();
    const t = u(), o = {
      ...e,
      lastModified: (/* @__PURE__ */ new Date()).toISOString()
    };
    return await d.writeFile(t, JSON.stringify(o, null, 2), "utf-8"), !0;
  } catch (t) {
    return console.error("Failed to save data:", t), !1;
  }
}, i = async () => {
  try {
    l();
    const e = h();
    if (c(e)) {
      const t = await d.readFile(e, "utf-8");
      return JSON.parse(t);
    }
    return p();
  } catch (e) {
    return console.error("Failed to load settings:", e), p();
  }
}, g = async (e) => {
  try {
    l();
    const t = h();
    return await d.writeFile(t, JSON.stringify(e, null, 2), "utf-8"), !0;
  } catch (t) {
    return console.error("Failed to save settings:", t), !1;
  }
};
let a = null;
const y = async () => {
  const t = (await i()).windowBounds || { width: 1200, height: 800 };
  a = new S({
    width: t.width,
    height: t.height,
    x: t.x,
    y: t.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: r(w, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    backgroundColor: "#09090b",
    // zinc-950
    titleBarStyle: "hiddenInset",
    show: !1
  }), a.once("ready-to-show", () => {
    a?.show();
  }), a.on("close", async () => {
    if (a) {
      const o = a.getBounds(), P = await i();
      await g({ ...P, windowBounds: o });
    }
  }), process.env.VITE_DEV_SERVER_URL ? (a.loadURL(process.env.VITE_DEV_SERVER_URL), a.webContents.openDevTools()) : a.loadFile(r(w, "../dist/index.html"));
};
s.handle("data:load", () => m());
s.handle("data:save", (e, t) => D(t));
s.handle("settings:load", () => i());
s.handle("settings:save", (e, t) => g(t));
s.handle("app:getDataPath", () => u());
s.handle("app:getSettingsPath", () => h());
s.handle("data:exportAll", async () => {
  const e = await m(), t = await i();
  return {
    data: e,
    settings: t,
    exportDate: (/* @__PURE__ */ new Date()).toISOString(),
    appVersion: n.getVersion()
  };
});
s.handle("data:importAll", async (e, t) => {
  try {
    return t.data && await D(t.data), t.settings && await g(t.settings), { success: !0 };
  } catch (o) {
    return console.error("Import failed:", o), { success: !1, error: String(o) };
  }
});
n.whenReady().then(() => {
  y(), n.on("activate", () => {
    S.getAllWindows().length === 0 && y();
  });
});
n.on("window-all-closed", () => {
  process.platform !== "darwin" && n.quit();
});
