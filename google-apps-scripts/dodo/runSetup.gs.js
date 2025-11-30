function runSetup() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("Running setup…", "Setup", 3);

  const setupSheet = ss.getSheetByName("Setup");
  if (!setupSheet) {
    ss.toast("Missing 'Setup' sheet. Please create one.", "Error", 5);
    return;
  }

  // --- READ SETTINGS USING NAMED RANGES ---
  const userName = getSetting("UserName", ""); // blank default
  const apiKey = getSetting("GeminiAPIKey", ""); // blank default
  const hoursBetweenChecks = getSetting("HoursBetweenChecks", 6); // default: every 6h
  const aiTag = getSetting("TAG_AI", "AI");
  const actionTag = getSetting("TAG_ACTION", "Action Needed");

  if (!userName || !apiKey || !hoursBetweenChecks) {
    ss.toast("Please ensure all fields are complete in the settings table.", "Setup Error", 6);
    return;
  }

  // --- SAVE SETTINGS TO SCRIPT PROPERTIES ---
  PropertiesService.getScriptProperties().setProperty("MY_NAME", userName);
  PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", apiKey);
  PropertiesService.getScriptProperties().setProperty("TAG_AI", aiTag);
  PropertiesService.getScriptProperties().setProperty("TAG_ACTION", actionTag);

  // --- CLEAR API KEY FROM THE SHEET FOR SECURITY ---
  ss.getRangeByName("GeminiAPIKey").clearContent();

  // --- ENSURE REQUIRED SHEETS EXIST ---
  ensureSheet_("Do");
  ensureSheet_("Doing");
  ensureSheet_("Done");

  // --- HEADER SETUP ---
  ensureHeaders_("Do", ["Do", "Date", "Subject", "Task", "Due", "Urgency", "Gmail Link"]);
  ensureHeaders_("Doing", ["Done", "Date", "Subject", "Task", "Due", "Urgency", "Gmail Link"]);
  ensureHeaders_("Done", ["Completed", "Date", "Subject", "Task", "Due", "Urgency", "Gmail Link"]);

  // --- INSTALL TRIGGERS ---
  installTrigger_("onEditHandler");
  installTrigger_("checkEmailsForNewActions", hoursBetweenChecks);

  ss.toast("Setup complete! Use 📬 Inbox Checker → Check Emails for Tasks", "Success", 6);
}

function ensureSheet_(name) {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(name)) {
    ss.insertSheet(name);
  }
}

function ensureHeaders_(sheetName, headers) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function getSetting(name, defaultValue) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName(name);

  if (!range) return defaultValue;              // No named range found
  const value = range.getValue();

  if (value === "" || value === null) return defaultValue;  // Empty cell
  
  return value;
}


function installTrigger_(functionName, hoursBetweenChecks) {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(t => t.getHandlerFunction() === functionName);

  if (!exists) {
    if (functionName === "onEditHandler") {
      ScriptApp.newTrigger("onEditHandler")
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onEdit()
        .create();
    }

    if (functionName === "checkEmailsForNewActions") {
      ScriptApp.newTrigger("checkEmailsForNewActions")
        .timeBased()
        .everyHours(hoursBetweenChecks)
        .create();
    }
  }
}