# kestrel-talk

## Rules

- **Before every `git push`**: Run full local **browser** E2E testing using Playwright (or equivalent). Must use a real browser (Chromium) — simulate mouse clicks, type text, verify visual output. Do NOT just run Node.js test scripts and assume the UI works. Test: connection, send messages, streaming blocks, code highlight, search, export, mobile responsive, keyboard shortcuts. Do not push untested code.
- Only write code in the kestrel-talk project. Read-only access to kestrel-agent.
