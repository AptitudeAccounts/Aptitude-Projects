/* ============================================================
   Aptitude Project Control — plain JS app (no build step)
   ============================================================
   Data comes from MOCK_DATA below until USE_LIVE_DATA is turned on.
   Paste your Apps Script Web App URL into SHEETS_API_URL below.
   ============================================================ */

const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzpCuePxK8Mi8l_l5QH8tRrvPRFmqe3TkxhQsz1RJduCgdjMTF5SE6nxxKivlzvTUt6/exec";
const USE_LIVE_DATA = true;

function formatAED(n) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(Number(n) || 0);
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function escapeHtml(str) {
  const d = document.createElement("div");
  d.innerText = str == null ? "" : String(str);
  return d.innerHTML;
}
/** Never let a blank/missing field render as the literal word "undefined". */
function safe(val, fallback) {
  return val !== undefined && val !== null && String(val).trim() !== "" ? val : (fallback !== undefined ? fallback : "—");
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
/** Large files (big photos, scanned PDFs) can be slow enough to time out Apps Script. Warn before attempting those. */
function checkFileSize_(file, maxMB = 8) {
  if (file.size > maxMB * 1024 * 1024) {
    showBanner(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — files over ${maxMB}MB often fail to upload. Try compressing it first (or take the photo at a lower resolution).`);
    return false;
  }
  return true;
}

/* Guaranteed logo fallback: if assets/logo.jpg ever fails to load, show a styled text wordmark instead of a blank box. */
function handleLogoError(img) {
  const span = document.createElement("span");
  span.className = "logo-fallback";
  span.style.fontSize = img.style.height ? `calc(${img.style.height} * 1.1)` : "20px";
  span.style.padding = img.style.padding || "0";
  span.style.background = img.style.background || "transparent";
  span.style.borderRadius = img.style.borderRadius || "0";
  span.style.display = "inline-block";
  span.textContent = "APTITUDE";
  img.replaceWith(span);
}

/* ---------------- Mock data (used until Sheets is connected) ---------------- */
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
      if (i < doneCount) status = "done"; else if (i === doneCount) status = "in-progress";
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
    { id: "sup-mock-1", project_id: "prj-001", name: "BuildRight Contracting", category: "Fit-Out", contract_value: 380000 },
    { id: "sup-mock-2", project_id: "prj-001", name: "Al Noor Electrical", category: "Electrical", contract_value: 65000 },
  ],
  invoices: [{ id: "inv-mock-1", supplier_id: "sup-mock-1", invoice_no: "INV-2291", amount: 120000, invoice_date: "2026-06-01", file_url: "" }],
  payments: [{ id: "pay-mock-1", invoice_id: "inv-mock-1", amount: 80000, paid_date: "2026-06-10", receipt_url: "" }],
  documents: [],
  folders: ["Lease", "Contracts", "Design Drawings", "Municipality", "Invoices", "Purchase Orders", "Approvals", "Completion Photos", "Opening Photos", "Completion Certificate"],
};

let state = {
  user: { name: "Mohamed", role: "owner" },
  route: "dashboard", projectId: null, workspaceTab: "Overview", openFolder: null, openSupplierId: null,
  expandedKpi: null, notifOpen: false, editingSupplierId: null,
  projects: [], milestones: [], budgetCategories: [], remarks: [], suppliers: [], invoices: [], payments: [], documents: [],
};

/* ---------------- Data loading + saving (Google Sheets + Drive bridge) ---------------- */
/** Retries a fetch a couple of times before giving up — Apps Script occasionally responds slowly or hiccups on the first try. */
async function fetchWithRetry_(url, options, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      return res;
    } catch (e) {
      lastError = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function loadAllData() {
  if (!USE_LIVE_DATA || !SHEETS_API_URL) return { ...MOCK_DATA };
  try {
    const res = await fetchWithRetry_(SHEETS_API_URL);
    const data = await res.json();
    return {
      projects: data.projects || [], milestones: data.milestones || [], budgetCategories: data.budgetCategories || [],
      remarks: data.remarks || [], suppliers: data.suppliers || [], invoices: data.invoices || [],
      payments: data.payments || [], documents: data.documents || [],
    };
  } catch (e) {
    console.error("Failed to load live data after retrying, falling back to mock data:", e);
    showBanner(`Couldn't load your Google Sheet after a few tries (${e.message || e}) — showing sample data. Try refreshing the page.`);
    return { ...MOCK_DATA };
  }
}
async function postToSheet(action, payload) {
  if (!USE_LIVE_DATA || !SHEETS_API_URL) { console.log("(offline mode)", action, payload); return { success: true, offline: true }; }
  try {
    const res = await fetchWithRetry_(SHEETS_API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }) });
    const result = await res.json();
    if (!result.success) {
      console.error("Save failed:", action, result.error);
      showBanner(`Couldn't save that (${result.error || "unknown error"}) — check the Sheet tab/headers for this, then try again.`);
    }
    return result;
  } catch (e) {
    console.error("Save failed after retrying:", e);
    showBanner(`Couldn't reach the server to save that, even after a few tries (${e.message || e}). Check your connection and try again.`);
    return { success: false, error: String(e) };
  }
}
/** A small dismissible banner instead of a blocking alert() — so a network hiccup doesn't interrupt typing. */
function showBanner(message) {
  let banner = document.getElementById("error-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "error-banner";
    banner.className = "error-banner";
    document.body.appendChild(banner);
  }
  banner.innerHTML = `<span>⚠️ ${escapeHtml(message)}</span><button id="error-banner-close">✕</button>`;
  banner.classList.add("visible");
  document.getElementById("error-banner-close").addEventListener("click", () => banner.classList.remove("visible"));
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => banner.classList.remove("visible"), 10000);
}

async function refreshData() {
  const data = await loadAllData();
  Object.assign(state, data);
  updateNotifBadge();
}

/* ---------------- Status badge helper ---------------- */
const STATUS_LABEL = { "on-track": "On Track", attention: "Attention", delayed: "Delayed", completed: "Completed" };
function badge(status) { return `<span class="badge ${status}"><span class="dot"></span>${STATUS_LABEL[status] || status}</span>`; }
function typeStyle(type) {
  if (type === "order") return "background:var(--warn-bg);color:var(--warn);";
  if (type === "question") return "background:var(--bad-bg);color:var(--bad);";
  return "background:var(--graphite-100);color:var(--graphite-600);";
}

/* ---------------- Login / Logout ---------------- */
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
    if (expected && enteredCode === expected.code) { errorEl.style.display = "none"; enterApp(); }
    else { errorEl.style.display = "block"; }
  });
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("bell-btn").addEventListener("click", toggleNotifPanel);
}

const SESSION_KEY = "aptitude_session";

async function enterApp() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
  document.getElementById("view-login").style.display = "none";
  document.getElementById("app-shell").classList.add("active");
  const title = USER_CODES[state.user.name]?.title || state.user.name;
  document.getElementById("sidebar-user-name").textContent = state.user.name;
  document.getElementById("sidebar-user-role").textContent = title;
  document.getElementById("sidebar-user-avatar").textContent = state.user.name.slice(0, 2).toUpperCase();
  document.getElementById("content").innerHTML = `<p class="loading-note">Loading data…</p>`;
  await refreshData();
  navigate("dashboard");
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  document.getElementById("app-shell").classList.remove("active");
  document.getElementById("view-login").style.display = "flex";
  document.getElementById("login-password").value = "";
  document.getElementById("login-error").style.display = "none";
}
/** Restores a saved session on page load, so refreshing doesn't log you out. */
function restoreSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (saved && saved.name && USER_CODES[saved.name]) {
      state.user = saved;
      enterApp();
      return true;
    }
  } catch (e) { /* ignore corrupt/old session data */ }
  return false;
}

/* ---------------- Live preview cards on the login screen ---------------- */
function el_(id) { return document.getElementById(id); }
function setText_(id, text) { const e = el_(id); if (e) e.textContent = text; }
function formatCompactAED_(n) {
  return "AED " + new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n) || 0);
}
const STATUS_BADGE_STYLE_ = {
  "on-track": ["On Track", "var(--good-bg)", "var(--good)"],
  attention: ["Attention", "var(--warn-bg)", "var(--warn)"],
  delayed: ["Delayed", "var(--bad-bg)", "var(--bad)"],
  completed: ["Completed", "var(--graphite-100)", "var(--graphite-600)"],
};
const REMARK_BADGE_STYLE_ = {
  order: ["ORDER", "var(--warn-bg)", "var(--warn)"],
  question: ["QUESTION", "var(--bad-bg)", "var(--bad)"],
  remark: ["REMARK", "var(--graphite-100)", "var(--graphite-600)"],
};

