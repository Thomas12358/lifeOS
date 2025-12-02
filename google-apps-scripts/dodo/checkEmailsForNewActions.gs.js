/********************************************************************
 *                       INBOX → TASKS ASSISTANT
 *                         By Thomas Charlton
 ********************************************************************/


// ======================= CONFIG =======================

const PROPS = PropertiesService.getScriptProperties();

const USER_NAME  = PROPS.getProperty('MY_NAME');
const API_KEY    = PROPS.getProperty('GEMINI_API_KEY');
const TAG_AI     = PROPS.getProperty('TAG_AI');
const TAG_ACTION = PROPS.getProperty('TAG_ACTION');

const SHEET_NAME = 'DoDo';
const NUM_EMAILS = 10;
const MAX_IDS    = 50;
const IDS_KEY    = 'LAST_PROCESSED_MESSAGE_IDS';

const GEMINI_MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";



/********************************************************************
 *                           MENU + SETUP
 ********************************************************************/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📬 Inbox Assistant")
    .addItem("Run Setup", "runSetup")
    .addItem("Check Emails for Tasks", "checkEmailsForNewActions")
    .addToUi();

  // NEW: refresh task filter
  refreshFilters_();
}

function runSetup() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("Running setup…", "Setup", 3);

  if (!ss.getSheetByName("Setup")) {
    return ss.toast("Missing 'Setup' sheet.", "Error", 6);
  }

  // Required settings from named ranges
  const userName           = getSetting_("UserName", "");
  const apiKey             = getSetting_("GeminiAPIKey", "");
  const hoursBetweenChecks = getSetting_("HoursBetweenChecks", 6);
  const tagAI              = getSetting_("TAG_AI", "AI");
  const tagAction          = getSetting_("TAG_ACTION", "Action Needed");

  if (!userName || !apiKey) {
    return ss.toast("Setup incomplete — please fill all fields.", "Setup Error", 6);
  }

  PROPS.setProperty("MY_NAME", userName);
  PROPS.setProperty("GEMINI_API_KEY", apiKey);
  PROPS.setProperty("TAG_AI", tagAI);
  PROPS.setProperty("TAG_ACTION", tagAction);

  // Hide API key on sheet
  const keyRange = ss.getRangeByName("GeminiAPIKey");
  if (keyRange) keyRange.clearContent();

  // Ensure task sheet exists
  ensureSheet_(SHEET_NAME);
  ensureHeaders_(SHEET_NAME, ["Do", "Date", "Subject", "Task", "Urgency", "Gmail Link"]);

  // Install triggers
  installTrigger_("onEditHandler");
  installTrigger_("checkEmailsForNewActions", hoursBetweenChecks);

  ss.toast("Setup complete! Use Inbox Assistant → Check Emails for Tasks", "Success", 6);
}



/********************************************************************
 *                       SETUP HELPERS
 ********************************************************************/

function getSetting_(name, defaultValue) {
  const range = SpreadsheetApp.getActive().getRangeByName(name);
  if (!range) return defaultValue;

  const value = range.getValue();
  return value === "" || value === null ? defaultValue : value;
}

function ensureSheet_(name) {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(name)) ss.insertSheet(name);
}

function ensureHeaders_(sheetName, headers) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function installTrigger_(fn, hours) {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.some(t => t.getHandlerFunction() === fn)) return;

  if (fn === "onEditHandler") {
    ScriptApp.newTrigger("onEditHandler")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
  }

  if (fn === "checkEmailsForNewActions") {
    ScriptApp.newTrigger("checkEmailsForNewActions")
      .timeBased()
      .everyHours(hours)
      .create();
  }
}

