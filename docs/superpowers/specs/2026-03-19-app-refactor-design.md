# App.jsx Refactor — Component Extraction

**Date:** 2026-03-19
**Goal:** Split the monolithic `src/App.jsx` (~1050 lines) into agent-friendly modules so that an AI agent can read, understand, and edit one unit without loading the full file.

## Constraints

- Single user (userbase of 1)
- Built and maintained entirely via Claude Code
- Keep inline styles (most agent-friendly — colocated, no cross-file coordination)
- Do not touch `mcp-server/` (independent Supabase client, shares no code with frontend)
- Do not touch `src/lib/storage.js` or `src/lib/supabase.js`
- No new dependencies

## File Structure After Refactor

```
src/
  App.jsx                — AuthGate, Tracker (state owner, hash router, mutations)
  views/
    ListView.jsx         — project list, search/filter, drag reorder, "pick up where you left off"
    DetailView.jsx       — project detail: reentry note, tasks, work log, export, archive
    TimelineView.jsx     — 7-day timeline with day grid and log entries
  components/
    QuickLogModal.jsx    — "L" keyboard shortcut modal
    UndoToast.jsx        — undo notification bar
    SyncPill.jsx         — saving/synced/offline indicator
  lib/
    constants.js         — DOMAINS, STATUS_META, PRIORITY_META, TASK_STATUS, STATUS_OPTIONS, PRIORITY_OPTIONS, SEED
    styles.js            — makeStyles(), SERIF, SANS, ACCENT
    helpers.js           — uid(), today(), staleness(), exportForClaude()
    storage.js           — (unchanged)
    supabase.js          — (unchanged)
```

## Architecture

### State ownership

`Tracker` in `App.jsx` is the single state owner. All `useState` hooks live here:
- `data`, `loading`, `loadError` — Supabase data
- `view`, `activeId` — hash-based routing (initialized from `window.location.hash`)
- `winWidth` — responsive layout
- `dark` — theme (persisted to localStorage)
- `search`, `filterDomain` — list filtering
- UI toggles: `showNew`, `showDormant`, `quickLog`
- `dragId`, `dragOver` — drag reorder state
- `undoAction` — undo toast state
- `syncState` — sync pill state
- Form buffers: `newName`, `newDomain`

Note: Detail-view-only state moves into DetailView (see State Simplification below).

### Mutation helpers (stay in Tracker)

- `persist(d)` — debounced save to Supabase
- `mut(ctxId, fn)` — update a single project
- `saveAll(d)` — replace full data + save
- `doWithUndo(label, action, undoFn)` — action with 5s undo window
- `fadeTo(fn)` — opacity transition wrapper

### Navigation (stays in Tracker)

- `openCtx(id, skipPush)` — navigate to detail view, push history state
- `goBack(skipPush)` — navigate to list view
- `openTimeline(skipPush)` — navigate to timeline view
- `popstate` listener, initial `replaceState` from hash

### View rendering

Tracker renders a simple switch:

```jsx
if (view === "detail" && ctx) return <DetailView ... />;
if (view === "timeline") return <TimelineView ... />;
return <ListView ... />;
```

## View Props

### ListView

| Prop | Type | Purpose |
|------|------|---------|
| `live` | array | Filtered active projects |
| `dormant` | array | Paused/archived/complete projects |
| `liveAll` | array | All non-dormant (for critical path) |
| `data` | object | Full data (backup export/import/reset) |
| `loadError` | string/null | Offline warning banner text |
| `search`, `setSearch` | string, fn | Search state |
| `filterDomain`, `setFilterDomain` | string, fn | Domain filter state |
| `showNew`, `setShowNew` | bool, fn | New project form toggle |
| `newName`, `setNewName` | string, fn | New project name buffer |
| `newDomain`, `setNewDomain` | string, fn | New project domain buffer |
| `showDormant`, `setShowDormant` | bool, fn | Dormant section toggle |
| `openCtx` | fn | Navigate to project detail |
| `openTimeline` | fn | Navigate to timeline |
| `toggleDark` | fn | Toggle dark mode |
| `dark` | bool | Current theme |
| `saveAll` | fn | Replace full data + persist |
| `dragId`, `setDragId` | string, fn | Drag state |
| `dragOver`, `setDragOver` | string, fn | Drag hover state |
| `handleDragStart`, `handleDragOver`, `handleDrop`, `handleDragEnd` | fn | Drag handlers |
| `moveCtx` | fn | Reorder projects |
| `quickLog`, `setQuickLog` | object, fn | Quick log modal state |
| `mut` | fn | Project mutation |
| `signOut` | fn | Sign out callback |
| `S` | object | Style object |
| `maxW` | number | Responsive max-width |

