// Shared mutable UI state plus DOM access and filtering/sorting built on it.
import { DEFAULT_FILTERS, FACETS } from "./model.js";
import { parseQuery, termMatch } from "./search.js";

export const $ = (id) => document.getElementById(id);

export const state = {
  tab: "inbox",
  items: [],
  history: [],
  selected: new Set(),
  filters: Object.assign(DEFAULT_FILTERS(), JSON.parse(localStorage.getItem("ghn.filters") || "{}")),
  repoQuery: "",
};

// Views and data actions announce changes; main.js re-renders in response (avoids import cycles).
export const emitChange = () => document.dispatchEvent(new Event("ghn:change"));

export const source = () => (state.tab === "inbox" ? state.items : state.history);

export function restorePrefs() {
  $("q").value = localStorage.getItem("ghn.q") || "";
  $("sort").value = localStorage.getItem("ghn.sort") || "new";
  $("group").value = localStorage.getItem("ghn.group") || "repo";
}

export function savePrefs() {
  localStorage.setItem("ghn.filters", JSON.stringify(state.filters));
  localStorage.setItem("ghn.q", $("q").value);
  localStorage.setItem("ghn.sort", $("sort").value);
  localStorage.setItem("ghn.group", $("group").value);
}

// skipKey lets a facet count its own options while ignoring its own selection
export function matches(n, skipKey, terms) {
  for (const t of terms) if (termMatch(n, t) === t.neg) return false;
  for (const f of FACETS) {
    if (f.key === skipKey) continue;
    const sel = state.filters[f.key];
    if (sel.length && !sel.includes(f.get(n))) return false;
  }
  return true;
}

export function visible() {
  const terms = parseQuery($("q").value);
  const arr = source().filter((n) => matches(n, null, terms));
  const when = (n) => new Date(n.updated || n.doneAt);
  const cmp = {
    new: (a, b) => (state.tab === "history" ? new Date(b.doneAt) - new Date(a.doneAt) : when(b) - when(a)),
    old: (a, b) => when(a) - when(b),
    repo: (a, b) => a.repo.localeCompare(b.repo) || when(b) - when(a),
    title: (a, b) => a.title.localeCompare(b.title),
  }[$("sort").value];
  return arr.sort(cmp);
}
