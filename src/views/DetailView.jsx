// src/views/DetailView.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { DOMAINS, STATUS_META, PRIORITY_META, STATUS_OPTIONS, PRIORITY_OPTIONS, TASK_STATUS } from "../lib/constants";
import { SERIF, MONO, SP } from "../lib/styles";
import { uid, now, dateOf, timeOf, exportForClaude } from "../lib/helpers";
import SyncPill from "../components/SyncPill";
import UndoToast from "../components/UndoToast";

const FOCUS_DURATION = 25 * 60 * 1000; // 25 minutes

export default function DetailView({ ctx, mut, doWithUndo, goBack, S, maxW, viewFade, syncState, undoAction }) {
  const [editReentry, setEditReentry] = useState(false);
  const [reentryDraft, setReentryDraft] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [logText, setLogText] = useState("");
  const [logDur, setLogDur] = useState("session");
  const [expandLog, setExpandLog] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskBuf, setEditTaskBuf] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [exportText, setExportText] = useState(null);
  const [copiedReentry, setCopiedReentry] = useState(false);
  const [reentryCollapsed, setReentryCollapsed] = useState(false);
  const [focusStart, setFocusStart] = useState(null);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusDone, setFocusDone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const taRef = useRef(null);
  const exportRef = useRef(null);
  const logInputRef = useRef(null);
  const notifPermRef = useRef(false);

  // Scroll-linked header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus timer tick
  useEffect(() => {
    if (!focusStart) return;
    const tick = () => {
      const elapsed = Date.now() - focusStart;
      const remaining = FOCUS_DURATION - elapsed;
      if (remaining <= 0) {
        setFocusRemaining(0);
        setFocusStart(null);
        setFocusDone(true);
        setExpandLog(false);
        setLogDur("deep");
        try { new Notification("Session done \u2014 log what you did?", { body: ctx.name, icon: "/favicon.svg" }); } catch {}
        return;
      }
      setFocusRemaining(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [focusStart, ctx.name]);

  // Recalculate on tab visibility change
  useEffect(() => {
    if (!focusStart) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        const remaining = FOCUS_DURATION - (Date.now() - focusStart);
        if (remaining <= 0) {
          setFocusRemaining(0);
          setFocusStart(null);
          setFocusDone(true);
          setExpandLog(false);
          setLogDur("deep");
          try { new Notification("Session done \u2014 log what you did?", { body: ctx.name, icon: "/favicon.svg" }); } catch {}
        } else {
          setFocusRemaining(remaining);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [focusStart, ctx.name]);

  // Auto-focus log input when focus session completes
  useEffect(() => {
    if (focusDone) setTimeout(() => logInputRef.current?.focus(), 200);
  }, [focusDone]);

  const startFocus = useCallback(() => {
    if (!notifPermRef.current && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
      notifPermRef.current = true;
    }
    setFocusStart(Date.now());
    setFocusRemaining(FOCUS_DURATION);
    setFocusDone(false);
  }, []);

  const cancelFocus = useCallback(() => {
    setFocusStart(null);
    setFocusRemaining(0);
  }, []);

  const dismissFocusDone = useCallback(() => setFocusDone(false), []);

  const formatTime = (ms) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const isMobile = maxW <= 560;

  const moveTask = (taskId, dir) => {
    mut(ctx.id, c => {
      const tasks = [...c.tasks];
      const task = tasks.find(t => t.id === taskId);
      if (!task) return {};
      const sameStatus = tasks.map((t, i) => ({ t, i })).filter(({ t }) => t.status === task.status);
      const posInGroup = sameStatus.findIndex(({ t }) => t.id === taskId);
      const targetInGroup = posInGroup + dir;
      if (targetInGroup < 0 || targetInGroup >= sameStatus.length) return {};
      const fromIdx = sameStatus[posInGroup].i;
      const toIdx = sameStatus[targetInGroup].i;
      [tasks[fromIdx], tasks[toIdx]] = [tasks[toIdx], tasks[fromIdx]];
      return { tasks };
    });
  };

  const autoLog = (taskText, oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;
    const labels = { "done": "Completed", "in-progress": "Started", "blocked": "Blocked", "todo": oldStatus === "in-progress" ? "Paused" : "Reopened" };
    const label = labels[newStatus] || `${oldStatus} \u2192 ${newStatus}`;
    mut(ctx.id, c => ({ log: [{ id: uid(), date: now(), text: `${label}: ${taskText}`, dur: "auto" }, ...c.log] }));
  };

  const dm = DOMAINS[ctx.domain] || { label: ctx.domain, color: "#78716C" };
  const sm = STATUS_META[ctx.status];
  const pm = PRIORITY_META[ctx.priority];
  const taskGroups = [
    { key: "in-progress", label: "In progress", icon: "\u25D1" },
    { key: "todo", label: "To do", icon: "\u25CB" },
    { key: "blocked", label: "Blocked", icon: "\u2298" },
    { key: "done", label: "Done", icon: "\u25CF" },
  ];

  if (isMobile && focusStart) {
    const progress = 1 - (focusRemaining / FOCUS_DURATION);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999, background: S.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
      }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${progress * 100}%`,
          background: S.accent + "0A",
          transition: "height 1s linear",
        }} />
        <span style={{ fontSize: 14, color: S.textMuted, marginBottom: SP.md, letterSpacing: "0.03em" }}>{ctx.name}</span>
        <span style={{
          fontSize: 72, fontWeight: 300, fontVariantNumeric: "tabular-nums",
          color: S.text, fontFamily: MONO,
          letterSpacing: "-0.02em",
        }}>{formatTime(focusRemaining)}</span>
        <span style={{ fontSize: 13, color: S.textMuted, marginTop: SP.lg }}>Focus session</span>
        <button onClick={cancelFocus} style={{
          ...S.ghostBtn, marginTop: SP.huge, fontSize: 13, color: S.textMuted,
          borderColor: S.border, padding: `${SP.sm}px ${SP.xxl}px`,
        }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ ...S.shell, opacity: viewFade }}><div style={S.wrap}>
      <SyncPill syncState={syncState} S={S} />
      <UndoToast undoAction={undoAction} S={S} />
      <div style={{
        ...S.stickyHeader,
        margin: `-${SP.xxl}px -${SP.xl}px 0`,
        padding: `calc(${SP.md}px + env(safe-area-inset-top, 0px)) ${SP.xl}px 10px`,
        ...(scrolled ? S.stickyHeaderShadow : {}),
      }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          <button onClick={goBack} style={{ ...S.back, margin: 0 }}>&larr; Projects</button>
        </div>
      </div>
      <div style={{ marginBottom: SP.xxl, marginTop: SP.lg }}>
        <h2 style={S.h2}>{ctx.name}</h2>
        <div style={{ display: "flex", gap: SP.sm, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={ctx.status} onChange={e => mut(ctx.id, () => ({ status: e.target.value }))}
            style={{ ...S.sel, background: sm.bg, color: sm.fg }}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
          <select value={ctx.priority} onChange={e => mut(ctx.id, () => ({ priority: e.target.value }))}
            style={{ ...S.sel, color: pm.fg }}>{PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}</select>
          <span style={{ ...S.chip, borderRadius: 10, color: dm.color, background: dm.color + "14", border: `1px solid ${dm.color}22` }}>{dm.label}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: SP.sm, alignItems: "center" }}>
            {focusStart ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  color: S.accent, fontFamily: MONO,
                  animation: "focusPulse 2s ease-in-out infinite",
                }}>{formatTime(focusRemaining)}</span>
                <button onClick={cancelFocus} title="Cancel focus session"
                  style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                  onMouseEnter={e => e.target.style.color = S.danger.fgHover} onMouseLeave={e => e.target.style.color = S.textMuted}>&times;</button>
              </span>
            ) : (
              <button onClick={startFocus} title="Start 25-minute focus session"
                style={{ ...S.ghostBtn, fontSize: 12, padding: `${SP.xs}px 10px` }}>
                {"\u23F1"} Focus
              </button>
            )}
            <button onClick={() => {
              const text = exportForClaude(ctx);
              setExportText(text);
              navigator.clipboard.writeText(text).then(() => {}, () => {});
              setTimeout(() => exportRef.current?.select(), 50);
            }} style={{ ...S.ghostBtn, fontSize: 12, padding: `${SP.xs}px 10px` }}>Export for Claude</button>
          </span>
        </div>
        <div style={{ margin: `${SP.sm}px 0 0`, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: S.textMuted, flexShrink: 0 }}>Stakeholders:</span>
          <input value={ctx.stakeholders || ""} onChange={e => mut(ctx.id, () => ({ stakeholders: e.target.value }))}
            placeholder="Add stakeholders..."
            style={{ fontSize: 13, color: S.textMid, background: "none", border: "none", borderBottom: "1px solid transparent", outline: "none", padding: "2px 0", flex: 1, fontFamily: "inherit", transition: "border-color 0.15s ease" }}
            onFocus={e => e.target.style.borderBottomColor = S.border}
            onBlur={e => e.target.style.borderBottomColor = "transparent"} />
        </div>
      </div>

      {exportText && (
        <section style={{ ...S.section, background: S.success.bg, border: `1px solid ${S.success.border}`, animation: "cardIn 0.15s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm }}>
            <h3 style={{ ...S.h3, color: S.success.text }}>Copied to clipboard &mdash; paste into Claude</h3>
            <button onClick={() => setExportText(null)} style={{ ...S.textBtn, color: S.success.text }}>Close</button>
          </div>
          <textarea ref={exportRef} readOnly value={exportText}
            style={{ ...S.ta, minHeight: 120, fontSize: 12, fontFamily: MONO, background: S.cardBg, color: S.text }}
            onFocus={e => e.target.select()} />
        </section>
      )}

      <section style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ ...S.h3, cursor: "pointer" }} onClick={() => !editReentry && setReentryCollapsed(!reentryCollapsed)}>
            {!editReentry && <span style={{ marginRight: SP.xs }}>{reentryCollapsed ? "\u25B8" : "\u25BE"}</span>}
            Re-entry note
          </h3>
          {!editReentry && !reentryCollapsed && <div style={{ display: "flex", gap: 10 }}>
            {ctx.reentry && <button onClick={() => {
              navigator.clipboard.writeText(ctx.reentry).then(() => { setCopiedReentry(true); setTimeout(() => setCopiedReentry(false), 1500); }, () => {});
            }} style={{ ...S.textBtn, color: copiedReentry ? S.taskStatus.done : S.textMuted, fontSize: 12 }}>{copiedReentry ? "Copied" : "Copy"}</button>}
            <button onClick={() => { setEditReentry(true); setReentryDraft(ctx.reentry); setReentryCollapsed(false); setTimeout(() => taRef.current?.focus(), 30); }} style={S.textBtn}>Edit</button>
          </div>}
        </div>
        {!reentryCollapsed && (editReentry ? (<>
          <textarea ref={taRef} value={reentryDraft} onChange={e => {
            setReentryDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }} onFocus={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            style={{ ...S.ta, overflow: "hidden" }} />
          <div style={{ display: "flex", gap: SP.sm, marginTop: SP.sm }}>
            <button onClick={() => { mut(ctx.id, () => ({ reentry: reentryDraft })); setEditReentry(false); }} style={S.primaryBtn}>Save</button>
            <button onClick={() => setEditReentry(false)} style={S.ghostBtn}>Cancel</button>
          </div>
        </>) : (
          <p style={{ fontSize: 14, color: S.textMid, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
            {ctx.reentry || <span style={{ color: S.textMuted, fontStyle: "italic" }}>Empty &mdash; click Edit</span>}
          </p>
        ))}
      </section>

      <section style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={S.h3}>Tasks</h3>
          <button onClick={() => setShowAddTask(true)} style={S.textBtn}>+ Add task</button>
        </div>
        {showAddTask && (
          <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.md + 2, marginTop: SP.sm, animation: "cardIn 0.15s ease-out" }}>
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
          const groupColor = S.taskStatus[g.key];
          return (
            <div key={g.key} style={{ marginBottom: SP.lg }}>
              <div onClick={isDoneGroup ? () => setShowDone(!showDone) : undefined}
                style={{ fontSize: 10, fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.08em", color: groupColor, marginBottom: 6, marginTop: SP.md, cursor: isDoneGroup ? "pointer" : "default" }}>
                {isDoneGroup && <span style={{ marginRight: SP.xs }}>{showDone ? "\u25BE" : "\u25B8"}</span>}
                {g.label} &middot; {items.length}
              </div>
              {(!isDoneGroup || showDone) && items.map((task, idx) => (
                <div key={task.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: `${SP.sm}px 0`,
                  borderBottom: `1px solid ${S.border}`,
                  opacity: isDoneGroup ? 0.4 : 1,
                  transition: "opacity 0.15s ease",
                }}>
                  <button onClick={() => {
                    const next = { todo: "in-progress", "in-progress": "done", done: "todo", blocked: "todo" };
                    const newStatus = next[task.status];
                    mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t) }));
                    autoLog(task.text, task.status, newStatus);
                  }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, color: groupColor, flexShrink: 0, marginTop: 1 }}
                    title={`${task.status} \u2014 click to advance`}>
                    {g.icon}
                  </button>
                  {!isDoneGroup && items.length > 1 && (
                    <span style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginTop: -4 }}>
                      <button onClick={() => moveTask(task.id, -1)}
                        style={{ background: "none", border: "none", color: idx === 0 ? S.border : S.textMuted, cursor: idx === 0 ? "default" : "pointer", padding: `6px ${SP.xs}px 2px`, fontSize: 10, lineHeight: 1 }}
                        title="Move up">{"\u25B2"}</button>
                      <button onClick={() => moveTask(task.id, 1)}
                        style={{ background: "none", border: "none", color: idx === items.length - 1 ? S.border : S.textMuted, cursor: idx === items.length - 1 ? "default" : "pointer", padding: `2px ${SP.xs}px 6px`, fontSize: 10, lineHeight: 1 }}
                        title="Move down">{"\u25BC"}</button>
                    </span>
                  )}
                  {editingTaskId === task.id ? (
                    <input autoFocus value={editTaskBuf} onChange={e => setEditTaskBuf(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, text: editTaskBuf } : t) })); setEditingTaskId(null); } if (e.key === "Escape") setEditingTaskId(null); }}
                      onBlur={() => { mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, text: editTaskBuf } : t) })); setEditingTaskId(null); }}
                      style={{ ...S.input, flex: 1, padding: "2px 6px", fontSize: 14 }} />
                  ) : (
                    <span onClick={() => { setEditingTaskId(task.id); setEditTaskBuf(task.text); }}
                      style={{ flex: 1, fontSize: 14, color: isDoneGroup ? S.textMuted : S.text, lineHeight: 1.5, cursor: "text", textDecoration: isDoneGroup ? "line-through" : "none", textDecorationColor: S.textMuted }}>{task.text}</span>
                  )}
                  <select value={task.status} onChange={e => {
                    const newStatus = e.target.value;
                    mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t) }));
                    autoLog(task.text, task.status, newStatus);
                  }}
                    style={{ fontSize: 11, color: S.textMuted, background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "1px 2px", cursor: "pointer", flexShrink: 0 }}>
                    {TASK_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => {
                    const removed = task;
                    doWithUndo(`Deleted "${task.text.slice(0, 30)}"`,
                      () => mut(ctx.id, c => ({ tasks: c.tasks.filter(t => t.id !== task.id) })),
                      () => mut(ctx.id, c => ({ tasks: [...c.tasks, removed] }))
                    );
                  }}
                    style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0, opacity: 0.4, transition: "opacity 0.15s ease, color 0.15s ease" }}
                    onMouseEnter={e => { e.target.style.color = S.danger.fgHover; e.target.style.opacity = 1; }}
                    onMouseLeave={e => { e.target.style.color = S.textMuted; e.target.style.opacity = 0.4; }}>&times;</button>
                </div>
              ))}
            </div>
          );
        })}
        {ctx.tasks.length === 0 && (
          <div style={{ ...S.emptyState, padding: `${SP.xxxl}px ${SP.xl}px` }}>
            <div style={{ fontSize: 24, marginBottom: SP.sm, opacity: 0.5 }}>{"\u2610"}</div>
            <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>No tasks yet — tap + Add task to get started</p>
          </div>
        )}
      </section>

      {focusDone && (
        <section style={{
          background: S.accent + "12", border: `1px solid ${S.accent}33`, borderRadius: 10,
          padding: `${SP.md + 2}px ${SP.lg + 2}px`, marginBottom: SP.md + 2, boxShadow: S.shadow,
          animation: "focusBannerIn 0.3s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: S.accent }}>
              Focus session complete &mdash; what did you accomplish?
            </span>
            <button onClick={dismissFocusDone}
              style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 14, padding: "0 2px" }}>&times;</button>
          </div>
        </section>
      )}

      <section style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm }}>
          <h3 style={S.h3}>Work log</h3>
          <button onClick={() => setExpandLog(!expandLog)} style={S.textBtn}>{expandLog ? "Collapse" : "Show"} ({ctx.log.length})</button>
        </div>
        <div style={{ display: "flex", gap: SP.sm }}>
          <input ref={logInputRef} value={logText} onChange={e => setLogText(e.target.value)} placeholder={focusDone ? "What did you accomplish?" : "What did you do?"}
            onKeyDown={e => { if (e.key === "Enter" && logText.trim()) { mut(ctx.id, c => ({ log: [{ id: uid(), date: now(), text: logText.trim(), dur: logDur }, ...c.log] })); setLogText(""); setFocusDone(false); } }}
            style={{ ...S.input, flex: 1, fontSize: 13, ...(focusDone ? { borderColor: S.accent + "66" } : {}) }} />
          <select value={logDur} onChange={e => setLogDur(e.target.value)} style={{ ...S.sel, fontSize: 12 }}>
            <option value="quick">Quick</option><option value="session">Session</option><option value="deep">Deep</option>
          </select>
          <button onClick={() => { if (logText.trim()) { mut(ctx.id, c => ({ log: [{ id: uid(), date: now(), text: logText.trim(), dur: logDur }, ...c.log] })); setLogText(""); setFocusDone(false); } }} style={S.primaryBtn}>Log</button>
        </div>
        {expandLog && ctx.log.length > 0 && (
          <div style={{ marginTop: SP.md }}>{ctx.log.map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: `7px 0`, borderBottom: `1px solid ${S.border}`, alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: S.textMuted, fontFamily: MONO, minWidth: 78, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{dateOf(e)}{timeOf(e) ? ` ${timeOf(e)}` : ""}</span>
              <span style={{ fontSize: 13, color: e.dur === "auto" ? S.textMuted : S.textMid, flex: 1, fontStyle: e.dur === "auto" ? "italic" : "normal" }}>{e.text}</span>
              {e.dur !== "auto" && <span style={{ ...S.chip, fontSize: 10, padding: "1px 7px", color: S.textMuted, background: S.textMuted + "12", textTransform: "uppercase" }}>{e.dur}</span>}
              <button onClick={() => mut(ctx.id, c => ({ log: c.log.filter(l => l.id !== e.id) }))}
                style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 13, opacity: 0.4, transition: "opacity 0.15s ease" }}
                onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.4}>&times;</button>
            </div>
          ))}</div>
        )}
        {expandLog && ctx.log.length === 0 && (
          <div style={{ ...S.emptyState, padding: `${SP.xxl}px ${SP.xl}px` }}>
            <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>No work logged yet</p>
          </div>
        )}
      </section>

      <div style={{ marginTop: SP.xxxl + 4, paddingTop: SP.lg, borderTop: `1px solid ${S.border}`, textAlign: "center" }}>
        <button onClick={() => {
          const prev = ctx.status;
          doWithUndo(`Archived "${ctx.name}"`,
            () => { mut(ctx.id, () => ({ status: "archived" })); goBack(); },
            () => mut(ctx.id, () => ({ status: prev }))
          );
        }} style={{ ...S.ghostBtn, color: S.textMuted, fontSize: 12 }}>Archive this project</button>
      </div>
    </div></div>
  );
}
