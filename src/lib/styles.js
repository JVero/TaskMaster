// src/lib/styles.js

export const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
export const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
export const ACCENT = { light: "#9C4430", dark: "#C4705A" };

// Spacing scale (px) — generous whitespace, editorial feel
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36, huge: 56 };

export function makeStyles(dark, maxW = 560) {
  const accent = dark ? ACCENT.dark : ACCENT.light;
  const bg = dark ? "#191715" : "#F0EDE8";
  const cardBg = dark ? "#211F1C" : "#FDFCFA";
  const cardHover = dark ? "#282522" : "#FDFBF8";
  const border = dark ? "#2E2B27" : "#EBE8E3";
  const borderMed = dark ? "#3D3A35" : "#DDD9D2";
  const text = dark ? "#E5E2DC" : "#1A1816";
  const textMid = dark ? "#9E9890" : "#5C5852";
  const textMuted = dark ? "#706B64" : "#A8A39C";
  const inputBg = dark ? "#1E1C19" : "#FDFCFA";
  // Whisper-quiet shadows — felt, not seen
  const shadow = dark
    ? "0 1px 2px rgba(0,0,0,0.15)"
    : "0 1px 2px rgba(120,110,100,0.04)";
  const shadowLg = dark
    ? "0 2px 8px rgba(0,0,0,0.2)"
    : "0 2px 8px rgba(120,110,100,0.06)";

  // Semantic color tokens — muted, editorial palette
  const warning = {
    bg: dark ? "#2A2210" : "#FAF5E8",
    text: dark ? "#D4A830" : "#7A5C10",
    border: dark ? "#3D3418" : "#EDE4C8",
  };
  const success = {
    bg: dark ? "#1A2818" : "#F4F9F4",
    text: dark ? "#7CC8A0" : "#2D5A3E",
    border: dark ? "#2A3A28" : "#D8E8D8",
  };
  const danger = {
    fg: dark ? "#D4756A" : "#A04030",
    fgHover: dark ? "#E0908A" : "#C05040",
  };
  const overlay = dark ? "rgba(10,8,6,0.45)" : "rgba(20,18,14,0.25)";

  // Toast
  const toast = {
    bg: dark ? "#2A2620" : "#282420",
    text: dark ? "#E5E2DC" : "#F0EDE6",
    border: dark ? "#3D3A35" : "#3A3630",
  };

  // Kbd styling
  const kbd = {
    bg: dark ? "#2A2620" : "#F0EDE8",
    border: border,
    text: textMuted,
  };

  // SyncPill — very subtle
  const syncPill = {
    saving: { bg: dark ? "#2A2210" : "#FAF6EC", text: dark ? "#D4A830" : "#7A5C10", border: dark ? "#3D3418" : "#E8E0C8" },
    saved: { bg: dark ? "#1A2818" : "#F2F7F2", text: dark ? "#7CC8A0" : "#3A6A4A", border: dark ? "#2A3A28" : "#D4E4D4" },
    offline: { bg: dark ? "#2A1A14" : "#FAF0EE", text: dark ? "#D4756A" : "#7A3020", border: dark ? "#3D2A20" : "#E8D0C8" },
  };

  // Task status colors — reserved, purposeful
  const taskStatus = {
    "in-progress": dark ? "#7EB0D8" : "#3B6F9A",
    todo: textMuted,
    blocked: danger.fg,
    done: dark ? "#6EB89A" : "#3A7A5A",
  };

  return {
    shell: {
      minHeight: "100vh", background: bg, fontFamily: SANS,
      padding: `calc(${SP.xxl}px + env(safe-area-inset-top, 0px)) calc(${SP.xl}px + env(safe-area-inset-right, 0px)) calc(${SP.xxl}px + env(safe-area-inset-bottom, 0px)) calc(${SP.xl}px + env(safe-area-inset-left, 0px))`,
      transition: "opacity 0.12s ease, background 0.3s ease",
    },
    wrap: { maxWidth: maxW, margin: "0 auto", transition: "max-width 0.3s ease" },
    section: {
      background: cardBg, borderRadius: 8, padding: `${SP.xl}px ${SP.xl}px`, marginBottom: SP.lg,
      border: `1px solid ${border}`, boxShadow: shadow,
    },
    h1: { margin: 0, fontSize: 30, fontWeight: 400, color: text, letterSpacing: "-0.025em", fontFamily: SERIF },
    h2: { margin: 0, fontSize: 24, fontWeight: 400, color: text, fontFamily: SERIF, letterSpacing: "-0.015em" },
    h3: { margin: 0, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: textMuted },
    dtag: { fontSize: 11, fontWeight: 500, padding: `2px ${SP.sm}px`, borderRadius: 4, border: "1px solid" },
    chip: {
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 450, letterSpacing: "0.02em",
      padding: `2px ${SP.sm}px`, borderRadius: 3, lineHeight: "18px",
    },
    sel: {
      fontSize: 12, fontWeight: 450, padding: `${SP.xs}px ${SP.sm}px`, borderRadius: 4,
      background: dark ? "#252220" : "#F5F3F0", border: `1px solid ${border}`, color: textMid, cursor: "pointer",
    },
    input: {
      background: inputBg, border: `1px solid ${border}`, borderRadius: 4, color: text,
      fontSize: 14, padding: `${SP.sm}px ${SP.md}px`, fontFamily: "inherit", outline: "none", flex: 1,
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    ta: {
      width: "100%", minHeight: 80, background: inputBg, border: `1px solid ${border}`, borderRadius: 4,
      color: text, fontSize: 14, padding: `10px ${SP.md}px`, resize: "vertical", fontFamily: "inherit",
      lineHeight: 1.7, boxSizing: "border-box", outline: "none",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    primaryBtn: {
      background: accent, color: "#fff", border: "none", fontWeight: 500, fontSize: 13,
      padding: `7px ${SP.lg + 2}px`, borderRadius: 4, cursor: "pointer",
      transition: "opacity 0.15s ease",
    },
    ghostBtn: {
      background: "none", border: `1px solid ${border}`, color: textMid,
      fontSize: 13, padding: `6px ${SP.md + 2}px`, borderRadius: 4, cursor: "pointer",
      transition: "border-color 0.15s ease, color 0.15s ease",
    },
    textBtn: { background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 },
    back: { background: "none", border: "none", color: textMid, cursor: "pointer", fontSize: 14, padding: `${SP.xs}px 0`, marginBottom: SP.lg },
    // Sticky header — clean rule, no heavy shadow
    stickyHeader: {
      position: "sticky", top: 0, zIndex: 100, background: bg,
      margin: `-${SP.xxl}px -${SP.xl}px ${SP.xxl}px`,
      padding: `calc(${SP.lg}px + env(safe-area-inset-top, 0px)) ${SP.xl}px ${SP.md + 2}px`,
      borderBottom: `1px solid ${border}`,
      transition: "box-shadow 0.2s ease",
    },
    stickyHeaderShadow: {
      boxShadow: dark
        ? "0 2px 8px rgba(0,0,0,0.15)"
        : "0 2px 8px rgba(120,110,100,0.04)",
    },
    // project card in list view — quiet elevation
    card: {
      padding: `${SP.lg}px ${SP.xl}px`, marginBottom: SP.md, borderRadius: 8,
      background: cardBg, border: `1px solid ${border}`, boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.15s ease",
    },
    cardHoverStyle: { boxShadow: shadowLg, borderColor: borderMed },
    // the "pick up where you left off" hero card — subtle left accent
    heroCard: {
      padding: `${SP.xl}px ${SP.xl}px`, marginBottom: SP.xl, borderRadius: 8,
      background: cardBg,
      border: `1px solid ${border}`,
      borderLeft: `2px solid ${accent}`,
      boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.2s ease",
    },
    // Empty state
    emptyState: {
      textAlign: "center", padding: `${SP.huge}px ${SP.xl}px`,
      color: textMuted, fontSize: 14, lineHeight: 1.7,
    },
    // Exported primitives
    accent, text, textMid, textMuted, cardBg, cardHover, border, borderMed,
    bg, shadow, shadowLg, inputBg,
    // Semantic tokens
    warning, success, danger, overlay, toast, kbd, syncPill, taskStatus,
  };
}
