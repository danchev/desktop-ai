const shortcutObjs = document.querySelectorAll(".btn");
const serviceUrlInput = document.querySelector("#service-url"); // Changed selector to ID and variable name

// Helper function to check if a key is a modifier key.
const isModifierKey = (key) => ["CONTROL", "ALT", "SHIFT", "META", "OS"].includes(key.toUpperCase());

const register = (event) => {
  // Parameter is the click event
  const buttonElement = event.target; // Get the button element from the event
  const originalText = buttonElement.dataset.originalText || "Set Shortcut"; // Use data-original-text
  buttonElement.innerText = "Recording..."; // Update button text

  let shortcut = []; // Use let to allow clearing/reassignment easily

  const keydownHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      shortcut.length = 0; // Clear the array
      buttonElement.innerText = originalText;
      document.removeEventListener("keydown", keydownHandler);
      document.removeEventListener("keyup", keyupHandler);
      return;
    }

    const keyUpper = e.key.toUpperCase();

    if (keyUpper === "BACKSPACE") {
      shortcut.pop();
    } else if (!shortcut.includes(keyUpper)) {
      // Avoid duplicate keys
      // Add key if it's not a duplicate and we have space (e.g., max 3 keys)
      if (shortcut.length < 3) {
        shortcut.push(keyUpper);
      }
    }
    // Update button text to show current recording
    buttonElement.innerText = shortcut.length > 0 ? shortcut.join(" + ") : "Recording...";
  };

  const keyupHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // The keyup event finalizes the shortcut recording.
    // If a modifier key is released, and other keys (part of the shortcut) are still theoretically held down,
    // this simple handler doesn't explicitly manage that. It finalizes based on the state of the 'shortcut' array.
    // The current logic: if the shortcut array is not empty and contains at least one non-modifier key,
    // it's considered a valid attempt. Otherwise, it reverts.
    // Removing { once: true } from addEventListener("keyup", keyupHandler) was to allow multiple keyups
    // to be processed if needed, but current logic finalizes on first relevant keyup.

    // If the released key is a modifier and it's part of the current shortcut,
    // or if the shortcut is empty, don't finalize yet unless it's the only key
    // and we decide to allow single modifier key shortcuts (currently, formatShortcutDisplayString() would make it "Set Shortcut").
    // The check `isModifierKey(e.key)` refers to the key that was *just released*.
    // The primary logic for finalization should depend on the content of the `shortcut` array.
    // The explicit check for `isModifierKey(e.key)` within the finalization logic might be redundant
    // if the `shortcut` array's content is the sole determinant.
    // The current logic correctly finalizes regardless of which key was last released,
    // based on the accumulated `shortcut` array.

    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);

    // Filter out modifier keys if they are the only keys pressed, unless we want to allow single modifier shortcuts
    const nonModifierKeysInShortcut = shortcut.filter((key) => !isModifierKey(key));

    if (shortcut.length === 0 || nonModifierKeysInShortcut.length === 0) {
      // If empty or only modifiers
      buttonElement.innerText = originalText;
      shortcut = []; // Ensure cleared for next time (though `register` re-initializes it)
    } else {
      // Format the recorded keys. keydownHandler already ensures a max of 3 keys.
      const formattedShortcut = formatShortcutDisplayString(shortcut);
      buttonElement.innerText = formattedShortcut;
      // Persist this new valid shortcut as the original text for future edits/cancellations.
      if (formattedShortcut !== "Set Shortcut") {
        buttonElement.dataset.originalText = formattedShortcut;
      } else {
        // If formatting resulted in "Set Shortcut" (e.g., if format function had stricter rules), revert.
        buttonElement.innerText = originalText;
      }
    }
  };

  // Add event listeners for the current recording session.
  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler);
  // Note: Removed { once: true } from keyupHandler to allow more flexible shortcut finalization,
  // though current logic finalizes on any keyup that results in a valid shortcut.
};

// Formats an array of shortcut keys into a display string.
function formatShortcutDisplayString(shortcutArray) {
  // keydownHandler ensures shortcutArray has max 3 items and are uppercase.
  if (!shortcutArray || shortcutArray.length === 0) {
    return "Set Shortcut";
  }
  return shortcutArray.join(" + "); // Already uppercase from keydownHandler
}

async function main() {
  // Initialize the shortcut button
  if (shortcutObjs.length > 0) {
    // Check if the shortcut button element exists
    const shortcutButton = shortcutObjs[0]; // Assuming only one shortcut button for now
    const storedShortcutString = await window.electron.getLocalStorage("toggleVisibilityShortcut");
    const initialButtonText = storedShortcutString || "Set Shortcut";

    shortcutButton.innerText = initialButtonText;
    shortcutButton.dataset.originalText = initialButtonText; // Initialize data-original-text

    shortcutButton.onclick = (event) => {
      // If there were other shortcut buttons, this is where you might reset their state.
      // For a single button, this is not strictly necessary but harmless.
      shortcutObjs.forEach((otherBtn) => {
        if (otherBtn !== event.target && otherBtn.innerText === "Recording...") {
          otherBtn.innerText = otherBtn.dataset.originalText || "Set Shortcut";
        }
      });
      register(event);
    };
  }

  // serviceUrlInput.placeholder is set in HTML, no need to set via JS unless dynamic
  serviceUrlInput.value = (await window.electron.getLocalStorage("serviceUrl")) || ""; // Changed key
  serviceUrlInput.onfocus = () => {
    serviceUrlInput.select();
  };
  serviceUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.querySelector(".done").click();
    }
  });

  document.querySelector(".done").onclick = async () => {
    await window.electron.setLocalStorage("toggleVisibilityShortcut", shortcutObjs[0].innerText);
    await window.electron.setLocalStorage("serviceUrl", serviceUrlInput.value); // Changed key and variable
    window.electron.updateWebviewUrl(serviceUrlInput.value); // Use new variable
    window.electron.close();
  };

  document.querySelector(".cancel").onclick = () => {
    window.electron.close();
  };
}

main();
