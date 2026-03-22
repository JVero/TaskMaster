# Design System — TaskMaster

## Rating Scale (0-100, per category)

| Category | Original | After v1 | After v2 | Notes |
|---|---|---|---|---|
| **Visual Hierarchy** | 82 | 86 | 89 | Scroll-linked header shadow, staggered card entrance animations, empty state treatments |
| **Color & Theming** | 78 | 84 | 90 | Full semantic token system: warning, success, danger, overlay, toast, kbd, syncPill, taskStatus |
| **Typography** | 75 | 78 | 84 | Consistent MONO stack, tabular-nums on all numeric displays, 3-tier heading scale |
| **Information Density** | 85 | 85 | 88 | Mini progress bars on project cards, task count chips |
| **Consistency** | 72 | 78 | 91 | Zero hardcoded hex in components — everything pulls from makeStyles() tokens |
| **Light/Dark Mode Parity** | 80 | 81 | 90 | SyncPill, UndoToast, QuickLogModal, export section, banners all dark-mode aware |
| **Spacing & Layout** | 70 | 74 | 85 | SP spacing scale (xs=4 through huge=48), consistent use across all views |
| **Polish & Delight** | 68 | 76 | 87 | Staggered cardIn animations, scroll header shadow, empty states with guidance, hover lift on all cards, focus-visible keyboard rings |

**Composite: 76.3 → 80.3 → 88.0**

## Token architecture

All colors flow from `makeStyles(dark, maxW)` in `src/lib/styles.js`:

```
Primitives:     accent, text, textMid, textMuted, bg, cardBg, border, borderMed, inputBg
Shadows:        shadow, shadowLg
Semantic:       warning.{bg,text,border}, success.{bg,text,border}, danger.{fg,fgHover}
Component:      overlay, toast.{bg,text,border}, kbd.{bg,border,text}
                syncPill.{saving,saved,offline}.{bg,text,border}
                taskStatus.{"in-progress",todo,blocked,done}
Spacing:        SP.{xs,sm,md,lg,xl,xxl,xxxl,huge} = {4,8,12,16,20,24,32,48}
```

Components receive `S` (the styles object) as a prop and never reference raw hex values.

## What moved each category

### Consistency (72 → 91): the biggest win
- Extracted every hardcoded hex into semantic tokens
- Warning banners use `S.warning.*`, demo banners use `S.success.*`
- Delete hover uses `S.danger.fgHover`, not `"#ef4444"`
- Kbd shortcuts use `S.kbd.*`
- Toast, sync pill, modal overlay all use tokens
- Task group colors come from `S.taskStatus[status]`

### Light/Dark Mode Parity (80 → 90)
- SyncPill: was hardcoded light-only colors → now uses `S.syncPill[state]`
- UndoToast: was always-dark `#2A2420` → now uses `S.toast.*` which adapts
- QuickLogModal overlay: was `rgba(20,16,12,0.4)` → now `S.overlay`
- Export section: was hardcoded green → now `S.success.*`
- "Copied" indicator: was `#059669` → now `S.taskStatus.done`

### Spacing & Layout (70 → 85)
- Introduced `SP` scale: `{xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48}`
- All margins, padding, gaps reference the scale
- Consistent `borderRadius: SP.sm (8)` for inputs, `10` for cards/sections

### Polish & Delight (68 → 87)
- Cards stagger in with `cardIn` animation + per-card delay (`idx * 30ms`)
- Scroll-linked sticky header gains shadow when `scrollY > 8`
- All cards hover-lift with `translateY(-1px)` + `shadowLg`
- Empty states with emoji + guidance text + gentle pulse animation
- `focus-visible` outlines for keyboard navigation (CSS, not inline)
- New project form, add task form animate in with `cardIn`

### Typography (75 → 84)
- Extracted `MONO` constant: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- `fontVariantNumeric: "tabular-nums"` on all numeric displays (staleness, counts, timer, dates)
- Consistent heading style via `S.h1` token (was inline-only before)

## Speed priority for applying to another subdomain

| Priority | Change | Time | Impact |
|----------|--------|------|--------|
| 1 | Copy `styles.js` token system | 5 min | Gets you all colors, spacing, shadows for free |
| 2 | Wire `S` prop through components | 15 min | Eliminates all hardcoded hex |
| 3 | Add CSS keyframes from `index.html` | 5 min | Entrance animations, hover lifts |
| 4 | Add scroll-linked header shadow | 10 min | Small useEffect + conditional style |
| 5 | Add empty states | 10 min | `S.emptyState` + emoji + guidance copy |
| 6 | Add `focus-visible` CSS | 2 min | Copy 6 lines from index.html |

Total: ~47 minutes to match this subdomain's design level.
