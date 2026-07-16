/* ============================================================
   Aptitude Project Control — plain JS app (no build step)
   ============================================================
   Data comes from MOCK_DATA below until USE_LIVE_DATA is turned on.
   Once your Google Sheet + Apps Script are connected (see
   docs/step-by-step.md), paste your Web App URL into SHEETS_API_URL
   and set USE_LIVE_DATA to true.
   ============================================================ */

const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzpCuePxK8Mi8l_l5QH8tRrvPRFmqe3TkxhQsz1RJduCgdjMTF5SE6nxxKivlzvTUt6/exec";
const USE_LIVE_DATA = true;

function formatAED(n) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(Number(n) || 0);
}
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- Mock data (replaced by Sheets data once connected) ---------------- */
const RAW_PROJECTS = [
  { id: "prj-001", name: "Marina Walk Café", brand: "Aptitude Coffee Co.", location: "Marina Walk, Unit 12", city: "Abu Dhabi", manager: "Sara Al Mazrouei", status: "on-track", completion: 78, budget: 1450000, spent: 1040000, outstanding: 96500, openingDate: "2026-09-14", riskLevel: "Low", nextMilestone: "POS Installation" },
  { id: "prj-002", name: "Yas Mall Kiosk", brand: "Aptitude Express", location: "Yas Mall, Level 1", city: "Abu Dhabi", manager: "Omar Haddad", status: "attention", completion: 54, budget: 620000, spent: 402000, outstanding: 58000, openingDate: "2026-08-02", riskLevel: "Medium", nextMilestone: "Authority Approvals" },
  { id: "prj-003", name: "Reem Island Bistro", brand: "Aptitude Kitchen", location: "City of Lights, Reem Island", city: "Abu Dhabi", manager: "Fatima Noor", status: "delayed", completion: 31, budget: 2100000, spent: 890000, outstanding: 214000, openingDate: "2026-11-20", riskLevel: "High", nextMilestone: "Civil Work Completion" },
  { id: "prj-004", name: "Al Ain Downtown Café", brand: "Aptitude Coffee Co.", location: "Downtown Al Ain", city: "Al Ain", manager: "Khalid Yousef", status: "on-track", completion: 92, budget: 980000, spent: 872000, outstanding: 12000, openingDate: "2026-08-18", riskLevel: "Low", nextMilestone: "Grand Opening" },
  { id: "prj-005", name: "Dalma Mall Kiosk", brand: "Aptitude Express", location: "Dalma Mall, Ground Floor", city: "Abu Dhabi", manager: "Sara Al Mazrouei", status: "completed", completion: 100, budget: 540000, spent: 528000, outstanding: 0, openingDate: "2026-05-01", riskLevel: "Low", nextMilestone: "Archived" },
  { id: "prj-006", name: "Saadiyat Retail Corner", brand: "Aptitude Kitchen", location: "Saadiyat Grove", city: "Abu Dhabi", manager: "Omar Haddad", status: "attention", completion: 47, budget: 1180000, spent: 610000, outstanding: 143000, openingDate: "2026-10-05", riskLevel: "Medium", nextMilestone: "Kitchen Equipment Delivery" },
];

const MILESTONE_TEMPLATE = [
  ["Lease Signed", "Sara Al Mazrouei", "2026-03-01"], ["Design Approved", "Design Team", "2026-03-20"],
  ["Authority Approvals", "Omar Haddad", "2026-04-10"], ["Fit-Out Started", "BuildRight", "2026-04-18"],
  ["Civil Work", "BuildRight", "2026-05-10"], ["Electrical", "Al Noor Electrical", "2026-05-25"],
  ["Plumbing", "Gulf Plumbing Co.", "2026-06-05"], ["HVAC", "CoolBreeze MEP", "2026-06-12"],
  ["Kitchen Equipment", "Procurement", "2026-06-25"], ["Coffee Equipment", "Procurement", "2026-06-28"],
  ["Furniture", "Procurement", "2026-07-05"], ["POS Installation", "IT Team", "2026-07-10"],
  ["CCTV", "IT Team", "2026-07-10"], ["Deep Cleaning", "Ops Team", "2026-07-15"],
  ["Recruitment", "HR Team", "2026-07-01"], ["Training", "Ops Team", "2026-07-18"],
  ["Soft Opening", "Ops Team", "2026-07-25"], ["Grand Opening", "Ops Team", "2026-08-02"],
];