/** Fills the login screen's rotating preview cards with real numbers from the Sheet, before anyone logs in. */
async function populateLoginPreviews() {
  if (!USE_LIVE_DATA || !SHEETS_API_URL) return; // no Sheet connected yet — leave the sample content as-is
  try {
    const data = await loadAllData();
    Object.assign(state, data);
    const projects = state.projects.map(computedProject);
    if (projects.length === 0) return;

    // Slide 1 — first 3 real projects
    projects.slice(0, 3).forEach((p, i) => {
      const n = i + 1;
      setText_(`lp-proj-${n}-name`, p.name);
      const badgeEl = el_(`lp-proj-${n}-badge`);
      if (badgeEl) {
        const [label, bg, fg] = STATUS_BADGE_STYLE_[p.status] || STATUS_BADGE_STYLE_["on-track"];
        badgeEl.textContent = label; badgeEl.style.background = bg; badgeEl.style.color = fg;
      }
      const barEl = el_(`lp-proj-${n}-bar`); if (barEl) barEl.style.width = `${p.completion}%`;
      setText_(`lp-proj-${n}-meta`, `${p.completion}% complete · Opening ${formatDate(p.openingDate)}`);
    });
    for (let n = projects.length + 1; n <= 3; n++) { const card = el_(`lp-proj-${n}`); if (card) card.style.display = "none"; }

    // Slide 2 — real totals + the supplier with the largest outstanding balance
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalOutstanding = projects.reduce((s, p) => s + Number(p.outstanding || 0), 0);
    setText_("lp-total-budget", formatCompactAED_(totalBudget));
    setText_("lp-total-budget-sub", `Across ${projects.length} active project${projects.length === 1 ? "" : "s"}`);
    setText_("lp-outstanding", formatCompactAED_(totalOutstanding));

    let bestSupplier = null, bestBalance = -1;
    state.suppliers.forEach((s) => {
      const invoices = state.invoices.filter((i) => i.supplier_id === s.id);
      const paid = invoices.reduce((sum, i) => sum + state.payments.filter((p) => p.invoice_id === i.id).reduce((s2, p) => s2 + Number(p.amount || 0), 0), 0);
      const balance = Number(s.contract_value || 0) - paid;
      if (balance > bestBalance) { bestBalance = balance; bestSupplier = { ...s, paid }; }
    });
    const supplierCard = el_("lp-supplier-card");
    if (bestSupplier && Number(bestSupplier.contract_value) > 0) {
      const pct = Math.min(100, Math.round((bestSupplier.paid / Number(bestSupplier.contract_value)) * 100));
      setText_("lp-supplier-name", `${safe(bestSupplier.category, "Supplier")} — ${safe(bestSupplier.name, "Unnamed")}`);
      const badgeEl = el_("lp-supplier-badge");
      if (badgeEl) {
        if (bestBalance > 0) { badgeEl.textContent = "Balance Due"; badgeEl.style.background = "var(--warn-bg)"; badgeEl.style.color = "var(--warn)"; }
        else { badgeEl.textContent = "Settled"; badgeEl.style.background = "var(--good-bg)"; badgeEl.style.color = "var(--good)"; }
      }
      const barEl = el_("lp-supplier-bar"); if (barEl) barEl.style.width = `${pct}%`;
      setText_("lp-supplier-meta", `${formatAED(bestSupplier.paid)} paid of ${formatAED(bestSupplier.contract_value)}`);
    } else if (supplierCard) { supplierCard.style.display = "none"; }

    // Slide 3 — 3 most recent real remarks, across all projects
    const recentRemarks = [...state.remarks].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
    recentRemarks.forEach((r, i) => {
      const n = i + 1;
      setText_(`lp-remark-${n}-author`, r.author || "Team");
      const badgeEl = el_(`lp-remark-${n}-badge`);
      if (badgeEl) {
        const [label, bg, fg] = REMARK_BADGE_STYLE_[r.type] || REMARK_BADGE_STYLE_.remark;
        badgeEl.textContent = label; badgeEl.style.background = bg; badgeEl.style.color = fg;
      }
      setText_(`lp-remark-${n}-text`, `"${r.text}"${r.tagged ? " — tagged " + r.tagged : ""}`);
    });
    for (let n = recentRemarks.length + 1; n <= 3; n++) { const card = el_(`lp-remark-${n}`); if (card) card.style.display = "none"; }
  } catch (e) {
    console.error("Couldn't load live preview data for login screen — showing sample content instead:", e);
  }
}

/* ---------------- Notifications (tagged remarks) ---------------- */
function getMyTaggedRemarks() {
  return state.remarks.filter((r) => (r.tagged || "").split(",").map((s) => s.trim()).includes(state.user.name)).slice().reverse();
}
function updateNotifBadge() {
  const mine = getMyTaggedRemarks();
  const badge = document.getElementById("bell-badge");
  if (mine.length > 0) { badge.textContent = mine.length; badge.classList.remove("hidden"); } else { badge.classList.add("hidden"); }
}
function toggleNotifPanel() {
  const panel = document.getElementById("notif-panel");
  state.notifOpen = !state.notifOpen;
  if (!state.notifOpen) { panel.classList.add("hidden"); return; }
  const mine = getMyTaggedRemarks();
  panel.innerHTML = mine.length === 0 ? `<p style="font-size:0.82rem;color:var(--graphite-400);">No notifications yet.</p>` :
    mine.map((r) => {
      const proj = state.projects.find((p) => p.id === r.project_id);
      return `<div class="notif-item"><span class="pct-pill" style="${typeStyle(r.type)}">${(r.type || "remark").toUpperCase()}</span>
        <p style="margin:0.3rem 0 0;">${escapeHtml(r.text)}</p>
        <p style="margin:2px 0 0;color:var(--graphite-400);">${r.author} on ${proj ? proj.name : "?"} · ${new Date(r.timestamp).toLocaleString()}</p></div>`;
    }).join("");
  panel.classList.remove("hidden");
}

/* ---------------- Navigation ---------------- */
function navigate(route, projectId) {
  state.route = route; state.projectId = projectId || null; state.workspaceTab = "Overview";
  state.openFolder = null; state.openSupplierId = null; state.expandedKpi = null; state.editingSupplierId = null;
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
  updateNotifBadge();
}

/* ---------------- Computed metrics (auto-calculated from Budget/Suppliers/Payments) ---------------- */
/**
 * A project's Budget, Spent, Outstanding and Completion are no longer typed in manually —
 * they're derived live from BudgetCategories, Suppliers, Invoices and Payments:
 *   Budget      = sum of that project's Budget Category amounts (falls back to the Projects sheet value if none entered yet)
 *   Spent       = sum of all Payments recorded against that project's suppliers
 *   Outstanding = sum of (Contract Value - Paid) across that project's suppliers
 *   Completion  = Spent ÷ Budget, capped at 100% (falls back to the Projects sheet value if Budget is 0)
 */
function getProjectMetrics(projectId) {
  const categories = state.budgetCategories.filter((c) => c.project_id === projectId);
  const suppliers = state.suppliers.filter((s) => s.project_id === projectId);

  const categoryBudgetSum = categories.reduce((s, c) => s + Number(c.budget || 0), 0);

  let spent = 0, outstanding = 0;
  suppliers.forEach((s) => {
    const invoices = state.invoices.filter((i) => i.supplier_id === s.id);
    const paidForSupplier = invoices.reduce((sum, inv) => {
      const pays = state.payments.filter((p) => p.invoice_id === inv.id);
      return sum + pays.reduce((s2, p) => s2 + Number(p.amount || 0), 0);
    }, 0);
    spent += paidForSupplier;
    outstanding += Math.max(0, Number(s.contract_value || 0) - paidForSupplier);
  });

  return { categoryBudgetSum, suppliers, spent, outstanding };
}

/** Merges a raw project row with its live-computed numbers for display. Original sheet row is untouched. */
function computedProject(project) {
  const m = getProjectMetrics(project.id);
  const budget = m.categoryBudgetSum > 0 ? m.categoryBudgetSum : Number(project.budget || 0);
  const spent = m.spent > 0 ? m.spent : Number(project.spent || 0);
  const outstanding = m.suppliers.length > 0 ? m.outstanding : Number(project.outstanding || 0);
  const completion = budget > 0 && m.spent > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : Number(project.completion || 0);
  return {
    ...project, budget, spent, outstanding, completion,
    name: safe(project.name, "(untitled project — check the Projects sheet)"),
    brand: safe(project.brand, "—"), location: safe(project.location, "—"), city: safe(project.city, "—"),
    manager: safe(project.manager, "Unassigned"), nextMilestone: safe(project.nextMilestone, "—"),
    riskLevel: safe(project.riskLevel, "Low"), status: safe(project.status, "on-track"),
  };
}

