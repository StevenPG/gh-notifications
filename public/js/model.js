// Notification helpers, labels and facet definitions.
import { icon } from "./icons.js";

export const typeLabel = { PullRequest: "Pull requests", Issue: "Issues", Commit: "Commits", Release: "Releases", Discussion: "Discussions", CheckSuite: "CI runs" };
export const stateLabel = { open: "Open", merged: "Merged", closed: "Closed", draft: "Draft", not_planned: "Not planned", none: "No state" };
export const typeAlias = { pr: "PullRequest", issue: "Issue", commit: "Commit", release: "Release", discussion: "Discussion", ci: "CheckSuite" };

const botRe = /^(chore|build|fix)\(deps(-dev)?\)|^bump /i;
export const isBot = (n) => n.author ? /\[bot\]$/.test(n.author) : botRe.test(n.title);
export const isClosedPR = (n) => n.type === "PullRequest" && (n.state === "closed" || n.state === "merged");
export const stateOf = (n) => n.state || "none";
export const kindOf = (n) => (isBot(n) ? "bot" : "human");
export const reasonOf = (n) => n.reason.replace(/_/g, " ");
export const ageMs = (n) => Date.now() - new Date(n.updated || n.doneAt);

export function ago(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}

export function dayKey(iso) {
  const d = new Date(iso), t = new Date();
  const diff = Math.round((new Date(t.toDateString()) - new Date(d.toDateString())) / 864e5);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function groupKey(n, mode) {
  return { repo: n.repo, reason: reasonOf(n), state: stateLabel[stateOf(n)], type: typeLabel[n.type] || n.type, none: "" }[mode];
}

// key -> value extractor, labels, order
export const FACETS = [
  { key: "type", title: "Type", get: (n) => n.type, label: (v) => typeLabel[v] || v, icon: (v) => icon({ type: v, state: "none" }) },
  { key: "state", title: "State", get: stateOf, label: (v) => stateLabel[v] || v },
  { key: "reason", title: "Reason", get: reasonOf, label: (v) => v },
  { key: "kind", title: "Author type", get: kindOf, label: (v) => (v === "bot" ? "Bots (dependabot...)" : "People") },
  { key: "read", title: "Read status", get: (n) => (n.unread ? "unread" : "read"), label: (v) => v },
  { key: "age", title: "Age", get: (n) => { const d = ageMs(n) / 864e5; return d < 1 ? "<1d" : d < 7 ? "1-7d" : d < 30 ? "7-30d" : ">30d"; }, label: (v) => v, order: ["<1d", "1-7d", "7-30d", ">30d"] },
  { key: "repo", title: "Repository", get: (n) => n.repo, label: (v) => v.split("/")[1] || v, search: true },
];
export const DEFAULT_FILTERS = () => ({ type: [], state: [], reason: [], kind: ["human"], read: [], age: [], repo: [] });