const BUDGET_TEMPLATE = [
  ["Security Deposit", 0.08], ["Rent", 0.06], ["Designer", 0.03], ["Fit-Out", 0.26], ["Kitchen Equipment", 0.14],
  ["Coffee Equipment", 0.06], ["Furniture", 0.07], ["POS", 0.02], ["IT", 0.015], ["CCTV", 0.012],
  ["Electrical", 0.045], ["Plumbing", 0.026], ["HVAC", 0.05], ["Signage", 0.022], ["Licenses", 0.018],
  ["Marketing", 0.028], ["Recruitment", 0.02], ["Initial Inventory", 0.025], ["Contingency", 0.04], ["Other", 0.01],
];

function buildMockMilestones() {
  const rows = [];
  RAW_PROJECTS.forEach((p) => {
    const doneCount = Math.round((p.completion / 100) * MILESTONE_TEMPLATE.length);
    MILESTONE_TEMPLATE.forEach((t, i) => {
      let status = "pending";
      if (i < doneCount) status = "done";
      else if (i === doneCount) status = "in-progress";
      rows.push({ id: `${p.id}-mile-${i + 1}`, project_id: p.id, name: t[0], status, progress: status === "done" ? 100 : status === "in-progress" ? 50 : 0, owner: t[1], due: t[2], remarks: "" });
    });
  });
  return rows;
}

function buildMockBudget() {
  const rows = [];
  RAW_PROJECTS.forEach((p) => {
    BUDGET_TEMPLATE.forEach((t, i) => {
      const budget = Math.round((p.budget * t[1]) / 1000) * 1000;
      const actual = Math.round(budget * (p.spent / p.budget) * (0.85 + Math.random() * 0.3));
      rows.push({ id: `${p.id}-bud-${i + 1}`, project_id: p.id, name: t[0], budget, actual: Math.max(0, actual) });
    });
  });
  return rows;
}

const MOCK_DATA = {
  projects: RAW_PROJECTS,
  milestones: buildMockMilestones(),
  budgetCategories: buildMockBudget(),
  remarks: [],
  suppliers: [
    { name: "BuildRight Contracting", category: "Fit-Out", contract: 380000, invoiced: 312000, paid: 260000 },
    { name: "Al Noor Electrical", category: "Electrical", contract: 65000, invoiced: 63200, paid: 63200 },
    { name: "Gulf Plumbing Co.", category: "Plumbing", contract: 38000, invoiced: 20000, paid: 12000 },
    { name: "CoolBreeze MEP", category: "HVAC", contract: 74000, invoiced: 40000, paid: 40000 },
    { name: "Kitchen Pro Equipment", category: "Kitchen Equipment", contract: 210000, invoiced: 198000, paid: 150000 },
  ],
  activity: [
    { text: "Invoice #INV-2291 uploaded by BuildRight Contracting", time: "2h ago" },
    { text: "Plumbing milestone marked in-progress", time: "5h ago" },
    { text: "Payment of AED 45,000 recorded to Al Noor Electrical", time: "1d ago" },
  ],
  folders: ["Lease", "Contracts", "Design Drawings", "Municipality", "Invoices", "Purchase Orders", "Approvals", "Completion Photos", "Opening Photos", "Completion Certificate"],
};

let state = {
  user: { name: "Mohamed", role: "owner" },
  route: "dashboard",
  projectId: null,
  workspaceTab: "Overview",
  projects: MOCK_DATA.projects,
  milestones: MOCK_DATA.milestones,
  budgetCategories: MOCK_DATA.budgetCategories,
  remarks: MOCK_DATA.remarks,
};

