let lastRun = 0;
const DEBOUNCE_MS = 100; // adjust if needed

function onEditHandler(e) {
  const now = Date.now();
  if (now - lastRun < DEBOUNCE_MS) return;   // debounce
  lastRun = now;

  handleEdit_(e);
}

function handleEdit_(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  const editedRow = e.range.getRow();   // freeze row *before* deletion happens
  const editedCol = e.range.getColumn();

  if (editedRow === 1) return;              // skip header
  if (e.value !== "TRUE") return;           // only when checkbox becomes TRUE
  if (editedCol !== 1) return;              // only checkbox column

  // DO → DOING
  if (sheetName === "Do") {
    moveRow_(sheet, editedRow, "Doing");
    return;
  }

  // DOING → DONE (+ archive)
  if (sheetName === "Doing") {
    const gmailLink = getGmailLinkFromRow_(sheet, editedRow);
    moveRow_(sheet, editedRow, "Done");
    if (isAutoArchiveEnabled_()) {
      archiveEmailByIdLink_(gmailLink);
    }
  }
}

function moveRow_(sourceSheet, row, targetSheetName) {
  const target = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
  if (!target) return;

  const lastCol = sourceSheet.getLastColumn();

  // Copy columns B → last column
  const rowData = sourceSheet.getRange(row, 2, 1, lastCol - 1).getValues()[0];

  // Prepend date or blank
  const prefix =
    targetSheetName === "Doing" ? [""] :
    targetSheetName === "Done"  ? [new Date()] :
    [];

  target.appendRow([...prefix, ...rowData]);

  // Delete AFTER copying + prefixing
  sourceSheet.deleteRow(row);
}

function getGmailLinkFromRow_(sheet, row) {
  const lastCol = sheet.getLastColumn();
  const rowData = sheet.getRange(row, 2, 1, lastCol - 1).getValues()[0];
  return rowData[rowData.length - 1] || "";
}

function isAutoArchiveEnabled_() {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName("ArchiveEmails");
  if (!range) return false;

  const value = String(range.getValue()).trim().toUpperCase();
  return value === "YES";
}

function archiveEmailByIdLink_(gmailLink) {
  if (!gmailLink) return;
  const match = gmailLink.match(/#inbox\/(.+)$/);
  if (!match) return;

  try {
    const msgId = match[1].trim();
    const message = GmailApp.getMessageById(msgId);
    message.getThread().moveToArchive();
  } catch (err) {
    Logger.log("Archive error: " + err);
  }
}
