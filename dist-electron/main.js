import { ipcMain as s, app as a, BrowserWindow as S } from "electron";
import { dirname as _, join as r } from "path";
import { existsSync as l, readFileSync as m, writeFileSync as D, mkdirSync as I } from "fs";
import { fileURLToPath as R } from "url";
const b = R(import.meta.url), g = _(b), c = () => {
  const e = a.getPath("userData");
  return r(e, "focusflow-data.json");
}, u = () => {
  const e = a.getPath("userData");
  return r(e, "focusflow-settings.json");
}, d = () => {
  const e = a.getPath("userData");
  l(e) || I(e, { recursive: !0 });
}, f = () => ({
  boards: [],
  columns: [],
  tasks: [],
  labels: [],
  version: 1,
  lastModified: (/* @__PURE__ */ new Date()).toISOString()
}), w = () => ({
  windowBounds: { width: 1200, height: 800 },
  lastOpenedBoardId: null,
  theme: "dark"
}), y = () => {
  try {
    d();
    const e = c();
    if (l(e)) {
      const t = m(e, "utf-8");
      return JSON.parse(t);
    }
    return f();
  } catch (e) {
    return console.error("Failed to load data:", e), f();
  }
}, P = (e) => {
  try {
    d();
    const t = c(), o = {
      ...e,
      lastModified: (/* @__PURE__ */ new Date()).toISOString()
    };
    return D(t, JSON.stringify(o, null, 2), "utf-8"), !0;
  } catch (t) {
    return console.error("Failed to save data:", t), !1;
  }
}, i = () => {
  try {
    d();
    const e = u();
    if (l(e)) {
      const t = m(e, "utf-8");
      return JSON.parse(t);
    }
    return w();
  } catch (e) {
    return console.error("Failed to load settings:", e), w();
  }
}, h = (e) => {
  try {
    d();
    const t = u();
    return D(t, JSON.stringify(e, null, 2), "utf-8"), !0;
  } catch (t) {
    return console.error("Failed to save settings:", t), !1;
  }
};
let n = null;
const p = () => {
  const t = i().windowBounds || { width: 1200, height: 800 };
  n = new S({
    width: t.width,
    height: t.height,
    x: t.x,
    y: t.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: r(g, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    backgroundColor: "#09090b",
    // zinc-950
    titleBarStyle: "hiddenInset",
    show: !1
  }), n.once("ready-to-show", () => {
    n?.show();
  }), n.on("close", () => {
    if (n) {
      const o = n.getBounds(), v = i();
      h({ ...v, windowBounds: o });
    }
  }), process.env.VITE_DEV_SERVER_URL ? (n.loadURL(process.env.VITE_DEV_SERVER_URL), n.webContents.openDevTools()) : n.loadFile(r(g, "../dist/index.html"));
};
s.handle("data:load", () => y());
s.handle("data:save", (e, t) => P(t));
s.handle("settings:load", () => i());
s.handle("settings:save", (e, t) => h(t));
s.handle("app:getDataPath", () => c());
s.handle("app:getSettingsPath", () => u());
s.handle("data:exportAll", () => {
  const e = y(), t = i();
  return {
    data: e,
    settings: t,
    exportDate: (/* @__PURE__ */ new Date()).toISOString(),
    appVersion: a.getVersion()
  };
});
s.handle("data:importAll", (e, t) => {
  try {
    return t.data && P(t.data), t.settings && h(t.settings), { success: !0 };
  } catch (o) {
    return console.error("Import failed:", o), { success: !1, error: String(o) };
  }
});
a.whenReady().then(() => {
  p(), a.on("activate", () => {
    S.getAllWindows().length === 0 && p();
  });
});
a.on("window-all-closed", () => {
  process.platform !== "darwin" && a.quit();
});
