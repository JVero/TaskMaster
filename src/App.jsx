import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { loadData, saveData, onSyncStatus } from "./lib/storage";
import { supabase } from "./lib/supabase";

// --- Supabase Auth gate ---
function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, background: "#FAF9F6" }}>
        <div style={{ color: "#A8A29E", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (session) return children;

  const signIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, background: "#FAF9F6", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 320, width: "100%" }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>{"\uD83D\uDD12"}</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1C1917", fontFamily: SERIF }}>Project Tracker</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#A8A29E" }}>Sign in to continue</p>
        <input
          autoFocus type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter") document.getElementById("pw")?.focus(); }}
          placeholder="Email"
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: 15,
            border: `1px solid ${error ? "#fca5a5" : "#D6D3D1"}`, borderRadius: 8,
            outline: "none", fontFamily: "inherit", marginBottom: 10,
            background: error ? "#fef2f2" : "#fff",
          }}
        />
        <input
          id="pw" type="password" value={password}
          onChange={e => { setPassword(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter") signIn(); }}
          placeholder="Password"
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: 15,
            border: `1px solid ${error ? "#fca5a5" : "#D6D3D1"}`, borderRadius: 8,
            outline: "none", fontFamily: "inherit", marginBottom: 10,
            background: error ? "#fef2f2" : "#fff",
          }}
        />
        <button onClick={signIn} disabled={loading}
          style={{
            width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 600,
            background: "#C15F3C", color: "#fff", border: "none", borderRadius: 8,
            cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error && <p style={{ marginTop: 10, fontSize: 13, color: "#dc2626" }}>{error}</p>}
      </div>
    </div>
  );
}

const DOMAINS = {
  "systems-cpp": { label: "Systems / C++", color: "#6366f1" },
  "data-science-python": { label: "Data Science", color: "#2563eb" },
  "computer-vision": { label: "Comp Vision", color: "#7c3aed" },
  "ios-swift": { label: "iOS / Swift", color: "#ea580c" },
  "clinical-ops": { label: "Clinical", color: "#059669" },
  "writing": { label: "Writing", color: "#b45309" },
  "teaching": { label: "Teaching", color: "#0891b2" },
};

const STATUS_META = {
  active: { label: "Active", bg: "#dcfce7", fg: "#166534" },
  blocked: { label: "Blocked", bg: "#fee2e2", fg: "#991b1b" },
  paused: { label: "Paused", bg: "#fef3c7", fg: "#92400e" },
  complete: { label: "Complete", bg: "#E7E5E4", fg: "#78716C" },
  archived: { label: "Archived", bg: "#E7E5E4", fg: "#A8A29E" },
};

const PRIORITY_META = {
  "critical-path": { label: "Critical path", fg: "#dc2626" },
  steady: { label: "Steady", fg: "#78716C" },
  background: { label: "Background", fg: "#A8A29E" },
  someday: { label: "Someday", fg: "#D6D3D1" },
};

const STATUS_OPTIONS = ["active", "blocked", "paused", "complete", "archived"];
const PRIORITY_OPTIONS = ["critical-path", "steady", "background", "someday"];
const TASK_STATUS = ["todo", "in-progress", "done", "blocked"];

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

function staleness(ctx) {
  if (!ctx.log.length) return { text: "No activity", days: Infinity, color: "#A8A29E" };
  const last = ctx.log.reduce((a, b) => a.date > b.date ? a : b);
  const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (days === 0) return { text: "Today", days, color: "#059669" };
  if (days === 1) return { text: "Yesterday", days, color: "#059669" };
  const text = `${days}d ago`;
  if (days <= 3) return { text, days, color: "#78716C" };
  if (days <= 7) return { text, days, color: "#d97706" };
  return { text, days, color: "#dc2626" };
}

