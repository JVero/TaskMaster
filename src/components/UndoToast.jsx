// src/components/UndoToast.jsx

export default function UndoToast({ undoAction }) {
  if (!undoAction) return null;
  return (
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
}
