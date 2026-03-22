// src/views/TimelineView.jsx

import { useState, useEffect } from "react";
import { DOMAINS, DAY_NAMES, MONTH_NAMES } from "../lib/constants";
import { SERIF, SP } from "../lib/styles";
import { today, dateOf, timeOf } from "../lib/helpers";
import SyncPill from "../components/SyncPill";
import UndoToast from "../components/UndoToast";

export default function TimelineView({ data, openCtx, goBack, S, maxW, viewFade, syncState, undoAction }) {
  const [scrolled, setScrolled] = useState(false);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  // Scroll-linked header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    const day = dateOf(e);
    if (!byDate[day]) byDate[day] = [];
    byDate[day].push(e);
  });
  Object.values(byDate).forEach(arr => arr.sort((a, b) => b.date.localeCompare(a.date)));
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const dayGrid = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayGrid.push({ key, day: DAY_NAMES[d.getDay()].slice(0, 3), date: d.getDate(), hasEntries: !!byDate[key], count: (byDate[key] || []).length });
  }

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      <SyncPill syncState={syncState} S={S} />
      <UndoToast undoAction={undoAction} S={S} />
      <div style={{
        ...S.stickyHeader,
        ...(scrolled ? S.stickyHeaderShadow : {}),
      }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={S.h1}>This week</h1>
            <button onClick={goBack} style={{ ...S.textBtn, fontSize: 13 }}>Back to projects</button>
          </div>
          <p style={{ margin: `${SP.xs}px 0 0`, fontSize: 13, color: S.textMuted, fontVariantNumeric: "tabular-nums" }}>{entries.length} log {entries.length === 1 ? "entry" : "entries"} in the last 7 days</p>
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: SP.xxxl - 4,
        background: S.cardBg, borderRadius: 10, padding: `${SP.md + 2}px ${SP.sm}px`,
        border: `1px solid ${S.border}`, boxShadow: S.shadow,
      }}>
        {dayGrid.map(d => {
          const isToday = d.key === today();
          return (
            <div key={d.key} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 11, color: S.textMuted, marginBottom: SP.xs, fontWeight: isToday ? 600 : 400, letterSpacing: "0.02em" }}>{d.day}</div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", margin: `0 auto ${SP.xs}px`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: isToday ? 700 : 400, fontVariantNumeric: "tabular-nums",
                color: isToday ? "#fff" : d.hasEntries ? S.text : S.textMuted,
                background: isToday ? S.accent : "transparent",
                transition: "background 0.15s ease",
              }}>{d.date}</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", minHeight: 4 }}>
                {d.count > 0 && Array.from({ length: Math.min(d.count, 4) }).map((_, i) => (
                  <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? S.accent : S.textMuted, opacity: isToday ? 1 : 0.5, transition: "opacity 0.15s ease" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sortedDates.length === 0 && (
        <div style={S.emptyState}>
          <div style={{ fontSize: 32, marginBottom: SP.md, animation: "emptyPulse 3s ease-in-out infinite" }}>{"\uD83D\uDCC5"}</div>
          <p style={{ margin: 0, fontWeight: 500, color: S.textMid }}>No work logged this week</p>
          <p style={{ margin: `${SP.sm}px 0 0`, fontSize: 13 }}>Log entries appear here as you work on projects</p>
        </div>
      )}

      {sortedDates.map(dateStr => {
        const d = new Date(dateStr + "T12:00:00");
        const isToday = dateStr === today();
        const isYesterday = dateStr === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().slice(0, 10);
        const label = isToday ? "Today" : isYesterday ? "Yesterday" : `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

        return (
          <div key={dateStr} style={{ marginBottom: SP.xxxl - 4 }}>
            <div style={{ fontSize: 11, fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.08em", color: S.textMuted, marginBottom: 10 }}>{label}</div>
            {byDate[dateStr].map((entry, idx) => (
              <div key={entry.id} onClick={() => openCtx(entry.ctxId)}
                style={{
                  padding: `10px ${SP.md + 2}px`, borderLeft: `3px solid ${entry.domain.color}`,
                  marginBottom: 6, cursor: "pointer",
                  background: S.cardBg, borderRadius: "0 8px 8px 0",
                  border: `1px solid ${S.border}`, borderLeftWidth: 3, borderLeftColor: entry.domain.color,
                  boxShadow: S.shadow,
                  transition: "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                  animation: "cardIn 0.2s ease-out",
                  animationFillMode: "backwards",
                  animationDelay: `${idx * 30}ms`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = S.shadowLg; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = S.shadow; e.currentTarget.style.transform = "none"; }}>
                {timeOf(entry) && <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 2, fontVariantNumeric: "tabular-nums" }}>{timeOf(entry)}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.sm }}>
                  <span style={{ fontSize: 14, color: entry.dur === "auto" ? S.textMuted : S.text, lineHeight: 1.5, flex: 1, fontStyle: entry.dur === "auto" ? "italic" : "normal" }}>{entry.text}</span>
                  {entry.dur !== "auto" && <span style={{ ...S.chip, fontSize: 10, padding: "1px 7px", color: S.textMuted, background: S.textMuted + "12", textTransform: "uppercase" }}>{entry.dur}</span>}
                </div>
                <div style={{ fontSize: 12, color: entry.domain.color, fontWeight: 500, marginTop: 3 }}>{entry.ctxName}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div></div>
  );
}
