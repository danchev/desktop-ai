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

const exec = (code) =>
  mainWindow.webContents.executeJavaScript(code).catch(console.error),
  getValue = (key, defaultVal = false) => store.get(key, defaultVal);

const toggleVisibility = (action) => {
  visible = action;
  if (action) {
    clearTimeout(closeTimeout);
    mainWindow.show();
  } else closeTimeout = setTimeout(() => mainWindow.hide(), 400);
  mainWindow.webContents.send("toggle-visibility", action);
};

const registerKeybindings = () => {
  globalShortcut.unregisterAll();

  const toggleVisibilityShortcut = getValue("toggleVisibilityShortcut");
  const toggleMicShortcut = getValue("toggleMicShortcut");

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

const updateWebviewUrl = (url) => {
  mainWindow.webContents.executeJavaScript(`
    document.getElementById('webview').src = \`${url}\`;
  `);
};

const getWebviewUrl = () => {
  const defaultUrl = 'https://gemini.google.com/app';
  let webviewUrl = getValue('webviewUrl');
  if (!webviewUrl) {
    store.set('webviewUrl', defaultUrl);
    webviewUrl = defaultUrl;
  }
  return webviewUrl;
}

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().bounds,
    winWidth = 400,
    winHeight = 700;

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
    show: getValue("show-on-startup", true),
    webPreferences: {
      contextIsolation: true,
      devTools: true,
      nodeIntegration: true,
      webviewTag: true,
      preload: join(__dirname, "src/preload.js"),
    },
  });

  mainWindow.loadFile("src/index.html").then(() => {
    updateWebviewUrl(getWebviewUrl());
  }).catch(console.error);

  mainWindow.on("blur", () => {
    if (!getValue("always-on-top", false)) toggleVisibility(false);
  });

  ipcMain.handle("get-local-storage", (event, key) => getValue(key));

  ipcMain.on("set-local-storage", (event, key, value) => {
    store.set(key, value);
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
          width: 500,
          height: 370,
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
      checked: getValue("always-on-top", false),
      click: (menuItem) => store.set("always-on-top", menuItem.checked),
    },
    {
      label: "Show on Startup",
      type: "checkbox",
      checked: getValue("show-on-startup", true),
      click: (menuItem) => store.set("show-on-startup", menuItem.checked),
    },
    { type: "separator" },
    {
      label: "Quit Ollama",
      click: () => mainWindow.close(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleVisibility(true));
};

app
  .whenReady()
  .then(() => {
    createTray();
    createWindow();
    registerKeybindings();
  })
  .catch(console.error);
