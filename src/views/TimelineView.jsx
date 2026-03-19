// src/views/TimelineView.jsx

import { DOMAINS, DAY_NAMES, MONTH_NAMES } from "../lib/constants";
import { SERIF } from "../lib/styles";
import { today } from "../lib/helpers";
import SyncPill from "../components/SyncPill";
import UndoToast from "../components/UndoToast";

export default function TimelineView({ data, openCtx, goBack, S, maxW, viewFade, syncState, undoAction }) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const entries = [];
  data.contexts.forEach(ctx => {
    const dm = DOMAINS[ctx.domain] || { label: ctx.domain, color: "#78716C" };
    ctx.log.forEach(entry => {
      const d = new Date(entry.date);
      if (d >= sevenDaysAgo) {
        entries.push({ ...entry, ctxId: ctx.id, ctxName: ctx.name, domain: dm });
      }
    });
  });

  const byDate = {};
  entries.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const dayGrid = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayGrid.push({ key, day: DAY_NAMES[d.getDay()].slice(0, 3), date: d.getDate(), hasEntries: !!byDate[key], count: (byDate[key] || []).length });
  }

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      <SyncPill syncState={syncState} />
      <UndoToast undoAction={undoAction} />
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: S.bg, margin: "-24px -20px 16px", padding: "calc(16px + env(safe-area-inset-top, 0px)) 20px 12px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: S.text, letterSpacing: "-0.02em", fontFamily: SERIF }}>This week</h1>
            <button onClick={goBack} style={{ ...S.textBtn, fontSize: 13 }}>Back to projects</button>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: S.textMuted }}>{entries.length} log {entries.length === 1 ? "entry" : "entries"} in the last 7 days</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        {dayGrid.map(d => {
          const isToday = d.key === today();
          return (
            <div key={d.key} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4, fontWeight: isToday ? 600 : 400 }}>{d.day}</div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", margin: "0 auto 4px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: isToday ? 700 : 400, fontVariantNumeric: "tabular-nums",
                color: isToday ? "#fff" : d.hasEntries ? S.text : S.textMuted,
                background: isToday ? S.accent : "transparent",
              }}>{d.date}</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                {d.count > 0 && Array.from({ length: Math.min(d.count, 4) }).map((_, i) => (
                  <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? S.accent : S.textMuted }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sortedDates.length === 0 && (
        <p style={{ textAlign: "center", color: S.textMuted, fontSize: 14, marginTop: 40 }}>No work logged in the past week.</p>
      )}

      {sortedDates.map(dateStr => {
        const d = new Date(dateStr + "T12:00:00");
        const isToday = dateStr === today();
        const isYesterday = dateStr === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().slice(0, 10);
        const label = isToday ? "Today" : isYesterday ? "Yesterday" : `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

        return (
          <div key={dateStr} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.textMuted, marginBottom: 10 }}>{label}</div>
            {byDate[dateStr].map(entry => (
              <div key={entry.id} onClick={() => openCtx(entry.ctxId)}
                style={{ padding: "10px 0 10px 14px", borderLeft: `2px solid ${entry.domain.color}`, marginBottom: 6, cursor: "pointer", marginLeft: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 14, color: entry.dur === "auto" ? S.textMuted : S.text, lineHeight: 1.5, flex: 1, fontStyle: entry.dur === "auto" ? "italic" : "normal" }}>{entry.text}</span>
                  {entry.dur !== "auto" && <span style={{ fontSize: 11, color: S.textMuted, flexShrink: 0, textTransform: "uppercase" }}>{entry.dur}</span>}
                </div>
                <div style={{ fontSize: 12, color: entry.domain.color, fontWeight: 500, marginTop: 2 }}>{entry.ctxName}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div></div>
  );
}
