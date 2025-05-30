import {
  app,
  Tray,
  Menu,
  shell,
  BrowserWindow,
  globalShortcut,
  screen,
  ipcMain,
  dialog, // Added dialog
} from "electron";
import { resolve, join, dirname } from "path";
import Store from "electron-store";
import { fileURLToPath } from "url";

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tray, mainWindow, closeTimeout, visible = true;
let lastGoodUrl = 'about:blank'; // Initialize lastGoodUrl

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
  // Basic check for empty or clearly invalid URLs before attempting to load
  if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://') && url !== 'about:blank')) {
    console.warn(`Invalid URL passed to updateWebviewUrl: ${url}. Using last known good URL or about:blank.`);
    // Attempt to load lastGoodUrl or about:blank if the provided url is obviously invalid
    const fallbackUrl = (lastGoodUrl && lastGoodUrl !== url) ? lastGoodUrl : 'about:blank';
    executeJavaScript(`document.getElementById('webview').src = \`${fallbackUrl}\`;`);
    if (url !== fallbackUrl) { // Avoid erroring for the fallback itself
      dialog.showErrorBox("Invalid URL", `The provided URL "${url}" is not valid. Loading previous or blank page.`);
    }
    return;
  }
  // The actual load will trigger 'did-finish-load' or 'did-fail-load' via preload
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
      const storedWebviewUrl = getStoreValue("webviewUrl", ""); // Default to empty string
      if (storedWebviewUrl && storedWebviewUrl !== 'about:blank') {
        updateWebviewUrl(storedWebviewUrl);
      } else {
        // If no URL is stored or it's about:blank, we can explicitly set it
        // or rely on the webview's default src if defined in HTML,
        // or just let it be (usually defaults to a blank page).
        // For clarity, let's ensure it starts with about:blank if no valid URL.
        updateWebviewUrl('about:blank');
      }
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

  ipcMain.on('webview-load-succeeded', (event, { loadedUrl }) => {
    if (loadedUrl && loadedUrl !== 'about:blank') { // Don't store about:blank as a "good" user URL
        lastGoodUrl = loadedUrl;
        // Optionally, update the store if you want the last successfully loaded URL to persist
        // Be careful with this, as it might overwrite a user's deliberate setting if they temporarily go to a different page.
        // For now, just updating lastGoodUrl for session recovery.
        // setStoreValue("webviewUrl", loadedUrl); 
    }
    console.log(`Webview successfully loaded: ${loadedUrl}`);
  });

  ipcMain.on('webview-load-failed', (event, { failedUrl, errorCode, errorDescription }) => {
    // Ignore specific errors if necessary, e.g. -3 (ABORTED) might be common if user navigates quickly
    if (errorCode === -3 /* ABORTED */) {
      console.warn(`Webview load aborted for ${failedUrl}. This might be due to navigation.`);
      return;
    }

    dialog.showErrorBox(
      "WebView Load Error",
      `Failed to load: ${failedUrl}\nError (${errorCode}): ${errorDescription}`
    );
    
    // Check if lastGoodUrl is different and not null/empty before attempting to revert
    if (lastGoodUrl && lastGoodUrl !== failedUrl && lastGoodUrl !== 'about:blank') {
      updateWebviewUrl(lastGoodUrl);
    } else {
      // If no valid lastGoodUrl or it's the same as the failed one, load about:blank
      updateWebviewUrl('about:blank');
    }
  });

  ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
    if (mainWindow) {
      const currentPosition = mainWindow.getPosition();
      const newX = currentPosition[0] + deltaX;
      const newY = currentPosition[1] + deltaY;
      mainWindow.setPosition(newX, newY, false); // `false` for animation parameter
    }
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
