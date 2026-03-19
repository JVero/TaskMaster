// src/lib/styles.js

export const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
export const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
export const ACCENT = { light: "#C15F3C", dark: "#D97756" };

export function makeStyles(dark, maxW = 560) {
  const accent = dark ? ACCENT.dark : ACCENT.light;
  const bg = dark ? "#1C1917" : "#FAF9F6";
  const card = dark ? "#292524" : "#FFFFFF";
  const border = dark ? "#3D3936" : "#E8E4E0";
  const borderMed = dark ? "#57534E" : "#D6D3D1";
  const text = dark ? "#E7E5E4" : "#1C1917";
  const textMid = dark ? "#A8A29E" : "#57534E";
  const textMuted = dark ? "#78716C" : "#A8A29E";
  const inputBg = dark ? "#292524" : "#FFFFFF";
  return {
    shell: { minHeight: "100vh", background: bg, fontFamily: SANS, padding: "calc(24px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px))", transition: "opacity 0.12s ease, background 0.3s ease" },
    wrap: { maxWidth: maxW, margin: "0 auto", transition: "max-width 0.3s ease" },
    section: { background: card, borderRadius: 8, padding: "16px 18px", marginBottom: 14, border: `1px solid ${border}` },
    h2: { margin: 0, fontSize: 22, fontWeight: 700, color: text, fontFamily: SERIF, letterSpacing: "-0.01em" },
    h3: { margin: 0, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted },
    dtag: { fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, border: "1px solid" },
    sel: { fontSize: 12, fontWeight: 500, padding: "4px 8px", borderRadius: 6, background: dark ? "#44403C" : "#FAF9F6", border: `1px solid ${borderMed}`, color: textMid, cursor: "pointer" },
    input: { background: inputBg, border: `1px solid ${borderMed}`, borderRadius: 6, color: text, fontSize: 14, padding: "8px 10px", fontFamily: "inherit", outline: "none", flex: 1 },
    ta: { width: "100%", minHeight: 80, background: inputBg, border: `1px solid ${borderMed}`, borderRadius: 6, color: text, fontSize: 14, padding: 10, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", outline: "none" },
    primaryBtn: { background: accent, color: "#fff", border: "none", fontWeight: 600, fontSize: 13, padding: "7px 16px", borderRadius: 6, cursor: "pointer" },
    ghostBtn: { background: "none", border: `1px solid ${borderMed}`, color: textMid, fontSize: 13, padding: "6px 14px", borderRadius: 6, cursor: "pointer" },
    textBtn: { background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 },
    back: { background: "none", border: "none", color: textMid, cursor: "pointer", fontSize: 14, padding: "4px 0", marginBottom: 16 },
    accent, text, textMid, textMuted, card, border, borderMed, bg,
  };
}