/* ---------------- Data loading + saving (Google Sheets bridge) ---------------- */
async function loadAllData() {
  if (!USE_LIVE_DATA || !SHEETS_API_URL) {
    return { projects: MOCK_DATA.projects, milestones: MOCK_DATA.milestones, budgetCategories: MOCK_DATA.budgetCategories, remarks: MOCK_DATA.remarks };
  }
  try {
    const res = await fetch(SHEETS_API_URL);
    const data = await res.json();
    return {
      projects: data.projects || [],
      milestones: data.milestones || [],
      budgetCategories: data.budgetCategories || [],
      remarks: data.remarks || [],
    };
  } catch (e) {
    console.error("Failed to load live data, falling back to mock data:", e);
    return { projects: MOCK_DATA.projects, milestones: MOCK_DATA.milestones, budgetCategories: MOCK_DATA.budgetCategories, remarks: MOCK_DATA.remarks };
  }
}

/** Sends a write action to Apps Script. Uses text/plain to avoid CORS preflight issues with Apps Script. */
async function postToSheet(action, payload) {
  if (!USE_LIVE_DATA || !SHEETS_API_URL) {
    console.log("(offline mode — would have sent)", action, payload);
    return { success: true, offline: true };
  }
  try {
    const res = await fetch(SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (e) {
    console.error("Save failed:", e);
    return { success: false, error: String(e) };
  }
}

/* ---------------- Status badge helper ---------------- */
const STATUS_LABEL = { "on-track": "On Track", attention: "Attention", delayed: "Delayed", completed: "Completed" };
function badge(status) {
  return `<span class="badge ${status}"><span class="dot"></span>${STATUS_LABEL[status] || status}</span>`;
}

/* ---------------- Login ---------------- */
const USER_CODES = {
  Mohamed: { code: "9593", title: "Owner", role: "owner" },
  Deven: { code: "34380", title: "Operations Manager", role: "operations" },
  Mansoor: { code: "5398", title: "Accountant", role: "accounts" },
};

function initLogin() {
  const roleBtns = document.querySelectorAll(".role-btn");
  roleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      roleBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.user = { name: btn.dataset.name, role: btn.dataset.role };
      document.getElementById("login-error").style.display = "none";
    });
  });
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredCode = document.getElementById("login-password").value.trim();
    const expected = USER_CODES[state.user.name];
    const errorEl = document.getElementById("login-error");
    if (expected && enteredCode === expected.code) {
      errorEl.style.display = "none";
      enterApp();
    } else {
      errorEl.style.display = "block";
    }
  });
}

async function enterApp() {
  document.getElementById("view-login").style.display = "none";
  document.getElementById("app-shell").classList.add("active");
  const title = USER_CODES[state.user.name]?.title || state.user.name;
  document.getElementById("sidebar-user-name").textContent = state.user.name;
  document.getElementById("sidebar-user-role").textContent = title;
  document.getElementById("sidebar-user-avatar").textContent = state.user.name.slice(0, 2).toUpperCase();

  const content = document.getElementById("content");
  content.innerHTML = `<p class="loading-note">Loading data…</p>`;

  const data = await loadAllData();
  state.projects = data.projects;
  state.milestones = data.milestones;
  state.budgetCategories = data.budgetCategories;
  state.remarks = data.remarks;

  navigate("dashboard");
}

/* ---------------- Navigation ---------------- */
function navigate(route, projectId) {
  state.route = route;
  state.projectId = projectId || null;
  state.workspaceTab = "Overview";
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.route === route));
  render();
}

function render() {
  const el = document.getElementById("content");
  if (state.route === "dashboard") renderDashboard(el);
  else if (state.route === "projects") renderProjects(el);
  else if (state.route === "workspace") renderWorkspace(el);
  document.getElementById("topbar-title").textContent =
    state.route === "dashboard" ? "Executive Dashboard" : state.route === "projects" ? "Projects" : state.projects.find((p) => p.id === state.projectId)?.name || "";
  document.getElementById("topbar-subtitle").textContent =
    state.route === "dashboard" ? `Welcome back, ${state.user.name} — here's where things stand` : "";
}

