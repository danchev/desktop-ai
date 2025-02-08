const shortcutObjs = document.querySelectorAll(".btn");
const webviewUrlInput = document.querySelector(".url-input");

const register = (btn) => {
  const shortcut = [];

  const keydownHandler = (e) => {
    shortcut.push(e.key);
  };

  const keyupHandler = (e) => {
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);

    if (e.key !== "Backspace") {
      btn.target.innerText = format(shortcut.splice(0, 3));
    } else {
      btn.target.innerText = "";
    }
  };

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler, { once: true });
};

function format(array) {
  return array.join(" + ").toLowerCase();
}

async function main() {
  shortcutObjs[0].innerText = await window.electron.getLocalStorage(
    "toggleVisibilityShortcut",
  );

  shortcutObjs.forEach((btn) => {
    btn.onclick = (event) => {
      register(event);
    };
  });

  webviewUrlInput.placeholder = "Enter webview URL";
  webviewUrlInput.value = await window.electron.getLocalStorage("webviewUrl");
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
