// src/components/SyncPill.jsx

export default function SyncPill({ syncState }) {
  if (syncState === "idle") return null;
  const configs = {
    saving: { bg: "#FDF6E3", color: "#8B6914", border: "#F0DFA0", label: "Saving..." },
    saved: { bg: "#EFF8F0", color: "#2D6A3E", border: "#C2E5C8", label: "Synced" },
    offline: { bg: "#FDF0EE", color: "#8B2E1A", border: "#F0C4BC", label: "Offline" },
  };
  const c = configs[syncState] || configs.offline;
  return (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 999,
      fontSize: 11, fontWeight: 550, padding: "3px 12px", borderRadius: 10,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
      opacity: syncState === "saved" ? 0.7 : 1,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      letterSpacing: "0.01em",
      animation: "pillFadeIn 0.2s ease-out",
    }}>
      {c.label}
    </div>
  );
}