/* ---------------- Dashboard ---------------- */
function renderDashboard(el) {
  const p = state.projects;
  const totalBudget = p.reduce((s, x) => s + Number(x.budget || 0), 0);
  const totalSpent = p.reduce((s, x) => s + Number(x.spent || 0), 0);
  const totalOutstanding = p.reduce((s, x) => s + Number(x.outstanding || 0), 0);
  const active = p.filter((x) => x.status !== "completed").length;
  const completed = p.filter((x) => x.status === "completed").length;

  el.innerHTML = `
    <div class="grid kpi-grid">
      ${kpi("Active Projects", active, "graphite")}
      ${kpi("Completed", completed, "good")}
      ${kpi("Total Budget", formatAED(totalBudget), "brass")}
      ${kpi("Total Spent", formatAED(totalSpent), "graphite")}
      ${kpi("Remaining Budget", formatAED(totalBudget - totalSpent), "good")}
      ${kpi("Outstanding Payments", formatAED(totalOutstanding), "bad")}
    </div>
    <div class="grid two-col" style="margin-top:1.5rem;">
      <div class="card">
        <div class="section-title"><h2>Recent Projects</h2><a href="#" id="view-all-link">View all →</a></div>
        <div>${p.slice(0, 5).map((x) => `
          <div class="list-row" data-goto="${x.id}">
            <div class="left"><div class="pct-chip">${x.completion}%</div>
              <div><p class="name">${x.name}</p><p class="sub">${x.brand} · ${x.city}</p></div>
            </div>${badge(x.status)}
          </div>`).join("")}</div>
      </div>
      <div class="card">
        <h2 style="font-size:1rem;">Project Status</h2>
        <p style="font-size:0.78rem;color:var(--graphite-500);margin:0.2rem 0 0.6rem;">Portfolio breakdown</p>
        <canvas id="statusChart" height="180"></canvas>
      </div>
    </div>
    <div class="grid two-col" style="margin-top:1.5rem;">
      <div class="card">
        <h2 style="font-size:1rem;">Budget vs Actual</h2>
        <p style="font-size:0.78rem;color:var(--graphite-500);margin:0.2rem 0 0.9rem;">Across all projects (AED)</p>
        <canvas id="budgetChart" height="200"></canvas>
      </div>
      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.9rem;">Recent Activity</h2>
        ${MOCK_DATA.activity.map((a) => `
          <div style="display:flex;gap:0.6rem;font-size:0.85rem;margin-bottom:0.8rem;">
            <span style="margin-top:6px;width:6px;height:6px;border-radius:50%;background:var(--brass-500);flex-shrink:0;"></span>
            <div><p style="margin:0;">${a.text}</p><p style="margin:2px 0 0;font-size:0.72rem;color:var(--graphite-400);">${a.time}</p></div>
          </div>`).join("")}
      </div>
    </div>
    <div class="grid two-col" style="margin-top:1.5rem;">
      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.9rem;">Projects Requiring Approval</h2>
        ${p.filter((x) => x.status === "attention" || x.status === "delayed").map((x) => `
          <div class="list-row" data-goto="${x.id}" style="border:1px solid var(--graphite-100);border-radius:0.5rem;margin-bottom:0.5rem;">
            <div><p class="name">${x.name}</p><p class="sub">Risk: ${x.riskLevel}</p></div>${badge(x.status)}
          </div>`).join("")}
      </div>
      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.9rem;">Upcoming Openings</h2>
        ${[...p].sort((a, b) => String(a.openingDate).localeCompare(String(b.openingDate))).slice(0, 4).map((x) => `
          <div class="list-row" data-goto="${x.id}" style="border:1px solid var(--graphite-100);border-radius:0.5rem;margin-bottom:0.5rem;">
            <div><p class="name">${x.name}</p><p class="sub">${x.city}</p></div>
            <p class="mono" style="font-size:0.78rem;color:var(--graphite-600);">${formatDate(x.openingDate)}</p>
          </div>`).join("")}
      </div>
    </div>
  `;
  el.querySelectorAll("[data-goto]").forEach((r) => r.addEventListener("click", () => navigate("workspace", r.dataset.goto)));
  document.getElementById("view-all-link").addEventListener("click", (e) => { e.preventDefault(); navigate("projects"); });
  drawStatusChart(p);
  drawBudgetChart(p);
}

function kpi(label, value, accent) {
  const colors = { graphite: "background:var(--graphite-950);color:white;", brass: "background:var(--brass-500);color:var(--graphite-950);", good: "background:var(--good);color:white;", bad: "background:var(--bad);color:white;" };
  return `<div class="card kpi-card">
    <div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon" style="${colors[accent]}">●</span></div>
    <p class="kpi-value mono">${value}</p>
  </div>`;
}

