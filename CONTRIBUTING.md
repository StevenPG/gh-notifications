# Contributing

Thanks for helping out! This project is intentionally tiny: plain Node.js, no
dependencies and no build step.

## Setup

```sh
git clone https://github.com/StevenPG/gh-notifications.git
cd gh-notifications
npm run demo   # fake data on http://localhost:4777, no GitHub login needed
npm test
```

`npm start` uses your real notifications through the `gh` CLI.

## Guidelines

- Keep it dependency free. Open an issue first if you think a dependency is needed.
- UI lives in `public/index.html` (single file, vanilla JS). Server is `server.js`.
- Add or update a test in `test/` for server behavior changes.
- Never commit real notification data, tokens or screenshots of your own inbox.
  Use `DEMO=1` (`demo.js`) for screenshots.
- Keep PRs small and focused, and describe what you changed and why.

## Reporting security issues

See [SECURITY.md](SECURITY.md).
