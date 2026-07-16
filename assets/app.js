/**
 * APPS SCRIPT — paste this into Extensions > Apps Script, opened FROM your
 * Google Sheet (so it's linked to the right spreadsheet). This file does NOT
 * go in GitHub — it lives inside Google's own editor.
 *
 * Required tabs in your Sheet (exact names, header row = row 1):
 *   Projects         | id, name, brand, location, city, manager, status, completion, budget, spent, outstanding, openingDate, riskLevel, nextMilestone
 *   Milestones       | id, project_id, name, status, progress, owner, due, remarks
 *   BudgetCategories | id, project_id, name, budget, actual
 *   Remarks          | id, project_id, author, role, type, tagged, text, timestamp
 *   Suppliers        | id, project_id, name, category, contract_value
 *   Invoices         | id, supplier_id, invoice_no, amount, invoice_date, file_url
 *   Payments         | id, invoice_id, amount, paid_date, receipt_url
 *   Documents        | id, project_id, folder, file_name, file_url, uploaded_by, uploaded_at
 *
 * Files are saved into a Google Drive folder called "Aptitude Projects" in
 * whichever account owns this Sheet — created automatically, no setup needed.
 *
 * EMAIL NOTIFICATIONS: fill in real email addresses below so people get
 * emailed when someone tags them in a Remark/Order/Question. Leave any of
 * them blank to skip emailing that person.
 */
const USER_EMAILS = {
  Mohamed: "",   // e.g. "mohamed@aptitudegroup.com"
  Deven: "",     // e.g. "deven@aptitudegroup.com"
  Mansoor: "",   // e.g. "mansoor@aptitudegroup.com"
};

/**
 * Header matching is now forgiving of spacing/capitalization/underscores —
 * "Opening Date", "opening_date", "OPENINGDATE" all resolve to the same
 * field the website expects. Genuine misspellings (like "Cpmpletion" instead
 * of "Completion") still won't match anything and need fixing in the Sheet.
 */
function normalizeKey_(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}
const FIELD_ALIASES_ = {
  id: "id", name: "name", brand: "brand", location: "location", city: "city", manager: "manager",
  status: "status", completion: "completion", budget: "budget", spent: "spent", outstanding: "outstanding",
  openingdate: "openingDate", risklevel: "riskLevel", nextmilestone: "nextMilestone",
  projectid: "project_id", project: "project_id", progress: "progress", owner: "owner", due: "due", remarks: "remarks",
  author: "author", role: "role", type: "type", tagged: "tagged", text: "text", timestamp: "timestamp",
  category: "category", contractvalue: "contract_value", supplierid: "supplier_id",
  invoiceno: "invoice_no", amount: "amount", invoicedate: "invoice_date", fileurl: "file_url",
  invoiceid: "invoice_id", paiddate: "paid_date", receipturl: "receipt_url",
  folder: "folder", filename: "file_name", uploadedby: "uploaded_by", uploadedat: "uploaded_at", actual: "actual", completedat: "completed_at",
};
function canonicalHeader_(header) {
  return FIELD_ALIASES_[normalizeKey_(header)] || header;
}

/* ---------------- Sheet helpers ---------------- */
/** Looks up a tab by name and throws a clear, human-readable error if it doesn't exist — instead of a cryptic "cannot read null" crash. */
function getSheetOrThrow_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    const available = SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) { return s.getName(); }).join(", ");
    throw new Error('No tab named exactly "' + sheetName + '" found. Your tabs are: ' + available + ". Check spelling/capitalization.");
  }
  return sheet;
}

function readSheetAsObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(canonicalHeader_);
  return values.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowIndexById_(sheet, idColName, idValue) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(canonicalHeader_);
  const idCol = headers.indexOf(idColName);
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(idValue)) return { rowIndex: i + 1, headers: headers };
  }
  return null;
}
function setCellByHeader_(sheet, rowIndex, headers, headerName, value) {
  const col = headers.indexOf(headerName);
  if (col === -1) return;
  sheet.getRange(rowIndex, col + 1).setValue(value);
}
function appendRowByHeaders_(sheetName, obj) {
  const sheet = getSheetOrThrow_(sheetName);
  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = rawHeaders.map(canonicalHeader_);
  const row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ""; });

  sheet.appendRow(row);
}
function newId_(prefix) {
  return prefix + "-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
}

/* ---------------- Delete helpers ---------------- */
/** Deletes every row in a sheet where colName equals value. Works bottom-up so row numbers don't shift mid-loop. */
function deleteRowsMatching_(sheetName, colName, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = values[0].map(canonicalHeader_);
  const col = headers.indexOf(colName);
  if (col === -1) return;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][col]) === String(value)) sheet.deleteRow(i + 1);
  }
}
function deleteRowById_(sheetName, idValue) { deleteRowsMatching_(sheetName, "id", idValue); }