let statusChartInstance, budgetChartInstance;
function drawStatusChart(p) {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;
  const counts = { "on-track": 0, attention: 0, delayed: 0, completed: 0 };
  p.forEach((x) => { if (counts[x.status] !== undefined) counts[x.status]++; });
  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: { labels: ["On Track", "Attention", "Delayed", "Completed"], datasets: [{ data: Object.values(counts), backgroundColor: ["#1E9E6B", "#C98A1E", "#D14343", "#8892A4"], borderWidth: 0 }] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 11 } } } }, cutout: "65%" },
  });
}
function drawBudgetChart(p) {
  const ctx = document.getElementById("budgetChart");
  if (!ctx) return;
  if (budgetChartInstance) budgetChartInstance.destroy();
  budgetChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels: p.map((x) => x.name.split(" ")[0]), datasets: [
      { label: "Budget", data: p.map((x) => Number(x.budget || 0)), backgroundColor: "#DCE1E8", borderRadius: 4 },
      { label: "Spent", data: p.map((x) => Number(x.spent || 0)), backgroundColor: "#14181F", borderRadius: 4 },
    ] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 11 } } } }, scales: { y: { ticks: { callback: (v) => v / 1000 + "k" } } } },
  });
}

/* ---------------- Projects list ---------------- */
let activeFilter = "all";
function renderProjects(el) {
  const filters = [["all", "All"], ["on-track", "On Track"], ["attention", "Attention"], ["delayed", "Delayed"], ["completed", "Completed"]];
  const list = activeFilter === "all" ? state.projects : state.projects.filter((p) => p.status === activeFilter);
  el.innerHTML = `
    <div class="filters">${filters.map(([v, l]) => `<button class="filter-btn ${activeFilter === v ? "active" : ""}" data-filter="${v}">${l}</button>`).join("")}</div>
    <div class="grid project-grid">
      ${list.map((p) => `
        <div class="card project-card" data-goto="${p.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div><p class="brand">${p.brand}</p><h3 class="pname">${p.name}</h3></div>${badge(p.status)}
          </div>
          <p class="loc">📍 ${p.location}, ${p.city}</p>
          <div style="margin-top:1rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--graphite-500);">
              <span>Completion</span><span class="mono" style="font-weight:600;color:var(--graphite-900);">${p.completion}%</span>
            </div>
            <div class="bar-bg"><div class="bar-fill" style="width:${p.completion}%"></div></div>
          </div>
          <div class="mini-grid">
            <div><p>Budget</p><p class="mono">${formatAED(p.budget)}</p></div>
            <div><p>Spent</p><p class="mono">${formatAED(p.spent)}</p></div>
            <div><p>Remaining</p><p class="mono">${formatAED(Number(p.budget) - Number(p.spent))}</p></div>
          </div>
          <p style="font-size:0.75rem;color:var(--graphite-500);margin-top:0.9rem;">📅 Opening ${formatDate(p.openingDate)}</p>
        </div>`).join("")}
    </div>
  `;
  el.querySelectorAll("[data-goto]").forEach((r) => r.addEventListener("click", () => navigate("workspace", r.dataset.goto)));
  el.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { activeFilter = b.dataset.filter; renderProjects(el); }));
}

/* ---------------- Project workspace ---------------- */
function renderWorkspace(el) {
  const project = state.projects.find((p) => p.id === state.projectId) || state.projects[0];
  const remaining = Number(project.budget) - Number(project.spent);
  const tabs = ["Overview", "Progress", "Budget", "Suppliers", "Documents"];

  el.innerHTML = `
    <div class="crumb"><a href="#" id="crumb-projects">Projects</a> › <b>${project.name}</b></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-top:0.3rem;">
      <div>
        <div style="display:flex;align-items:center;gap:0.6rem;"><h1 style="font-size:1.3rem;">${project.name}</h1>${badge(project.status)}</div>
        <p style="color:var(--graphite-500);font-size:0.85rem;margin-top:0.3rem;">📍 ${project.location}, ${project.city} · ${project.brand}</p>
      </div>
    </div>
    <div class="tabs">${tabs.map((t) => `<button class="tab-btn ${state.workspaceTab === t ? "active" : ""}" data-tab="${t}">${t}</button>`).join("")}</div>
    <div id="tab-content" style="margin-top:1.5rem;"></div>
  `;
  document.getElementById("crumb-projects").addEventListener("click", (e) => { e.preventDefault(); navigate("projects"); });
  el.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.workspaceTab = b.dataset.tab; renderWorkspace(el); }));

  const tabEl = document.getElementById("tab-content");
  if (state.workspaceTab === "Overview") renderOverviewTab(tabEl, project, remaining);
  if (state.workspaceTab === "Progress") renderProgressTab(tabEl, project);
  if (state.workspaceTab === "Budget") renderBudgetTab(tabEl, project);
  if (state.workspaceTab === "Suppliers") renderSuppliersTab(tabEl);
  if (state.workspaceTab === "Documents") renderDocumentsTab(tabEl);
}

