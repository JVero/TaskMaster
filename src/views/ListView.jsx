// src/views/ListView.jsx

import { useState, useEffect, useRef } from "react";
import { DOMAINS, STATUS_META, SEED } from "../lib/constants";
import { SERIF, SANS, MONO, SP } from "../lib/styles";
import { uid, today, staleness } from "../lib/helpers";
import { saveData } from "../lib/storage";
import SyncPill from "../components/SyncPill";
import UndoToast from "../components/UndoToast";


export default function ListView({
  live, dormant, liveAll, data, loadError,
  search, setSearch, filterDomain, setFilterDomain,
  showNew, setShowNew, newName, setNewName, newDomain, setNewDomain,
  showDormant, setShowDormant,
  openCtx, openTimeline, toggleDark, dark,
  saveAll, dragId, setDragId, dragOver, setDragOver,
  handleDragStart, handleDragOver, handleDrop, handleDragEnd,
  moveCtx, quickLog, setQuickLog, mut, signOut, demo,
  S, maxW, viewFade, syncState, undoAction,
  setData, setActiveId, setView,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const totalOpen = data.contexts.reduce((n, c) => n + c.tasks.filter(t => t.status !== "done").length, 0);
  const crits = liveAll.filter(c => c.priority === "critical-path");

  // Scroll-linked header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const chipStyle = (color) => ({
    ...S.chip,
    color: color,
    background: color + (dark ? "18" : "12"),
  });

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      <SyncPill syncState={syncState} S={S} />
      <UndoToast undoAction={undoAction} S={S} />
      {loadError && (
        <div style={{ background: S.warning.bg, borderRadius: 10, padding: `${SP.sm}px ${SP.md + 2}px`, marginBottom: SP.md, fontSize: 13, color: S.warning.text, border: `1px solid ${S.warning.border}` }}>
          {loadError}
        </div>
      )}
      <div ref={headerRef} style={{
        ...S.stickyHeader,
        ...(scrolled ? S.stickyHeaderShadow : {}),
      }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          {demo && (
            <div style={{ background: S.success.bg, borderRadius: 10, padding: `6px ${SP.md + 2}px`, marginBottom: 10, fontSize: 13, color: S.success.text, border: `1px solid ${S.success.border}`, textAlign: "center" }}>
              Demo mode — changes are saved locally in your browser
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={S.h1}>Projects</h1>
            <div style={{ display: "flex", alignItems: "center", gap: SP.md + 2 }}>
              <button onClick={openTimeline} style={{ ...S.textBtn, fontSize: 13, color: S.textMuted }}>This week</button>
              <button onClick={toggleDark} title={dark ? "Light mode" : "Dark mode"}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, color: S.textMuted, transition: "color 0.15s ease" }}>{dark ? "\u2600\uFE0F" : "\u263E"}</button>
              <button onClick={() => setShowNew(true)} style={{ ...S.textBtn, fontSize: 13 }}>+ New</button>
            </div>
          </div>
          <p style={{ margin: `${SP.xs}px 0 0`, fontSize: 13, color: S.textMuted, letterSpacing: "0.01em", fontVariantNumeric: "tabular-nums" }}>{live.length} active &middot; {totalOpen} open tasks</p>
        </div>
      </div>

      {showNew && (
        <div style={{ ...S.section, marginBottom: SP.lg, animation: "cardIn 0.15s ease-out" }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project name"
            onKeyDown={e => {
              if (e.key === "Enter" && newName.trim()) {
                const nc = { id: "ctx-" + uid(), name: newName.trim(), domain: newDomain, status: "active", priority: "steady", reentry: "", stakeholders: "", tasks: [], log: [] };
                saveAll({ ...data, contexts: [...data.contexts, nc], order: [...(data.order || []), nc.id] }); setNewName(""); setShowNew(false); openCtx(nc.id);
              }
              if (e.key === "Escape") { setShowNew(false); setNewName(""); }
            }}
            style={{ ...S.input, width: "100%", fontSize: 15, padding: `10px ${SP.md}px`, marginBottom: 10, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: SP.sm, flexWrap: "wrap" }}>
            <select value={newDomain} onChange={e => setNewDomain(e.target.value)} style={{ ...S.sel, fontSize: 13 }}>
              {Object.entries(DOMAINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={() => {
              if (newName.trim()) {
                const nc = { id: "ctx-" + uid(), name: newName.trim(), domain: newDomain, status: "active", priority: "steady", reentry: "", stakeholders: "", tasks: [], log: [] };
                saveAll({ ...data, contexts: [...data.contexts, nc], order: [...(data.order || []), nc.id] }); setNewName(""); setShowNew(false); openCtx(nc.id);
              }
            }} style={S.primaryBtn}>Create</button>
            <button onClick={() => { setShowNew(false); setNewName(""); }} style={S.ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: SP.xl, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${S.border}`, padding: "6px 0", fontSize: 14, color: S.text, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s ease" }}
          onFocus={e => e.target.style.borderBottomColor = S.borderMed}
          onBlur={e => e.target.style.borderBottomColor = S.border} />
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ fontSize: 12, background: "transparent", border: "none", color: S.textMuted, cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">All</option>
          {Object.entries(DOMAINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(search || filterDomain) && <button onClick={() => { setSearch(""); setFilterDomain(""); }} style={{ ...S.textBtn, fontSize: 12, flexShrink: 0 }}>Clear</button>}
      </div>

      {crits.length > 0 && (
        <p style={{ fontSize: 13, color: S.textMid, margin: `0 0 ${SP.lg}px`, lineHeight: 1.5 }}>
          <span style={{ color: S.accent, fontWeight: 600 }}>Critical path:</span> {crits.map(c => c.name).join(" \u2192 ")}
        </p>
      )}

      {(() => {
        const candidates = liveAll.filter(c => c.status === "active" || c.status === "blocked");
        if (candidates.length === 0) return null;
        const withStaleness = candidates.map(c => ({ ...c, stale: staleness(c) }));
        const critStale = withStaleness.filter(c => c.priority === "critical-path").sort((a, b) => b.stale.days - a.stale.days);
        const pick = critStale[0] || withStaleness.sort((a, b) => b.stale.days - a.stale.days)[0];
        if (!pick) return null;
        const nextTask = pick.tasks.find(t => t.status === "in-progress") || pick.tasks.find(t => t.status === "todo");
        return (
          <div onClick={() => openCtx(pick.id)} style={S.heroCard}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = S.shadowLg; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = S.shadow; e.currentTarget.style.transform = "none"; }}>
            <div style={{ fontSize: 10, fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.1em", color: S.accent, marginBottom: 6 }}>Pick up where you left off</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: SP.sm }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: S.text, fontFamily: SERIF }}>{pick.name}</span>
              <span style={{ fontWeight: 400, color: S.textMuted, fontSize: 13, fontFamily: SANS, fontVariantNumeric: "tabular-nums" }}>&middot; {pick.stale.text}</span>
            </div>
            {nextTask && <div style={{ fontSize: 13, color: S.textMid, marginTop: 5, lineHeight: 1.4 }}>{nextTask.status === "in-progress" ? "\u25D1" : "\u25CB"} {nextTask.text}</div>}
          </div>
        );
      })()}

      {live.length === 0 && !showNew && (
        <div style={S.emptyState}>
          <div style={{ fontSize: 32, marginBottom: SP.md, animation: "emptyPulse 3s ease-in-out infinite" }}>{search || filterDomain ? "\uD83D\uDD0D" : "\uD83D\uDCDD"}</div>
          <p style={{ margin: 0, fontWeight: 500, color: S.textMid }}>
            {search || filterDomain ? "No projects match your search" : "No active projects yet"}
          </p>
          <p style={{ margin: `${SP.sm}px 0 0`, fontSize: 13 }}>
            {search || filterDomain
              ? <button onClick={() => { setSearch(""); setFilterDomain(""); }} style={S.textBtn}>Clear filters</button>
              : <>Press <kbd style={{ background: S.kbd.bg, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontFamily: MONO, border: `1px solid ${S.kbd.border}`, color: S.kbd.text }}>N</kbd> or tap + New to create one</>
            }
          </p>
        </div>
      )}

      {live.map((c, idx) => {
        const dm = DOMAINS[c.domain] || { label: c.domain, color: "#78716C" };
        const sm = STATUS_META[c.status];
        const total = c.tasks.length;
        const done = c.tasks.filter(t => t.status === "done").length;
        const isBlocked = c.status === "blocked";
        const isDragging = dragId === c.id;
        const isOver = dragOver === c.id && dragId !== c.id;
        const isHovered = hoveredId === c.id;
        const stale = staleness(c);
        const reorderBtn = { background: "none", border: "none", padding: `${SP.xs}px 3px`, fontSize: 9, lineHeight: 1, cursor: "pointer", color: S.textMuted };

        return (
          <div key={c.id}
            draggable
            onDragStart={handleDragStart(c.id)}
            onDragOver={handleDragOver(c.id)}
            onDrop={handleDrop()}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => { if (!dragId) openCtx(c.id); }}
            style={{
              ...S.card,
              opacity: isDragging ? 0.25 : 1,
              borderColor: isOver ? S.accent + "44" : isHovered ? S.borderMed : S.border,
              boxShadow: isHovered ? S.shadowLg : S.shadow,
              transform: isHovered && !isDragging ? "translateY(-1px)" : "none",
              cursor: "grab",
              userSelect: "none",
              animation: "cardIn 0.2s ease-out",
              animationFillMode: "backwards",
              animationDelay: `${idx * 30}ms`,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.md }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: SP.sm, minWidth: 0, flex: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sm.fg, flexShrink: 0, position: "relative", top: -1, display: "inline-block", boxShadow: `0 0 0 2px ${sm.fg}22` }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: isBlocked ? S.danger.fg : S.text, fontFamily: SERIF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 12, color: stale.color, fontWeight: stale.days >= 7 ? 600 : 400, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{stale.text}</span>
            </div>
            {c.reentry && (
              <p style={{ fontSize: 13, color: S.textMid, margin: `6px 0 0 ${SP.lg - 1}px`, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {c.reentry}
              </p>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: SP.sm, marginLeft: SP.lg - 1, alignItems: "center", flexWrap: "wrap" }}>
              <span style={chipStyle(dm.color)}>{dm.label}</span>
              {c.priority === "critical-path" && <span style={chipStyle(S.accent)}>Critical</span>}
              {total > 0 && (
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: S.textMuted, fontVariantNumeric: "tabular-nums" }}>{done}/{total}</span>
                  {/* Mini progress bar */}
                  <span style={{ width: 32, height: 3, borderRadius: 2, background: S.border, overflow: "hidden", display: "inline-block" }}>
                    <span style={{ display: "block", height: "100%", width: `${(done / total) * 100}%`, background: done === total ? S.taskStatus.done : S.accent, borderRadius: 2, transition: "width 0.3s ease" }} />
                  </span>
                </span>
              )}
              <span onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginLeft: total > 0 ? 2 : "auto" }}>
                <button onClick={(e) => { e.stopPropagation(); moveCtx(c.id, -1); }} disabled={idx === 0}
                  style={{ ...reorderBtn, color: idx === 0 ? S.border : S.textMuted }}>{"\u25B2"}</button>
                <button onClick={(e) => { e.stopPropagation(); moveCtx(c.id, 1); }} disabled={idx === live.length - 1}
                  style={{ ...reorderBtn, color: idx === live.length - 1 ? S.border : S.textMuted }}>{"\u25BC"}</button>
              </span>
            </div>
          </div>
        );
      })}

      {dormant.length > 0 && (
        <div style={{ marginTop: SP.xxxl - 4 }}>
          <button onClick={() => setShowDormant(!showDormant)} style={{ ...S.textBtn, fontSize: 12, color: S.textMuted }}>
            {showDormant ? "\u25BE" : "\u25B8"} Paused & archived ({dormant.length})
          </button>
          {showDormant && dormant.map(c => (
            <div key={c.id} onClick={() => openCtx(c.id)}
              style={{ padding: `10px ${SP.lg}px`, cursor: "pointer", marginTop: 6, borderRadius: SP.sm, background: S.cardBg, border: `1px solid ${S.border}`, transition: "border-color 0.15s ease, transform 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = S.borderMed; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.transform = "none"; }}>
              <span style={{ fontSize: 14, color: S.textMuted }}>{c.name}</span>
              <span style={{ fontSize: 11, color: S.textMuted, marginLeft: SP.sm, opacity: 0.5 }}>{STATUS_META[c.status]?.label || c.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: SP.huge, paddingTop: SP.xl, borderTop: `1px solid ${S.border}`, textAlign: "center" }}>
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `project-tracker-backup-${today()}.json`;
          a.click(); URL.revokeObjectURL(url);
        }} style={{ background: "none", border: "none", color: S.textMuted, fontSize: 11, cursor: "pointer" }}>Export backup</button>
        <span style={{ color: S.border, margin: `0 ${SP.sm}px` }}>&middot;</span>
        <button onClick={() => {
          const input = document.createElement("input");
          input.type = "file"; input.accept = ".json";
          input.onchange = (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const imported = JSON.parse(e.target.result);
                if (!imported.contexts || !Array.isArray(imported.contexts)) { alert("Invalid backup file."); return; }
                if (!confirm(`Import ${imported.contexts.length} projects? This will replace all current data.`)) return;
                if (!imported.order) imported.order = imported.contexts.map(c => c.id);
                setData(imported); saveData(imported);
              } catch { alert("Could not parse backup file."); }
            };
            reader.readAsText(file);
          };
          input.click();
        }} style={{ background: "none", border: "none", color: S.textMuted, fontSize: 11, cursor: "pointer" }}>Import backup</button>
        <span style={{ color: S.border, margin: `0 ${SP.sm}px` }}>&middot;</span>
        <button onClick={() => {
          if (confirm("Reset everything to defaults?")) {
            setData(SEED); setActiveId(null); setView("list");
            saveData(SEED);
          }
        }} style={{ background: "none", border: "none", color: S.border, fontSize: 11, cursor: "pointer" }}>Reset to defaults</button>
        <p style={{ fontSize: 11, color: S.textMuted, margin: `10px 0 0`, opacity: 0.7 }}>
          {["L log", "/ search", "N new"].map((s, i) => {
            const [key, label] = s.split(" ");
            return <span key={i}>{i > 0 && <span style={{ margin: "0 6px" }}>&middot;</span>}<kbd style={{ background: S.kbd.bg, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontFamily: MONO, border: `1px solid ${S.kbd.border}`, color: S.kbd.text }}>{key}</kbd> {label}</span>;
          })}
        </p>
        <button onClick={signOut}
          style={{ background: "none", border: "none", color: S.border, fontSize: 11, cursor: "pointer", marginTop: SP.sm }}>{demo ? "Exit demo" : "Sign out"}</button>
      </div>


    </div></div>
  );
}
