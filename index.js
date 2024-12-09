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
import { resolve, join } from "path";
import Store from "electron-store";
import { fileURLToPath } from "url";
import { dirname } from "path";

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tray,
  ollama,
  closeTimeout,
  visible = true;

const exec = (code) =>
    ollama.webContents.executeJavaScript(code).catch(console.error),
  getValue = (key, defaultVal = false) => store.get(key, defaultVal);

const toggleVisibility = (action) => {
  visible = action;
  if (action) {
    clearTimeout(closeTimeout);
    ollama.show();
  } else closeTimeout = setTimeout(() => ollama.hide(), 400);
  ollama.webContents.send("toggle-visibility", action);
};

const registerKeybindings = () => {
  globalShortcut.unregisterAll();
  const toggleVisibilityShortcut = getValue("toggleVisibilityShortcut"),
    toggleMicShortcut = getValue("toggleMicShortcut");

  if (toggleVisibilityShortcut) {
    globalShortcut.register(toggleVisibilityShortcut, () =>
      toggleVisibility(!visible),
    );
  }

  if (toggleMicShortcut) {
    globalShortcut.register(toggleMicShortcut, () => {
      toggleVisibility(true);
      ollama.webContents.send("activate-mic");
    });
  }
};

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().bounds,
    winWidth = 400,
    winHeight = 700;

  ollama = new BrowserWindow({
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

  ollama.loadFile("src/index.html").catch(console.error);

  ollama.on("blur", () => {
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
      label: "Set Keybindings",
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
              "components/setKeybindingsOverlay/preload.js",
            ),
          },
        });
        dialog
          .loadFile("components/setKeybindingsOverlay/index.html")
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
      click: () => ollama.close(),
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