/* ---------- Overview + Remarks (everyone can post; owner especially) ---------- */
function renderOverviewTab(el, project, remaining) {
  const projectRemarks = state.remarks.filter((r) => r.project_id === project.id).slice().reverse();
  el.innerHTML = `
    <div class="grid two-col">
      <div>
        <div class="card">
          <h2 style="font-size:1rem;margin-bottom:1rem;">Executive Summary</h2>
          <div class="grid" style="grid-template-columns:repeat(2,1fr);gap:1rem;">
            ${field("Project Manager", project.manager)}
            ${field("Expected Opening", formatDate(project.openingDate))}
            ${field("Risk Level", project.riskLevel)}
            ${field("Next Milestone", project.nextMilestone)}
          </div>
          <div style="margin-top:1.2rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--graphite-500);"><span>Overall Progress</span><span class="mono" style="font-weight:600;">${project.completion}%</span></div>
            <div class="bar-bg" style="height:8px;"><div class="bar-fill" style="width:${project.completion}%"></div></div>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;">
          <h2 style="font-size:1rem;margin-bottom:1rem;">Remarks</h2>
          <form id="remark-form" style="display:flex;gap:0.5rem;margin-bottom:1rem;">
            <input id="remark-input" type="text" placeholder="Add a remark or comment…" style="flex:1;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.85rem;" />
            <button type="submit" class="login-submit" style="width:auto;padding:0.55rem 1.1rem;margin:0;">Post</button>
          </form>
          <div id="remarks-list">
            ${projectRemarks.length === 0 ? `<p style="font-size:0.82rem;color:var(--graphite-400);">No remarks yet.</p>` :
              projectRemarks.map((r) => `
                <div style="border-bottom:1px solid var(--graphite-50);padding:0.6rem 0;">
                  <p style="font-size:0.85rem;margin:0;">${escapeHtml(r.text)}</p>
                  <p style="font-size:0.72rem;color:var(--graphite-400);margin:3px 0 0;">${r.author} (${r.role}) · ${new Date(r.timestamp).toLocaleString()}</p>
                </div>`).join("")}
          </div>
        </div>
      </div>
      <div class="card health-card">
        <p class="h-label">Project Health</p>
        <p class="h-value display">${project.status === "delayed" ? "Needs Attention" : project.status === "attention" ? "Monitor Closely" : "Healthy"}</p>
        <div class="health-row"><span>Budget</span><span class="mono">${formatAED(project.budget)}</span></div>
        <div class="health-row"><span>Spent</span><span class="mono">${formatAED(project.spent)}</span></div>
        <div class="health-row"><span>Remaining</span><span class="mono">${formatAED(remaining)}</span></div>
        <div class="health-row"><span>Outstanding</span><span class="mono" style="color:var(--brass-400);">${formatAED(project.outstanding)}</span></div>
      </div>
    </div>
  `;

  document.getElementById("remark-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("remark-input");
    const text = input.value.trim();
    if (!text) return;
    const remark = { id: "local-" + Date.now(), project_id: project.id, author: state.user.name, role: state.user.role, text, timestamp: new Date().toISOString() };
    state.remarks.push(remark);
    input.value = "";
    renderOverviewTab(el, project, remaining);
    await postToSheet("addRemark", { projectId: project.id, author: state.user.name, role: state.user.role, text });
  });
}
function field(label, value) {
  return `<div><p style="font-size:0.72rem;color:var(--graphite-400);">${label}</p><p style="font-size:0.85rem;font-weight:500;margin-top:0.2rem;">${value}</p></div>`;
}
function escapeHtml(str) {
  const d = document.createElement("div");
  d.innerText = str;
  return d.innerHTML;
}

