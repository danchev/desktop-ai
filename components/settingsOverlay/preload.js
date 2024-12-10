const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getLocalStorage: (a) => ipcRenderer.invoke("get-local-storage", a),
  setLocalStorage: (a, b) => ipcRenderer.send("set-local-storage", a, b),
  updateWebviewUrl: (url) => ipcRenderer.send("update-webview-url", url),
  close: () => ipcRenderer.send("close"),
});