function renderDashboard(el) {
  const p = state.projects.map(computedProject);
  const totalBudget = p.reduce((s, x) => s + Number(x.budget || 0), 0);
  const totalSpent = p.reduce((s, x) => s + Number(x.spent || 0), 0);
  const totalOutstanding = p.reduce((s, x) => s + Number(x.outstanding || 0), 0);
  const active = p.filter((x) => x.status !== "completed");
  const completed = p.filter((x) => x.status === "completed");
  const recentRemarks = [...state.remarks].reverse().slice(0, 5);
  const nextOpening = [...p].filter((x) => x.status !== "completed").sort((a, b) => String(a.openingDate).localeCompare(String(b.openingDate)))[0];
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  el.innerHTML = `
    <div class="hero-banner">
      <div class="hero-inner">
        <div>
          <h1>${greeting}, ${state.user.name} 👋</h1>
          <p>${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${p.length} projects across the portfolio</p>
        </div>
        <div class="hero-stat">
          <p class="val">${nextOpening ? nextOpening.name : "—"}</p>
          <p class="lbl">Next Opening${nextOpening ? " · " + formatDate(nextOpening.openingDate) : ""}</p>
        </div>
      </div>
    </div>
    <div class="grid kpi-grid">
      ${kpiClickable("active", "Active Projects", active.length, "graphite")}
      ${kpiClickable("completed", "Completed", completed.length, "good")}
      ${kpiClickable("budget", "Total Budget", formatAED(totalBudget), "brass")}
      ${kpiClickable("spent", "Total Spent", formatAED(totalSpent), "graphite")}
      ${kpiClickable("remaining", "Remaining Budget", formatAED(totalBudget - totalSpent), "good")}
      ${kpiClickable("outstanding", "Outstanding Payments", formatAED(totalOutstanding), "bad")}
    </div>
    <div id="kpi-expand-panel"></div>
    <div class="grid two-col" style="margin-top:1.5rem;">
      <div class="card">
        <div class="section-title"><h2>Recent Projects</h2><a href="#" id="view-all-link">View all →</a></div>
        <div>${p.slice(0, 5).map((x) => `
          <div class="list-row" data-goto="${x.id}"><div class="left"><div class="pct-chip">${x.completion}%</div>
            <div><p class="name">${x.name}</p><p class="sub">${x.brand} · ${x.city}</p></div></div>${badge(x.status)}</div>`).join("")}</div>
      </div>
      <div class="card"><h2 style="font-size:1rem;">Project Status</h2><p style="font-size:0.78rem;color:var(--graphite-500);margin:0.2rem 0 0.6rem;">Portfolio breakdown</p><canvas id="statusChart" height="180"></canvas></div>
    </div>
    <div class="grid two-col" style="margin-top:1.5rem;">
      <div class="card"><h2 style="font-size:1rem;">Budget vs Actual</h2><p style="font-size:0.78rem;color:var(--graphite-500);margin:0.2rem 0 0.9rem;">Across all projects (AED)</p><canvas id="budgetChart" height="200"></canvas></div>
      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.9rem;">Recent Remarks &amp; Orders</h2>
        ${recentRemarks.length === 0 ? `<p style="font-size:0.82rem;color:var(--graphite-400);">Nothing posted yet.</p>` : recentRemarks.map((r) => {
          const proj = state.projects.find((x) => x.id === r.project_id);
          return `<div style="display:flex;gap:0.6rem;font-size:0.85rem;margin-bottom:0.8rem;">
            <span class="pct-pill" style="${typeStyle(r.type)}">${(r.type || "remark").toUpperCase()}</span>
            <div><p style="margin:0;">${escapeHtml(r.text)}</p><p style="margin:2px 0 0;font-size:0.72rem;color:var(--graphite-400);">${r.author} on ${proj ? proj.name : "?"} ${r.tagged ? "· tagged " + escapeHtml(r.tagged) : ""}</p></div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  el.querySelectorAll("[data-goto]").forEach((r) => r.addEventListener("click", () => navigate("workspace", r.dataset.goto)));
  document.getElementById("view-all-link").addEventListener("click", (e) => { e.preventDefault(); navigate("projects"); });
  el.querySelectorAll("[data-kpi]").forEach((card) => card.addEventListener("click", () => {
    state.expandedKpi = state.expandedKpi === card.dataset.kpi ? null : card.dataset.kpi;
    el.querySelectorAll("[data-kpi]").forEach((c) => c.classList.toggle("expanded", c.dataset.kpi === state.expandedKpi));
    renderKpiExpandPanel(p, totalBudget, totalSpent);
  }));
  drawStatusChart(p); drawBudgetChart(p);
  renderKpiExpandPanel(p, totalBudget, totalSpent);
}

function kpiClickable(key, label, value, accent) {
  const colors = { graphite: "background:var(--graphite-950);color:white;", brass: "background:var(--brass-500);color:var(--graphite-950);", good: "background:var(--good);color:white;", bad: "background:var(--bad);color:white;" };
  return `<div class="card kpi-card" data-kpi="${key}"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon" style="${colors[accent]}">●</span></div><p class="kpi-value mono">${value}</p></div>`;
}

function renderKpiExpandPanel(p, totalBudget, totalSpent) {
  const panel = document.getElementById("kpi-expand-panel");
  if (!state.expandedKpi) { panel.innerHTML = ""; return; }
  let title = "", rows = [];
  if (state.expandedKpi === "active") { title = "Active Projects"; rows = p.filter((x) => x.status !== "completed"); }
  if (state.expandedKpi === "completed") { title = "Completed Projects"; rows = p.filter((x) => x.status === "completed"); }
  if (state.expandedKpi === "outstanding") { title = "Projects With Outstanding Payments"; rows = p.filter((x) => Number(x.outstanding) > 0).sort((a, b) => Number(b.outstanding) - Number(a.outstanding)); }
  if (["budget", "spent", "remaining"].includes(state.expandedKpi)) { title = "Budget Breakdown by Project"; rows = p; }

  if (["budget", "spent", "remaining"].includes(state.expandedKpi)) {
    panel.innerHTML = `<div class="card expand-panel"><h3 style="font-size:0.95rem;margin-bottom:0.7rem;">${title}</h3>
      <table><thead><tr><th>Project</th><th class="right">Budget</th><th class="right">Spent</th><th class="right">Remaining</th></tr></thead>
      <tbody>${rows.map((x) => `<tr data-goto="${x.id}" style="cursor:pointer;"><td>${x.name}</td><td class="right mono">${formatAED(x.budget)}</td><td class="right mono">${formatAED(x.spent)}</td><td class="right mono">${formatAED(Number(x.budget) - Number(x.spent))}</td></tr>`).join("")}</tbody></table>
    </div>`;
  } else {
    panel.innerHTML = `<div class="card expand-panel"><h3 style="font-size:0.95rem;margin-bottom:0.7rem;">${title}</h3>
      ${rows.length === 0 ? `<p style="font-size:0.85rem;color:var(--graphite-400);">None right now.</p>` :
        rows.map((x) => `<div class="list-row" data-goto="${x.id}"><div class="left"><div class="pct-chip">${x.completion}%</div><div><p class="name">${x.name}</p><p class="sub">${x.brand} · ${x.city}</p></div></div>${badge(x.status)}</div>`).join("")}
    </div>`;
  }
  panel.querySelectorAll("[data-goto]").forEach((r) => r.addEventListener("click", () => navigate("workspace", r.dataset.goto)));
}

let statusChartInstance, budgetChartInstance;
function drawStatusChart(p) {
  const ctx = document.getElementById("statusChart"); if (!ctx) return;
  const counts = { "on-track": 0, attention: 0, delayed: 0, completed: 0 };
  p.forEach((x) => { if (counts[x.status] !== undefined) counts[x.status]++; });
  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(ctx, { type: "doughnut", data: { labels: ["On Track", "Attention", "Delayed", "Completed"], datasets: [{ data: Object.values(counts), backgroundColor: ["#1E9E6B", "#C98A1E", "#D14343", "#8892A4"], borderWidth: 0 }] }, options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 11 } } } }, cutout: "65%" } });
}
function drawBudgetChart(p) {
  const ctx = document.getElementById("budgetChart"); if (!ctx) return;
  if (budgetChartInstance) budgetChartInstance.destroy();
  budgetChartInstance = new Chart(ctx, { type: "bar", data: { labels: p.map((x) => x.name.split(" ")[0]), datasets: [{ label: "Budget", data: p.map((x) => Number(x.budget || 0)), backgroundColor: "#DCE1E8", borderRadius: 4 }, { label: "Spent", data: p.map((x) => Number(x.spent || 0)), backgroundColor: "#14181F", borderRadius: 4 }] }, options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 11 } } } }, scales: { y: { ticks: { callback: (v) => v / 1000 + "k" } } } } });
}