const SEED = {
  order: ["ctx-5", "ctx-1", "ctx-2", "ctx-3", "ctx-4", "ctx-6", "ctx-7", "ctx-8"],
  contexts: [
    {
      id: "ctx-1", name: "Closed-Loop Active Sensing", domain: "systems-cpp",
      status: "blocked", priority: "critical-path",
      reentry: "BLOCKED on dissertation proposal \u2014 can't run new participants until proposal is approved. Use this window to scope the webcam real-time feedback feature (replacing video playback). Sketch the architecture before proposal clears.",
      stakeholders: "Dr. Torres, IRB",
      tasks: [
        { id: "t1", text: "Scope webcam CV library options (latency requirements?)", status: "todo" },
        { id: "t2", text: "Sketch webcam feedback architecture", status: "todo" },
        { id: "t3", text: "Collect remaining participants (after proposal)", status: "blocked" },
        { id: "t4", text: "Kinematic profile analysis across learning phases", status: "in-progress" },
      ],
      log: [{ id: "l1", date: "2026-03-10", text: "Reviewed torus/cylinder boundary detection. Stable.", dur: "session" }],
    },
    {
      id: "ctx-2", name: "Facial Kinematics / OpenFace", domain: "computer-vision",
      status: "active", priority: "steady",
      reentry: "Pipeline is stable, running on new datasets. Nothing unexpected. Good flow-state work when you need a break from writing.",
      stakeholders: "Dr. Torres",
      tasks: [
        { id: "t5", text: "Process current dataset batch", status: "in-progress" },
        { id: "t6", text: "Flag any anomalous results", status: "todo" },
        { id: "t7", text: "Cross-population comparison analysis", status: "todo" },
      ],
      log: [{ id: "l2", date: "2026-03-13", text: "Ran pipeline on batch 3. Clean output.", dur: "session" }],
    },
    {
      id: "ctx-3", name: "iPad Dementia Screening App", domain: "ios-swift",
      status: "active", priority: "steady",
      reentry: "STILL NEED the advanced geometric analysis of drawing paths before the paper is complete. Do the analysis FIRST \u2014 don't get pulled into writing prose until it's done.",
      stakeholders: "Dr. Torres",
      tasks: [
        { id: "t8", text: "Implement geometric path analysis (curvature, trajectory decomposition)", status: "todo" },
        { id: "t9", text: "Run geometric analysis on collected data", status: "todo" },
        { id: "t10", text: "Integrate geometric findings into paper draft", status: "todo" },
        { id: "t11", text: "Finish paper draft", status: "todo" },
      ],
      log: [{ id: "l3", date: "2026-03-15", text: "Outlined geometric analysis approach.", dur: "quick" }],
    },
    {
      id: "ctx-4", name: "ASD Sulforaphane Clinical Trial", domain: "clinical-ops",
      status: "active", priority: "steady",
      reentry: "5 participants collected. Scheduling happens around you. Next session: run Mocopi + OpenFace protocol. Between sessions: spot-check data quality on existing 5.",
      stakeholders: "Dr. Torres, Clinical collaborators, IRB",
      tasks: [
        { id: "t12", text: "Spot-check data quality on 5 existing participants", status: "todo" },
        { id: "t13", text: "Run next participant session when scheduled", status: "todo" },
        { id: "t14", text: "Longitudinal analysis across timepoints", status: "todo" },
      ],
      log: [{ id: "l4", date: "2026-03-12", text: "Participant 5 session complete.", dur: "deep" }],
    },
    {
      id: "ctx-5", name: "Dissertation Proposal", domain: "writing",
      status: "active", priority: "critical-path",
      reentry: "THE BOTTLENECK. Quals first, then schedule proposal defense. Next: identify which section you're drafting and write. This unblocks Closed-Loop and sets the Dec 2026 timeline.",
      stakeholders: "Dr. Torres, Committee",
      tasks: [
        { id: "t15", text: "Complete qualifying exams", status: "in-progress" },
        { id: "t16", text: "Draft introduction / framing", status: "todo" },
        { id: "t17", text: "Draft methods across studies", status: "todo" },
        { id: "t18", text: "Schedule proposal defense with committee", status: "todo" },
      ],
      log: [{ id: "l5", date: "2026-03-16", text: "Worked on quals prep.", dur: "deep" }],
    },
    {
      id: "ctx-6", name: "Teaching \u2014 Quant Methods", domain: "teaching",
      status: "active", priority: "steady",
      reentry: "Autopilot. Mid-semester, weekly lectures. Protect this from expanding into research time.",
      stakeholders: "Students, Department",
      tasks: [
        { id: "t19", text: "Weekly lecture prep & delivery", status: "in-progress" },
        { id: "t20", text: "Grading", status: "in-progress" },
      ],
      log: [{ id: "l6", date: "2026-03-17", text: "Taught weekly session.", dur: "session" }],
    },
    {
      id: "ctx-7", name: "XSens LSL Integration", domain: "systems-cpp",
      status: "complete", priority: "background",
      reentry: "Complete. Integrated into lab infrastructure.",
      stakeholders: "Lab", tasks: [
        { id: "t21", text: "C++ XSens SDK integration", status: "done" },
        { id: "t22", text: "LSL outlet configuration", status: "done" },
      ], log: [],
    },
    {
      id: "ctx-8", name: "ABR Theoretical Paper", domain: "writing",
      status: "paused", priority: "background",
      reentry: "PNAS Nexus paper published. Parked unless extending framework.",
      stakeholders: "Dr. Torres",
      tasks: [{ id: "t24", text: "PNAS Nexus publication", status: "done" }], log: [],
    },
  ],
};

