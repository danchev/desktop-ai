const shortcutObjs = document.querySelectorAll(".btn");
const serviceUrlInput = document.querySelector("#service-url"); // Changed selector to ID and variable name

const register = (event) => { // Parameter is the click event
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
    } else if (!shortcut.includes(keyUpper)) { // Avoid duplicate keys
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

    // Determine if the released key is a modifier
    const isModifierKey = (key) => ["CONTROL", "ALT", "SHIFT", "META", "OS"].includes(key.toUpperCase());

    // If the released key is a modifier and it's part of the current shortcut,
    // or if the shortcut is empty, don't finalize yet unless it's the only key
    // and we decide to allow single modifier key shortcuts (currently, format() would make it "Set Shortcut").
    if (isModifierKey(e.key) && shortcut.includes(e.key.toUpperCase()) && shortcut.length < 3 && shortcut.length > 0) {
        // If a modifier key is released, but other keys are still held or it's not a complete sequence,
        // wait for more key releases or a non-modifier key.
        // The current shortcut array is what matters.
        // We finalize when a non-modifier key is released, or if the sequence is deemed complete.
        // For simplicity, we'll finalize if the shortcut is not empty and not just modifiers.
        // This keyup handler might need more sophisticated logic for complex sequences.
        // Let's assume for now that any keyup could be a signal to try to finalize.
    }

    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);

    // Filter out modifier keys if they are the only keys pressed, unless we want to allow single modifier shortcuts
    const nonModifierKeysInShortcut = shortcut.filter(key => !isModifierKey(key));

    if (shortcut.length === 0 || nonModifierKeysInShortcut.length === 0) { // If empty or only modifiers
      buttonElement.innerText = originalText;
      shortcut = []; // Ensure cleared
    } else {
      const formattedShortcut = format(shortcut); // format will also handle max length if needed by splicing
      buttonElement.innerText = formattedShortcut;
      if (formattedShortcut !== "Set Shortcut") { // Only update originalText if it's a valid shortcut
          buttonElement.dataset.originalText = formattedShortcut;
      } else {
          buttonElement.innerText = originalText; // Revert if format() decided it's not a valid shortcut
      }
    }
  };

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler); // Removed { once: true } to handle multi-key sequences better
};

function format(array) {
  // Ensure we handle splicing for max length within format or before calling format if register allows more than 3 keys.
  // The current keydownHandler limits to 3 keys.
  const validShortcutArray = array.slice(0, 3); // Ensure max 3 keys
  if (!validShortcutArray || validShortcutArray.length === 0) return "Set Shortcut";
  if (!array || array.length === 0) return "Set Shortcut"; // Default text for empty shortcut
  return array.join(" + ").toUpperCase(); // Display in uppercase
}

async function main() {
  const initialShortcut = await window.electron.getLocalStorage("toggleVisibilityShortcut");
  const initialShortcutText = initialShortcut || "Set Shortcut";
  shortcutObjs[0].innerText = initialShortcutText;
  shortcutObjs[0].dataset.originalText = initialShortcutText; // Initialize dataset.originalText

  shortcutObjs.forEach((btn) => {
    // Ensure original text is set for all shortcut buttons if there were more
    if (!btn.dataset.originalText) {
        const btnOriginalText = btn.innerText || "Set Shortcut";
        btn.dataset.originalText = btnOriginalText;
    }

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

  // serviceUrlInput.placeholder is set in HTML, no need to set via JS unless dynamic
  serviceUrlInput.value =
    (await window.electron.getLocalStorage("serviceUrl")) || ""; // Changed key
  serviceUrlInput.onfocus = () => {
    serviceUrlInput.select();
  };
  serviceUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.querySelector(".done").click();
    }
  });

  document.querySelector(".done").onclick = async () => {
    await window.electron.setLocalStorage(
      "toggleVisibilityShortcut",
      shortcutObjs[0].innerText,
    );
    await window.electron.setLocalStorage("serviceUrl", serviceUrlInput.value); // Changed key and variable
    window.electron.updateWebviewUrl(serviceUrlInput.value); // Use new variable
    window.electron.close();
  };

  document.querySelector(".cancel").onclick = () => {
    window.electron.close();
  };
}

main();
