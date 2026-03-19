// src/lib/helpers.js

import { DOMAINS } from "./constants";

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);

export function staleness(ctx) {
  if (!ctx.log.length) return { text: "No activity", days: Infinity, color: "#A8A29E" };
  const last = ctx.log.reduce((a, b) => a.date > b.date ? a : b);
  const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (days === 0) return { text: "Today", days, color: "#6A9E80" };
  if (days === 1) return { text: "Yesterday", days, color: "#6A9E80" };
  const text = `${days}d ago`;
  if (days <= 3) return { text, days, color: "#78716C" };
  if (days <= 7) return { text, days, color: "#A68352" };
  return { text, days, color: "#B04A33" };
}

export function exportForClaude(ctx) {
  const dm = DOMAINS[ctx.domain] || { label: ctx.domain };
  const lines = [];
  lines.push(`# Project: ${ctx.name}`);
  lines.push(`- Domain: ${dm.label}`);
  lines.push(`- Status: ${ctx.status} | Priority: ${ctx.priority}`);
  if (ctx.stakeholders) lines.push(`- Stakeholders: ${ctx.stakeholders}`);
  lines.push('');
  lines.push(`## Re-entry note`);
  lines.push(ctx.reentry || '(none)');
  lines.push('');
  lines.push(`## Tasks`);
  const groups = { "in-progress": [], "todo": [], "blocked": [], "done": [] };
  ctx.tasks.forEach(t => { if (groups[t.status]) groups[t.status].push(t); });
  for (const [status, tasks] of Object.entries(groups)) {
    if (tasks.length === 0) continue;
    lines.push(`### ${status} (${tasks.length})`);
    tasks.forEach(t => lines.push(`- ${t.text}`));
  }
  if (ctx.log.length > 0) {
    lines.push('');
    lines.push(`## Recent work log (last 5)`);
    ctx.log.slice(0, 5).forEach(e => {
      lines.push(`- ${e.date} [${e.dur}]: ${e.text}`);
    });
  }
  return lines.join('\n');
}
