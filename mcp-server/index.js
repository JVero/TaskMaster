import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.TASKMASTER_SUPABASE_URL,
  process.env.TASKMASTER_SUPABASE_ANON_KEY
);

const ROW_ID = "default";

// Sign in once at startup (catch to prevent unhandled rejection crash)
let authReady = supabase.auth.signInWithPassword({
  email: process.env.TASKMASTER_EMAIL,
  password: process.env.TASKMASTER_PASSWORD,
}).then(({ error }) => {
  if (error) console.error(`Auth failed: ${error.message}`);
});

// --- helpers ---

async function loadState() {
  await authReady;
  const { data, error } = await supabase
    .from("tracker_state")
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw new Error(`Supabase read failed: ${error.message}`);
  if (!data?.data) throw new Error("No tracker data found");
  return data.data;
}

async function saveState(state) {
  await authReady;
  const { error } = await supabase
    .from("tracker_state")
    .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase write failed: ${error.message}`);
}

function findCtx(state, nameOrId) {
  const lower = nameOrId.toLowerCase();
  return state.contexts.find(
    (c) => c.id === nameOrId || c.name.toLowerCase() === lower || c.name.toLowerCase().includes(lower)
  );
}

const DOMAINS = {
  "systems-cpp": "Systems / C++",
  "data-science-python": "Data Science",
  "computer-vision": "Comp Vision",
  "ios-swift": "iOS / Swift",
  "clinical-ops": "Clinical",
  "writing": "Writing",
  "teaching": "Teaching",
};

const STATUS_OPTIONS = ["active", "blocked", "paused", "complete", "archived"];
const PRIORITY_OPTIONS = ["critical-path", "steady", "background", "someday"];
const TASK_STATUS = ["todo", "in-progress", "done", "blocked"];

function formatProject(ctx, verbose) {
  const domain = DOMAINS[ctx.domain] || ctx.domain;
  const openTasks = ctx.tasks.filter((t) => t.status !== "done").length;
  const doneTasks = ctx.tasks.filter((t) => t.status === "done").length;

  let out = `## ${ctx.name}\n`;
  out += `- Domain: ${domain}\n`;
  out += `- Status: ${ctx.status} | Priority: ${ctx.priority}\n`;
  if (ctx.stakeholders) out += `- Stakeholders: ${ctx.stakeholders}\n`;
  out += `- Tasks: ${openTasks} open, ${doneTasks} done\n`;

  if (ctx.reentry) {
    out += `\n### Re-entry note\n${ctx.reentry}\n`;
  }

  if (verbose) {
    const groups = { "in-progress": [], todo: [], blocked: [], done: [] };
    ctx.tasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t);
    });
    out += `\n### Tasks\n`;
    for (const [status, tasks] of Object.entries(groups)) {
      if (tasks.length === 0) continue;
      out += `**${status}** (${tasks.length})\n`;
      tasks.forEach((t) => (out += `- ${t.text}\n`));
    }
    if (ctx.log.length > 0) {
      out += `\n### Recent log (last 5)\n`;
      ctx.log.slice(0, 5).forEach((e) => {
        out += `- ${e.date} [${e.dur}]: ${e.text}\n`;
      });
    }
  }

  return out;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

// --- MCP server ---

const server = new McpServer({
  name: "TaskMaster",
  version: "1.0.0",
});

// READ: get all projects
server.tool(
  "get_all_projects",
  "Get a briefing of all projects with status, priority, re-entry notes, and task counts. Use this at the start of a conversation to understand the user's current workload.",
  {},
  async () => {
    const state = await loadState();
    const order = state.order || state.contexts.map((c) => c.id);
    const ctxMap = {};
    state.contexts.forEach((c) => (ctxMap[c.id] = c));

    const active = order.map((id) => ctxMap[id]).filter((c) => c && !["complete", "archived"].includes(c.status));
    const dormant = order.map((id) => ctxMap[id]).filter((c) => c && ["complete", "archived"].includes(c.status));

    let text = `# Active Projects (${active.length})\n\n`;
    active.forEach((c) => (text += formatProject(c, false) + "\n"));

    if (dormant.length > 0) {
      text += `\n# Completed / Archived (${dormant.length})\n`;
      dormant.forEach((c) => (text += `- ${c.name} (${c.status})\n`));
    }

    return { content: [{ type: "text", text }] };
  }
);

