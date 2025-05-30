import { contextBridge, ipcRenderer } from "electron";

// Expose a safe version of ipcRenderer.send to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = [
      'move-window',
      'set-local-storage',
      'close',
      'update-webview-url',
      'webview-load-failed', // Added channel
      'webview-load-succeeded' // Added channel
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // If you needed to receive messages from main in renderer.js (not just preload)
  // you would expose ipcRenderer.on as well, similarly whitelisting channels.
  // receive: (channel, func) => {
  //   const validChannels = ['toggle-visibility', 'update-webview-url', 'activate-mic'];
  //   if (validChannels.includes(channel)) {
  //     // Deliberately strip event as it includes `sender`
  //     ipcRenderer.on(channel, (event, ...args) => func(...args));
  //   }
  // }
});


ipcRenderer.on("toggle-visibility", (e, action) => {
  document.querySelector(".view").classList.toggle("close", !action);
});

ipcRenderer.on("update-webview-url", (event, url) => {
  document.getElementById('webview').src = url;
});

// It seems activate-mic is also expected by the main process to be handled here
// Let's ensure it's defined if not already
ipcRenderer.on("activate-mic", () => {
  // Assuming there's a microphone button or similar UI element to interact with
  // For now, let's just log it, as the original task doesn't specify the action.
  console.log("activate-mic event received in preload");
  // Example: if there was a mic button in index.html with id="mic-button"
  // const micButton = document.getElementById('mic-button');
  // if (micButton) micButton.click();
});

window.addEventListener('DOMContentLoaded', () => {
  const webview = document.getElementById('webview');
  if (webview) {
    webview.addEventListener('did-fail-load', (error) => {
      // error object contains properties like errorCode, errorDescription, validatedURL (original URL)
      // We are interested in the URL that was attempted, which is webview.src at this point or error.validatedURL
      window.electronAPI.send('webview-load-failed', {
        failedUrl: error.validatedURL || webview.src, // validatedURL is often the original target
        errorCode: error.errorCode,
        errorDescription: error.errorDescription
      });
    });

    webview.addEventListener('did-finish-load', () => {
      // did-finish-load fires for successful loads
      window.electronAPI.send('webview-load-succeeded', {
        loadedUrl: webview.src
      });
    });

    // Optional: Handle cases where the webview process might crash
    webview.addEventListener('crashed', (event) => {
      console.error('Webview crashed:', event);
      // You could send another IPC message to main to handle this, perhaps reloading or showing an error
      window.electronAPI.send('webview-load-failed', {
        failedUrl: webview.src, // or a placeholder URL indicating a crash
        errorCode: -1000, // Custom error code for crash
        errorDescription: 'The web content process crashed.'
      });
    });

    // Optional: Handle if webview is killed (e.g. out of memory)
     webview.addEventListener('destroyed', (event) => {
      console.error('Webview destroyed:', event);
      // Similar to crashed, might warrant an IPC message
    });
  }
});