/* ---------------- Projects list (with Add New Project) ---------------- */
let activeFilter = "all";
let showAddProject = false;
function renderProjects(el) {
  const filters = [["all", "All"], ["on-track", "On Track"], ["attention", "Attention"], ["delayed", "Delayed"], ["completed", "Completed"]];
  const list = (activeFilter === "all" ? state.projects : state.projects.filter((p) => p.status === activeFilter)).map(computedProject);
  el.innerHTML = `
    <div class="section-card-header">
      <div class="filters">${filters.map(([v, l]) => `<button class="filter-btn ${activeFilter === v ? "active" : ""}" data-filter="${v}">${l}</button>`).join("")}</div>
      <button class="login-submit" id="toggle-add-project" style="width:auto;padding:0.5rem 1rem;margin:0;">+ Add New Project</button>
    </div>
    <div id="add-project-wrap"></div>
    <div class="grid project-grid">
      ${list.map((p) => `
        <div class="card project-card" data-goto="${p.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><p class="brand">${p.brand}</p><h3 class="pname">${p.name}</h3></div>${badge(p.status)}</div>
          <p class="loc">📍 ${p.location}, ${p.city}</p>
          <div style="margin-top:1rem;"><div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--graphite-500);"><span>Completion</span><span class="mono" style="font-weight:600;color:var(--graphite-900);">${p.completion}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${p.completion}%"></div></div></div>
          <div class="mini-grid"><div><p>Budget</p><p class="mono">${formatAED(p.budget)}</p></div><div><p>Spent</p><p class="mono">${formatAED(p.spent)}</p></div><div><p>Remaining</p><p class="mono">${formatAED(Number(p.budget) - Number(p.spent))}</p></div></div>
          <p style="font-size:0.75rem;color:var(--graphite-500);margin-top:0.9rem;">📅 Opening ${formatDate(p.openingDate)}</p>
        </div>`).join("")}
    </div>`;
  el.querySelectorAll("[data-goto]").forEach((r) => r.addEventListener("click", () => navigate("workspace", r.dataset.goto)));
  el.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { activeFilter = b.dataset.filter; renderProjects(el); }));
  document.getElementById("toggle-add-project").addEventListener("click", () => { showAddProject = !showAddProject; renderAddProjectForm(el); });
  renderAddProjectForm(el);
}

function renderAddProjectForm(el) {
  const wrap = document.getElementById("add-project-wrap");
  if (!showAddProject) { wrap.innerHTML = ""; return; }
  wrap.innerHTML = `
    <form id="add-project-form" class="collapsible-form">
      <div class="field-row">
        <input required id="np-name" placeholder="Project name" style="flex:2;min-width:180px;" />
        <input required id="np-brand" placeholder="Brand" style="flex:1;min-width:140px;" />
      </div>
      <div class="field-row">
        <input required id="np-location" placeholder="Location" style="flex:1;min-width:160px;" />
        <input required id="np-city" placeholder="City" style="width:140px;" />
        <input required id="np-manager" placeholder="Project Manager" style="flex:1;min-width:160px;" />
      </div>
      <div class="field-row">
        <select id="np-status"><option value="on-track">On Track</option><option value="attention">Attention</option><option value="delayed">Delayed</option><option value="completed">Completed</option></select>
        <input id="np-completion" type="number" min="0" max="100" placeholder="Completion %" style="width:130px;" />
        <select id="np-risk"><option value="Low">Low Risk</option><option value="Medium">Medium Risk</option><option value="High">High Risk</option></select>
      </div>
      <div class="field-row">
        <input required id="np-budget" type="number" placeholder="Budget (AED)" style="width:160px;" />
        <input id="np-spent" type="number" placeholder="Spent so far (AED)" style="width:160px;" />
        <input id="np-outstanding" type="number" placeholder="Outstanding (AED)" style="width:160px;" />
        <input required id="np-opening" type="date" style="width:160px;" />
      </div>
      <div class="field-row">
        <input id="np-nextmilestone" placeholder="Next milestone" style="flex:1;min-width:200px;" />
        <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1.1rem;margin:0;">Save Project</button>
      </div>
    </form>`;
  document.getElementById("add-project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const payload = {
      name: document.getElementById("np-name").value, brand: document.getElementById("np-brand").value,
      location: document.getElementById("np-location").value, city: document.getElementById("np-city").value,
      manager: document.getElementById("np-manager").value, status: document.getElementById("np-status").value,
      completion: document.getElementById("np-completion").value || 0, riskLevel: document.getElementById("np-risk").value,
      budget: document.getElementById("np-budget").value, spent: document.getElementById("np-spent").value || 0,
      outstanding: document.getElementById("np-outstanding").value || 0, openingDate: document.getElementById("np-opening").value,
      nextMilestone: document.getElementById("np-nextmilestone").value,
    };
    await postToSheet("addProject", payload);
    showAddProject = false;
    await refreshData();
    renderProjects(el);
  });
}

/* ---------------- Project workspace ---------------- */
let showEditProject = false;
function renderWorkspace(el) {
  const rawProject = state.projects.find((p) => p.id === state.projectId) || state.projects[0];
  if (!rawProject) { el.innerHTML = `<p class="loading-note">No project data yet.</p>`; return; }
  const project = computedProject(rawProject);
  const remaining = Number(project.budget) - Number(project.spent);
  const tabs = ["Overview", "Progress", "Budget", "Suppliers", "Documents", "Full Report"];
  el.innerHTML = `
    <div class="crumb"><a href="#" id="crumb-projects">Projects</a> › <b>${project.name}</b></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-top:0.3rem;">
      <div><div style="display:flex;align-items:center;gap:0.6rem;"><h1 style="font-size:1.3rem;">${project.name}</h1>${badge(project.status)}</div>
      <p style="color:var(--graphite-500);font-size:0.85rem;margin-top:0.3rem;">📍 ${project.location}, ${project.city} · ${project.brand}</p></div>
      <div style="display:flex;gap:0.5rem;">
        <button class="filter-btn" id="toggle-edit-project">✏️ Edit Project</button>
        <button class="filter-btn" id="delete-project-btn" style="color:var(--bad);">🗑️ Delete Project</button>
      </div>
    </div>
    <div id="edit-project-wrap"></div>
    <div class="tabs">${tabs.map((t) => `<button class="tab-btn ${state.workspaceTab === t ? "active" : ""}" data-tab="${t}">${t}</button>`).join("")}</div>
    <div id="tab-content" style="margin-top:1.5rem;"></div>`;
  document.getElementById("crumb-projects").addEventListener("click", (e) => { e.preventDefault(); navigate("projects"); });
  el.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.workspaceTab = b.dataset.tab; state.openFolder = null; state.openSupplierId = null; state.editingSupplierId = null; renderWorkspace(el); }));
  document.getElementById("toggle-edit-project").addEventListener("click", () => { showEditProject = !showEditProject; renderEditProjectForm(el, rawProject); });
  document.getElementById("delete-project-btn").addEventListener("click", async () => {
    const typed = prompt(`This permanently deletes "${project.name}" AND every milestone, budget category, supplier, invoice, payment, remark and document under it.\n\nType the project name exactly to confirm:`);
    if (typed !== project.name) { if (typed !== null) alert("Name didn't match — nothing was deleted."); return; }
    await postToSheet("deleteProject", { projectId: project.id });
    await refreshData();
    navigate("projects");
  });
  renderEditProjectForm(el, rawProject);

  const tabEl = document.getElementById("tab-content");
  if (state.workspaceTab === "Overview") renderOverviewTab(tabEl, project, remaining);
  if (state.workspaceTab === "Progress") renderProgressTab(tabEl, project);
  if (state.workspaceTab === "Budget") renderBudgetTab(tabEl, project);
  if (state.workspaceTab === "Suppliers") renderSuppliersTab(tabEl, project);
  if (state.workspaceTab === "Documents") renderDocumentsTab(tabEl, project);
  if (state.workspaceTab === "Full Report") renderFullReportTab(tabEl, project, remaining);
}

function renderEditProjectForm(el, project) {
  const wrap = document.getElementById("edit-project-wrap");
  if (!showEditProject) { wrap.innerHTML = ""; return; }
  wrap.innerHTML = `
    <form id="edit-project-form" class="collapsible-form">
      <p style="font-size:0.78rem;color:var(--graphite-500);margin-bottom:0.6rem;">Budget, Spent, Outstanding and Completion are auto-calculated from Budget Categories, Suppliers and Payments — edit those instead. Everything else here can be changed directly.</p>
      <div class="field-row">
        <input required id="ep-name" placeholder="Project name" value="${escapeHtml(project.name)}" style="flex:2;min-width:180px;" />
        <input required id="ep-brand" placeholder="Brand" value="${escapeHtml(project.brand)}" style="flex:1;min-width:140px;" />
      </div>
      <div class="field-row">
        <input required id="ep-location" placeholder="Location" value="${escapeHtml(project.location)}" style="flex:1;min-width:160px;" />
        <input required id="ep-city" placeholder="City" value="${escapeHtml(project.city)}" style="width:140px;" />
        <input required id="ep-manager" placeholder="Project Manager" value="${escapeHtml(project.manager)}" style="flex:1;min-width:160px;" />
      </div>
      <div class="field-row">
        <select id="ep-status">
          <option value="on-track" ${project.status === "on-track" ? "selected" : ""}>On Track</option>
          <option value="attention" ${project.status === "attention" ? "selected" : ""}>Attention</option>
          <option value="delayed" ${project.status === "delayed" ? "selected" : ""}>Delayed</option>
          <option value="completed" ${project.status === "completed" ? "selected" : ""}>Completed</option>
        </select>
        <select id="ep-risk">
          <option value="Low" ${project.riskLevel === "Low" ? "selected" : ""}>Low Risk</option>
          <option value="Medium" ${project.riskLevel === "Medium" ? "selected" : ""}>Medium Risk</option>
          <option value="High" ${project.riskLevel === "High" ? "selected" : ""}>High Risk</option>
        </select>
        <input required id="ep-opening" type="date" value="${project.openingDate ? String(project.openingDate).slice(0, 10) : ""}" style="width:160px;" />
      </div>
      <div class="field-row">
        <input id="ep-nextmilestone" placeholder="Next milestone" value="${escapeHtml(project.nextMilestone)}" style="flex:1;min-width:200px;" />
        <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1.1rem;margin:0;">Save Changes</button>
      </div>
    </form>`;
  document.getElementById("edit-project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const payload = {
      projectId: project.id,
      name: document.getElementById("ep-name").value, brand: document.getElementById("ep-brand").value,
      location: document.getElementById("ep-location").value, city: document.getElementById("ep-city").value,
      manager: document.getElementById("ep-manager").value, status: document.getElementById("ep-status").value,
      riskLevel: document.getElementById("ep-risk").value, openingDate: document.getElementById("ep-opening").value,
      nextMilestone: document.getElementById("ep-nextmilestone").value,
    };
    await postToSheet("updateProject", payload);
    showEditProject = false;
    await refreshData();
    renderWorkspace(el);
  });
}

