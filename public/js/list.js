// Notification list, group headers and toolbar button state.
import { $, state, source, visible, emitChange } from "./state.js";
import { icon } from "./icons.js";
import { stateLabel, isBot, isClosedPR, reasonOf, groupKey, dayKey, ago } from "./model.js";
import * as api from "./api.js";
import { done } from "./actions.js";

function row(n) {
  const d = document.createElement("div");
  const hist = state.tab === "history";
  d.className = "row " + (hist || !n.unread ? "read" : "unread");
  d.innerHTML = `${hist ? "" : `<input type="checkbox" ${state.selected.has(n.id) ? "checked" : ""}>`}${icon(n)}
    <div class="body"><a class="title" target="_blank" rel="noopener"></a>
    <div class="meta"><span class="repo"></span>${n.state ? `<span class="tag state-${n.state}">${stateLabel[n.state]}</span>` : ""}
    <span class="tag reason"></span>${isBot(n) ? '<span class="tag bot">bot</span>' : ""}<span class="author"></span></div></div>
    ${hist ? "" : '<div class="actions"><button class="done">Done</button></div>'}<span class="time">${hist ? ago(n.doneAt) : ago(n.updated)}</span>`;
  d.querySelector(".repo").textContent = n.repo;
  d.querySelector(".reason").textContent = reasonOf(n);
  d.querySelector(".author").textContent = n.author ? "by " + n.author : "";
  const a = d.querySelector(".title");
  a.textContent = n.title; a.href = n.url;
  if (!hist) {
    a.onclick = () => {
      if (n.unread) api.markRead(n.id);
      n.unread = false; d.className = "row read";
    };
    d.querySelector("input").onchange = (e) => {
      e.target.checked ? state.selected.add(n.id) : state.selected.delete(n.id);
      updateButtons();
    };
    d.querySelector(".done").onclick = () => done([n.id]);
  }
  return d;
}

export function updateButtons() {
  const { selected, items, history } = state;
  $("doneSel").disabled = !selected.size;
  $("doneSel").textContent = selected.size ? `Done (${selected.size})` : "Done";
  const c = items.filter(isClosedPR).length;
  $("doneClosed").textContent = `Done: closed/merged PRs (${c})`;
  $("doneClosed").disabled = !c;
  const m = visible().length;
  $("doneMatch").textContent = `Done all matching (${m})`;
  $("doneMatch").disabled = !m;
  $("histCount").textContent = history.length ? `(${history.length})` : "";
}

export function renderList() {
  const v = visible(), list = $("list"), inbox = state.tab === "inbox";
  list.innerHTML = "";
  if (!v.length) list.innerHTML = `<div class="empty">${inbox ? "Nothing matches. Adjust filters or enjoy inbox zero." : "No done items match."}</div>`;
  const mode = inbox ? $("group").value : "day";
  const groups = new Map();
  v.forEach((n) => {
    const k = mode === "day" ? dayKey(n.doneAt) : groupKey(n, mode);
    (groups.get(k) || groups.set(k, []).get(k)).push(n);
  });
  for (const [k, arr] of groups) {
    const g = document.createElement("div");
    g.className = "group";
    if (k) {
      g.innerHTML = `<h2><span></span><span class="count">${arr.length}</span>${inbox ? '<button class="chip grp">Done all</button>' : ""}</h2>`;
      g.querySelector("h2 span").textContent = k;
      if (inbox) g.querySelector(".grp").onclick = () => done(arr.map((n) => n.id));
    }
    const card = document.createElement("div");
    card.className = "card";
    arr.forEach((n) => card.appendChild(row(n)));
    g.appendChild(card);
    list.appendChild(g);
  }
  $("status").textContent = `${v.length} shown / ${source().length} ${inbox ? "total" : "done"}`;
}
