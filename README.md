# Ollama Desktop Client (Electron)

Fork of the original Gemini Desktop Client by [nekupaw](https://github.com/nekupaw/gemini-desktop) with modifications for self-hosted AI interface.

Precompiled versions for Linux and Windows are available for download here:
[Windows (Setup)](https://github.com/danchev/ollama-desktop/releases/latest/download/Ollama-Desktop.exe),
[Linux (AppImage)](https://github.com/danchev/ollama-desktop/releases/latest/download/Ollama-Desktop.AppImage)

For other systems, simply adapt and build the source code to suit your
needs.

## Development

### Code Quality and Formatting

This project uses pre-commit hooks to ensure code quality and consistent
formatting. The hooks are defined in `.pre-commit-config.yaml` and currently
include:

- Basic checks like trailing whitespace, end-of-file fixing, and YAML/JSON
  validation.
- Automated code formatting using [Prettier](https://prettier.io/).

#### Setting Up Pre-commit Hooks

To use these hooks locally, you need to have `pre-commit` installed and then
set up the hooks in your local repository clone:

1.  **Install pre-commit:**
    If you don't have it installed, you can typically install it using pip:
    ```bash
    pip install pre-commit
    ```
    Alternatively, see the
    [official installation guide](https://pre-commit.com/#installation) for
    other methods (e.g., using Homebrew, Conda).

2.  **Install the git hooks:**
    Navigate to the root directory of this repository and run:
    ```bash
    pre-commit install
    ```

Once installed, the hooks will run automatically on `git commit`. If any hooks
modify files (like Prettier formatting your code), you'll need to `git add`
those changes and re-commit.

---

This client operates by utilizing a WebView container to access the Ollama
website and implements various modifications for enhanced user experience. With
the shortcut Ctrl + G, Ollama can be opened from anywhere. tip: use the
installer and copy the shortcut from the desktop to the startup folder.
