// Search query parsing and matching.
import { typeAlias, isBot, stateOf, reasonOf, ageMs } from "./model.js";

const QUALIFIERS = ["is", "state", "repo", "author", "reason", "type", "age", "title"];

function parseDuration(s) {
  const m = s.match(/^([<>]?)(\d+)([hdw])$/);
  if (!m) return null;
  const ms = +m[2] * { h: 36e5, d: 864e5, w: 6048e5 }[m[3]];
  return { op: m[1] || "<", ms };
}

export function parseQuery(q) {
  const terms = [];
  for (const raw of q.match(/-?(?:\w+:)?(?:"[^"]*"|\S+)/g) || []) {
    const neg = raw.startsWith("-"), t = neg ? raw.slice(1) : raw;
    const m = t.match(/^(\w+):(.*)$/);
    if (m && QUALIFIERS.includes(m[1])) {
      terms.push({ neg, key: m[1], val: m[2].replace(/^"|"$/g, "").toLowerCase() });
    } else terms.push({ neg, key: "text", val: t.replace(/^"|"$/g, "").toLowerCase() });
  }
  return terms;
}

export function termMatch(n, t) {
  const v = t.val;
  switch (t.key) {
    case "text": return (n.title + " " + n.repo + " " + (n.author || "")).toLowerCase().includes(v);
    case "title": return n.title.toLowerCase().includes(v);
    case "repo": return n.repo.toLowerCase().includes(v);
    case "author": return v === "me" ? n.reason === "author" : (n.author || "").toLowerCase().includes(v);
    case "reason": return reasonOf(n).includes(v.replace(/_/g, " "));
    case "state": return stateOf(n) === v.replace("-", "_");
    case "type": return n.type.toLowerCase() === (typeAlias[v] || v).toLowerCase();
    case "age": { const d = parseDuration(v); if (!d) return true; return d.op === "<" ? ageMs(n) < d.ms : ageMs(n) > d.ms; }
    case "is":
      if (typeAlias[v]) return n.type === typeAlias[v];
      if (v === "unread") return !!n.unread;
      if (v === "read") return !n.unread;
      if (v === "bot") return isBot(n);
      if (v === "human") return !isBot(n);
      if (v === "draft" || v === "open" || v === "merged") return stateOf(n) === v;
      if (v === "closed") return stateOf(n) === "closed" || stateOf(n) === "merged" || stateOf(n) === "not_planned";
      return true;
  }
  return true;
}
