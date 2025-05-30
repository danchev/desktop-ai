const shortcutObjs = document.querySelectorAll(".btn");
const webviewUrlInput = document.querySelector(".url-input");

const register = (event) => { // Parameter is the click event
  const buttonElement = event.target; // Get the button element from the event
  const originalText = buttonElement.innerText || "Set Shortcut"; // Store original text, default if empty
  buttonElement.innerText = "Recording..."; // Update button text

  const shortcut = [];

  const keydownHandler = (e) => {
    e.preventDefault(); // Prevent default browser actions for keys
    shortcut.push(e.key.toUpperCase()); // Store keys in uppercase for consistency
  };

  const keyupHandler = (e) => {
    e.preventDefault();
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);

    // Filter out modifier keys if they are the only keys pressed
    const validShortcut = shortcut.filter(key => !["CONTROL", "SHIFT", "ALT", "META"].includes(key));

    if (e.key.toUpperCase() === "BACKSPACE" || validShortcut.length === 0) {
      buttonElement.innerText = originalText; // Revert to original or default text
    } else if (shortcut.length > 0) {
      // Use the last key released if it's not a modifier, or the full sequence
      // For simplicity, we'll just use the recorded shortcut array
      // Limit to 3 keys as before
      buttonElement.innerText = format(shortcut.splice(0, 3));
    } else {
      buttonElement.innerText = originalText; // Fallback if shortcut is empty
    }
  };

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler, { once: true });
};

function format(array) {
  if (!array || array.length === 0) return "Set Shortcut"; // Default text for empty shortcut
  return array.join(" + ").toUpperCase(); // Display in uppercase
}

async function main() {
  const initialShortcut = await window.electron.getLocalStorage("toggleVisibilityShortcut");
  shortcutObjs[0].innerText = initialShortcut || "Set Shortcut"; // Default text if no shortcut

  shortcutObjs.forEach((btn) => {
    // Store original text in a data attribute in case it's cleared
    const originalText = btn.innerText || "Set Shortcut";
    btn.setAttribute('data-original-text', originalText);

    btn.onclick = (event) => {
      // Before starting registration, ensure other buttons are not in "Recording..." state
      shortcutObjs.forEach(otherBtn => {
        if (otherBtn !== event.target && otherBtn.innerText === "Recording...") {
          otherBtn.innerText = otherBtn.getAttribute('data-original-text') || "Set Shortcut";
        }
      });
      register(event);
    };
  });

  webviewUrlInput.placeholder = "Enter webview URL";
  webviewUrlInput.value =
    (await window.electron.getLocalStorage("webviewUrl")) || "";
  webviewUrlInput.onfocus = () => {
    webviewUrlInput.select();
  };
  webviewUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.querySelector(".done").click();
    }
  });

  document.querySelector(".done").onclick = async () => {
    await window.electron.setLocalStorage(
      "toggleVisibilityShortcut",
      shortcutObjs[0].innerText,
    );
    await window.electron.setLocalStorage("webviewUrl", webviewUrlInput.value);
    window.electron.updateWebviewUrl(webviewUrlInput.value);
    window.electron.close();
  };

  document.querySelector(".cancel").onclick = () => {
    window.electron.close();
  };
}

main();
