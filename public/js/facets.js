// Left sidebar facets and the active-filter pills.
import { $, state, source, matches, emitChange } from "./state.js";
import { FACETS } from "./model.js";
import { parseQuery } from "./search.js";

export function renderFacets() {
  const terms = parseQuery($("q").value), src = source(), el = $("facets");
  el.innerHTML = "";
  for (const f of FACETS) {
    const base = src.filter((n) => matches(n, f.key, terms));
    const counts = new Map();
    base.forEach((n) => counts.set(f.get(n), (counts.get(f.get(n)) || 0) + 1));
    state.filters[f.key].forEach((v) => counts.has(v) || counts.set(v, 0));
    let vals = [...counts.keys()];
    vals.sort(f.order ? (a, b) => f.order.indexOf(a) - f.order.indexOf(b) : (a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
    if (f.key === "kind") vals = ["human", "bot"];
    const h = document.createElement("h3");
    h.className = state.filters[f.key].length ? "active" : "";
    h.innerHTML = `<span>${f.title}</span><a>clear</a>`;
    h.querySelector("a").onclick = () => { state.filters[f.key] = []; emitChange(); };
    el.appendChild(h);
    const box = document.createElement("div");
    if (f.search) {
      const s = document.createElement("input");
      s.type = "text"; s.id = "repoSearch"; s.placeholder = "Find repo..."; s.value = state.repoQuery;
      s.oninput = () => { state.repoQuery = s.value; renderOptions(f, vals, counts, box); };
      el.appendChild(s);
      box.id = "repoOpts";
    }
    renderOptions(f, vals, counts, box);
    el.appendChild(box);
  }
}

function renderOptions(f, vals, counts, box) {
  box.innerHTML = "";
  for (const v of vals) {
    if (f.search && state.repoQuery && !v.toLowerCase().includes(state.repoQuery.toLowerCase())) continue;
    const c = counts.get(v) || 0, on = state.filters[f.key].includes(v);
    const o = document.createElement("div");
    o.className = "opt" + (on ? " on" : "") + (c === 0 && !on ? " zero" : "");
    o.innerHTML = `<input type="checkbox" ${on ? "checked" : ""}>${f.icon ? f.icon(v) : ""}<span class="lbl"></span><span class="n">${c}</span>`;
    o.querySelector(".lbl").textContent = f.label(v);
    o.title = v;
    o.onclick = () => {
      const a = state.filters[f.key], i = a.indexOf(v);
      i < 0 ? a.push(v) : a.splice(i, 1);
      emitChange();
    };
    box.appendChild(o);
  }
}

export function renderPills() {
  const el = $("pills");
  el.innerHTML = "";
  for (const f of FACETS) for (const v of state.filters[f.key]) {
    const p = document.createElement("span");
    p.className = "pill";
    p.innerHTML = `<span></span><button title="Remove">x</button>`;
    p.querySelector("span").textContent = `${f.title}: ${f.label(v)}`;
    p.querySelector("button").onclick = () => { state.filters[f.key] = state.filters[f.key].filter((x) => x !== v); emitChange(); };
    el.appendChild(p);
  }
  if (!$("q").value && !el.children.length) el.innerHTML = `<span class="help">Qualifiers: <code>is:pr</code> <code>is:issue</code> <code>is:unread</code> <code>is:bot</code> <code>state:merged</code> <code>repo:name</code> <code>author:name</code> <code>reason:mention</code> <code>age:&lt;2d</code> <code>age:&gt;1w</code> <code>-word</code> to exclude</span>`;
}