/* ---------- Overview + Remarks (type + tagging) ---------- */
function renderOverviewTab(el, project, remaining) {
  const projectRemarks = state.remarks.filter((r) => r.project_id === project.id).slice().reverse();
  const others = Object.keys(USER_CODES).filter((n) => n !== state.user.name);
  el.innerHTML = `
    <div class="grid two-col">
      <div>
        <div class="card">
          <h2 style="font-size:1rem;margin-bottom:1rem;">Executive Summary</h2>
          <div class="grid" style="grid-template-columns:repeat(2,1fr);gap:1rem;">
            ${field("Project Manager", project.manager)}${field("Expected Opening", formatDate(project.openingDate))}${field("Risk Level", project.riskLevel)}${field("Next Milestone", project.nextMilestone)}
          </div>
          <div style="margin-top:1.2rem;"><div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--graphite-500);"><span>Overall Progress</span><span class="mono" style="font-weight:600;">${project.completion}%</span></div><div class="bar-bg" style="height:8px;"><div class="bar-fill" style="width:${project.completion}%"></div></div></div>
        </div>
        <div class="card" style="margin-top:1rem;">
          <h2 style="font-size:1rem;margin-bottom:1rem;">Remarks, Orders &amp; Questions</h2>
          <form id="remark-form">
            <div style="display:flex;gap:0.5rem;margin-bottom:0.6rem;flex-wrap:wrap;">
              <select id="remark-type" class="filter-btn" style="padding:0.4rem 0.6rem;">
                <option value="remark">Remark</option><option value="order">Issue Order</option><option value="question">Raise Question</option>
              </select>
              ${others.map((n) => `<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.8rem;color:var(--graphite-600);"><input type="checkbox" class="tag-check" value="${n}"> Tag ${n}</label>`).join("")}
            </div>
            <div style="display:flex;gap:0.5rem;">
              <input id="remark-input" type="text" placeholder="Write a remark, order, or question…" style="flex:1;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.85rem;" />
              <button type="submit" class="login-submit" style="width:auto;padding:0.55rem 1.1rem;margin:0;">Post</button>
            </div>
          </form>
          <div id="remarks-list" style="margin-top:1rem;">
            ${projectRemarks.length === 0 ? `<p style="font-size:0.82rem;color:var(--graphite-400);">No remarks yet.</p>` :
              projectRemarks.map((r) => `
                <div class="remark-row" data-remark-id="${r.id}" style="border-bottom:1px solid var(--graphite-50);padding:0.6rem 0;">
                  <div style="display:flex;gap:0.5rem;align-items:baseline;justify-content:space-between;">
                    <div style="display:flex;gap:0.5rem;align-items:baseline;"><span class="pct-pill" style="${typeStyle(r.type)}">${(r.type || "remark").toUpperCase()}</span><p style="font-size:0.85rem;margin:0;">${escapeHtml(r.text)}</p></div>
                    <button class="filter-btn delete-remark-btn" style="padding:0.1rem 0.4rem;color:var(--bad);font-size:0.7rem;">🗑️</button>
                  </div>
                  <p style="font-size:0.72rem;color:var(--graphite-400);margin:3px 0 0;">${r.author} (${r.role}) · ${new Date(r.timestamp).toLocaleString()} ${r.tagged ? "· tagged " + escapeHtml(r.tagged) : ""}</p>
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
    </div>`;
  document.getElementById("remark-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    const input = document.getElementById("remark-input");
    const text = input.value.trim(); if (!text) return;
    btn.disabled = true; btn.textContent = "Posting…";
    const type = document.getElementById("remark-type").value;
    const tagged = Array.from(el.querySelectorAll(".tag-check:checked")).map((c) => c.value).join(", ");
    input.value = "";
    await postToSheet("addRemark", { projectId: project.id, projectName: project.name, author: state.user.name, role: state.user.role, type, tagged, text });
    await refreshData();
    renderOverviewTab(el, computedProject(state.projects.find((p) => p.id === project.id)), remaining);
  });
  el.querySelectorAll(".delete-remark-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this remark? This can't be undone.")) return;
      const remarkId = btn.closest("[data-remark-id]").dataset.remarkId;
      await postToSheet("deleteRemark", { remarkId });
      await refreshData();
      renderOverviewTab(el, computedProject(state.projects.find((p) => p.id === project.id)), remaining);
    });
  });
}
function field(label, value) { return `<div><p style="font-size:0.72rem;color:var(--graphite-400);">${label}</p><p style="font-size:0.85rem;font-weight:500;margin-top:0.2rem;">${value}</p></div>`; }

