// Entry point: wires the DOM to state, rendering and actions.
import { $, state, visible, restorePrefs, savePrefs } from "./state.js";
import { DEFAULT_FILTERS, isClosedPR } from "./model.js";
import { renderFacets, renderPills } from "./facets.js";
import { renderList, updateButtons } from "./list.js";
import { load, loadHistory, done, confirmDone, clearHistory } from "./actions.js";

function update() {
  savePrefs();
  renderFacets(); renderPills(); renderList(); updateButtons();
}
document.addEventListener("ghn:change", update);

restorePrefs();

document.querySelectorAll("#tabs button").forEach((b) => (b.onclick = () => {
  state.tab = b.dataset.v;
  document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".inboxOnly").forEach((e) => e.classList.toggle("hidden", state.tab !== "inbox"));
  document.querySelectorAll(".historyOnly").forEach((e) => e.classList.toggle("hidden", state.tab !== "history"));
  $("group").classList.toggle("hidden", state.tab !== "inbox");
  update();
}));
["sort", "group"].forEach((id) => ($(id).onchange = update));
$("q").oninput = update;
$("all").onchange = load;
$("refresh").onclick = load;
$("clearAll").onclick = () => { state.filters = Object.assign(DEFAULT_FILTERS(), { kind: [] }); $("q").value = ""; update(); };
$("selAll").onclick = () => { visible().forEach((n) => state.selected.add(n.id)); update(); };
$("doneSel").onclick = () => state.selected.size && done([...state.selected]);
$("doneMatch").onclick = () => confirmDone(visible().map((n) => n.id), "matching notifications");
$("doneClosed").onclick = () => confirmDone(state.items.filter(isClosedPR).map((n) => n.id), "closed/merged PR notifications");
$("clearHist").onclick = clearHistory;
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("q").focus(); }
  if (e.key === "Escape") document.activeElement.blur();
});

loadHistory();
load();
setInterval(load, 120000);
