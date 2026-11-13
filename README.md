# gh-notifications

A small local web app for triaging your GitHub notifications. The github.com
notifications page is limited, so this gives you real filtering, PR and issue
state icons, bulk "Done" actions and a history of what you cleared.

Zero dependencies: just Node.js and the [GitHub CLI](https://cli.github.com/).

## Features

- State icons for pull requests (open, draft, merged, closed), issues (open,
  closed, not planned), commits, releases, discussions and CI runs
- Sidebar facets with live counts: type, state, reason, author type (people vs
  bots), read status, age and repository
- Search qualifiers (see below), sorting and grouping, saved between visits
- Hide Dependabot and other bot PRs by default (based on the real PR author)
- Mark done one at a time, by selection, by group, or "all matching" the
  current filters, plus a one-click "closed/merged PRs" cleanup
- Done history tab, stored locally in `done-log.json`

## Requirements

- Node.js 18 or newer
- GitHub CLI, logged in: `gh auth login`

The token needs the `notifications` scope (and `repo` to read private
repositories). If needed: `gh auth refresh -s notifications`.

## Run

```sh
git clone <this repo>
cd gh-notifications
npm start        # or: node server.js
```

Open <http://localhost:4777>. Set `PORT` to use another port:

```sh
PORT=5000 npm start
```

The server only listens on `127.0.0.1`. It reuses your `gh` login, so no token
is stored by this app.

## Search qualifiers

| Qualifier | Example | Meaning |
| --- | --- | --- |
| `is:` | `is:pr`, `is:issue`, `is:unread`, `is:read`, `is:bot`, `is:draft`, `is:closed` | Quick flags |
| `state:` | `state:merged` | `open`, `draft`, `merged`, `closed`, `not_planned` |
| `type:` | `type:pr` | `pr`, `issue`, `commit`, `release`, `discussion`, `ci` |
| `repo:` | `repo:my-repo` | Repo name contains text |
| `author:` | `author:octocat`, `author:me` | Author login (`me` = PRs you authored) |
| `reason:` | `reason:mention` | Why you were notified |
| `age:` | `age:<2d`, `age:>1w` | Last updated (`h`, `d`, `w`) |
| `-term` | `-dependabot`, `-repo:docs` | Exclude |
| `"quoted"` | `"fix login"` | Phrase match |

Press `/` to focus the search box.

## Notes

- "Done" removes the notification from your inbox (same as the Done button on
  GitHub). GitHub has no API to undo it, so history is a record only.
- Item state and author are fetched per notification and cached in memory, so
  the first load can take a few seconds.
- History is kept in `done-log.json` (last 5000 entries, git-ignored).

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications?all=true\|false` | Notifications with state and author |
| POST | `/api/done/:id` | Mark done (body: item metadata for history) |
| POST | `/api/read/:id` | Mark read |
| GET / DELETE | `/api/history` | Read or clear the done log |

## License

MIT