/* ---------- Progress tab — everyone logged in can edit ---------- */
function renderProgressTab(el, project) {
  const icon = { done: "✅", "in-progress": "🟡", pending: "⚪" };
  const list = state.milestones.filter((m) => m.project_id === project.id);
  el.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <h2 style="font-size:1rem;margin-bottom:0.5rem;">Add Milestone</h2>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">
        ${MILESTONE_TEMPLATE.map((t) => `<button type="button" class="filter-btn preset-mile-btn" data-preset="${escapeHtml(t[0])}" style="padding:0.35rem 0.7rem;">+ ${t[0]}</button>`).join("")}
      </div>
      <form id="add-milestone-form" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <input required id="mile-name" placeholder="Milestone name" style="flex:1;min-width:180px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <input id="mile-owner" placeholder="Responsible person" style="flex:1;min-width:160px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <input id="mile-due" type="date" style="width:160px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1.1rem;margin:0;">Add Milestone</button>
      </form>
    </div>
    <div class="card" style="padding:0;">
      <div style="display:flex;justify-content:space-between;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">
        <h2 style="font-size:1rem;">Milestone Checklist</h2><p style="font-size:0.78rem;color:var(--graphite-500);">${list.filter((m) => m.status === "done").length}/${list.length} complete</p>
      </div>
      <div style="padding:0 1.2rem;">
        ${list.length === 0 ? `<p style="font-size:0.85rem;color:var(--graphite-400);padding:1rem 0;">No milestones yet — add one above.</p>` : list.map((m) => `
          <div class="milestone-row" data-mid="${m.id}">
            <div class="left"><span>${icon[m.status] || "⚪"}</span><div><p style="font-size:0.87rem;font-weight:500;margin:0;">${escapeHtml(safe(m.name, "(untitled milestone)"))}</p><p style="font-size:0.75rem;color:var(--graphite-500);margin:2px 0 0;">${escapeHtml(safe(m.owner, "Unassigned"))} · Due ${formatDate(m.due)}</p></div></div>
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <select class="m-status filter-btn" style="padding:0.3rem 0.5rem;">
                <option value="pending" ${m.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="in-progress" ${m.status === "in-progress" ? "selected" : ""}>In Progress</option>
                <option value="done" ${m.status === "done" ? "selected" : ""}>Done</option>
              </select>
              <input class="m-progress" type="number" min="0" max="100" value="${m.progress || 0}" style="width:60px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.4rem;font-size:0.8rem;" />
              <input class="m-remarks" type="text" placeholder="Notes…" value="${escapeHtml(m.remarks || "")}" style="width:140px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.5rem;font-size:0.8rem;" />
              <button class="filter-btn save-milestone" style="padding:0.3rem 0.7rem;">Save</button>
              <button class="filter-btn delete-milestone" style="padding:0.3rem 0.6rem;color:var(--bad);">🗑️</button>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  el.querySelectorAll(".preset-mile-btn").forEach((b) => b.addEventListener("click", () => { document.getElementById("mile-name").value = b.dataset.preset; }));
  document.getElementById("add-milestone-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("mile-name").value.trim();
    if (!name) return;
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const owner = document.getElementById("mile-owner").value.trim();
    const due = document.getElementById("mile-due").value;
    await postToSheet("addMilestone", { projectId: project.id, name, owner, due });
    await refreshData(); renderProgressTab(el, project);
  });
  el.querySelectorAll(".delete-milestone").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mid = btn.closest("[data-mid]").dataset.mid;
      if (!confirm("Delete this milestone? This can't be undone.")) return;
      await postToSheet("deleteMilestone", { milestoneId: mid });
      await refreshData(); renderProgressTab(el, project);
    });
  });
  el.querySelectorAll(".save-milestone").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("[data-mid]"); const mid = row.dataset.mid;
      const status = row.querySelector(".m-status").value, progress = row.querySelector(".m-progress").value, remarks = row.querySelector(".m-remarks").value;
      const m = state.milestones.find((x) => x.id === mid); if (m) { m.status = status; m.progress = progress; m.remarks = remarks; }
      btn.textContent = "Saving…";
      const result = await postToSheet("updateMilestone", { milestoneId: mid, status, progress, remarks });
      btn.textContent = result.success ? "Saved ✓" : "Failed";
      setTimeout(() => renderProgressTab(el, project), 600);
    });
  });
}

/* ---------- Budget tab — everyone logged in can edit ---------- */
const BUDGET_CATEGORY_PRESETS = ["Designer Contract", "Outfit Contract", "Equipment Contract", "Printing and Related"];

function renderBudgetTab(el, project) {
  const list = state.budgetCategories.filter((c) => c.project_id === project.id);
  const totalBudget = list.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalActual = list.reduce((s, c) => s + Number(c.actual || 0), 0);
  const rows = list.map((c) => {
    const variance = Number(c.budget) - Number(c.actual);
    const pct = Number(c.budget) ? Math.round((Number(c.actual) / Number(c.budget)) * 100) : 0;
    const pctStyle = pct > 100 ? "background:var(--bad-bg);color:var(--bad);" : pct > 85 ? "background:var(--warn-bg);color:var(--warn);" : "background:var(--good-bg);color:var(--good);";
    return `<tr data-cid="${c.id}"><td>${c.name}</td><td class="right mono">${formatAED(c.budget)}</td>
      <td class="right mono"><input class="c-actual" type="number" value="${c.actual}" style="width:110px;text-align:right;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.25rem 0.4rem;font-size:0.82rem;" /></td>
      <td class="right mono" style="color:${variance < 0 ? "var(--bad)" : "var(--good)"}">${formatAED(variance)}</td>
      <td class="right"><span class="pct-pill" style="${pctStyle}">${pct}%</span></td>
      <td class="right"><button class="filter-btn save-budget" style="padding:0.25rem 0.6rem;">Save</button></td>
      <td class="right"><button class="filter-btn delete-budget" style="padding:0.25rem 0.5rem;color:var(--bad);">🗑️</button></td></tr>`;
  }).join("");

  el.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <h2 style="font-size:1rem;margin-bottom:0.5rem;">Add Budget Category</h2>
      <p style="font-size:0.78rem;color:var(--graphite-500);margin-bottom:0.7rem;">This project's Total Budget on the Dashboard is the sum of every category below — add one for each contract or cost line.</p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">
        ${BUDGET_CATEGORY_PRESETS.map((name) => `<button type="button" class="filter-btn preset-cat-btn" data-preset="${name}" style="padding:0.35rem 0.7rem;">+ ${name}</button>`).join("")}
      </div>
      <form id="add-category-form" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <input required id="cat-name" placeholder="Category name" style="flex:1;min-width:180px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <input required id="cat-budget" type="number" placeholder="Budget amount (AED)" style="width:180px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1.1rem;margin:0;">Add Category</button>
      </form>
    </div>
    <div class="card" style="padding:0;overflow-x:auto;">
      <h2 style="font-size:1rem;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">Budget vs Actual</h2>
      <table><thead><tr><th>Category</th><th class="right">Budget</th><th class="right">Actual</th><th class="right">Variance</th><th class="right">Spent %</th><th></th><th></th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Total</td><td class="right mono">${formatAED(totalBudget)}</td><td class="right mono">${formatAED(totalActual)}</td><td class="right mono">${formatAED(totalBudget - totalActual)}</td><td class="right mono">${totalBudget ? Math.round((totalActual / totalBudget) * 100) : 0}%</td><td></td><td></td></tr></tfoot>
      </table>
    </div>`;

  el.querySelectorAll(".preset-cat-btn").forEach((b) => b.addEventListener("click", () => { document.getElementById("cat-name").value = b.dataset.preset; }));
  document.getElementById("add-category-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cat-name").value.trim();
    if (!name) return;
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const budget = document.getElementById("cat-budget").value;
    await postToSheet("addBudgetCategory", { projectId: project.id, name, budget });
    await refreshData(); renderBudgetTab(el, project);
  });
  el.querySelectorAll(".save-budget").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("[data-cid]"); const cid = row.dataset.cid;
      const actual = row.querySelector(".c-actual").value;
      const c = state.budgetCategories.find((x) => x.id === cid); if (c) c.actual = actual;
      btn.textContent = "Saving…";
      const result = await postToSheet("updateBudget", { categoryId: cid, actual });
      btn.textContent = result.success ? "Saved ✓" : "Failed";
      setTimeout(() => renderBudgetTab(el, project), 600);
    });
  });
  el.querySelectorAll(".delete-budget").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cid = btn.closest("[data-cid]").dataset.cid;
      if (!confirm("Delete this budget category? This can't be undone.")) return;
      await postToSheet("deleteBudgetCategory", { categoryId: cid });
      await refreshData(); renderBudgetTab(el, project);
    });
  });
}