/** Returns the "id" values of every row in a sheet where colName equals value. */
function getIdsWhere_(sheetName, colName, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(canonicalHeader_);
  const col = headers.indexOf(colName), idCol = headers.indexOf("id");
  const ids = [];
  for (let i = 1; i < values.length; i++) { if (String(values[i][col]) === String(value)) ids.push(values[i][idCol]); }
  return ids;
}

function deleteSupplierCascade_(supplierId) {
  const invoiceIds = getIdsWhere_("Invoices", "supplier_id", supplierId);
  invoiceIds.forEach(function (invId) { deleteRowsMatching_("Payments", "invoice_id", invId); });
  deleteRowsMatching_("Invoices", "supplier_id", supplierId);
  deleteRowById_("Suppliers", supplierId);
}
function deleteInvoiceCascade_(invoiceId) {
  deleteRowsMatching_("Payments", "invoice_id", invoiceId);
  deleteRowById_("Invoices", invoiceId);
}
function deleteProjectCascade_(projectId) {
  deleteRowsMatching_("Milestones", "project_id", projectId);
  deleteRowsMatching_("BudgetCategories", "project_id", projectId);
  const supplierIds = getIdsWhere_("Suppliers", "project_id", projectId);
  supplierIds.forEach(function (sId) { deleteSupplierCascade_(sId); });
  deleteRowsMatching_("Remarks", "project_id", projectId);
  deleteRowsMatching_("Documents", "project_id", projectId);
  deleteRowById_("Projects", projectId);
}

