// src/lib/constants.js

export const DOMAINS = {
  "systems-cpp": { label: "Systems", color: "#7C7FB8" },
  "data-science-python": { label: "Data Science", color: "#6B8CAE" },
  "computer-vision": { label: "Vision", color: "#8E74AD" },
  "ios-swift": { label: "iOS", color: "#C17A52" },
  "clinical-ops": { label: "Clinical", color: "#6A9E80" },
  "writing": { label: "Writing", color: "#A68352" },
  "teaching": { label: "Teaching", color: "#6A9DAA" },
};

export const STATUS_META = {
  active: { label: "Active", bg: "#EDF5F0", fg: "#4A7C5C" },
  blocked: { label: "Blocked", bg: "#FDF0EE", fg: "#B04A33" },
  paused: { label: "Paused", bg: "#F5F3EE", fg: "#92400e" },
  complete: { label: "Done", bg: "#F0EFED", fg: "#78716C" },
  archived: { label: "Archived", bg: "#F0EFED", fg: "#A8A29E" },
};

export const PRIORITY_META = {
  "critical-path": { label: "Critical path", fg: "#dc2626" },
  steady: { label: "Steady", fg: "#78716C" },
  background: { label: "Background", fg: "#A8A29E" },
  someday: { label: "Someday", fg: "#D6D3D1" },
};

export const STATUS_OPTIONS = ["active", "blocked", "paused", "complete", "archived"];
export const PRIORITY_OPTIONS = ["critical-path", "steady", "background", "someday"];
export const TASK_STATUS = ["todo", "in-progress", "done", "blocked"];

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SEED = {
  order: ["ctx-5", "ctx-1", "ctx-2", "ctx-3", "ctx-4", "ctx-6", "ctx-7", "ctx-8"],
  contexts: [
    {
      id: "ctx-1", name: "Closed-Loop Active Sensing", domain: "systems-cpp",
      status: "blocked", priority: "critical-path",
      reentry: "BLOCKED on dissertation proposal — can't run new participants until proposal is approved. Use this window to scope the webcam real-time feedback feature (replacing video playback). Sketch the architecture before proposal clears.",
      stakeholders: "Dr. Torres, IRB",
      tasks: [
        { id: "t1", text: "Scope webcam CV library options (latency requirements?)", status: "todo" },
        { id: "t2", text: "Sketch webcam feedback architecture", status: "todo" },
        { id: "t3", text: "Collect remaining participants (after proposal)", status: "blocked" },
        { id: "t4", text: "Kinematic profile analysis across learning phases", status: "in-progress" },
      ],
      log: [{ id: "l1", date: "2026-03-10", text: "Reviewed torus/cylinder boundary detection. Stable.", dur: "session" }],
    },
    {
      id: "ctx-2", name: "Facial Kinematics / OpenFace", domain: "computer-vision",
      status: "active", priority: "steady",
      reentry: "Pipeline is stable, running on new datasets. Nothing unexpected. Good flow-state work when you need a break from writing.",
      stakeholders: "Dr. Torres",
      tasks: [
        { id: "t5", text: "Process current dataset batch", status: "in-progress" },
        { id: "t6", text: "Flag any anomalous results", status: "todo" },
        { id: "t7", text: "Cross-population comparison analysis", status: "todo" },
      ],
      log: [{ id: "l2", date: "2026-03-13", text: "Ran pipeline on batch 3. Clean output.", dur: "session" }],
    },
    {
      id: "ctx-3", name: "iPad Dementia Screening App", domain: "ios-swift",
      status: "active", priority: "steady",
      reentry: "STILL NEED the advanced geometric analysis of drawing paths before the paper is complete. Do the analysis FIRST — don't get pulled into writing prose until it's done.",
      stakeholders: "Dr. Torres",
      tasks: [
        { id: "t8", text: "Implement geometric path analysis (curvature, trajectory decomposition)", status: "todo" },
        { id: "t9", text: "Run geometric analysis on collected data", status: "todo" },
        { id: "t10", text: "Integrate geometric findings into paper draft", status: "todo" },
        { id: "t11", text: "Finish paper draft", status: "todo" },
      ],
      log: [{ id: "l3", date: "2026-03-15", text: "Outlined geometric analysis approach.", dur: "quick" }],
    },
    {
      id: "ctx-4", name: "ASD Sulforaphane Clinical Trial", domain: "clinical-ops",
      status: "active", priority: "steady",
      reentry: "5 participants collected. Scheduling happens around you. Next session: run Mocopi + OpenFace protocol. Between sessions: spot-check data quality on existing 5.",
      stakeholders: "Dr. Torres, Clinical collaborators, IRB",
      tasks: [
        { id: "t12", text: "Spot-check data quality on 5 existing participants", status: "todo" },
        { id: "t13", text: "Run next participant session when scheduled", status: "todo" },
        { id: "t14", text: "Longitudinal analysis across timepoints", status: "todo" },
      ],
      log: [{ id: "l4", date: "2026-03-12", text: "Participant 5 session complete.", dur: "deep" }],
    },
    {
      id: "ctx-5", name: "Dissertation Proposal", domain: "writing",
      status: "active", priority: "critical-path",
      reentry: "THE BOTTLENECK. Quals first, then schedule proposal defense. Next: identify which section you're drafting and write. This unblocks Closed-Loop and sets the Dec 2026 timeline.",
      stakeholders: "Dr. Torres, Committee",
      tasks: [
        { id: "t15", text: "Complete qualifying exams", status: "in-progress" },
        { id: "t16", text: "Draft introduction / framing", status: "todo" },
        { id: "t17", text: "Draft methods across studies", status: "todo" },
        { id: "t18", text: "Schedule proposal defense with committee", status: "todo" },
      ],
      log: [{ id: "l5", date: "2026-03-16", text: "Worked on quals prep.", dur: "deep" }],
    },
    {
      id: "ctx-6", name: "Teaching — Quant Methods", domain: "teaching",
      status: "active", priority: "steady",
      reentry: "Autopilot. Mid-semester, weekly lectures. Protect this from expanding into research time.",
      stakeholders: "Students, Department",
      tasks: [
        { id: "t19", text: "Weekly lecture prep & delivery", status: "in-progress" },
        { id: "t20", text: "Grading", status: "in-progress" },
      ],
      log: [{ id: "l6", date: "2026-03-17", text: "Taught weekly session.", dur: "session" }],
    },
    {
      id: "ctx-7", name: "XSens LSL Integration", domain: "systems-cpp",
      status: "complete", priority: "background",
      reentry: "Complete. Integrated into lab infrastructure.",
      stakeholders: "Lab", tasks: [
        { id: "t21", text: "C++ XSens SDK integration", status: "done" },
        { id: "t22", text: "LSL outlet configuration", status: "done" },
      ], log: [],
    },
    {
      id: "ctx-8", name: "ABR Theoretical Paper", domain: "writing",
      status: "paused", priority: "background",
      reentry: "PNAS Nexus paper published. Parked unless extending framework.",
      stakeholders: "Dr. Torres",
      tasks: [{ id: "t24", text: "PNAS Nexus publication", status: "done" }], log: [],
    },
  ],
};
