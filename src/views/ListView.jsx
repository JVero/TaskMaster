// src/views/ListView.jsx

import { DOMAINS, STATUS_META, SEED } from "../lib/constants";
import { SERIF, SANS } from "../lib/styles";
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
  const totalOpen = data.contexts.reduce((n, c) => n + c.tasks.filter(t => t.status !== "done").length, 0);
  const crits = liveAll.filter(c => c.priority === "critical-path");

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      <SyncPill syncState={syncState} />
      <UndoToast undoAction={undoAction} />
      {loadError && (
        <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#92400e", border: "1px solid #fde68a" }}>
          {loadError}
        </div>
      )}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: S.bg, margin: "-24px -20px 16px", padding: "calc(16px + env(safe-area-inset-top, 0px)) 20px 12px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          {demo && (
            <div style={{ background: "#EDF5F0", borderRadius: 8, padding: "6px 14px", marginBottom: 10, fontSize: 13, color: "#4A7C5C", border: "1px solid #bbf7d0", textAlign: "center" }}>
              Demo mode — changes are saved locally in your browser
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: S.text, letterSpacing: "-0.02em", fontFamily: SERIF }}>Projects</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={openTimeline} style={{ ...S.textBtn, fontSize: 13, color: S.textMuted }}>This week</button>
              <button onClick={toggleDark} title={dark ? "Light mode" : "Dark mode"}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, color: S.textMuted }}>{dark ? "\u2600" : "\u263E"}</button>
              <button onClick={() => setShowNew(true)} style={{ ...S.textBtn, fontSize: 13 }}>+ New</button>
            </div>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: S.textMuted }}>{live.length} active &middot; {totalOpen} open tasks</p>
        </div>
      </div>

      {showNew && (
        <div style={{ ...S.section, marginBottom: 16, border: "1px solid #D6D3D1" }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project name"
            onKeyDown={e => {
              if (e.key === "Enter" && newName.trim()) {
                const nc = { id: "ctx-" + uid(), name: newName.trim(), domain: newDomain, status: "active", priority: "steady", reentry: "", stakeholders: "", tasks: [], log: [] };
                saveAll({ ...data, contexts: [...data.contexts, nc], order: [...(data.order || []), nc.id] }); setNewName(""); setShowNew(false); openCtx(nc.id);
              }
              if (e.key === "Escape") { setShowNew(false); setNewName(""); }
            }}
            style={{ ...S.input, width: "100%", fontSize: 15, padding: "10px 12px", marginBottom: 10, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${S.border}`, padding: "6px 0", fontSize: 14, color: S.text, outline: "none", fontFamily: "inherit" }} />
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ fontSize: 12, background: "transparent", border: "none", color: S.textMuted, cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">All</option>
          {Object.entries(DOMAINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(search || filterDomain) && <button onClick={() => { setSearch(""); setFilterDomain(""); }} style={{ ...S.textBtn, fontSize: 12, flexShrink: 0 }}>Clear</button>}
      </div>

      {crits.length > 0 && (
        <p style={{ fontSize: 13, color: S.textMid, margin: "0 0 16px" }}>
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
          <div onClick={() => openCtx(pick.id)} style={{ padding: "14px 0", marginBottom: 8, borderBottom: `1px solid ${S.border}`, cursor: "pointer" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: S.accent, marginBottom: 5 }}>Pick up where you left off</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: S.text, fontFamily: SERIF }}>{pick.name} <span style={{ fontWeight: 400, color: S.textMuted, fontSize: 13, fontFamily: SANS }}>&middot; {pick.stale.text}</span></div>
            {nextTask && <div style={{ fontSize: 13, color: S.textMid, marginTop: 4 }}>{nextTask.status === "in-progress" ? "\u25D1" : "\u25CB"} {nextTask.text}</div>}
          </div>
        );
      })()}

      {live.map(c => {
        const dm = DOMAINS[c.domain] || { label: c.domain, color: "#78716C" };
        const sm = STATUS_META[c.status];
        const total = c.tasks.length;
        const done = c.tasks.filter(t => t.status === "done").length;
        const isBlocked = c.status === "blocked";
        const isDragging = dragId === c.id;
        const isOver = dragOver === c.id && dragId !== c.id;
        const stale = staleness(c);

        return (
          <div key={c.id}
            draggable
            onDragStart={handleDragStart(c.id)}
            onDragOver={handleDragOver(c.id)}
            onDrop={handleDrop()}
            onDragEnd={handleDragEnd}
            onClick={() => { if (!dragId) openCtx(c.id); }}
            style={{
              padding: "16px 2px",
              borderBottom: `1px solid ${S.border}`,
              cursor: "grab",
              opacity: isDragging ? 0.25 : 1,
              background: isOver ? (dark ? "rgba(193,95,60,0.08)" : "rgba(193,95,60,0.04)") : "transparent",
              transition: "opacity 0.15s, background 0.15s",
              userSelect: "none",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sm.fg, flexShrink: 0, position: "relative", top: -1, display: "inline-block" }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: isBlocked ? "#B04A33" : S.text, fontFamily: SERIF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 12, color: stale.color, fontWeight: stale.days >= 7 ? 600 : 400, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{stale.text}</span>
            </div>
            {c.reentry && (
              <p style={{ fontSize: 13, color: S.textMid, margin: "5px 0 0 15px", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {c.reentry}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 7, marginLeft: 15, alignItems: "center", fontSize: 12, color: S.textMuted }}>
              <span style={{ color: dm.color, fontWeight: 500 }}>{dm.label}</span>
              {c.priority === "critical-path" && <span style={{ color: S.accent, fontWeight: 500 }}>Critical</span>}
              {total > 0 && <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{done}/{total}</span>}
            </div>
          </div>
        );
      })}

      {dormant.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setShowDormant(!showDormant)} style={{ ...S.textBtn, fontSize: 12, color: S.textMuted }}>
            {showDormant ? "\u25BE" : "\u25B8"} Paused & archived ({dormant.length})
          </button>
          {showDormant && dormant.map(c => (
            <div key={c.id} onClick={() => openCtx(c.id)}
              style={{ padding: "10px 2px", cursor: "pointer", borderBottom: `1px solid ${S.border}` }}>
              <span style={{ fontSize: 14, color: S.textMuted }}>{c.name}</span>
              <span style={{ fontSize: 11, color: S.textMuted, marginLeft: 8, opacity: 0.6 }}>{STATUS_META[c.status]?.label || c.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${S.border}`, textAlign: "center" }}>
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `project-tracker-backup-${today()}.json`;
          a.click(); URL.revokeObjectURL(url);
        }} style={{ background: "none", border: "none", color: "#A8A29E", fontSize: 11, cursor: "pointer" }}>Export backup</button>
        <span style={{ color: "#D6D3D1", margin: "0 8px" }}>&middot;</span>
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
        }} style={{ background: "none", border: "none", color: "#A8A29E", fontSize: 11, cursor: "pointer" }}>Import backup</button>
        <span style={{ color: "#D6D3D1", margin: "0 8px" }}>&middot;</span>
        <button onClick={() => {
          if (confirm("Reset everything to defaults?")) {
            setData(SEED); setActiveId(null); setView("list");
            saveData(SEED);
          }
        }} style={{ background: "none", border: "none", color: "#D6D3D1", fontSize: 11, cursor: "pointer" }}>Reset to defaults</button>
        <p style={{ fontSize: 11, color: "#D6D3D1", margin: "8px 0 0" }}>
          {["L log", "/ search", "N new"].map((s, i) => {
            const [key, label] = s.split(" ");
            return <span key={i}>{i > 0 && <span style={{ margin: "0 6px" }}>&middot;</span>}<kbd style={{ background: "#E7E5E4", padding: "1px 5px", borderRadius: 3, fontSize: 11, border: "1px solid #D6D3D1" }}>{key}</kbd> {label}</span>;
          })}
        </p>
        <button onClick={signOut}
          style={{ background: "none", border: "none", color: "#D6D3D1", fontSize: 11, cursor: "pointer", marginTop: 8 }}>{demo ? "Exit demo" : "Sign out"}</button>
      </div>


    </div></div>
  );
}
