const P = (d) => `<path d="${d}"/>`;
const svg = (cls, inner) => `<svg class="icon ${cls}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const circ = (x, y) => `<circle cx="${x}" cy="${y}" r="1.8"/>`;

export function icon(n) {
  const s = n.state || "none";
  const c = "s-" + s;
  switch (n.type) {
    case "PullRequest":
      if (s === "merged") return svg(c, circ(4, 3.5) + circ(4, 12.5) + circ(12, 11) + P("M4 5.3v5.4M5.8 3.5h2.2a2 2 0 0 1 2 2v3.8"));
      if (s === "closed") return svg(c, circ(4, 3.5) + circ(4, 12.5) + circ(12, 12.5) + P("M4 5.3v5.4M12 10.7V6M10.2 2.5l3.6 3.6M13.8 2.5l-3.6 3.6"));
      if (s === "draft") return svg(c, circ(4, 3.5) + circ(4, 12.5) + circ(12, 12.5) + P("M4 5.3v5.4M12 10.7V9.5M12 7V5.5"));
      return svg(c, circ(4, 3.5) + circ(4, 12.5) + circ(12, 12.5) + P("M4 5.3v5.4M12 10.7V6a2 2 0 0 0-2-2H8.5M10 2.2L8.3 4 10 5.8"));
    case "Issue":
      if (s === "closed") return svg(c, `<circle cx="8" cy="8" r="6.2"/>` + P("M5.5 8.2l1.8 1.8 3.4-3.6"));
      if (s === "not_planned") return svg(c, `<circle cx="8" cy="8" r="6.2"/>` + P("M5.5 10.5l5-5"));
      return svg(c, `<circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/>`);
    case "Commit": return svg("s-none", `<circle cx="8" cy="8" r="2.6"/>` + P("M1.5 8h3.9M10.6 8h3.9"));
    case "Release": return svg("s-open", P("M2 8.5V3a1 1 0 0 1 1-1h5.5l5.5 5.5-6 6z") + circ(5, 5));
    case "Discussion": return svg("s-none", P("M2.5 3h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8l-3 2.5V11H2.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"));
    case "CheckSuite": return svg("s-closed", `<circle cx="8" cy="8" r="6.2"/>` + P("M5.5 5.5l5 5M10.5 5.5l-5 5"));
    default: return svg("s-none", P("M3 2.5h8a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2z") + P("M3 11.5a2 2 0 0 1 2-2h8"));
  }
}
