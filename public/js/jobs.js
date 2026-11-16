// Queued GitHub Actions jobs tab.
import { $ } from "./state.js";
import { ago } from "./model.js";
import * as api from "./api.js";

let loaded = false;

const QUEUED_ICON = `<svg class="icon s-queued" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg>`;

function jobRow(j) {
  const d = document.createElement("div");
  d.className = "row";
  d.innerHTML = `${QUEUED_ICON}<div class="body"><a class="title" target="_blank" rel="noopener"></a>
    <div class="meta"><span class="tag state-queued">queued</span><span class="workflow"></span><span class="tag branch"></span></div></div>
    <span class="time" title="Queued since"></span>`;
  const a = d.querySelector(".title");
  a.textContent = j.name; a.href = j.url;
  d.querySelector(".workflow").textContent = j.workflow;
  const b = d.querySelector(".branch");
  if (j.branch) b.textContent = j.branch; else b.remove();
  d.querySelector(".time").textContent = ago(j.createdAt);
  return d;
}

function renderJobs(data) {
  $("jobsCount").textContent = data.length ? `(${data.length})` : "";
  const repos = new Set(data.map((j) => j.repo)).size;
  $("jobsStatus").textContent = data.length
    ? `${data.length} queued job${data.length === 1 ? "" : "s"} across ${repos} repo${repos === 1 ? "" : "s"}, oldest first`
    : "Scanned your recently pushed repositories";
  const list = $("jobsList");
  list.innerHTML = "";
  if (!data.length) { list.innerHTML = '<div class="empty">No queued jobs right now</div>'; return; }
  const byRepo = new Map();
  data.forEach((j) => byRepo.set(j.repo, [...(byRepo.get(j.repo) || []), j]));
  for (const [repo, jobs] of byRepo) {
    const g = document.createElement("div");
    g.className = "group";
    g.innerHTML = `<h2><span></span><span class="count">${jobs.length}</span></h2><div class="card"></div>`;
    g.querySelector("h2 span").textContent = repo;
    jobs.forEach((j) => g.querySelector(".card").append(jobRow(j)));
    list.append(g);
  }
}

// Loads once on first visit unless force is set (Refresh button).
export async function loadJobs(force) {
  if (loaded && !force) return;
  $("jobsStatus").textContent = "Loading...";
  try {
    renderJobs(await api.fetchQueuedJobs());
    loaded = true;
  } catch (e) { $("jobsStatus").textContent = api.errMsg(e); }
}

// Swaps the page chrome between the jobs view and the inbox/history layout.
export function showJobsTab(on) {
  $("jobsView").classList.toggle("hidden", !on);
  $("mainLayout").classList.toggle("hidden", on);
  $("pills").classList.toggle("hidden", on);
  $("status").classList.toggle("hidden", on);
  document.querySelectorAll("header .bar:not(.inboxOnly):not(.historyOnly)").forEach((e) => e.classList.toggle("hidden", on));
}
