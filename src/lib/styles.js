// src/lib/styles.js

export const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
export const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
export const ACCENT = { light: "#B8533A", dark: "#D4795E" };

export function makeStyles(dark, maxW = 560) {
  const accent = dark ? ACCENT.dark : ACCENT.light;
  const bg = dark ? "#1A1714" : "#F7F5F0";
  const card = dark ? "#252019" : "#FFFDF9";
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
  return {
    shell: {
      minHeight: "100vh", background: bg, fontFamily: SANS,
      padding: "calc(24px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px))",
      transition: "opacity 0.12s ease, background 0.3s ease",
    },
    wrap: { maxWidth: maxW, margin: "0 auto", transition: "max-width 0.3s ease" },
    section: {
      background: card, borderRadius: 10, padding: "16px 18px", marginBottom: 14,
      border: `1px solid ${border}`, boxShadow: shadow,
    },
    h2: { margin: 0, fontSize: 22, fontWeight: 700, color: text, fontFamily: SERIF, letterSpacing: "-0.01em" },
    h3: { margin: 0, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted },
    dtag: { fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, border: "1px solid" },
    chip: {
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 550, letterSpacing: "0.01em",
      padding: "2px 9px", borderRadius: 10, lineHeight: "18px",
    },
    sel: {
      fontSize: 12, fontWeight: 500, padding: "4px 8px", borderRadius: 8,
      background: dark ? "#302A22" : "#F5F2EC", border: `1px solid ${border}`, color: textMid, cursor: "pointer",
    },
    input: {
      background: inputBg, border: `1px solid ${border}`, borderRadius: 8, color: text,
      fontSize: 14, padding: "8px 12px", fontFamily: "inherit", outline: "none", flex: 1,
      transition: "border-color 0.15s ease",
    },
    ta: {
      width: "100%", minHeight: 80, background: inputBg, border: `1px solid ${border}`, borderRadius: 8,
      color: text, fontSize: 14, padding: "10px 12px", resize: "vertical", fontFamily: "inherit",
      lineHeight: 1.6, boxSizing: "border-box", outline: "none",
      transition: "border-color 0.15s ease",
    },
    primaryBtn: {
      background: accent, color: "#fff", border: "none", fontWeight: 600, fontSize: 13,
      padding: "7px 18px", borderRadius: 8, cursor: "pointer",
      transition: "opacity 0.15s ease",
    },
    ghostBtn: {
      background: "none", border: `1px solid ${border}`, color: textMid,
      fontSize: 13, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
      transition: "border-color 0.15s ease, color 0.15s ease",
    },
    textBtn: { background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 },
    back: { background: "none", border: "none", color: textMid, cursor: "pointer", fontSize: 14, padding: "4px 0", marginBottom: 16 },
    // project card in list view
    card: {
      padding: "14px 16px", marginBottom: 8, borderRadius: 10,
      background: card, border: `1px solid ${border}`, boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
    },
    cardHover: { boxShadow: shadowLg, borderColor: borderMed },
    // the "pick up where you left off" hero card
    heroCard: {
      padding: "16px 18px", marginBottom: 16, borderRadius: 10,
      background: dark ? "#2A2218" : "#FDF8F0",
      border: `1px solid ${dark ? "#3D3328" : "#EDE4D4"}`,
      borderLeft: `3px solid ${accent}`,
      boxShadow: shadow,
      cursor: "pointer",
      transition: "box-shadow 0.15s ease",
    },
    accent, text, textMid, textMuted, card, cardHover: cardHover, border, borderMed, bg, shadow, shadowLg, inputBg,
  };
}