/* ---------- Progress tab — editable only for Operations (Deven) ---------- */
function renderProgressTab(el, project) {
  const canEdit = state.user.role === "operations";
  const icon = { done: "✅", "in-progress": "🟡", pending: "⚪" };
  const list = state.milestones.filter((m) => m.project_id === project.id);

  el.innerHTML = `
    <div class="card" style="padding:0;">
      <div style="display:flex;justify-content:space-between;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">
        <h2 style="font-size:1rem;">Milestone Checklist ${canEdit ? "" : "<span style='font-size:0.72rem;color:var(--graphite-400);font-weight:400;'>(read-only — Deven can edit)</span>"}</h2>
        <p style="font-size:0.78rem;color:var(--graphite-500);">${list.filter((m) => m.status === "done").length}/${list.length} complete</p>
      </div>
      <div style="padding:0 1.2rem;">
        ${list.map((m) => `
          <div class="milestone-row" data-mid="${m.id}">
            <div class="left"><span>${icon[m.status] || "⚪"}</span>
              <div><p style="font-size:0.87rem;font-weight:500;margin:0;">${m.name}</p><p style="font-size:0.75rem;color:var(--graphite-500);margin:2px 0 0;">${m.owner} · Due ${formatDate(m.due)}</p></div>
            </div>
            ${canEdit ? `
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <select class="m-status filter-btn" style="padding:0.3rem 0.5rem;">
                  <option value="pending" ${m.status === "pending" ? "selected" : ""}>Pending</option>
                  <option value="in-progress" ${m.status === "in-progress" ? "selected" : ""}>In Progress</option>
                  <option value="done" ${m.status === "done" ? "selected" : ""}>Done</option>
                </select>
                <input class="m-progress" type="number" min="0" max="100" value="${m.progress || 0}" style="width:60px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.4rem;font-size:0.8rem;" />
                <input class="m-remarks" type="text" placeholder="Notes…" value="${m.remarks || ""}" style="width:140px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.5rem;font-size:0.8rem;" />
                <button class="filter-btn save-milestone" style="padding:0.3rem 0.7rem;">Save</button>
              </div>` : `
              <div style="font-size:0.75rem;color:var(--graphite-500);">${m.progress || 0}% ${m.remarks ? "· " + escapeHtml(m.remarks) : ""}</div>`}
          </div>`).join("")}
      </div>
    </div>
  `;

  if (canEdit) {
    el.querySelectorAll(".save-milestone").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("[data-mid]");
        const mid = row.dataset.mid;
        const status = row.querySelector(".m-status").value;
        const progress = row.querySelector(".m-progress").value;
        const remarks = row.querySelector(".m-remarks").value;
        const m = state.milestones.find((x) => x.id === mid);
        if (m) { m.status = status; m.progress = progress; m.remarks = remarks; }
        btn.textContent = "Saving…";
        const result = await postToSheet("updateMilestone", { milestoneId: mid, status, progress, remarks });
        btn.textContent = result.success ? "Saved ✓" : "Failed";
        setTimeout(() => renderProgressTab(el, project), 600);
      });
    });
  }
}

