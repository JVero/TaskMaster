# Focus Timer — Design Spec

## Summary

Add a 25-minute Pomodoro-style focus timer to the project detail view. The timer is optional, minimal, and integrates with the existing work log to capture what was accomplished.

## UI Placement

The timer button lives in the detail view header row alongside the status/priority selects and "Export for Claude" button. It's styled as a ghost button with a clock icon, matching the existing aesthetic.

### States

**Idle:** A subtle ghost button with a clock icon (`⏱ Focus`) in the header row. Same styling as "Export for Claude."

**Active:** The button transforms into a warm countdown display — accent color (`#C15F3C`) text showing `24:31` with a subtle pulse animation. A small `×` button to cancel. Fits inline without dominating the header.

**Complete:** A warm-toned banner slides in above the work log section with "Focus session complete — what did you accomplish?" The work log input auto-expands with the text input focused and duration pre-filled as "deep." Dismissing or submitting the log resets the timer to idle.

## Behavior

- **Start:** Click the idle timer button. Requests `Notification.requestPermission()` on first use only.
- **Countdown:** 25 minutes. No pause/resume — it's a commitment.
- **Accuracy:** Uses `Date.now()` arithmetic, not interval decrement. Recalculates on `visibilitychange` so backgrounded tabs stay accurate.
- **Cancel:** Click `×` next to countdown. Resets to idle, no log prompt.
- **Finish:** Browser notification fires ("Session done — log what you did?"). In-app banner appears above work log. Log input auto-focuses with duration pre-set to "deep."
- **Navigation:** Leaving the detail view (back to list) cancels the timer. The timer is scoped to a single project session.

## Technical Details

- All state lives in `DetailView` component (`useState`/`useRef`).
- `setInterval` at 1s ticks for display updates; elapsed time computed from `Date.now() - startTime`.
- `document.addEventListener("visibilitychange", ...)` recalculates remaining time when tab regains focus.
- `new Notification(...)` for browser notification on completion.
- No new dependencies. No data model changes — the work log entry is the record.

## What It Doesn't Do

- No pause/resume
- No sound effects
- No session history beyond the work log entry
- No configurable duration (25 min fixed)

## Files Changed

- `src/views/DetailView.jsx` — timer state, UI, notification logic