/* ---------- Suppliers tab — Statement of Account per supplier ---------- */
function renderSuppliersTab(el, project) {
  const suppliers = state.suppliers.filter((s) => s.project_id === project.id);
  const categoryNames = state.budgetCategories.filter((c) => c.project_id === project.id).map((c) => c.name);
  el.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <h2 style="font-size:1rem;margin-bottom:0.8rem;">Add Supplier</h2>
      <form id="add-supplier-form" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <input required id="sup-name" placeholder="Supplier name" style="flex:1;min-width:160px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <input required id="sup-category" list="category-options" placeholder="Category (matches a Budget Category)" style="flex:1;min-width:200px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <datalist id="category-options">${categoryNames.map((n) => `<option value="${escapeHtml(n)}">`).join("")}</datalist>
        <input required id="sup-contract" type="number" placeholder="Contract value (AED)" style="width:160px;border:1px solid var(--graphite-200);border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.85rem;" />
        <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1.1rem;margin:0;">Add</button>
      </form>
      <p style="font-size:0.75rem;color:var(--graphite-400);margin-top:0.5rem;">Type a category that matches one on the Budget tab (e.g. "Outfit Contract") to group this supplier under it below.</p>
    </div>
    <div id="supplier-list"></div>`;
  document.getElementById("add-supplier-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("sup-name").value.trim();
    if (!name) return;
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const category = document.getElementById("sup-category").value.trim() || "Other";
    const contractValue = document.getElementById("sup-contract").value;
    await postToSheet("addSupplier", { projectId: project.id, name, category, contractValue });
    await refreshData(); renderSuppliersTab(el, project);
  });
  renderSupplierList(el, project, suppliers);
}
function renderSupplierList(el, project, suppliers) {
  const listEl = document.getElementById("supplier-list");
  if (suppliers.length === 0) { listEl.innerHTML = `<p style="font-size:0.85rem;color:var(--graphite-400);">No suppliers added yet.</p>`; return; }

  // Group suppliers by category so this reads as a per-category spend report.
  const groups = {};
  suppliers.forEach((s) => { const key = (s.category && String(s.category).trim()) || "Uncategorised"; (groups[key] = groups[key] || []).push(s); });

  listEl.innerHTML = Object.keys(groups).map((catName) => {
    const catSuppliers = groups[catName];
    return `<div style="margin-bottom:1.4rem;">
      <h3 style="font-size:0.9rem;color:var(--brass-600);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.6rem;">${escapeHtml(catName)}</h3>
      <div class="grid" style="grid-template-columns:1fr;gap:1rem;">
        ${catSuppliers.map((s) => {
          const supplierName = s.name && String(s.name).trim() ? s.name : "(unnamed supplier)";
          const invoices = state.invoices.filter((i) => i.supplier_id === s.id);
          const invoiceTotal = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
          const paidTotal = invoices.reduce((sum, i) => { const pays = state.payments.filter((p) => p.invoice_id === i.id); return sum + pays.reduce((s2, p) => s2 + Number(p.amount || 0), 0); }, 0);
          const balance = Number(s.contract_value || 0) - paidTotal;
          const isOpen = state.openSupplierId === s.id;
          const isEditing = state.editingSupplierId === s.id;
          return `<div class="card supplier-card" data-supplier-row="${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="cursor:pointer;flex:1;" data-toggle-supplier="${s.id}">
                <h3 style="font-size:1rem;">${escapeHtml(supplierName)} ${isOpen ? "▾" : "▸"}</h3><p style="font-size:0.78rem;color:var(--graphite-500);">${escapeHtml(catName)}</p>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span class="pct-pill" style="${balance > 0 ? "background:var(--warn-bg);color:var(--warn);" : "background:var(--good-bg);color:var(--good);"}">${balance > 0 ? "Balance Due" : "Settled"}</span>
                <button class="filter-btn edit-supplier-btn" data-id="${s.id}" style="padding:0.2rem 0.5rem;">${isEditing ? "✕" : "✏️"}</button>
                <button class="filter-btn delete-supplier-btn" data-id="${s.id}" style="padding:0.2rem 0.5rem;color:var(--bad);">🗑️</button>
              </div>
            </div>
            ${isEditing ? `
              <form class="edit-supplier-form" data-id="${s.id}" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.7rem;padding-top:0.7rem;border-top:1px solid var(--graphite-100);">
                <input class="es-name" value="${escapeHtml(s.name || "")}" placeholder="Supplier name" style="flex:1;min-width:140px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.4rem 0.6rem;font-size:0.8rem;" />
                <input class="es-category" value="${escapeHtml(s.category || "")}" placeholder="Category" style="flex:1;min-width:140px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.4rem 0.6rem;font-size:0.8rem;" />
                <input class="es-contract" type="number" value="${Number(s.contract_value || 0)}" placeholder="Contract value" style="width:150px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.4rem 0.6rem;font-size:0.8rem;" />
                <button type="submit" class="login-submit" style="width:auto;padding:0.4rem 0.9rem;margin:0;">Save</button>
              </form>` : `
              <div class="stat-grid">
                <div><p style="font-size:0.7rem;color:var(--graphite-400);">Contract Amount</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(s.contract_value)}</p></div>
                <div><p style="font-size:0.7rem;color:var(--graphite-400);">Invoiced</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(invoiceTotal)}</p></div>
                <div><p style="font-size:0.7rem;color:var(--graphite-400);">Payment Done</p><p class="mono" style="font-size:0.85rem;font-weight:600;">${formatAED(paidTotal)}</p></div>
                <div><p style="font-size:0.7rem;color:var(--graphite-400);">Balance Yet to Pay</p><p class="mono" style="font-size:0.85rem;font-weight:600;color:var(--bad);">${formatAED(balance)}</p></div>
              </div>`}
            ${isOpen && !isEditing ? renderSupplierDetail(project, s, invoices) : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");

  listEl.querySelectorAll("[data-toggle-supplier]").forEach((row) => {
    row.addEventListener("click", () => { state.openSupplierId = state.openSupplierId === row.dataset.toggleSupplier ? null : row.dataset.toggleSupplier; renderSupplierList(el, project, suppliers); attachSupplierDetailHandlers(el, project); });
  });
  listEl.querySelectorAll(".edit-supplier-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); state.editingSupplierId = state.editingSupplierId === btn.dataset.id ? null : btn.dataset.id; renderSupplierList(el, project, suppliers); attachSupplierDetailHandlers(el, project); });
  });
  listEl.querySelectorAll(".delete-supplier-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this supplier along with ALL its invoices and payments? This can't be undone.")) return;
      await postToSheet("deleteSupplier", { supplierId: btn.dataset.id });
      await refreshData(); renderSuppliersTab(el, project);
    });
  });
  listEl.querySelectorAll(".edit-supplier-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = "Saving…";
      const supplierId = form.dataset.id;
      const name = form.querySelector(".es-name").value.trim();
      const category = form.querySelector(".es-category").value.trim();
      const contractValue = form.querySelector(".es-contract").value;
      await postToSheet("updateSupplier", { supplierId, name, category, contractValue });
      state.editingSupplierId = null;
      await refreshData();
      renderSuppliersTab(el, project);
    });
  });
  attachSupplierDetailHandlers(el, project);
}
function renderSupplierDetail(project, supplier, invoices) {
  return `<div style="border-top:1px solid var(--graphite-100);margin-top:0.9rem;padding-top:0.9rem;">
    <h4 style="font-size:0.85rem;margin-bottom:0.6rem;">Statement of Account — Invoices &amp; Payments</h4>
    ${invoices.length === 0 ? `<p style="font-size:0.8rem;color:var(--graphite-400);">No invoices yet.</p>` :
      invoices.map((inv) => {
        const pays = state.payments.filter((p) => p.invoice_id === inv.id);
        const paid = pays.reduce((s, p) => s + Number(p.amount || 0), 0);
        return `<div style="border:1px solid var(--graphite-100);border-radius:0.6rem;padding:0.7rem;margin-bottom:0.6rem;">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
            <p style="font-size:0.85rem;font-weight:600;margin:0;">Invoice ${escapeHtml(inv.invoice_no)} — ${formatAED(inv.amount)}</p>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <p style="font-size:0.75rem;color:var(--graphite-500);margin:0;">${formatDate(inv.invoice_date)} ${inv.file_url ? `· <a href="${inv.file_url}" target="_blank" style="color:var(--brass-600);">View invoice</a>` : ""}</p>
              <button class="filter-btn delete-invoice-btn" data-id="${inv.id}" style="padding:0.15rem 0.4rem;color:var(--bad);font-size:0.7rem;">🗑️</button>
            </div>
          </div>
          <p style="font-size:0.78rem;color:var(--graphite-500);margin:0.3rem 0 0;">Paid: <b class="mono">${formatAED(paid)}</b> · Balance: <b class="mono">${formatAED(Number(inv.amount) - paid)}</b></p>
          ${pays.map((p) => `<p style="font-size:0.75rem;color:var(--graphite-600);margin:0.2rem 0 0;display:flex;align-items:center;gap:0.4rem;">💳 ${formatAED(p.amount)} on ${formatDate(p.paid_date)} ${p.receipt_url ? `· <a href="${p.receipt_url}" target="_blank" style="color:var(--brass-600);">Bank receipt</a>` : "(no receipt attached)"} <button class="filter-btn delete-payment-btn" data-id="${p.id}" style="padding:0.1rem 0.35rem;color:var(--bad);font-size:0.68rem;">🗑️</button></p>`).join("")}
          <form class="add-payment-form" data-invoice="${inv.id}" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.5rem;">
            <input type="number" class="pay-amount" placeholder="Amount paid" required style="width:120px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.3rem 0.5rem;font-size:0.78rem;" />
            <input type="date" class="pay-date" required style="border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.3rem 0.5rem;font-size:0.78rem;" />
            <input type="file" class="pay-receipt" style="font-size:0.75rem;" />
            <button type="submit" class="filter-btn" style="padding:0.3rem 0.6rem;">Record Payment</button>
          </form>
        </div>`;
      }).join("")}
    <form class="add-invoice-form" data-supplier="${supplier.id}" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.5rem;">
      <input type="text" class="inv-no" placeholder="Invoice #" required style="width:110px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.3rem 0.5rem;font-size:0.78rem;" />
      <input type="number" class="inv-amount" placeholder="Amount" required style="width:110px;border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.3rem 0.5rem;font-size:0.78rem;" />
      <input type="date" class="inv-date" required style="border:1px solid var(--graphite-200);border-radius:0.4rem;padding:0.3rem 0.5rem;font-size:0.78rem;" />
      <input type="file" class="inv-file" style="font-size:0.75rem;" />
      <button type="submit" class="filter-btn" style="padding:0.3rem 0.6rem;">Add Invoice</button>
    </form>
  </div>`;
}
function attachSupplierDetailHandlers(el, project) {
  el.querySelectorAll(".add-invoice-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = "Saving…";
      const supplierId = form.dataset.supplier;
      const invoiceNo = form.querySelector(".inv-no").value, amount = form.querySelector(".inv-amount").value, invoiceDate = form.querySelector(".inv-date").value;
      const fileInput = form.querySelector(".inv-file");
      let fileBase64 = "", fileName = "", mimeType = "";
      if (fileInput.files[0]) {
        if (!checkFileSize_(fileInput.files[0])) { btn.disabled = false; btn.textContent = "Add Invoice"; return; }
        fileBase64 = await fileToBase64(fileInput.files[0]); fileName = fileInput.files[0].name; mimeType = fileInput.files[0].type;
      }
      await postToSheet("addInvoice", { supplierId, invoiceNo, amount, invoiceDate, projectName: project.name, fileBase64, fileName, mimeType });
      await refreshData(); renderSuppliersTab(el, project);
    });
  });
  el.querySelectorAll(".add-payment-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = "Saving…";
      const invoiceId = form.dataset.invoice;
      const amount = form.querySelector(".pay-amount").value, paidDate = form.querySelector(".pay-date").value;
      const fileInput = form.querySelector(".pay-receipt");
      let fileBase64 = "", fileName = "", mimeType = "";
      if (fileInput.files[0]) {
        if (!checkFileSize_(fileInput.files[0])) { btn.disabled = false; btn.textContent = "Record Payment"; return; }
        fileBase64 = await fileToBase64(fileInput.files[0]); fileName = fileInput.files[0].name; mimeType = fileInput.files[0].type;
      }
      await postToSheet("addPayment", { invoiceId, amount, paidDate, projectName: project.name, fileBase64, fileName, mimeType });
      await refreshData(); renderSuppliersTab(el, project);
    });
  });
  el.querySelectorAll(".delete-invoice-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this invoice along with any payments recorded against it? This can't be undone.")) return;
      await postToSheet("deleteInvoice", { invoiceId: btn.dataset.id });
      await refreshData(); renderSuppliersTab(el, project);
    });
  });
  el.querySelectorAll(".delete-payment-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this payment record? This can't be undone.")) return;
      await postToSheet("deletePayment", { paymentId: btn.dataset.id });
      await refreshData(); renderSuppliersTab(el, project);
    });
  });
}

/* ---------- Documents tab — folders + real upload to Drive ---------- */
function renderDocumentsTab(el, project) {
  if (state.openFolder) {
    const files = state.documents.filter((d) => d.project_id === project.id && d.folder === state.openFolder);
    el.innerHTML = `<div class="card" style="padding:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);">
        <h2 style="font-size:1rem;">📁 ${state.openFolder}</h2><button class="link-btn" id="back-to-folders">← Back to folders</button>
      </div>
      <div style="padding:1.2rem;">
        <form id="upload-form" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">
          <input type="file" id="doc-file" required style="font-size:0.85rem;" />
          <button type="submit" class="login-submit" style="width:auto;padding:0.5rem 1rem;margin:0;">Upload</button>
        </form>
        ${files.length === 0 ? `<p style="font-size:0.85rem;color:var(--graphite-400);">No files uploaded to this folder yet.</p>` :
          files.map((f) => `<div class="doc-row" data-doc-id="${f.id}" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--graphite-50);font-size:0.85rem;"><a href="${f.file_url}" target="_blank" style="color:var(--brass-600);">${escapeHtml(f.file_name)}</a><div style="display:flex;align-items:center;gap:0.6rem;"><span style="color:var(--graphite-400);font-size:0.75rem;">${f.uploaded_by} · ${formatDate(f.uploaded_at)}</span><button class="filter-btn delete-doc-btn" style="padding:0.15rem 0.4rem;color:var(--bad);font-size:0.7rem;">🗑️</button></div></div>`).join("")}
      </div>
    </div>`;
    document.getElementById("back-to-folders").addEventListener("click", () => { state.openFolder = null; renderDocumentsTab(el, project); });
    document.getElementById("upload-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("doc-file");
      if (!fileInput.files[0]) return;
      const btn = e.target.querySelector("button");
      if (btn.disabled) return;
      if (!checkFileSize_(fileInput.files[0])) return;
      btn.disabled = true; btn.textContent = "Uploading…";
      const fileBase64 = await fileToBase64(fileInput.files[0]);
      await postToSheet("uploadDocument", { projectId: project.id, projectName: project.name, folder: state.openFolder, fileName: fileInput.files[0].name, mimeType: fileInput.files[0].type, fileBase64, uploadedBy: state.user.name });
      await refreshData(); renderDocumentsTab(el, project);
    });
    el.querySelectorAll(".delete-doc-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this file from the list? (The file itself stays safely in Google Drive — this only removes it from the dashboard.)")) return;
        const docId = btn.closest("[data-doc-id]").dataset.docId;
        await postToSheet("deleteDocument", { documentId: docId });
        await refreshData(); renderDocumentsTab(el, project);
      });
    });
    return;
  }
  el.innerHTML = `<div class="card" style="padding:0;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.2rem;border-bottom:1px solid var(--graphite-100);"><h2 style="font-size:1rem;">Documents</h2></div>
    <div class="folder-grid" style="padding:1.2rem;">
      ${MOCK_DATA.folders.map((f) => {
        const count = state.documents.filter((d) => d.project_id === project.id && d.folder === f).length;
        return `<button class="folder-btn" data-open-folder="${f}"><div style="font-size:1.5rem;">📁</div><p style="font-size:0.78rem;font-weight:500;margin-top:0.5rem;">${f}</p><p style="font-size:0.7rem;color:var(--graphite-400);margin-top:2px;">${count} file${count === 1 ? "" : "s"}</p></button>`;
      }).join("")}
    </div>
  </div>`;
  el.querySelectorAll("[data-open-folder]").forEach((b) => b.addEventListener("click", () => { state.openFolder = b.dataset.openFolder; renderDocumentsTab(el, project); }));
}

/* ---------- Full Report tab — everything about this ONE project, one place, printable ---------- */
function renderFullReportTab(el, project, remaining) {
  const milestones = state.milestones.filter((m) => m.project_id === project.id);
  const budget = state.budgetCategories.filter((c) => c.project_id === project.id);
  const totalBudget = budget.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalActual = budget.reduce((s, c) => s + Number(c.actual || 0), 0);
  const suppliers = state.suppliers.filter((s) => s.project_id === project.id);
  const remarks = state.remarks.filter((r) => r.project_id === project.id).slice().reverse();
  const docCount = state.documents.filter((d) => d.project_id === project.id).length;

  const html = `
    <div class="report-section"><h3>Project Overview</h3>
      <div class="grid" style="grid-template-columns:repeat(2,1fr);gap:0.8rem;">
        ${field("Brand", project.brand)}${field("Location", project.location + ", " + project.city)}
        ${field("Project Manager", project.manager)}${field("Status", STATUS_LABEL[project.status] || project.status)}
        ${field("Completion", project.completion + "%")}${field("Expected Opening", formatDate(project.openingDate))}
        ${field("Risk Level", project.riskLevel)}${field("Next Milestone", project.nextMilestone)}
        ${field("Budget", formatAED(project.budget))}${field("Spent", formatAED(project.spent))}
        ${field("Remaining", formatAED(remaining))}${field("Outstanding", formatAED(project.outstanding))}
      </div>
    </div>
    <div class="report-section"><h3>Milestones (${milestones.filter((m) => m.status === "done").length}/${milestones.length} complete)</h3>
      ${milestones.map((m) => `<p style="font-size:0.85rem;margin:0.25rem 0;">${m.status === "done" ? "✅" : m.status === "in-progress" ? "🟡" : "⚪"} ${m.name} — ${m.owner}, due ${formatDate(m.due)} ${m.remarks ? "(" + escapeHtml(m.remarks) + ")" : ""}</p>`).join("")}
    </div>
    <div class="report-section"><h3>Budget vs Actual — Total ${formatAED(totalBudget)} budgeted, ${formatAED(totalActual)} spent</h3>
      <table><thead><tr><th>Category</th><th class="right">Budget</th><th class="right">Actual</th></tr></thead>
      <tbody>${budget.map((c) => `<tr><td>${c.name}</td><td class="right mono">${formatAED(c.budget)}</td><td class="right mono">${formatAED(c.actual)}</td></tr>`).join("")}</tbody></table>
    </div>
    <div class="report-section"><h3>Suppliers</h3>
      ${suppliers.length === 0 ? `<p style="font-size:0.85rem;color:var(--graphite-400);">None added yet.</p>` : suppliers.map((s) => {
        const invoices = state.invoices.filter((i) => i.supplier_id === s.id);
        const paid = invoices.reduce((sum, i) => sum + state.payments.filter((p) => p.invoice_id === i.id).reduce((s2, p) => s2 + Number(p.amount || 0), 0), 0);
        return `<p style="font-size:0.85rem;margin:0.25rem 0;">${s.name} (${s.category}) — Contract ${formatAED(s.contract_value)}, Paid ${formatAED(paid)}, Balance ${formatAED(Number(s.contract_value) - paid)}</p>`;
      }).join("")}
    </div>
    <div class="report-section"><h3>Documents on file</h3><p style="font-size:0.85rem;">${docCount} file${docCount === 1 ? "" : "s"} uploaded across all folders.</p></div>
    <div class="report-section"><h3>Remarks, Orders &amp; Questions</h3>
      ${remarks.length === 0 ? `<p style="font-size:0.85rem;color:var(--graphite-400);">None yet.</p>` : remarks.map((r) => `<p style="font-size:0.85rem;margin:0.3rem 0;"><b>[${(r.type || "remark").toUpperCase()}]</b> ${escapeHtml(r.text)} — ${r.author}, ${new Date(r.timestamp).toLocaleString()}</p>`).join("")}
    </div>`;

  el.innerHTML = `<div class="card" id="full-report-content">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h2 style="font-size:1.1rem;">Full Project File — ${project.name}</h2>
      <button class="filter-btn" id="print-report-btn">🖨️ Print / Save as PDF</button>
    </div>
    ${html}
  </div>`;

  document.getElementById("print-report-btn").addEventListener("click", () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${project.name} — Full Project File</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#141821;} h3{border-bottom:2px solid #C9A227;padding-bottom:6px;} table{width:100%;border-collapse:collapse;} td,th{padding:4px 8px;text-align:left;} .right{text-align:right;}</style>
      </head><body><h1>${project.name} — Full Project File</h1>${html}</body></html>`);
    w.document.close();
    w.print();
  });
}

/* ---------------- Boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  document.querySelectorAll(".nav-btn").forEach((b) => { if (b.dataset.route) b.addEventListener("click", () => navigate(b.dataset.route)); });
  const restored = restoreSession();
  if (!restored) populateLoginPreviews();
});
