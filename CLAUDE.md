# TaskMaster — Personal Project Tracker

A React + Vite web app (PWA) backed by Supabase. Single-page app with all UI in `src/App.jsx`. Data is stored as a single JSON blob in Supabase's `tracker_state` table.

## Stack
- React 19, Vite, inline styles (no CSS files)
- Supabase for auth, storage, and realtime sync
- Deployed on Vercel

## MCP Server (`mcp-server/`)
A local MCP server that gives Claude read/write access to the tracker via Supabase. Tools:
- `get_all_projects` / `get_project` — read project state
- `log_work` / `add_task` / `update_task_status` — write to projects
- `update_project_status` / `update_reentry_note` / `create_project` — manage projects

The MCP server authenticates with a dedicated Supabase user (not the service role key). Credentials are in `.mcp.json` (gitignored) and `~/.claude.json`.

## Key files
- `src/App.jsx` — all UI components and styles
- `src/lib/storage.js` — Supabase read/write/realtime sync
- `src/lib/supabase.js` — Supabase client init
- `mcp-server/index.js` — MCP server
- `.env` — Supabase URL and anon key (gitignored)
