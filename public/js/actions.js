// Loading notifications/history and marking items done.
import * as api from "./api.js";
import { $, state, emitChange } from "./state.js";

export async function load() {
  $("status").textContent = "Loading...";
  try {
    state.items = await api.fetchNotifications($("all").checked);
  } catch (e) {
    $("status").textContent = api.errMsg(e);
    return;
  }
  state.selected = new Set([...state.selected].filter((id) => state.items.some((n) => n.id === id)));
  emitChange();
}

export async function loadHistory() {
  state.history = await api.fetchHistory();
  emitChange();
}

export async function done(ids) {
  const byId = new Map(state.items.map((n) => [n.id, n]));
  await Promise.all(ids.map((id) => {
    const n = byId.get(id) || {};
    const meta = { type: n.type, state: n.state, title: n.title, repo: n.repo, url: n.url, author: n.author, reason: n.reason, updated: n.updated };
    return api.markDone(id, meta);
  }));
  state.items = state.items.filter((n) => !ids.includes(n.id));
  ids.forEach((id) => state.selected.delete(id));
  await loadHistory();
}

export function confirmDone(ids, what) {
  if (ids.length && confirm(`Mark ${ids.length} ${what} as done?`)) done(ids);
}

export async function clearHistory() {
  if (!confirm("Clear the done history log?")) return;
  await api.clearHistory();
  loadHistory();
}
