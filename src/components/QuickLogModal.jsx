// src/components/QuickLogModal.jsx

import { uid, today } from "../lib/helpers";
import { SERIF } from "../lib/styles";

export default function QuickLogModal({ quickLog, setQuickLog, live, mut, S }) {
  if (!quickLog) return null;
  const submit = () => {
    if (quickLog.text.trim() && quickLog.ctxId) {
      mut(quickLog.ctxId, c => ({ log: [{ id: uid(), date: today(), text: quickLog.text.trim(), dur: quickLog.dur }, ...c.log] }));
      setQuickLog(null);
    }
  };
  return (
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
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          style={{ ...S.input, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={quickLog.dur} onChange={e => setQuickLog({ ...quickLog, dur: e.target.value })} style={{ ...S.sel, fontSize: 12 }}>
            <option value="quick">Quick</option><option value="session">Session</option><option value="deep">Deep</option>
          </select>
          <button onClick={submit} style={S.primaryBtn}>Log</button>
          <button onClick={() => setQuickLog(null)} style={S.ghostBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
