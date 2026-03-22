// src/components/SyncPill.jsx

export default function SyncPill({ syncState, S }) {
  if (syncState === "idle" || !S) return null;
  const configs = S.syncPill;
  const c = configs[syncState] || configs.offline;
  return (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 999,
      fontSize: 11, fontWeight: 550, padding: "3px 12px", borderRadius: 10,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
      opacity: syncState === "saved" ? 0.7 : 1,
      boxShadow: S.shadow,
      letterSpacing: "0.01em",
      animation: "pillFadeIn 0.2s ease-out",
    }}>
      {syncState === "saving" ? "Saving..." : syncState === "saved" ? "Synced" : "Offline"}
    </div>
  );
}
