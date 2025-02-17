import {
  app,
  Tray,
  Menu,
  shell,
  BrowserWindow,
  globalShortcut,
  screen,
  ipcMain,
} from "electron";
import { resolve, join, dirname } from "path";
import Store from "electron-store";
import { fileURLToPath } from "url";

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tray, mainWindow, closeTimeout, visible = true;

// Utility functions
const executeJavaScript = (code) =>
  mainWindow.webContents.executeJavaScript(code).catch(console.error);
const getStoreValue = (key, defaultVal = false) => store.get(key, defaultVal);
const setStoreValue = (key, value) => store.set(key, value);

const toggleVisibility = (action) => {
  visible = action;
  clearTimeout(closeTimeout);
  if (action) {
    mainWindow.show();
  } else {
    closeTimeout = setTimeout(() => mainWindow.hide(), 400);
  }
  mainWindow.webContents.send("toggle-visibility", action);
};

const registerKeybindings = () => {
  globalShortcut.unregisterAll();

  const toggleVisibilityShortcut = getStoreValue("toggleVisibilityShortcut");
  const toggleMicShortcut = getStoreValue("toggleMicShortcut");

  if (toggleVisibilityShortcut) {
    globalShortcut.register(toggleVisibilityShortcut, () =>
      toggleVisibility(!visible),
    );
  }

  if (toggleMicShortcut) {
    globalShortcut.register(toggleMicShortcut, () => {
      toggleVisibility(true);
      mainWindow.webContents.send("activate-mic");
    });
  }
};

const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (e) {
    console.error("Invalid URL:", e.message);
    return false;
  }
};

const updateWebviewUrl = (url) => {
  if (!isValidUrl(url)) return;
  executeJavaScript(`document.getElementById('webview').src = \`${url}\`;`);
};

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().bounds;
  const winWidth = 400;
  const winHeight = 700;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    frame: false,
    movable: true,
    maximizable: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    x: width - winWidth - 10,
    y: height - winHeight - 60,
    icon: resolve(__dirname, "icon.png"),
    show: getStoreValue("show-on-startup", true),
    webPreferences: {
      contextIsolation: true,
      devTools: true,
      nodeIntegration: true,
      webviewTag: true,
      preload: join(__dirname, "src/preload.js"),
    },
  });

  mainWindow
    .loadFile("src/index.html")
    .then(() => {
      const webviewUrl = getStoreValue("webviewUrl", false);
      updateWebviewUrl(webviewUrl);
    })
    .catch(console.error);

  mainWindow.on("blur", () => {
    if (!getStoreValue("always-on-top", false)) toggleVisibility(false);
  });

  // IPC Handlers
  ipcMain.handle("get-local-storage", (event, key) => getStoreValue(key));
  ipcMain.on("set-local-storage", (event, key, value) => {
    setStoreValue(key, value);
    registerKeybindings();
  });
  ipcMain.on("close", (event) => {
    BrowserWindow.fromWebContents(event.sender).close();
  });
  ipcMain.on("update-webview-url", (event, url) => {
    updateWebviewUrl(url);
  });
};

const createTray = () => {
  tray = new Tray(resolve(__dirname, "assets/icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "About (GitHub)",
      click: () =>
        shell
          .openExternal("https://github.com/danchev/ollama-desktop")
          .catch(console.error),
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        const dialog = new BrowserWindow({
          width: 550,
          height: 320,
          frame: false,
          maximizable: false,
          resizable: false,
          skipTaskbar: true,
          webPreferences: {
            contextIsolation: true,
            preload: join(
              __dirname,
              "components/settingsOverlay/preload.js",
            ),
          },
        });
        dialog
          .loadFile("components/settingsOverlay/index.html")
          .catch(console.error);
        dialog.show();
      },
    },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: getStoreValue("always-on-top", false),
      click: (menuItem) => setStoreValue("always-on-top", menuItem.checked),
    },
    {
      label: "Show on Startup",
      type: "checkbox",
      checked: getStoreValue("show-on-startup", true),
      click: (menuItem) => setStoreValue("show-on-startup", menuItem.checked),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => mainWindow.close(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleVisibility(true));
};

// App lifecycle
app
  .whenReady()
  .then(() => {
    createTray();
    createWindow();
    registerKeybindings();
  })
  .catch(console.error);
