# Contributing to PulseLayer 🤝

Thank you for your interest in contributing to **PulseLayer**! We welcome contributions from developers, researchers, and community members building on the Stellar Network.

---

## Code of Conduct

By participating in this project, you agree to uphold a respectful, collaborative, and professional open-source environment.

* **Respectful Communication**: Maintain constructive and inclusive technical discussions.
* **Code Excellence**: Write clean, testable, and documented TypeScript/React code.
* **Security Awareness**: Never submit code that exposes secret keys, unsafe deserialization, or un-sanitized raw query execution.

---

## How to Contribute

### 1. Report Bugs & Suggest Enhancements
- Check existing GitHub Issues before opening a new one.
- Use issue templates where available.
- Provide step-by-step reproduction steps, environment details (Node version, OS), and error logs.

### 2. Local Setup Workflow
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/Justice989810/Pulse-Layer.git
   cd pulse-layer
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/horizon-stream-enhancement
   ```
5. Test your changes locally:
   ```bash
   npm run dev
   ```

---

## Coding Standards

- **TypeScript**: Strict mode enabled. Do not use `any` unless absolutely necessary for external raw payloads.
- **Code Style**: Run `npm run lint` before committing to ensure adherence to ESLint standards.
- **Component Architecture**: Keep UI components modular, accessible, and theme-adaptive (supporting both Light and Dark modes via `ThemeContext`).
- **Backend Safety**: Always use parameterized queries (`db.prepare()`) when interacting with `better-sqlite3`.

---

## Submitting Pull Requests

Run the same checks used by continuous integration before opening a pull request:

```bash
npm run lint && npm run build
```

Then:

1. Push your feature branch to your fork:
   ```bash
   git push origin feature/horizon-stream-enhancement
   ```
3. Open a Pull Request targeting `main`.
4. Fill out the PR description template detailing:
   - Summary of changes.
   - Associated Issue numbers.
   - Verification steps taken.
