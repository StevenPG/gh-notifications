// Thin wrappers around the local server API.
export async function fetchNotifications(includeRead) {
  const r = await fetch("/api/notifications?all=" + includeRead);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}

export const fetchHistory = async () => (await fetch("/api/history")).json();
export const clearHistory = () => fetch("/api/history", { method: "DELETE" });
export const markRead = (id) => fetch("/api/read/" + id, { method: "POST" });
export const markDone = (id, meta) => fetch("/api/done/" + id, { method: "POST", body: JSON.stringify(meta) });
