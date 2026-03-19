// src/components/SyncPill.jsx

export default function SyncPill({ syncState }) {
  if (syncState === "idle") return null;
  return (
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
}
