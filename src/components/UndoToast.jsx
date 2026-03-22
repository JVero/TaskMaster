// src/components/UndoToast.jsx

export default function UndoToast({ undoAction, S }) {
  if (!undoAction) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      background: "#2A2420", color: "#E8E4DD", padding: "10px 18px", borderRadius: 12,
      fontSize: 13, fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 6px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15)",
      animation: "toastIn 0.2s ease-out",
      border: "1px solid #3D3428",
    }}>
      <span>{undoAction.label}</span>
      <button onClick={undoAction.undo} style={{
        background: "#B8533A", color: "#fff", border: "none", borderRadius: 7,
        padding: "4px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "opacity 0.15s ease",
      }}>Undo</button>
    </div>
  );
}
