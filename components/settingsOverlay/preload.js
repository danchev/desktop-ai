const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getLocalStorage: (key) => ipcRenderer.invoke("get-local-storage", key),
  setLocalStorage: (key, value) => ipcRenderer.send("set-local-storage", key, value),
  updateWebviewUrl: (url) => ipcRenderer.send("update-webview-url", url),
  close: () => ipcRenderer.send("close"),
});
