// src/components/UndoToast.jsx

export default function UndoToast({ undoAction, S }) {
  if (!undoAction) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      background: S.toast.bg, color: S.toast.text, padding: "10px 18px", borderRadius: 12,
      fontSize: 13, fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 14,
      boxShadow: S.shadowLg,
      animation: "toastIn 0.2s ease-out",
      border: `1px solid ${S.toast.border}`,
    }}>
      <span>{undoAction.label}</span>
      <button onClick={undoAction.undo} style={{
        background: S.accent, color: "#fff", border: "none", borderRadius: 7,
        padding: "4px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "opacity 0.15s ease",
      }}>Undo</button>
    </div>
  );
}