// Generate a pasteable context briefing for Claude
function exportForClaude(ctx) {
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

function Tracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [view, setView] = useState("list");
  const [activeId, setActiveId] = useState(null);
  const [editReentry, setEditReentry] = useState(false);
  const [reentryDraft, setReentryDraft] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [logText, setLogText] = useState("");
  const [logDur, setLogDur] = useState("session");
  const [expandLog, setExpandLog] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskBuf, setEditTaskBuf] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("writing");
  const [showDormant, setShowDormant] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [exportText, setExportText] = useState(null);
  const [viewFade, setViewFade] = useState(1);
  const [quickLog, setQuickLog] = useState(null); // { ctxId, text, dur }
  const [syncState, setSyncState] = useState("idle");
  const [undoAction, setUndoAction] = useState(null); // { label, undo, timer }
  const [showDone, setShowDone] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("tracker-dark") === "1"; } catch { return false; }
  });
  const S = useMemo(() => makeStyles(dark), [dark]);
  const taRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadData(SEED);
        if (!loaded.order) loaded.order = loaded.contexts.map(c => c.id);
        setData(loaded);
      } catch (e) {
        console.error('Load failed, using seed:', e);
        setData(SEED);
        setLoadError('Could not reach database \u2014 working offline.');
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => onSyncStatus(setSyncState), []);
  const toggleDark = () => setDark(d => { const v = !d; try { localStorage.setItem("tracker-dark", v ? "1" : "0"); } catch {} return v; });

  // Quick-log keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "l" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (view === "list") {
          e.preventDefault();
          setQuickLog({ ctxId: "", text: "", dur: "session" });
        }
      }
      if (e.key === "Escape" && quickLog) setQuickLog(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, quickLog]);

  const persist = useCallback((d) => { saveData(d); }, []);
  const mut = useCallback((ctxId, fn) => {
    setData(prev => {
      const next = { ...prev, contexts: prev.contexts.map(c => c.id === ctxId ? { ...c, ...fn(c) } : c) };
      persist(next); return next;
    });
  }, [persist]);
  const saveAll = useCallback((d) => { setData(d); persist(d); }, [persist]);
  const doWithUndo = useCallback((label, action, undoFn) => {
    action();
    if (undoAction?.timer) clearTimeout(undoAction.timer);
    const timer = setTimeout(() => setUndoAction(null), 5000);
    setUndoAction({ label, undo: () => { undoFn(); clearTimeout(timer); setUndoAction(null); }, timer });
  }, [undoAction]);

  const fadeTo = useCallback((fn) => {
    setViewFade(0);
    setTimeout(() => { fn(); setViewFade(1); }, 120);
  }, []);
  const openCtx = (id) => fadeTo(() => { setActiveId(id); setView("detail"); setEditReentry(false); setExpandLog(false); setShowAddTask(false); setEditingTaskId(null); setExportText(null); });
  const goBack = () => fadeTo(() => { setView("list"); setActiveId(null); setExportText(null); });

  // Drag handlers — live reorder on hover, persist on drop
  const handleDragStart = (id) => (e) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (id) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragId || id === dragId || id === dragOver) return;
    setDragOver(id);
    setData(prev => {
      const order = [...(prev.order || prev.contexts.map(c => c.id))];
      const fromIdx = order.indexOf(dragId);
      const toIdx = order.indexOf(id);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, dragId);
      return { ...prev, order };
    });
  };
  const handleDrop = () => (e) => {
    e.preventDefault();
    setData(prev => { persist(prev); return prev; });
    setDragId(null); setDragOver(null);
  };
  const handleDragEnd = () => {
    setData(prev => { persist(prev); return prev; });
    setDragId(null); setDragOver(null);
  };

  const moveCtx = (id, dir) => {
    setData(prev => {
      const order = [...(prev.order || prev.contexts.map(c => c.id))];
      const idx = order.indexOf(id);
      const target = idx + dir;
      if (target < 0 || target >= order.length) return prev;
      [order[idx], order[target]] = [order[target], order[idx]];
      const next = { ...prev, order };
      persist(next); return next;
    });
  };

  const syncPill = syncState !== "idle" && (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 999,
      fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 12,
      background: syncState === "saving" ? "#fef3c7" : syncState === "saved" ? "#dcfce7" : "#fee2e2",
      color: syncState === "saving" ? "#92400e" : syncState === "saved" ? "#166534" : "#991b1b",
      transition: "all 0.3s ease",
      opacity: syncState === "saved" ? 0.6 : 1,
    }}>
      {syncState === "saving" ? "Saving..." : syncState === "saved" ? "Synced" : "Offline"}
    </div>
  );

  const undoToast = undoAction && (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      background: "#292524", color: "#fff", padding: "10px 16px", borderRadius: 10,
      fontSize: 13, fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeIn 0.15s ease",
    }}>
      <span>{undoAction.label}</span>
      <button onClick={undoAction.undo} style={{
        background: "#C15F3C", color: "#fff", border: "none", borderRadius: 5,
        padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}>Undo</button>
    </div>
  );

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#A8A29E", fontFamily: SANS }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>&#8987;</div>
      Loading&hellip;
    </div>
  );
  if (!data) return null;

  const ctx = activeId ? data.contexts.find(c => c.id === activeId) : null;
  const order = data.order || data.contexts.map(c => c.id);
  const ctxMap = {};
  data.contexts.forEach(c => { ctxMap[c.id] = c; });
  const ordered = order.map(id => ctxMap[id]).filter(Boolean);
  const liveAll = ordered.filter(c => !["complete", "archived", "paused"].includes(c.status));
  const dormant = ordered.filter(c => ["complete", "archived", "paused"].includes(c.status));
  const searchLower = search.toLowerCase();
  const live = liveAll.filter(c => {
    if (filterDomain && c.domain !== filterDomain) return false;
    if (search && !c.name.toLowerCase().includes(searchLower) && !c.reentry?.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  /* ---- DETAIL ---- */
  if (view === "detail" && ctx) {
    const dm = DOMAINS[ctx.domain] || { label: ctx.domain, color: "#78716C" };
    const sm = STATUS_META[ctx.status];
    const pm = PRIORITY_META[ctx.priority];
    const taskGroups = [
      { key: "in-progress", label: "In progress", icon: "\u25D1", color: "#2563eb" },
      { key: "todo", label: "To do", icon: "\u25CB", color: "#78716C" },
      { key: "blocked", label: "Blocked", icon: "\u2298", color: "#dc2626" },
      { key: "done", label: "Done", icon: "\u25CF", color: "#059669" },
    ];

    return (
      <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
        {syncPill}{undoToast}{undoToast}
        <button onClick={goBack} style={S.back}>&larr; Projects</button>
        <div style={{ marginBottom: 24 }}>
          <h2 style={S.h2}>{ctx.name}</h2>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={ctx.status} onChange={e => mut(ctx.id, () => ({ status: e.target.value }))}
              style={{ ...S.sel, background: sm.bg, color: sm.fg }}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
            <select value={ctx.priority} onChange={e => mut(ctx.id, () => ({ priority: e.target.value }))}
              style={{ ...S.sel, color: pm.fg }}>{PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}</select>
            <span style={{ ...S.dtag, borderColor: dm.color + "44", color: dm.color }}>{dm.label}</span>
            <button onClick={() => {
              const text = exportForClaude(ctx);
              setExportText(text);
              navigator.clipboard.writeText(text).then(() => {}, () => {});
              setTimeout(() => exportRef.current?.select(), 50);
            }} style={{ ...S.ghostBtn, fontSize: 12, padding: "4px 10px", marginLeft: "auto" }}>Export for Claude</button>
          </div>
          <div style={{ margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#D6D3D1", flexShrink: 0 }}>Stakeholders:</span>
            <input value={ctx.stakeholders || ""} onChange={e => mut(ctx.id, () => ({ stakeholders: e.target.value }))}
              placeholder="Add stakeholders..."
              style={{ fontSize: 13, color: "#A8A29E", background: "none", border: "none", borderBottom: "1px solid transparent", outline: "none", padding: "2px 0", flex: 1, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderBottomColor = "#e2e8f0"}
              onBlur={e => e.target.style.borderBottomColor = "transparent"} />
          </div>
        </div>

        {exportText && (
          <section style={{ ...S.section, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ ...S.h3, color: "#166534" }}>Copied to clipboard &mdash; paste into Claude</h3>
              <button onClick={() => setExportText(null)} style={{ ...S.textBtn, color: "#166534" }}>Close</button>
            </div>
            <textarea ref={exportRef} readOnly value={exportText}
              style={{ ...S.ta, minHeight: 120, fontSize: 12, fontFamily: "ui-monospace, monospace", background: "#fff", color: "#1C1917" }}
              onFocus={e => e.target.select()} />
          </section>
        )}

        <section style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={S.h3}>Re-entry note</h3>
            {!editReentry && <button onClick={() => { setEditReentry(true); setReentryDraft(ctx.reentry); setTimeout(() => taRef.current?.focus(), 30); }} style={S.textBtn}>Edit</button>}
          </div>
          {editReentry ? (<>
            <textarea ref={taRef} value={reentryDraft} onChange={e => setReentryDraft(e.target.value)} style={S.ta} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => { mut(ctx.id, () => ({ reentry: reentryDraft })); setEditReentry(false); }} style={S.primaryBtn}>Save</button>
              <button onClick={() => setEditReentry(false)} style={S.ghostBtn}>Cancel</button>
            </div>
          </>) : (
            <p style={{ fontSize: 14, color: S.textMid, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
              {ctx.reentry || <span style={{ color: "#D6D3D1", fontStyle: "italic" }}>Empty &mdash; click Edit</span>}
            </p>
          )}
        </section>

        <section style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={S.h3}>Tasks</h3>
            <button onClick={() => setShowAddTask(true)} style={S.textBtn}>+ Add task</button>
          </div>
          {showAddTask && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="What needs doing?"
                onKeyDown={e => {
                  if (e.key === "Enter" && newTask.trim()) { mut(ctx.id, c => ({ tasks: [{ id: uid(), text: newTask.trim(), status: "todo" }, ...c.tasks] })); setNewTask(""); }
                  if (e.key === "Escape") { setShowAddTask(false); setNewTask(""); }
                }} style={S.input} />
              <button onClick={() => { if (newTask.trim()) { mut(ctx.id, c => ({ tasks: [{ id: uid(), text: newTask.trim(), status: "todo" }, ...c.tasks] })); setNewTask(""); } }} style={S.primaryBtn}>Add</button>
            </div>
          )}
          {taskGroups.map(g => {
            const items = ctx.tasks.filter(t => t.status === g.key);
            if (!items.length) return null;
            const isDoneGroup = g.key === "done";
            return (
              <div key={g.key} style={{ marginBottom: 16 }}>
                <div onClick={isDoneGroup ? () => setShowDone(!showDone) : undefined}
                  style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: g.color, marginBottom: 6, cursor: isDoneGroup ? "pointer" : "default" }}>
                  {isDoneGroup && <span style={{ marginRight: 4 }}>{showDone ? "\u25BE" : "\u25B8"}</span>}
                  {g.label} &middot; {items.length}
                </div>
                {(!isDoneGroup || showDone) && items.map(task => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${S.border}`, opacity: isDoneGroup ? 0.4 : 1 }}>
                    <button onClick={() => {
                      const next = { todo: "in-progress", "in-progress": "done", done: "todo", blocked: "todo" };
                      mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, status: next[t.status] } : t) }));
                    }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, color: g.color, flexShrink: 0, marginTop: 1 }}
                      title={`${task.status} \u2014 click to advance`}>
                      {g.icon}
                    </button>
                    {editingTaskId === task.id ? (
                      <input autoFocus value={editTaskBuf} onChange={e => setEditTaskBuf(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, text: editTaskBuf } : t) })); setEditingTaskId(null); } if (e.key === "Escape") setEditingTaskId(null); }}
                        onBlur={() => { mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, text: editTaskBuf } : t) })); setEditingTaskId(null); }}
                        style={{ ...S.input, flex: 1, padding: "2px 6px", fontSize: 14 }} />
                    ) : (
                      <span onClick={() => { setEditingTaskId(task.id); setEditTaskBuf(task.text); }}
                        style={{ flex: 1, fontSize: 14, color: isDoneGroup ? S.textMuted : S.text, lineHeight: 1.5, cursor: "text", textDecoration: isDoneGroup ? "line-through" : "none", textDecorationColor: S.textMuted }}>{task.text}</span>
                    )}
                    <select value={task.status} onChange={e => mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, status: e.target.value } : t) }))}
                      style={{ fontSize: 11, color: "#A8A29E", background: "none", border: "1px solid #D6D3D1", borderRadius: 4, padding: "1px 2px", cursor: "pointer", flexShrink: 0 }}>
                      {TASK_STATUS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => {
                      const removed = task;
                      doWithUndo(`Deleted "${task.text.slice(0, 30)}"`,
                        () => mut(ctx.id, c => ({ tasks: c.tasks.filter(t => t.id !== task.id) })),
                        () => mut(ctx.id, c => ({ tasks: [...c.tasks, removed] }))
                      );
                    }}
                      style={{ background: "none", border: "none", color: "#D6D3D1", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}
                      onMouseEnter={e => e.target.style.color = "#ef4444"} onMouseLeave={e => e.target.style.color = "#e2e8f0"}>&times;</button>
                  </div>
                ))}
              </div>
            );
          })}
          {ctx.tasks.length === 0 && <p style={{ color: "#D6D3D1", fontSize: 14, margin: 0 }}>No tasks yet.</p>}
        </section>

        <section style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={S.h3}>Work log</h3>
            <button onClick={() => setExpandLog(!expandLog)} style={S.textBtn}>{expandLog ? "Collapse" : "Show"} ({ctx.log.length})</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={logText} onChange={e => setLogText(e.target.value)} placeholder="What did you do?"
              onKeyDown={e => { if (e.key === "Enter" && logText.trim()) { mut(ctx.id, c => ({ log: [{ id: uid(), date: today(), text: logText.trim(), dur: logDur }, ...c.log] })); setLogText(""); } }}
              style={{ ...S.input, flex: 1, fontSize: 13 }} />
            <select value={logDur} onChange={e => setLogDur(e.target.value)} style={{ ...S.sel, fontSize: 12 }}>
              <option value="quick">Quick</option><option value="session">Session</option><option value="deep">Deep</option>
            </select>
            <button onClick={() => { if (logText.trim()) { mut(ctx.id, c => ({ log: [{ id: uid(), date: today(), text: logText.trim(), dur: logDur }, ...c.log] })); setLogText(""); } }} style={S.primaryBtn}>Log</button>
          </div>
          {expandLog && ctx.log.length > 0 && (
            <div style={{ marginTop: 12 }}>{ctx.log.map(e => (
              <div key={e.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #E7E5E4", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "#A8A29E", fontFamily: "ui-monospace, monospace", minWidth: 78, flexShrink: 0 }}>{e.date}</span>
                <span style={{ fontSize: 13, color: "#57534E", flex: 1 }}>{e.text}</span>
                <span style={{ fontSize: 11, color: "#D6D3D1", flexShrink: 0, textTransform: "uppercase" }}>{e.dur}</span>
                <button onClick={() => mut(ctx.id, c => ({ log: c.log.filter(l => l.id !== e.id) }))}
                  style={{ background: "none", border: "none", color: "#D6D3D1", cursor: "pointer", fontSize: 13 }}>&times;</button>
              </div>
            ))}</div>
          )}
        </section>

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #E7E5E4", textAlign: "center" }}>
          <button onClick={() => {
            const prev = ctx.status;
            doWithUndo(`Archived "${ctx.name}"`,
              () => { mut(ctx.id, () => ({ status: "archived" })); goBack(); },
              () => mut(ctx.id, () => ({ status: prev }))
            );
          }} style={{ ...S.ghostBtn, color: "#D6D3D1", fontSize: 12 }}>Archive this project</button>
        </div>
      </div></div>
    );
  }

  /* ---- LIST ---- */
  const totalOpen = data.contexts.reduce((n, c) => n + c.tasks.filter(t => t.status !== "done").length, 0);
  const crits = liveAll.filter(c => c.priority === "critical-path");

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      {syncPill}{undoToast}
      {loadError && (
        <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#92400e", border: "1px solid #fde68a" }}>
          {loadError}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: S.text, letterSpacing: "-0.02em", fontFamily: SERIF }}>Projects</h1>
            <button onClick={toggleDark} title={dark ? "Light mode" : "Dark mode"}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, color: S.textMuted }}>{dark ? "\u2600" : "\u263E"}</button>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: S.textMuted }}>{live.length} active &middot; {totalOpen} open tasks &middot; drag to reorder</p>
        </div>
        <button onClick={() => setShowNew(true)} style={S.primaryBtn}>+ New project</button>
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

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
          style={{ ...S.input, fontSize: 13, padding: "6px 10px" }} />
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ ...S.sel, fontSize: 12 }}>
          <option value="">All domains</option>
          {Object.entries(DOMAINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(search || filterDomain) && <button onClick={() => { setSearch(""); setFilterDomain(""); }} style={{ ...S.textBtn, fontSize: 12, flexShrink: 0 }}>Clear</button>}
      </div>

      {crits.length > 0 && (
        <div style={{ background: dark ? "#3b1111" : "#fef2f2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: S.text, border: dark ? "1px solid #7f1d1d" : "1px solid #fecaca" }}>
          <span style={{ fontWeight: 700, color: "#dc2626" }}>Critical path: </span>{crits.map(c => c.name).join(" \u2192 ")}
        </div>
      )}

      {(() => {
        // "What should I work on?" — find the stalest critical-path project, or stalest active
        const candidates = liveAll.filter(c => c.status === "active" || c.status === "blocked");
        if (candidates.length === 0) return null;
        const withStaleness = candidates.map(c => ({ ...c, stale: staleness(c) }));
        const critStale = withStaleness.filter(c => c.priority === "critical-path").sort((a, b) => b.stale.days - a.stale.days);
        const pick = critStale[0] || withStaleness.sort((a, b) => b.stale.days - a.stale.days)[0];
        if (!pick) return null;
        const dm = DOMAINS[pick.domain] || { label: pick.domain, color: "#78716C" };
        const nextTask = pick.tasks.find(t => t.status === "in-progress") || pick.tasks.find(t => t.status === "todo");
        return (
          <div onClick={() => openCtx(pick.id)} style={{ background: dark ? "#3B2517" : "#FDF8F4", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: dark ? "1px solid #C15F3C33" : "1px solid #E8C4B0", cursor: "pointer" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#C15F3C", marginBottom: 4 }}>Suggested next</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{pick.name} <span style={{ fontWeight: 400, color: S.textMuted }}>&middot; {pick.stale.text}</span></div>
            {nextTask && <div style={{ fontSize: 13, color: "#57534E", marginTop: 4 }}>{nextTask.status === "in-progress" ? "\u25D1" : "\u25CB"} {nextTask.text}</div>}
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

        return (
          <div key={c.id}
            draggable
            onDragStart={handleDragStart(c.id)}
            onDragOver={handleDragOver(c.id)}
            onDrop={handleDrop()}
            onDragEnd={handleDragEnd}
            onClick={() => { if (!dragId) openCtx(c.id); }}
            style={{
              background: isOver ? (dark ? "#3B2517" : "#FDF8F4") : S.card,
              borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "grab", boxShadow: "0 1px 3px rgba(28, 25, 23, 0.06)",
              border: isOver ? "1px dashed #C15F3C" : isBlocked ? "1px solid #fca5a5" : `1px solid ${S.border}`,
              borderLeft: `3px solid ${isBlocked ? "#dc2626" : dm.color}`,
              opacity: isDragging ? 0.4 : 1,
              transition: "background 0.15s, opacity 0.15s, border 0.15s",
              userSelect: "none",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); moveCtx(c.id, -1); }}
                    style={{ background: "none", border: "none", color: "#D6D3D1", cursor: "pointer", padding: 0, fontSize: 10, lineHeight: 1 }}
                    title="Move up">{"\u25B2"}</button>
                  <button onClick={e => { e.stopPropagation(); moveCtx(c.id, 1); }}
                    style={{ background: "none", border: "none", color: "#D6D3D1", cursor: "pointer", padding: 0, fontSize: 10, lineHeight: 1 }}
                    title="Move down">{"\u25BC"}</button>
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: S.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SERIF }}>{c.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: sm.bg, color: sm.fg, flexShrink: 0 }}>{sm.label}</span>
              </div>
              <span style={{ color: "#D6D3D1", flexShrink: 0 }}>&rarr;</span>
            </div>
            <p style={{ fontSize: 13, color: S.textMid, margin: "6px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {c.reentry || "No re-entry note"}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: dm.color }}>{dm.label}</span>
              {c.priority === "critical-path" && <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626" }}>Critical</span>}
              {(() => { const s = staleness(c); return (
                <span style={{ fontSize: 11, color: s.color, fontWeight: s.days >= 7 ? 600 : 400, marginLeft: 4 }}>{s.text}</span>
              ); })()}
              {total > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                  <div style={{ width: 48, height: 4, background: "#E7E5E4", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(done / total) * 100}%`, height: "100%", background: dm.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#A8A29E" }}>{done}/{total}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {dormant.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowDormant(!showDormant)} style={{ ...S.textBtn, fontSize: 13, color: "#A8A29E" }}>
            {showDormant ? "\u25BE" : "\u25B8"} Paused &amp; archived ({dormant.length})
          </button>
          {showDormant && dormant.map(c => (
            <div key={c.id} onClick={() => openCtx(c.id)}
              style={{ padding: "10px 14px", marginTop: 4, cursor: "pointer", borderRadius: 6, background: S.card, borderLeft: `3px solid ${(DOMAINS[c.domain] || {}).color || "#A8A29E"}` }}>
              <span style={{ fontSize: 14, color: "#78716C" }}>{c.name}</span>
              <span style={{ fontSize: 11, color: "#D6D3D1", marginLeft: 8 }}>{c.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 36, textAlign: "center" }}>
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `project-tracker-backup-${today()}.json`;
          a.click(); URL.revokeObjectURL(url);
        }} style={{ background: "none", border: "none", color: "#A8A29E", fontSize: 11, cursor: "pointer" }}>Export full backup (JSON)</button>
        <span style={{ color: "#D6D3D1", margin: "0 8px" }}>&middot;</span>
        <button onClick={() => {
          if (confirm("Reset everything to defaults?")) {
            setData(SEED); setActiveId(null); setView("list");
            saveData(SEED);
          }
        }} style={{ background: "none", border: "none", color: "#D6D3D1", fontSize: 11, cursor: "pointer" }}>Reset to defaults</button>
        <p style={{ fontSize: 11, color: "#D6D3D1", margin: "8px 0 0" }}>Press <kbd style={{ background: "#E7E5E4", padding: "1px 5px", borderRadius: 3, fontSize: 11, border: "1px solid #D6D3D1" }}>L</kbd> to quick-log</p>
        <button onClick={() => supabase.auth.signOut()}
          style={{ background: "none", border: "none", color: "#D6D3D1", fontSize: 11, cursor: "pointer", marginTop: 8 }}>Sign out</button>
      </div>

      {quickLog && (
        <div onClick={() => setQuickLog(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: S.card, borderRadius: 12, padding: "20px 24px", width: "100%", maxWidth: 420, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: S.text, fontFamily: SERIF }}>Quick log</h3>
            <select value={quickLog.ctxId} onChange={e => setQuickLog({ ...quickLog, ctxId: e.target.value })}
              autoFocus
              style={{ ...S.sel, width: "100%", fontSize: 14, padding: "8px 10px", marginBottom: 10, boxSizing: "border-box" }}>
              <option value="">Pick a project...</option>
              {live.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={quickLog.text} onChange={e => setQuickLog({ ...quickLog, text: e.target.value })}
              placeholder="What did you do?"
              onKeyDown={e => {
                if (e.key === "Enter" && quickLog.text.trim() && quickLog.ctxId) {
                  mut(quickLog.ctxId, c => ({ log: [{ id: uid(), date: today(), text: quickLog.text.trim(), dur: quickLog.dur }, ...c.log] }));
                  setQuickLog(null);
                }
              }}
              style={{ ...S.input, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={quickLog.dur} onChange={e => setQuickLog({ ...quickLog, dur: e.target.value })} style={{ ...S.sel, fontSize: 12 }}>
                <option value="quick">Quick</option><option value="session">Session</option><option value="deep">Deep</option>
              </select>
              <button onClick={() => {
                if (quickLog.text.trim() && quickLog.ctxId) {
                  mut(quickLog.ctxId, c => ({ log: [{ id: uid(), date: today(), text: quickLog.text.trim(), dur: quickLog.dur }, ...c.log] }));
                  setQuickLog(null);
                }
              }} style={S.primaryBtn}>Log</button>
              <button onClick={() => setQuickLog(null)} style={S.ghostBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div></div>
  );
}

const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
const ACCENT = { light: "#C15F3C", dark: "#D97756" };

function makeStyles(dark) {
  const accent = dark ? ACCENT.dark : ACCENT.light;
  const bg = dark ? "#1C1917" : "#FAF9F6";
  const card = dark ? "#292524" : "#FFFFFF";
  const border = dark ? "#44403C" : "#E7E5E4";
  const borderMed = dark ? "#57534E" : "#D6D3D1";
  const text = dark ? "#E7E5E4" : "#1C1917";
  const textMid = dark ? "#A8A29E" : "#57534E";
  const textMuted = dark ? "#78716C" : "#A8A29E";
  const inputBg = dark ? "#292524" : "#FFFFFF";
  return {
    shell: { minHeight: "100vh", background: bg, fontFamily: SANS, padding: "20px 16px", transition: "opacity 0.12s ease, background 0.3s ease" },
    wrap: { maxWidth: 620, margin: "0 auto" },
    section: { background: card, borderRadius: 12, padding: "16px 18px", marginBottom: 14, border: `1px solid ${border}`, boxShadow: "0 1px 3px rgba(28, 25, 23, 0.06)" },
    h2: { margin: 0, fontSize: 20, fontWeight: 700, color: text, fontFamily: SERIF },
    h3: { margin: 0, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: textMuted },
    dtag: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, border: "1px solid" },
    sel: { fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, background: dark ? "#44403C" : "#FAF9F6", border: `1px solid ${borderMed}`, color: textMid, cursor: "pointer" },
    input: { background: inputBg, border: `1px solid ${borderMed}`, borderRadius: 8, color: text, fontSize: 14, padding: "8px 10px", fontFamily: "inherit", outline: "none", flex: 1 },
    ta: { width: "100%", minHeight: 80, background: inputBg, border: `1px solid ${borderMed}`, borderRadius: 8, color: text, fontSize: 14, padding: 10, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", outline: "none" },
    primaryBtn: { background: accent, color: "#fff", border: "none", fontWeight: 600, fontSize: 13, padding: "7px 16px", borderRadius: 8, cursor: "pointer" },
    ghostBtn: { background: "none", border: `1px solid ${borderMed}`, color: textMid, fontSize: 13, padding: "6px 14px", borderRadius: 8, cursor: "pointer" },
    textBtn: { background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 },
    back: { background: "none", border: "none", color: textMid, cursor: "pointer", fontSize: 14, padding: "4px 0", marginBottom: 16 },
    // theme tokens for inline use
    accent, text, textMid, textMuted, card, border, borderMed, bg,
  };
}

export default function App() {
  return <AuthGate><Tracker /></AuthGate>;
}
