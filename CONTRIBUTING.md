# Contributing to Desktop AI

Thank you for your interest in contributing!

## How to Contribute

- **Report Issues:** Use the [GitHub Issues](https://github.com/danchev/desktop-ai/issues) page to report bugs, request features, or ask questions.
- **Suggest Improvements:** Open an issue or discussion for ideas and feedback.
- **Submit Pull Requests:** Fork the repository, create a feature branch, and submit a pull request with a clear description of your changes.

## Coding Standards

- Use clear, descriptive variable and function names.
- Write concise, readable code and add comments where necessary.
- Follow the existing code style and structure.
- Prefer ES6+ syntax for JavaScript/TypeScript files.

## Commit Message Guidelines

- Use short, descriptive commit messages (e.g., "Fix window resize bug").
- For larger changes, use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `refactor:` for code refactoring
  - `test:` for adding or updating tests

## Code Quality and Formatting

This project uses pre-commit hooks to ensure code quality and consistent formatting. The hooks are defined in `.pre-commit-config.yaml` and currently include:

- Basic checks like trailing whitespace, end-of-file fixing, and YAML/JSON validation.
- Automated code formatting using [Prettier](https://prettier.io/).

### Setting Up Pre-commit Hooks

To use these hooks locally, you need to have `pre-commit` installed and then set up the hooks in your local repository clone:

1. **Install pre-commit:**
   If you don't have it installed, you can typically install it using pip:

   ```bash
   pip install pre-commit
   ```

   Alternatively, see the [official installation guide](https://pre-commit.com/#installation) for other methods (e.g., using Homebrew, Conda).

2. **Install the git hooks:**
   Navigate to the root directory of this repository and run:
   ```bash
   pre-commit install
   ```

Once installed, the hooks will run automatically on `git commit`. If any hooks modify files (like Prettier formatting your code), you'll need to `git add` those changes and re-commit.

---

Thank you for helping improve Desktop AI!