// READ: get one project in detail
server.tool(
  "get_project",
  "Get detailed info for a single project including all tasks and recent log entries. Accepts a project name (or partial match).",
  { project: z.string().describe("Project name or ID") },
  async ({ project }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}". Available: ${state.contexts.map((c) => c.name).join(", ")}` }] };
    }
    return { content: [{ type: "text", text: formatProject(ctx, true) }] };
  }
);

// WRITE: log work
server.tool(
  "log_work",
  "Add a work log entry to a project.",
  {
    project: z.string().describe("Project name or ID"),
    text: z.string().describe("What was done"),
    duration: z.enum(["quick", "session", "deep"]).default("session").describe("How long the work took"),
  },
  async ({ project, text, duration }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}".` }] };
    }
    ctx.log.unshift({ id: uid(), date: today(), text, dur: duration });
    await saveState(state);
    return { content: [{ type: "text", text: `Logged to "${ctx.name}": ${text} [${duration}]` }] };
  }
);

// WRITE: add task
server.tool(
  "add_task",
  "Add a new task to a project.",
  {
    project: z.string().describe("Project name or ID"),
    text: z.string().describe("Task description"),
    status: z.enum(TASK_STATUS).default("todo").describe("Initial task status"),
  },
  async ({ project, text, status }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}".` }] };
    }
    ctx.tasks.unshift({ id: uid(), text, status });
    await saveState(state);
    return { content: [{ type: "text", text: `Added task to "${ctx.name}": ${text} [${status}]` }] };
  }
);

// WRITE: update task status
server.tool(
  "update_task_status",
  "Change the status of a task within a project.",
  {
    project: z.string().describe("Project name or ID"),
    task: z.string().describe("Task text (partial match)"),
    status: z.enum(TASK_STATUS).describe("New status"),
  },
  async ({ project, task, status }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}".` }] };
    }
    const lower = task.toLowerCase();
    const t = ctx.tasks.find((t) => t.text.toLowerCase().includes(lower));
    if (!t) {
      return { content: [{ type: "text", text: `No task found matching "${task}" in "${ctx.name}". Tasks: ${ctx.tasks.map((t) => t.text).join(", ")}` }] };
    }
    const old = t.status;
    t.status = status;
    await saveState(state);
    return { content: [{ type: "text", text: `Updated "${t.text}" in "${ctx.name}": ${old} → ${status}` }] };
  }
);

// WRITE: update project status
server.tool(
  "update_project_status",
  "Change the status of a project.",
  {
    project: z.string().describe("Project name or ID"),
    status: z.enum(STATUS_OPTIONS).describe("New project status"),
  },
  async ({ project, status }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}".` }] };
    }
    const old = ctx.status;
    ctx.status = status;
    await saveState(state);
    return { content: [{ type: "text", text: `Updated "${ctx.name}" status: ${old} → ${status}` }] };
  }
);

// WRITE: update re-entry note
server.tool(
  "update_reentry_note",
  "Update the re-entry note for a project. This is the note that helps the user remember where they left off.",
  {
    project: z.string().describe("Project name or ID"),
    note: z.string().describe("New re-entry note text"),
  },
  async ({ project, note }) => {
    const state = await loadState();
    const ctx = findCtx(state, project);
    if (!ctx) {
      return { content: [{ type: "text", text: `No project found matching "${project}".` }] };
    }
    ctx.reentry = note;
    await saveState(state);
    return { content: [{ type: "text", text: `Updated re-entry note for "${ctx.name}".` }] };
  }
);

// WRITE: create project
server.tool(
  "create_project",
  "Create a new project.",
  {
    name: z.string().describe("Project name"),
    domain: z.enum(Object.keys(DOMAINS)).describe("Project domain"),
    priority: z.enum(PRIORITY_OPTIONS).default("steady").describe("Priority level"),
    reentry: z.string().default("").describe("Initial re-entry note"),
  },
  async ({ name, domain, priority, reentry }) => {
    const state = await loadState();
    const id = "ctx-" + uid();
    const newCtx = { id, name, domain, status: "active", priority, reentry, stakeholders: "", tasks: [], log: [] };
    state.contexts.push(newCtx);
    if (!state.order) state.order = state.contexts.map((c) => c.id);
    else state.order.push(id);
    await saveState(state);
    return { content: [{ type: "text", text: `Created project "${name}" [${DOMAINS[domain]}, ${priority}]` }] };
  }
);

// --- start ---

const transport = new StdioServerTransport();
await server.connect(transport);
