const { gh, mapLimit } = require("./github");

const REPO_RE = /^[\w-][\w.-]*\/[\w.-]*[\w-][\w.-]*$/;
const isValidRepo = (repo) => REPO_RE.test(repo);

// Queued jobs live on workflow runs that are queued or in progress. Scan the
// most recently pushed repos unless a specific repo is given.
async function listQueuedJobs(repo) {
  let repos;
  if (repo) repos = [repo];
  else {
    const out = await gh(["api", "user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator,organization_member"]);
    repos = JSON.parse(out).filter((r) => !r.archived).map((r) => r.full_name);
  }
  const perRepo = await mapLimit(repos, 5, async (full) => {
    try {
      const runs = [];
      for (const status of ["queued", "in_progress"]) {
        const out = await gh(["api", `repos/${full}/actions/runs?status=${status}&per_page=50`]);
        runs.push(...JSON.parse(out).workflow_runs);
      }
      const jobs = await mapLimit(runs, 5, async (run) => {
        const out = await gh(["api", "--paginate", "--slurp", `repos/${full}/actions/runs/${run.id}/jobs?per_page=100`]);
        return JSON.parse(out).flatMap((p) => p.jobs)
          .filter((j) => j.status === "queued")
          .map((j) => ({ id: String(j.id), repo: full, workflow: run.name, name: j.name, branch: run.head_branch, createdAt: j.created_at, url: j.html_url }));
      });
      return jobs.flat();
    } catch { return []; } // repos without Actions access are skipped
  });
  return perRepo.flat().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

module.exports = { listQueuedJobs, isValidRepo };
