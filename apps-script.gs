/**
 * APPS SCRIPT — paste this into script.google.com (or Extensions > Apps Script
 * from inside your Google Sheet). This is NOT a file that goes in GitHub —
 * it lives inside Google's own editor. See docs/step-by-step.md for exactly
 * where to paste it.
 *
 * What it does: turns your Google Sheet into a tiny API. When your website
 * calls the published URL, this code reads the "Projects" tab and sends the
 * rows back as JSON so the dashboard can display them.
 */

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Projects");
  const values = sheet.getDataRange().getValues();

  const headers = values[0];
  const rows = values.slice(1);

  const projects = rows.map(function (row) {
    const obj = {};
    headers.forEach(function (header, i) {
      obj[header] = row[i];
    });
    return obj;
  });

  const output = { projects: projects };

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
