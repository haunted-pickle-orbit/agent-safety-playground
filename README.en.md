# Agent Safety Playground

[Live demo](https://haunted-pickle-orbit.github.io/agent-safety-playground/) · [简体中文](README.md) · [GitHub](https://github.com/haunted-pickle-orbit/agent-safety-playground)

![App preview](docs/preview.png)

Version 0.2.0. Three bilingual, interactive labs explain indirect prompt injection, path traversal and misleading tool descriptions.

**Deterministic educational simulation, not an LLM benchmark or production sandbox.** No API key, real email, user file access or system permission changes. Execution policies control in-memory state transitions for a predefined plan.

## Start

Use Node.js 20.19+ within 20.x, 22.12+ within 22.x, or a newer major:

```sh
npm ci
npm run dev
```

Open the terminal URL (normally http://127.0.0.1:5173) and select English. Run the baseline, enable a safeguard, then rerun and inspect state changes. Offline labs are generated automatically at startup. Downloaded HTML files run independently and support both languages, reset and JSON export.

Language and previously passed labs are stored locally. Policies and results survive course navigation within the page but are cleared on reload. Reset clears only the selected lab. Storage failures do not prevent using the labs. Modified policies mark the last result stale and disable export until rerun.

## Check

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite builds the application and serves it at port 4175, which must be free. On Windows, set PLAYWRIGHT_CHANNEL=msedge to use an installed Edge browser. GitHub Actions updates the live demo after checks pass.

Approval is trusted lesson configuration bound to exact recipient and content; actions cannot approve themselves. Unsupported tools and invalid arguments are denied. Failed prerequisites prevent dependent actions from executing.

The virtual path model does not cover symlinks or races. Real model integration and external technical review remain future work. The project is distributed under the [MIT License](LICENSE).
