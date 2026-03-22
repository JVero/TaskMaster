// src/lib/styles.js

export const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
export const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
export const ACCENT = { light: "#B8533A", dark: "#D4795E" };

// Spacing scale (px) — use these instead of arbitrary numbers
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };

export function makeStyles(dark, maxW = 560) {
  const accent = dark ? ACCENT.dark : ACCENT.light;
  const bg = dark ? "#1A1714" : "#F7F5F0";
  const cardBg = dark ? "#252019" : "#FFFDF9";
  const cardHover = dark ? "#2C261E" : "#FDFBF6";
  const border = dark ? "#352F28" : "#E8E3DB";
  const borderMed = dark ? "#4A4238" : "#D4CFC6";
  const text = dark ? "#E8E4DD" : "#1C1917";
  const textMid = dark ? "#A8A19A" : "#57534E";
  const textMuted = dark ? "#78716A" : "#A09A92";
  const inputBg = dark ? "#211D17" : "#FFFEFA";
  const shadow = dark
    ? "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)"
    : "0 1px 3px rgba(140,120,100,0.08), 0 1px 2px rgba(140,120,100,0.06)";
  const shadowLg = dark
    ? "0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)"
    : "0 4px 12px rgba(140,120,100,0.1), 0 2px 4px rgba(140,120,100,0.06)";

  // Semantic color tokens — banners, alerts, feedback
  const warning = {
    bg: dark ? "#2E2510" : "#FEF3C7",
    text: dark ? "#FBBF24" : "#92400E",
    border: dark ? "#5C4A1A" : "#FDE68A",
  };
  const success = {
    bg: dark ? "#1A2E1A" : "#F0FDF4",
    text: dark ? "#6EE7B7" : "#166534",
    border: dark ? "#2D4A2D" : "#BBF7D0",
  };
  const danger = {
    fg: dark ? "#F87171" : "#DC2626",
    fgHover: dark ? "#FCA5A5" : "#EF4444",
  };
  const overlay = dark ? "rgba(10,8,6,0.5)" : "rgba(20,16,12,0.35)";

  // Toast (always dark for contrast, but slightly adapts)
  const toast = {
    bg: dark ? "#302A22" : "#2A2420",
    text: dark ? "#E8E4DD" : "#F5F2EC",
    border: dark ? "#4A4238" : "#3D3428",
  };

  // Kbd styling
  const kbd = {
    bg: dark ? "#302A22" : "#F0EDE6",
    border: border,
    text: textMid,
  };

  // SyncPill (dark-mode aware)
  const syncPill = {
    saving: { bg: dark ? "#2E2510" : "#FDF6E3", text: dark ? "#FBBF24" : "#8B6914", border: dark ? "#5C4A1A" : "#F0DFA0" },
    saved: { bg: dark ? "#1A2E1A" : "#EFF8F0", text: dark ? "#6EE7B7" : "#2D6A3E", border: dark ? "#2D4A2D" : "#C2E5C8" },
    offline: { bg: dark ? "#2E1A14" : "#FDF0EE", text: dark ? "#F87171" : "#8B2E1A", border: dark ? "#5C2A1A" : "#F0C4BC" },
  };

  // Task status colors
  const taskStatus = {
    "in-progress": dark ? "#60A5FA" : "#2563EB",
    todo: textMuted,
    blocked: danger.fg,
    done: dark ? "#34D399" : "#059669",
  };

  return {
    shell: {
      minHeight: "100vh", background: bg, fontFamily: SANS,
      padding: `calc(${SP.xxl}px + env(safe-area-inset-top, 0px)) calc(${SP.xl}px + env(safe-area-inset-right, 0px)) calc(${SP.xxl}px + env(safe-area-inset-bottom, 0px)) calc(${SP.xl}px + env(safe-area-inset-left, 0px))`,
      transition: "opacity 0.12s ease, background 0.3s ease",
    },
    wrap: { maxWidth: maxW, margin: "0 auto", transition: "max-width 0.3s ease" },
    section: {
      background: cardBg, borderRadius: 10, padding: `${SP.lg}px ${SP.lg + 2}px`, marginBottom: SP.md + 2,
      border: `1px solid ${border}`, boxShadow: shadow,
    },
    h1: { margin: 0, fontSize: 28, fontWeight: 700, color: text, letterSpacing: "-0.02em", fontFamily: SERIF },
    h2: { margin: 0, fontSize: 22, fontWeight: 700, color: text, fontFamily: SERIF, letterSpacing: "-0.01em" },
    h3: { margin: 0, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted },
    dtag: { fontSize: 11, fontWeight: 500, padding: `2px ${SP.sm}px`, borderRadius: 4, border: "1px solid" },
    chip: {
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 550, letterSpacing: "0.01em",
      padding: `2px ${SP.sm + 1}px`, borderRadius: 10, lineHeight: "18px",
    },
    sel: {
      fontSize: 12, fontWeight: 500, padding: `${SP.xs}px ${SP.sm}px`, borderRadius: SP.sm,
      background: dark ? "#302A22" : "#F5F2EC", border: `1px solid ${border}`, color: textMid, cursor: "pointer",
    },
    input: {
      background: inputBg, border: `1px solid ${border}`, borderRadius: SP.sm, color: text,
      fontSize: 14, padding: `${SP.sm}px ${SP.md}px`, fontFamily: "inherit", outline: "none", flex: 1,
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    ta: {
      width: "100%", minHeight: 80, background: inputBg, border: `1px solid ${border}`, borderRadius: SP.sm,
      color: text, fontSize: 14, padding: `10px ${SP.md}px`, resize: "vertical", fontFamily: "inherit",
      lineHeight: 1.6, boxSizing: "border-box", outline: "none",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    primaryBtn: {
      background: accent, color: "#fff", border: "none", fontWeight: 600, fontSize: 13,
      padding: `7px ${SP.lg + 2}px`, borderRadius: SP.sm, cursor: "pointer",
      transition: "opacity 0.15s ease, transform 0.1s ease",
    },
    ghostBtn: {
      background: "none", border: `1px solid ${border}`, color: textMid,
      fontSize: 13, padding: `6px ${SP.md + 2}px`, borderRadius: SP.sm, cursor: "pointer",
      transition: "border-color 0.15s ease, color 0.15s ease",
    },
    textBtn: { background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 },
    back: { background: "none", border: "none", color: textMid, cursor: "pointer", fontSize: 14, padding: `${SP.xs}px 0`, marginBottom: SP.lg },
    // Sticky header (gains shadow when scrolled via JS)
    stickyHeader: {
      position: "sticky", top: 0, zIndex: 100, background: bg,
      margin: `-${SP.xxl}px -${SP.xl}px ${SP.xl}px`,
      padding: `calc(${SP.lg}px + env(safe-area-inset-top, 0px)) ${SP.xl}px ${SP.md + 2}px`,
      borderBottom: `1px solid ${border}`,
      transition: "box-shadow 0.2s ease",
    },
    stickyHeaderShadow: {
      boxShadow: dark
        ? "0 4px 16px rgba(0,0,0,0.3)"
        : "0 4px 16px rgba(140,120,100,0.08)",
    },
    // project card in list view
    card: {
      padding: `${SP.md + 2}px ${SP.lg}px`, marginBottom: SP.sm, borderRadius: 10,
      background: cardBg, border: `1px solid ${border}`, boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.15s ease",
    },
    cardHoverStyle: { boxShadow: shadowLg, borderColor: borderMed },
    // the "pick up where you left off" hero card
    heroCard: {
      padding: `${SP.lg}px ${SP.lg + 2}px`, marginBottom: SP.lg, borderRadius: 10,
      background: dark ? "#2A2218" : "#FDF8F0",
      border: `1px solid ${dark ? "#3D3328" : "#EDE4D4"}`,
      borderLeft: `3px solid ${accent}`,
      boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.15s ease, transform 0.15s ease",
    },
    // Empty state
    emptyState: {
      textAlign: "center", padding: `${SP.huge}px ${SP.xl}px`,
      color: textMuted, fontSize: 14, lineHeight: 1.6,
    },
    // Exported primitives
    accent, text, textMid, textMuted, cardBg, cardHover, border, borderMed,
    bg, shadow, shadowLg, inputBg,
    // Semantic tokens
    warning, success, danger, overlay, toast, kbd, syncPill, taskStatus,
  };
}