function refreshFilters_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const range = sheet.getDataRange();
  let filter = range.getFilter();

  // Create filter only if missing (don't recreate if it already exists)
  if (!filter) {
    filter = range.createFilter();
  }

  // 1) Hide rows where Column A checkbox is TRUE
  const criteria = SpreadsheetApp.newFilterCriteria()
    .setHiddenValues([true, "TRUE"])
    .build();

  filter.setColumnFilterCriteria(1, criteria); // Column A = 1

  // 2) Sort by date in Column B, newest first
  filter.sort(2, false); // column 2, descending = newest at top
}


/********************************************************************
 *                     MAIN: EMAIL → TASK EXTRACTION
 ********************************************************************/

function checkEmailsForNewActions() {
  const ss = SpreadsheetApp.getActive();
  if (!validateSetup_(ss)) return;

  ss.toast("Checking inbox…", "AI Task Assistant", 4);

  const sheet   = ss.getSheetByName(SHEET_NAME);
  const threads = GmailApp.getInboxThreads(0, NUM_EMAILS);

  if (!threads.length) {
    return ss.toast("Inbox empty — nothing to check.", "Done", 3);
  }

  const processed = loadProcessedIds_();
  const userLabels = getUserLabelNames_();
  const labelAI     = ensureLabel_(TAG_AI);
  const labelAction = ensureLabel_(TAG_ACTION);
  const now = new Date();

  threads.forEach(thread => {
    const msg = getLatestMessage_(thread);
    const msgId = msg.getId();

    if (processed.has(msgId)) return;

    const data = extractEmailData_(msg);
    autoApplyClassificationLabel_(thread, userLabels, data.subject, data.body);
    thread.addLabel(labelAI);

    const actions = requestActionsFromAI_(data.subject, data.body);
    if (!actions.length) {
      processed.add(msgId);
      return;
    }

    thread.addLabel(labelAction);

    actions.forEach(a => {
      sheet.appendRow([
        "",
        now,
        data.subject,
        a.task || "",
        a.urgency || "",
        data.link
      ]);
    });

    ss.toast(`Added ${actions.length} task(s) from "${data.subject}"`, "Tasks Added", 5);
    processed.add(msgId);
  });

  saveProcessedIds_(processed);
  ss.toast("Finished checking.", "Done", 3);
}



/********************************************************************
 *                     ON EDIT (checkbox → archive)
 ********************************************************************/

function onEditHandler(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row === 1 || col !== 1 || e.value !== "TRUE") return;

  if (!isAutoArchiveEnabled_()) return;

  const gmailLink = getGmailLinkFromRow_(sheet, row);
  archiveEmailByIdLink_(gmailLink);
}

function getGmailLinkFromRow_(sheet, row) {
  const lastCol = sheet.getLastColumn();
  const rowData = sheet.getRange(row, 2, 1, lastCol - 1).getValues()[0];
  return rowData[rowData.length - 1] || "";
}

function isAutoArchiveEnabled_() {
  const range = SpreadsheetApp.getActive().getRangeByName("ArchiveEmails");
  if (!range) return false;
  return String(range.getValue()).trim().toUpperCase() === "YES";
}