/* ---------------- Drive helpers ---------------- */
function findOrCreateFolder_(name, parent) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}
function getProjectFolder_(projectName) {
  const root = findOrCreateFolder_("Aptitude Projects", DriveApp.getRootFolder());
  return findOrCreateFolder_(projectName, root);
}
function saveBase64File_(projectName, subFolderName, fileName, mimeType, base64Data) {
  const projectFolder = getProjectFolder_(projectName);
  const targetFolder = findOrCreateFolder_(subFolderName, projectFolder);
  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/* ---------------- Email helper ---------------- */
function notifyTagged_(taggedCsv, author, type, text, projectName) {
  if (!taggedCsv) return;
  const names = taggedCsv.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  names.forEach(function (name) {
    const email = USER_EMAILS[name];
    if (!email) return;
    const subject = "[Aptitude] " + author + " tagged you in a " + (type || "remark") + " — " + projectName;
    const body = author + " posted this on " + projectName + ":\n\n\"" + text + "\"\n\nOpen the dashboard to reply.";
    try { MailApp.sendEmail(email, subject, body); } catch (e) { /* ignore email failures */ }
  });
}

/* ---------------- doGet: send everything ---------------- */
/**
 * RUN THIS ONE MANUALLY FIRST — select "authorizeDriveAccess" from the
 * function dropdown at the top of this editor, then click ▷ Run.
 * doGet/doPost never call DriveApp directly by themselves when Apps Script
 * decides what to ask permission for during a manual Run, so this function
 * exists purely to force the "Allow Drive access" prompt to appear.
 * Once you click Allow here, uploads will work.
 */
function authorizeDriveAccess() {
  const folder = DriveApp.getRootFolder();
  Logger.log("Drive access granted. Root folder name: " + folder.getName());
}

function doGet(e) {
  const output = {
    projects: readSheetAsObjects_("Projects"),
    milestones: readSheetAsObjects_("Milestones"),
    budgetCategories: readSheetAsObjects_("BudgetCategories"),
    remarks: readSheetAsObjects_("Remarks"),
    suppliers: readSheetAsObjects_("Suppliers"),
    invoices: readSheetAsObjects_("Invoices"),
    payments: readSheetAsObjects_("Payments"),
    documents: readSheetAsObjects_("Documents"),
  };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- doPost: receive writes from the website ---------------- */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let result = { success: true };

  try {
    if (action === "addMilestone") {
      appendRowByHeaders_("Milestones", {
        id: newId_("mile"), project_id: body.projectId, name: body.name, status: "pending",
        progress: 0, owner: body.owner || "", due: body.due || "", remarks: "",
      });
    }

    else if (action === "updateMilestone") {
      const sheet = getSheetOrThrow_("Milestones");
      const found = findRowIndexById_(sheet, "id", body.milestoneId);
      if (!found) throw new Error("Milestone not found: " + body.milestoneId);
      if (body.status !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "status", body.status);
      if (body.progress !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "progress", body.progress);
      if (body.remarks !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "remarks", body.remarks);
      // Stamp when a milestone becomes "done" so the Dashboard can show recently-achieved ones in order.
      // Harmless if your Milestones tab doesn't have a completed_at column — this just gets skipped.
      if (body.status === "done") setCellByHeader_(sheet, found.rowIndex, found.headers, "completed_at", new Date().toISOString());
    }

    else if (action === "updateBudget") {
      const sheet = getSheetOrThrow_("BudgetCategories");
      const found = findRowIndexById_(sheet, "id", body.categoryId);
      if (!found) throw new Error("Budget category not found: " + body.categoryId);
      setCellByHeader_(sheet, found.rowIndex, found.headers, "actual", body.actual);
    }

    else if (action === "addRemark") {
      appendRowByHeaders_("Remarks", {
        id: newId_("rem"), project_id: body.projectId, author: body.author, role: body.role,
        type: body.type || "remark", tagged: body.tagged || "", text: body.text, timestamp: new Date().toISOString(),
      });
      notifyTagged_(body.tagged, body.author, body.type, body.text, body.projectName || body.projectId);
    }

    else if (action === "addProject") {
      appendRowByHeaders_("Projects", {
        id: newId_("prj"), name: body.name, brand: body.brand, location: body.location, city: body.city,
        manager: body.manager, status: body.status || "on-track", completion: body.completion || 0,
        budget: body.budget || 0, spent: body.spent || 0, outstanding: body.outstanding || 0,
        openingDate: body.openingDate || "", riskLevel: body.riskLevel || "Low", nextMilestone: body.nextMilestone || "",
      });
    }

    else if (action === "addBudgetCategory") {
      appendRowByHeaders_("BudgetCategories", { id: newId_("bud"), project_id: body.projectId, name: body.name, budget: body.budget || 0, actual: 0 });
    }

    else if (action === "updateProject") {
      const sheet = getSheetOrThrow_("Projects");
      const found = findRowIndexById_(sheet, "id", body.projectId);
      if (!found) throw new Error("Project not found: " + body.projectId);
      const fields = ["name", "brand", "location", "city", "manager", "status", "completion", "budget", "spent", "outstanding", "openingDate", "riskLevel", "nextMilestone"];
      fields.forEach(function (f) { if (body[f] !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, f, body[f]); });
    }

    else if (action === "updateSupplier") {
      const sheet = getSheetOrThrow_("Suppliers");
      const found = findRowIndexById_(sheet, "id", body.supplierId);
      if (!found) throw new Error("Supplier not found: " + body.supplierId);
      if (body.name !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "name", body.name);
      if (body.category !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "category", body.category);
      if (body.contractValue !== undefined) setCellByHeader_(sheet, found.rowIndex, found.headers, "contract_value", body.contractValue);
    }

    else if (action === "addSupplier") {
      appendRowByHeaders_("Suppliers", { id: newId_("sup"), project_id: body.projectId, name: body.name, category: body.category, contract_value: body.contractValue });
    }

    else if (action === "addInvoice") {
      let fileUrl = "";
      if (body.fileBase64) fileUrl = saveBase64File_(body.projectName, "Invoices", body.fileName, body.mimeType, body.fileBase64);
      appendRowByHeaders_("Invoices", { id: newId_("inv"), supplier_id: body.supplierId, invoice_no: body.invoiceNo, amount: body.amount, invoice_date: body.invoiceDate, file_url: fileUrl });
    }

    else if (action === "addPayment") {
      let receiptUrl = "";
      if (body.fileBase64) receiptUrl = saveBase64File_(body.projectName, "Payment Receipts", body.fileName, body.mimeType, body.fileBase64);
      appendRowByHeaders_("Payments", { id: newId_("pay"), invoice_id: body.invoiceId, amount: body.amount, paid_date: body.paidDate, receipt_url: receiptUrl });
    }

    else if (action === "uploadDocument") {
      let fileUrl = "";
      if (body.fileBase64) fileUrl = saveBase64File_(body.projectName, body.folder, body.fileName, body.mimeType, body.fileBase64);
      appendRowByHeaders_("Documents", { id: newId_("doc"), project_id: body.projectId, folder: body.folder, file_name: body.fileName, file_url: fileUrl, uploaded_by: body.uploadedBy, uploaded_at: new Date().toISOString() });
      result.fileUrl = fileUrl;
    }

    else if (action === "deleteMilestone") { deleteRowById_("Milestones", body.milestoneId); }
    else if (action === "deleteBudgetCategory") { deleteRowById_("BudgetCategories", body.categoryId); }
    else if (action === "deleteSupplier") { deleteSupplierCascade_(body.supplierId); }
    else if (action === "deleteInvoice") { deleteInvoiceCascade_(body.invoiceId); }
    else if (action === "deletePayment") { deleteRowById_("Payments", body.paymentId); }
    else if (action === "deleteDocument") { deleteRowById_("Documents", body.documentId); }
    else if (action === "deleteRemark") { deleteRowById_("Remarks", body.remarkId); }
    else if (action === "deleteProject") { deleteProjectCascade_(body.projectId); }

    else {
      throw new Error("Unknown action: " + action);
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