/* ---------- Budget tab — editable only for Accounts (Mansoor) ---------- */
function renderBudgetTab(el, project) {
  const canEdit = state.user.role === "accounts";
  const list = state.budgetCategories.filter((c) => c.project_id === project.id);
  const totalBudget = list.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalActual = list.reduce((s, c) => s + Number(c.actual || 0), 0);

  const rows = list.map((c) => {
    const variance = Number(c.budget) - Number(c.actual);
    const pct = Number(c.budget) ? Math.round((Number(c.actual) / Number(c.budget)) * 100) : 0;
    const pctStyle = pct > 100 ? "background:var(--bad-bg);color:var(--bad);" : pct > 85 ? "background:var(--warn-bg);color:var(--warn);" : "background:var(--good-bg);color:var(--good);";
    return `<tr data-cid="${c.id}">
      <td>${c.name}</td>
      <td class="right mono">${formatAED(c.budget)}</td>
      <td class="right mono">
        ${canEdit
          ? `<input class="c-actual" type="number" value="${c.actual}" style="width:110px;text-align:right;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.4rem;font-size:0.82rem;" />`
          : formatAED(c.actual)}
      </td>
      <td class="right mono" style="color:${variance < 0 ? "var(--bad)" : "var(--good)"}">${formatAED(variance)}</td>
      <td class="right"><span class="pct-pill" style="${pctStyle}">${pct}%</span></td>
      <td class="right">${canEdit ? `<button class="filter-btn save-budget" style="padding:0.25rem 0.6rem;">Save</button>` : ""}</td>
    </tr>`;
  }).join("");

  el.innerHTML = `<div class="card" style="padding:0;overflow-x:auto;">
    <h2 style="font-size:1rem;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">Budget vs Actual ${canEdit ? "" : "<span style='font-size:0.72rem;color:var(--graphite-400);font-weight:400;'>(read-only — Mansoor can edit)</span>"}</h2>
    <table>
      <thead><tr><th>Category</th><th class="right">Budget</th><th class="right">Actual</th><th class="right">Variance</th><th class="right">Spent %</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total</td><td class="right mono">${formatAED(totalBudget)}</td><td class="right mono">${formatAED(totalActual)}</td>
        <td class="right mono">${formatAED(totalBudget - totalActual)}</td><td class="right mono">${totalBudget ? Math.round((totalActual / totalBudget) * 100) : 0}%</td><td></td></tr></tfoot>
    </table>
  </div>`;

  if (canEdit) {
    el.querySelectorAll(".save-budget").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("[data-cid]");
        const cid = row.dataset.cid;
        const actual = row.querySelector(".c-actual").value;
        const c = state.budgetCategories.find((x) => x.id === cid);
        if (c) c.actual = actual;
        btn.textContent = "Saving…";
        const result = await postToSheet("updateBudget", { categoryId: cid, actual });
        btn.textContent = result.success ? "Saved ✓" : "Failed";
        setTimeout(() => renderBudgetTab(el, project), 600);
      });
    });
  }
}

function renderSuppliersTab(el) {
  el.innerHTML = `<div class="grid" style="grid-template-columns:1fr;gap:1rem;">
    ${MOCK_DATA.suppliers.map((s) => {
      const outstanding = s.invoiced - s.paid;
      return `<div class="card supplier-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div><h3 style="font-size:1rem;">${s.name}</h3><p style="font-size:0.78rem;color:var(--graphite-500);">${s.category}</p></div>
          <span class="pct-pill" style="${outstanding > 0 ? "background:var(--warn-bg);color:var(--warn);" : "background:var(--good-bg);color:var(--good);"}">${outstanding > 0 ? "Payment Due" : "Settled"}</span>
        </div>
        <div class="stat-grid">
          <div><p style="font-size:0.7rem;color:var(--graphite-400);">Contract</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(s.contract)}</p></div>
          <div><p style="font-size:0.7rem;color:var(--graphite-400);">Invoiced</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(s.invoiced)}</p></div>
          <div><p style="font-size:0.7rem;color:var(--graphite-400);">Paid</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(s.paid)}</p></div>
          <div><p style="font-size:0.7rem;color:var(--graphite-400);">Outstanding</p><p class="mono" style="font-size:0.85rem;font-weight:600;color:var(--bad);">${formatAED(outstanding)}</p></div>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderDocumentsTab(el) {
  el.innerHTML = `<div class="card" style="padding:0;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">
      <h2 style="font-size:1rem;">Documents</h2>
      <span style="font-size:0.82rem;color:var(--graphite-400);">🔍 Search files…</span>
    </div>
    <div class="folder-grid" style="padding:1.2rem;">
      ${MOCK_DATA.folders.map((f) => `<button class="folder-btn"><div style="font-size:1.5rem;">📁</div><p style="font-size:0.78rem;font-weight:500;margin-top:0.5rem;">${f}</p></button>`).join("")}
    </div>
    <div style="padding:0 1.2rem 1.2rem;"><div class="dropzone">⬆️ Drag and drop files, or click to upload</div></div>
  </div>`;
}

/* ---------------- Boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.route)));
});
