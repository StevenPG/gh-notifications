// Fake data for `DEMO=1 npm start`, used for screenshots and trying the UI without a GitHub login.
const now = Date.now();
const ago = (h) => new Date(now - h * 36e5).toISOString();
const U = "https://github.com/acme";

const rows = [
  ["PullRequest", "open", "review_requested", "acme/web-app", "Add dark mode toggle to settings", "octocat", 2, true, 412],
  ["PullRequest", "open", "review_requested", "acme/web-app", "Fix flaky checkout test on CI", "hubot", 5, true, 418],
  ["PullRequest", "merged", "author", "acme/web-app", "Refactor auth middleware", "demo-user", 8, false, 401],
  ["PullRequest", "draft", "author", "acme/api", "WIP: paginate search results", "demo-user", 11, true, 77],
  ["PullRequest", "open", "mention", "acme/api", "Support bulk export endpoint", "monalisa", 20, true, 80],
  ["PullRequest", "closed", "state_change", "acme/api", "Try experimental cache layer", "monalisa", 30, true, 71],
  ["PullRequest", "open", "review_requested", "acme/api", "chore(deps): bump express from 4.19.1 to 4.19.2", "dependabot[bot]", 3, true, 91],
  ["PullRequest", "open", "review_requested", "acme/api", "chore(deps): bump the npm-minor group with 4 updates", "dependabot[bot]", 4, true, 92],
  ["PullRequest", "merged", "state_change", "acme/docs", "Document the new webhook retries", "hubot", 50, false, 12],
  ["PullRequest", "open", "review_requested", "acme/docs", "chore(deps): bump actions/checkout from 4 to 5", "dependabot[bot]", 70, true, 15],
  ["Issue", "open", "mention", "acme/web-app", "Sidebar overlaps content on small screens", "octocat", 6, true, 399],
  ["Issue", "open", "assign", "acme/api", "Rate limiter returns 500 instead of 429", "monalisa", 26, true, 66],
  ["Issue", "closed", "state_change", "acme/docs", "Typo in the quick start guide", "hubot", 90, false, 9],
  ["Issue", "not_planned", "subscribed", "acme/web-app", "Support Internet Explorer 11", "octocat", 150, false, 150],
  ["Release", null, "subscribed", "acme/cli", "v2.4.0", null, 200, false, null],
  ["Discussion", null, "subscribed", "acme/web-app", "RFC: move to a monorepo?", null, 40, true, null],
  ["CheckSuite", null, "ci_activity", "acme/api", "CI workflow run failed for main branch", null, 1, true, null],
];

const list = rows.map(([type, state, reason, repo, title, author, h, unread, num], i) => ({
  id: String(9000 + i),
  unread,
  reason,
  repo,
  type,
  title,
  updated: ago(h),
  url: num ? `https://github.com/${repo}/${type === "PullRequest" ? "pull" : "issues"}/${num}` : `${U}/${repo.split("/")[1]}`,
  ...(state ? { state } : {}),
  ...(author ? { author } : {}),
}));

const history = [
  ["PullRequest", "merged", "acme/web-app", "Bump lodash from 4.17.20 to 4.17.21", "dependabot[bot]", "state_change", 2],
  ["PullRequest", "closed", "acme/api", "Prototype GraphQL gateway", "monalisa", "state_change", 3],
  ["Issue", "closed", "acme/docs", "Broken link on the install page", "hubot", "state_change", 27],
].map(([type, state, repo, title, author, reason, h], i) => ({
  id: String(8000 + i), type, state, repo, title, author, reason,
  url: `https://github.com/${repo}/pull/${100 + i}`, updated: ago(h + 1), doneAt: ago(h),
}));

const queuedJobs = [
  ["acme/api", "CI", "test (node 20)", 1],
  ["acme/api", "CI", "test (node 22)", 1],
  ["acme/web-app", "Deploy", "build", 0.2],
].map(([repo, workflow, name, h], i) => ({
  id: String(7000 + i), repo, workflow, name, branch: "main", createdAt: ago(h), url: `https://github.com/${repo}/actions`,
}));

module.exports = { list, history, queuedJobs };
