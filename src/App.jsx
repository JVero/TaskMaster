import { useState, useEffect, useCallback, useMemo } from "react";
import { loadData, saveData, onSyncStatus, onRemoteUpdate } from "./lib/storage";
import { supabase } from "./lib/supabase";
import { SEED } from "./lib/constants";
import { SANS, SERIF, makeStyles } from "./lib/styles";
import ListView from "./views/ListView";
import DetailView from "./views/DetailView";
import TimelineView from "./views/TimelineView";
import QuickLogModal from "./components/QuickLogModal";

// --- Supabase Auth gate ---
function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
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

const DEMO_KEY = "tracker-demo-data";

function Tracker({ demo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "timeline") return "timeline";
    if (hash && hash !== "") return "detail";
    return "list";
  });
  const [activeId, setActiveId] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash && hash !== "" && hash !== "timeline") return hash;
    return null;
  });
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("writing");
  const [showDormant, setShowDormant] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [viewFade, setViewFade] = useState(1);
  const [quickLog, setQuickLog] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const [undoAction, setUndoAction] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("tracker-dark") === "1"; } catch { return false; }
  });

  // Responsive layout
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const maxW = winWidth >= 1200 ? 800 : winWidth >= 900 ? 700 : 560;

  const S = useMemo(() => makeStyles(dark, maxW), [dark, maxW]);

  useEffect(() => { document.body.style.background = S.bg; }, [S.bg]);

  // Load data
  useEffect(() => {
    if (demo) {
      try {
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) { const parsed = JSON.parse(saved); if (parsed?.contexts) { if (!parsed.order) parsed.order = parsed.contexts.map(c => c.id); setData(parsed); setLoading(false); return; } }
      } catch {}
      setData(SEED);
      setLoading(false);
      return;
    }
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
  }, [demo]);

  // Sync status + realtime (skip in demo mode)
  useEffect(() => { if (!demo) return onSyncStatus(setSyncState); }, [demo]);
  useEffect(() => { if (!demo) return onRemoteUpdate((remoteData) => {
    if (remoteData && remoteData.contexts) {
      if (!remoteData.order) remoteData.order = remoteData.contexts.map(c => c.id);
      setData(remoteData);
    }
  }); }, [demo]);

  const toggleDark = () => setDark(d => { const v = !d; try { localStorage.setItem("tracker-dark", v ? "1" : "0"); } catch {} return v; });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Escape: close quick-log, or go back from detail/timeline
      if (e.key === "Escape") {
        if (quickLog) { setQuickLog(null); return; }
        if (!inInput && view !== "list") { goBack(); return; }
      }

      // Skip remaining shortcuts if in an input
      if (inInput || e.ctrlKey || e.metaKey || e.altKey) return;

      // L: quick-log
      if (e.key === "l") {
        e.preventDefault();
        setQuickLog({ ctxId: view === "detail" && activeId ? activeId : "", text: "", dur: "session" });
      }
      // /: focus search (list view only)
      if (e.key === "/" && view === "list") {
        e.preventDefault();
        document.querySelector('input[placeholder="Search..."]')?.focus();
      }
      // N: new project (list view only)
      if (e.key === "n" && view === "list") {
        e.preventDefault();
        setShowNew(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, quickLog, activeId]);

  // Mutation helpers
  const persist = useCallback((d) => {
    if (demo) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch {} }
    else { saveData(d); }
  }, [demo]);
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

  // Navigation
  const fadeTo = useCallback((fn) => {
    setViewFade(0);
    setTimeout(() => { fn(); setViewFade(1); }, 120);
  }, []);
  const openCtx = (id, skipPush) => {
    fadeTo(() => { setActiveId(id); setView("detail"); });
    if (!skipPush) window.history.pushState({ view: "detail", id }, "", `#${id}`);
  };
  const goBack = (skipPush) => {
    fadeTo(() => { setView("list"); setActiveId(null); });
    if (!skipPush) window.history.pushState({ view: "list" }, "", "#");
  };
  const openTimeline = (skipPush) => {
    fadeTo(() => { setView("timeline"); setActiveId(null); });
    if (!skipPush) window.history.pushState({ view: "timeline" }, "", "#timeline");
  };

  // Swipe-right to go back (mobile, detail/timeline only)
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (startX < 40 && dx > 80 && dy < dx * 0.5 && view !== "list") {
        goBack();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [view]);

  // Hash-based routing
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "timeline") {
      window.history.replaceState({ view: "timeline" }, "", "#timeline");
    } else if (hash && hash !== "") {
      window.history.replaceState({ view: "detail", id: hash }, "", `#${hash}`);
    } else {
      window.history.replaceState({ view: "list" }, "", "#");
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const state = e.state;
      if (state?.view === "detail" && state.id) {
        openCtx(state.id, true);
      } else if (state?.view === "timeline") {
        openTimeline(true);
      } else {
        goBack(true);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Drag handlers
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

  const signOut = demo ? () => { window.location.href = "/"; } : () => supabase.auth.signOut();

  // Loading state
  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#A8A29E", fontFamily: SANS }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>&#8987;</div>
      Loading&hellip;
    </div>
  );
  if (!data) return null;

  // Derived data
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

  // View routing
  let viewEl;
  if (view === "detail" && ctx) {
    viewEl = <DetailView ctx={ctx} mut={mut} doWithUndo={doWithUndo} goBack={goBack} S={S} maxW={maxW} viewFade={viewFade} syncState={syncState} undoAction={undoAction} />;
  } else if (view === "timeline") {
    viewEl = <TimelineView data={data} openCtx={openCtx} goBack={goBack} S={S} maxW={maxW} viewFade={viewFade} syncState={syncState} undoAction={undoAction} />;
  } else {
    viewEl = <ListView
      live={live} dormant={dormant} liveAll={liveAll} data={data} loadError={loadError}
      search={search} setSearch={setSearch} filterDomain={filterDomain} setFilterDomain={setFilterDomain}
      showNew={showNew} setShowNew={setShowNew} newName={newName} setNewName={setNewName} newDomain={newDomain} setNewDomain={setNewDomain}
      showDormant={showDormant} setShowDormant={setShowDormant}
      openCtx={openCtx} openTimeline={openTimeline} toggleDark={toggleDark} dark={dark}
      saveAll={saveAll} dragId={dragId} setDragId={setDragId} dragOver={dragOver} setDragOver={setDragOver}
      handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop} handleDragEnd={handleDragEnd}
      moveCtx={moveCtx} quickLog={quickLog} setQuickLog={setQuickLog} mut={mut} signOut={signOut} demo={demo}
      S={S} maxW={maxW} viewFade={viewFade} syncState={syncState} undoAction={undoAction}
      setData={setData} setActiveId={setActiveId} setView={setView}
    />;
  }

  return <>
    {viewEl}
    <QuickLogModal quickLog={quickLog} setQuickLog={setQuickLog} live={liveAll} mut={mut} S={S} />
  </>;
}

const DEMO = window.location.pathname.startsWith("/demo");

export default function App() {
  if (DEMO) return <Tracker demo />;
  return <AuthGate><Tracker /></AuthGate>;
}
