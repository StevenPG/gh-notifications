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
- UI is vanilla ES modules: markup in `public/index.html`, styles in `public/css/`, code in `public/js/` (`main.js` is the entry point).
- Server code is in `src/` (`routes.js` for endpoints, `github.js` for `gh` access, `history.js` for the done log). `server.js` just starts it.
- Add or update a test in `test/` for server behavior changes.
- Never commit real notification data, tokens or screenshots of your own inbox.
  Use `DEMO=1` (`src/demo.js`) for screenshots.
- Keep PRs small and focused, and describe what you changed and why.

## Reporting security issues

See [SECURITY.md](SECURITY.md).