function archiveEmailByIdLink_(gmailLink) {
  const match = gmailLink?.match(/#inbox\/(.+)$/);
  if (!match) return;

  try {
    const msg = GmailApp.getMessageById(match[1]);
    msg.getThread().moveToArchive();
  } catch (err) {
    Logger.log("Archive error: " + err);
  }
}



/********************************************************************
 *                       EMAIL PROCESSING HELPERS
 ********************************************************************/

function validateSetup_(ss) {
  if (!API_KEY) return ss.toast("Missing API key.", "Error", 5), false;
  if (!USER_NAME) return ss.toast("Missing user name.", "Error", 5), false;
  return true;
}

function getLatestMessage_(thread) {
  return thread.getMessages().sort((a,b) => b.getDate() - a.getDate())[0];
}

function extractEmailData_(message) {
  return {
    subject: redact_(message.getSubject()),
    body: redact_(getPlainText_(message)),
    link: `https://mail.google.com/mail/u/0/#inbox/${message.getId()}`
  };
}

function getPlainText_(msg) {
  const plain = msg.getPlainBody();
  if (plain && plain.trim()) return plain.trim();
  return msg.getBody().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}



/********************************************************************
 *                     LABEL CLASSIFICATION HELPERS
 ********************************************************************/

function ensureLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function threadHasLabel_(thread, name) {
  return thread.getLabels().some(l => l.getName() === name);
}

function autoApplyClassificationLabel_(thread, allowedLabels, subject, body) {
  const chosen = getBestLabel_(allowedLabels, subject, body);
  if (chosen && !threadHasLabel_(thread, chosen)) {
    thread.addLabel(GmailApp.getUserLabelByName(chosen));
  }
}

function getBestLabel_(allowedLabels, subject, body) {
  const prompt = `
Pick one label from the following list:
${allowedLabels.map(l => "- " + l).join("\n")}

If none apply, return "none".

Subject: ${subject}
Body: ${body}

Return JSON: {"label": "<label>"}
`.trim();

  const res = callGemini_(prompt).json;
  if (!res?.label || res.label.toLowerCase() === "none") return null;

  const normalized = allowedLabels.map(l => l.toLowerCase());
  const idx = normalized.indexOf(res.label.toLowerCase());
  return idx >= 0 ? allowedLabels[idx] : null;
}



/********************************************************************
 *                          AI TASK LOGIC
 ********************************************************************/

function requestActionsFromAI_(subject, body) {
  const prompt = buildTaskPrompt_(subject, body);
  const res = callGemini_(prompt);
  return res.json?.actions || [];
}

function buildTaskPrompt_(subject, body) {
  return `
Extract only HIGH-IMPORTANCE, clearly assigned actions for ${USER_NAME}.

Rules:
1. Only include tasks where the sender explicitly assigns work to ${USER_NAME}.
2. Or ${USER_NAME} commits to doing something.
3. Must require output: reply, document, decision, follow-up.
4. Skip FYIs, alerts, newsletters, suggestions, optional items.

Subject: ${subject || "No subject"}
Body:
${body}

Return JSON like:
{"actions":[{"task":"...", "urgency":"low|medium|high"}]}
`.trim();
}



/********************************************************************
 *                     CALL GEMINI (safe JSON)
 ********************************************************************/

function callGemini_(prompt) {
  const resp = UrlFetchApp.fetch(GEMINI_MODEL_URL, {
    method: "POST",
    contentType: "application/json",
    headers: { "x-goog-api-key": API_KEY },
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
    muteHttpExceptions: true
  });

  const data = safeJson_(resp);
  return parseGeminiJson_(data);
}

function safeJson_(resp) {
  try { return JSON.parse(resp.getContentText()); }
  catch (_) { return {}; }
}

function parseGeminiJson_(data) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = text.replace(/^```json/i, "")
                      .replace(/```$/i, "")
                      .trim();

  try { return { rawText: text, json: JSON.parse(cleaned) }; }
  catch (_) { return { rawText: text, json: null }; }
}



/********************************************************************
 *                         REDACTION
 ********************************************************************/

function redact_(txt) {
  if (!txt) return "";
  return txt
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\+?\d[\d()\-\s]{6,}\d/g, "[PHONE]")
    .replace(/\bhttps?:\/\/\S+/gi, "[URL]")
    .replace(/\b\d{6,}\b/g, "[ID]")
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD]")
    .trim();
}



/********************************************************************
 *                 PROCESSED MESSAGE STORAGE
 ********************************************************************/

function loadProcessedIds_() {
  const raw = PROPS.getProperty(IDS_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  return new Set(arr);
}

function saveProcessedIds_(set) {
  const arr = Array.from(set).slice(-MAX_IDS);
  PROPS.setProperty(IDS_KEY, JSON.stringify(arr));
}



/********************************************************************
 *                           UTIL
 ********************************************************************/

function getUserLabelNames_() {
  return GmailApp.getUserLabels().map(l => l.getName());
}