### DetailView

| Prop | Type | Purpose |
|------|------|---------|
| `ctx` | object | The active project |
| `mut` | fn | Project mutation |
| `doWithUndo` | fn | Undoable actions |
| `goBack` | fn | Navigate back to list |
| `S` | object | Style object |
| `maxW` | number | Responsive max-width |
| `viewFade` | number | Opacity for transitions |

Note: DetailView manages its own local UI state (editReentry, reentryDraft, newTask, showAddTask, editingTaskId, editTaskBuf, logText, logDur, expandLog, showDone, exportText) and its own refs (taRef for reentry textarea, exportRef for export textarea). It also defines `moveTask` locally (only needs `mut`). The `taskGroups` rendering constant is local to DetailView.

Because this state is view-local, navigating away unmounts DetailView and naturally resets it — the explicit state resets currently in `openCtx` become unnecessary and should be removed during refactoring.

### TimelineView

| Prop | Type | Purpose |
|------|------|---------|
| `data` | object | Full data (cross-project log aggregation) |
| `openCtx` | fn | Navigate to project from log entry |
| `goBack` | fn | Navigate back to list |
| `S` | object | Style object |
| `maxW` | number | Responsive max-width |
| `viewFade` | number | Opacity for transitions |

### Shared Components

**SyncPill:** `syncState` (string)

**UndoToast:** `undoAction` (object | null)

**QuickLogModal:** `quickLog` (object | null), `setQuickLog` (fn), `live` (array — for project picker), `mut` (fn), `S` (object)

## State Simplification

Moving DetailView's UI state out of Tracker is a net improvement — Tracker currently holds 31 useState hooks, many of which are only relevant to the detail view. After refactor:

- **Tracker:** ~20 hooks (data, routing, shared UI like quickLog/undo/sync)
- **DetailView:** 11 hooks (editReentry, reentryDraft, newTask, showAddTask, editingTaskId, editTaskBuf, logText, logDur, expandLog, showDone, exportText) + 2 refs (taRef, exportRef)

This means navigating away from detail and back naturally resets that local state — which is the correct behavior (you don't want stale edit buffers when re-entering a project).

## lib/ Extractions

### constants.js

Exports: `DOMAINS`, `STATUS_META`, `PRIORITY_META`, `STATUS_OPTIONS`, `PRIORITY_OPTIONS`, `TASK_STATUS`, `SEED`, `DAY_NAMES`, `MONTH_NAMES`

### styles.js

Exports: `makeStyles`, `SERIF`, `SANS`, `ACCENT`

### helpers.js

Exports: `uid`, `today`, `staleness`, `exportForClaude`

Note: `staleness()` and `exportForClaude()` depend on `DOMAINS` — they import from `constants.js`.

## What Does NOT Change

- `src/lib/storage.js` — untouched
- `src/lib/supabase.js` — untouched
- `src/main.jsx` — untouched
- `mcp-server/` — entirely independent, untouched
- `index.html` — untouched
- Inline styling approach — kept as-is
- All existing functionality — pure refactor, no behavior changes

## Bugfix During Refactor

- The detail view currently renders `{undoToast}` twice (duplicate). Fix by rendering UndoToast once per view.

## Implementation Notes

- `openCtx` currently resets detail-view state (editReentry, expandLog, etc.). After refactor, DetailView unmounts/remounts on navigation, so these resets are unnecessary — remove them from `openCtx`.
- The `document.body.style.background` side effect must stay in Tracker (not in a view), so it fires regardless of which view is mounted.
- ListView needs a `signOut` callback prop rather than importing `supabase` directly — keeps the auth boundary in App.jsx.

## Expected File Sizes (approximate)

| File | Lines |
|------|-------|
| `App.jsx` (Tracker + AuthGate) | ~200 |
| `ListView.jsx` | ~250 |
| `DetailView.jsx` | ~300 |
| `TimelineView.jsx` | ~100 |
| `QuickLogModal.jsx` | ~50 |
| `UndoToast.jsx` | ~20 |
| `SyncPill.jsx` | ~20 |
| `constants.js` | ~100 |
| `styles.js` | ~40 |
| `helpers.js` | ~40 |

Total: ~1120 lines across 10 files vs ~1080 in one file. Slight overhead from imports/exports, but each file is independently comprehensible.
