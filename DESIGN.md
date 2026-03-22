# Design System — TaskMaster

## Rating Scale Reference

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Raw HTML | No styling at all |
| 2 | "It works" | Basic spacing, readable but clearly a prototype |
| 3 | Bootstrap-default | Generic framework look, nothing custom |
| 4 | Competent | Clean layout, decent spacing, consistent colors, but nothing memorable |
| 5 | Polished | Custom palette, typography, elevation/depth, intentional spacing, micro-interactions |
| 6 | Refined | Every detail considered, elegant transitions, personality in the design |
| 7 | Brand-quality | Cohesive system, could ship as a product |

## What moved us from 4 → 5.5

### 1. Warm analog palette (biggest single impact)
Replaced neutral stone grays and clinical white with cream paper tones.

```
Light bg:   #FAF9F6 → #F7F5F0  (warmer cream, aged paper)
Cards:      #FFFFFF → #FFFDF9  (warm ivory, not clinical white)
Dark bg:    #1C1917 → #1A1714  (leather-brown, less gray)
Accent:     #C15F3C → #B8533A  (deeper, more ink-like)
```

This is the fastest design win — swapping 4-5 hex values transforms the entire feel. Takes ~5 minutes.

### 2. Card elevation instead of flat dividers
Every project item became its own card with subtle warm shadows.

```js
shadow:   "0 1px 3px rgba(140,120,100,0.08), 0 1px 2px rgba(140,120,100,0.06)"
shadowLg: "0 4px 12px rgba(140,120,100,0.1), 0 2px 4px rgba(140,120,100,0.06)"
```

Key detail: the shadow uses warm `rgba(140,120,100)` not neutral `rgba(0,0,0)`. Cards hover-lift from `shadow` → `shadowLg`. Takes ~15 minutes.

### 3. Tag pills instead of bare colored text
Domain labels and priority badges became tinted pill chips:

```js
chip: {
  display: "inline-flex", alignItems: "center",
  fontSize: 11, fontWeight: 550, letterSpacing: "0.01em",
  padding: "2px 9px", borderRadius: 10, lineHeight: "18px",
}
// Usage: color from domain, background = color + "12" (very transparent tint)
```

This is high visual impact for minimal code. Takes ~10 minutes.

### 4. Hero "pick up where you left off" card
A single differentiated card at the top with a bookmark-ribbon left border:

```js
heroCard: {
  background: dark ? "#2A2218" : "#FDF8F0",     // slightly warmer than regular cards
  border: `1px solid ${dark ? "#3D3328" : "#EDE4D4"}`,
  borderLeft: `3px solid ${accent}`,             // the "ribbon bookmark"
  boxShadow: shadow,
}
```

Creates visual hierarchy instantly. The accent left-border is the key detail. Takes ~10 minutes.

### 5. Micro-animations (CSS keyframes)
Six small animations that make interactions feel alive:

```css
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

Plus `transition: "box-shadow 0.15s ease"` on every interactive element. Takes ~10 minutes.

### 6. Typography hierarchy
Newsreader serif for headings, system sans for body. Three clear tiers:

- **h1**: 28px, weight 700, tracking -0.02em (page titles)
- **h2**: 22px, weight 700, tracking -0.01em (project names)
- **h3**: 11px, weight 600, uppercase, tracking 0.08em (section labels)

Already had Newsreader loaded — just needed consistent application. Takes ~5 minutes.

## Speed priority if applying to another subdomain

If you have ~1 hour, do them in this order (highest impact first):

| Priority | Change | Time | Impact |
|----------|--------|------|--------|
| 1 | Swap bg/card/accent hex values | 5 min | Transforms entire mood |
| 2 | Add card shadows + hover lift | 15 min | Adds depth and interactivity |
| 3 | Tag pills (chip style) | 10 min | Metadata becomes scannable |
| 4 | Typography hierarchy (serif headings) | 5 min | Establishes information structure |
| 5 | Hero/featured card with accent border | 10 min | Creates visual priority |
| 6 | CSS keyframe animations | 10 min | Interactions feel responsive |

Total: ~55 minutes to go from "competent" (4) to "polished" (5.5).

## What's still needed to reach 6+ (Refined)

These are the gaps that separate "polished" from "every detail considered":

- **Page transitions**: Directional slide between list → detail → timeline views
- **Drag-and-drop feedback**: Ghost card preview, drop slot indicator, smooth reorder animation
- **Empty states**: Illustration or guidance when a project has no tasks/logs
- **Dark mode token consistency**: Eliminate scattered hardcoded hex values; pull everything from the token system
- **Keyboard focus rings**: Visible `:focus-visible` outlines on buttons and interactive elements
- **Loading skeletons**: Shimmer placeholders instead of plain "Loading..." text
- **Timeline refinement**: Replace dot indicators with something more intentional
- **Scroll-linked effects**: Sticky header shadow that appears on scroll

Each of these is individually small (~15-30 min) but collectively they're what makes a design feel "considered" rather than "styled."
