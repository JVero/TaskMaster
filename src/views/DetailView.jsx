// src/views/DetailView.jsx

import { useState, useRef } from "react";
import { DOMAINS, STATUS_META, PRIORITY_META, STATUS_OPTIONS, PRIORITY_OPTIONS, TASK_STATUS } from "../lib/constants";
import { SERIF } from "../lib/styles";
import { uid, today, exportForClaude } from "../lib/helpers";
import SyncPill from "../components/SyncPill";
import UndoToast from "../components/UndoToast";

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
  const taRef = useRef(null);
  const exportRef = useRef(null);

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
    const label = labels[newStatus] || `${oldStatus} → ${newStatus}`;
    mut(ctx.id, c => ({ log: [{ id: uid(), date: today(), text: `${label}: ${taskText}`, dur: "auto" }, ...c.log] }));
  };

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
      <SyncPill syncState={syncState} />
      <UndoToast undoAction={undoAction} />
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: S.bg, margin: "-24px -20px 0", padding: "calc(12px + env(safe-area-inset-top, 0px)) 20px 10px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto" }}>
          <button onClick={goBack} style={{ ...S.back, margin: 0 }}>&larr; Projects</button>
        </div>
      </div>
      <div style={{ marginBottom: 24, marginTop: 16 }}>
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
          {!editReentry && <div style={{ display: "flex", gap: 10 }}>
            {ctx.reentry && <button onClick={() => {
              navigator.clipboard.writeText(ctx.reentry).then(() => { setCopiedReentry(true); setTimeout(() => setCopiedReentry(false), 1500); }, () => {});
            }} style={{ ...S.textBtn, color: copiedReentry ? "#059669" : S.textMuted, fontSize: 12 }}>{copiedReentry ? "Copied" : "Copy"}</button>}
            <button onClick={() => { setEditReentry(true); setReentryDraft(ctx.reentry); setTimeout(() => taRef.current?.focus(), 30); }} style={S.textBtn}>Edit</button>
          </div>}
        </div>
        {editReentry ? (<>
          <textarea ref={taRef} value={reentryDraft} onChange={e => {
            setReentryDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }} onFocus={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            style={{ ...S.ta, overflow: "hidden" }} />
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
              {(!isDoneGroup || showDone) && items.map((task, idx) => (
                <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${S.border}`, opacity: isDoneGroup ? 0.4 : 1 }}>
                  <button onClick={() => {
                    const next = { todo: "in-progress", "in-progress": "done", done: "todo", blocked: "todo" };
                    const newStatus = next[task.status];
                    mut(ctx.id, c => ({ tasks: c.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t) }));
                    autoLog(task.text, task.status, newStatus);
                  }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, color: g.color, flexShrink: 0, marginTop: 1 }}
                    title={`${task.status} \u2014 click to advance`}>
                    {g.icon}
                  </button>
                  {!isDoneGroup && items.length > 1 && (
                    <span style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginTop: -4 }}>
                      <button onClick={() => moveTask(task.id, -1)}
                        style={{ background: "none", border: "none", color: idx === 0 ? S.border : S.textMuted, cursor: idx === 0 ? "default" : "pointer", padding: "6px 4px 2px", fontSize: 10, lineHeight: 1 }}
                        title="Move up">{"\u25B2"}</button>
                      <button onClick={() => moveTask(task.id, 1)}
                        style={{ background: "none", border: "none", color: idx === items.length - 1 ? S.border : S.textMuted, cursor: idx === items.length - 1 ? "default" : "pointer", padding: "2px 4px 6px", fontSize: 10, lineHeight: 1 }}
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
              <span style={{ fontSize: 13, color: e.dur === "auto" ? "#A8A29E" : "#57534E", flex: 1, fontStyle: e.dur === "auto" ? "italic" : "normal" }}>{e.text}</span>
              {e.dur !== "auto" && <span style={{ fontSize: 11, color: "#D6D3D1", flexShrink: 0, textTransform: "uppercase" }}>{e.dur}</span>}
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
