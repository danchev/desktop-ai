const shortcutObjs = document.querySelectorAll(".btn");
const webviewUrlInput = document.querySelector(".url-input");

const register = (btn) => {
  let shortcut = [];

  document.addEventListener("keydown", (e) => shortcut.push(e.key));
  document.addEventListener(
    "keyup",
    (e) => {
      if (e.keyCode !== 8) {
        btn.target.innerText = format(shortcut.splice(0, 3));
      } else btn.target.innerText = "";
      shortcut.length = 0;
    },
    { once: true },
  );
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
      btn.innerText = "enter keybinding";
      register(event);
    };
  });

  webviewUrlInput.placeholder = "Enter webview URL";
  webviewUrlInput.onfocus = () => { webviewUrlInput.select(); };
  webviewUrlInput.onkeydown = (e) => { if (e.key === "Enter") document.querySelector(".done").click(); };
  webviewUrlInput.value = await window.electron.getLocalStorage("webviewUrl");

  document.querySelector(".done").onclick = () => {
    window.electron.setLocalStorage(
      "toggleVisibilityShortcut",
      shortcutObjs[0].innerText,
    );
    window.electron.setLocalStorage("webviewUrl", webviewUrlInput.value);
    window.electron.updateWebviewUrl(webviewUrlInput.value);
    window.electron.close();
  };

  document.querySelector(".cancel").onclick = () => {
    window.electron.close();
  };
}

main();
