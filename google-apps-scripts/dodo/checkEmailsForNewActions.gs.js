// --- CONFIG ---

// User settings (set in the Setup tab)
const USER_NAME = PropertiesService.getScriptProperties().getProperty('MY_NAME'); // User's name
const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); // Gemini API key
const LABEL_NAME_AI = PropertiesService.getScriptProperties().getProperty('TAG_AI');; // Any email that is checked is given this label/tag
const LABEL_NAME_ACTION = PropertiesService.getScriptProperties().getProperty('TAG_ACTION');; // Any email that requires work is given this label/tag

// These are internal parameters
const SHEET_NAME = 'Do'; // Name of the spreadsheet tab name
const MAX_REMEMBERED_IDS = 50; // List of checked emails in LAST_PROCESSED_KEY
const NUM_EMAILS_CHECKED = 10; // Number of emails in the inbox that are checked at a time
const LAST_PROCESSED_KEY = 'LAST_PROCESSED_MESSAGE_IDS'; // Name of list of checked messages (to avoid re-checking every email)

// This is the main prompt. Feel free to adjust as necessary
const BASE_PROMPT  = `
You are an intelligent email assistant that extracts only **high-importance, clearly assigned tasks** for the user, ${USER_NAME}.

Your job is to capture **only actions that ${USER_NAME} is explicitly responsible for**, focusing on:
- Direct requests, assignments, or obligations directed at ${USER_NAME}.
- Commitments ${USER_NAME} himself makes (“Ill send…”, “Ill prepare…”).
- Emails where a reply, deliverable, or decision is clearly expected.

A task should be extracted **only if all of the following are true**:
1. The action is clearly directed at ${USER_NAME} personally (not a group).
2. The sender explicitly asks ${USER_NAME} to do something OR ${USER_NAME} promises to do something.
3. The action requires ${USER_NAME} to produce something, communicate, decide, schedule, update, or follow up.
4. The action has some consequence or importance (time-sensitivity, responsibility, expectation).

Do **not** create tasks for:
- FYIs, summaries, newsletters, digests, announcements.
- Anything informational with no explicit request.
- Suggestions (“could you take a look”, “FYI in case useful”), unless a deliverable is expected.
- Casual / low-importance comments (“let me know”, “keep in mind”, “remember to…”).
- Automated receipts, confirmations, login alerts, status updates.
- Reports, statements, system notifications, invoices unless ${USER_NAME} must take an explicit follow-up action.
- Sales, marketing, newsletters, charity, petitions, events, promotions.
- Anything where ${USER_NAME} is merely cc'd or included for awareness.
- Conditionals or hypotheticals (“if you want”, “might need”, “could consider”).
- Any action that is optional, trivial, or routine.

**Only extract high-confidence, meaningful tasks. When in doubt, do NOT create a task.**

Formatting rules:
- Each task must start with a verb and be concise (“Send updated contract to client”).
- Include a due date only if explicitly mentioned.
- If no qualifying tasks exist, return an empty actions array.
- The "due_date" field must be a valid date in ISO 8601 format (YYYY-MM-DD). This ensures compatibility with Google Sheets.
- If no due date is mentioned in the email, return an empty string "".
- Do NOT use informal dates like "next Tuesday", "tomorrow", "in two weeks", or "Q4" — only a valid "YYYY-MM-DD" date.

Return strictly valid JSON with no extra text:
{
  "actions": [
    {"task": "...", "due_date": "...", "urgency": <"low" | "medium" | "high">}
  ]
}
`;

// --- MAIN FUNCTION ---

function checkEmailsForNewActions() {

  const ss = SpreadsheetApp.getActive();
  ss.toast("Checking your inbox for new actions…", "AI Task Assistant", 4);

  if (!API_KEY) {
    ss.toast("Missing API key. Go to the Setup tab to configure.", "Error", 6);
    return;
  }

  if (!USER_NAME) {
    ss.toast("Missing name. Go to the Setup tab to configure.", "Error", 6);
    return;
  }

  const allowedLabels = getUserLabelNames_().sort();
  const labelAI = GmailApp.getUserLabelByName(LABEL_NAME_AI) || GmailApp.createLabel(LABEL_NAME_AI);
  const labelAction = GmailApp.getUserLabelByName(LABEL_NAME_ACTION) || GmailApp.createLabel(LABEL_NAME_ACTION);
  const threads = GmailApp.getInboxThreads(0, NUM_EMAILS_CHECKED);

  if (threads.length === 0) {
    ss.toast("Your inbox is empty — nothing to check.", "Done", 4);
    Logger.log('Inbox empty');
    return;
  }

  const props = PropertiesService.getScriptProperties();
  let processedIds = safeParseJson_(props.getProperty(LAST_PROCESSED_KEY), []);
  if (!Array.isArray(processedIds)) processedIds = [];

  const sheet = ss.getSheetByName(SHEET_NAME);
  const now = new Date();

  for (const thread of threads) {

    // Get latest message
    const messages = thread.getMessages().sort((a, b) => b.getDate() - a.getDate());
    const message = messages[0]; 
    const messageId = message.getId();

    if (processedIds.includes(messageId)) continue;

    // Get email data
    const subject = redactSensitiveInfo_(message.getSubject());
    const body = redactSensitiveInfo_(safeGetPlainText_(message));
    const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${messageId}`;

    Logger.log(`Processing email: ${subject} (${messageId})`);

    // Auto tag emails based on user's existing labels
    const bestLabel = getBestLabelForEmail_(allowedLabels, subject, body);
    if (bestLabel && !thread.getLabels().map(l => l.getName()).includes(bestLabel)) {
      const lab = GmailApp.getUserLabelByName(bestLabel);
      if (lab) thread.addLabel(lab);
    }
    if (!thread.getLabels().map(l => l.getName()).includes(labelAI)) thread.addLabel(labelAI); 

    // Check for actions
    const fullPrompt = `
      ${BASE_PROMPT}

      Email Subject: ${subject || "No subject"}
      Email Body:
      ${body}
    `.trim();
    const gem = callGemini_(fullPrompt);
    const actions = gem.json?.actions || [];
    if (!actions.length) {
      processedIds.unshift(messageId);
      if (processedIds.length > MAX_REMEMBERED_IDS)
        processedIds = processedIds.slice(0, MAX_REMEMBERED_IDS);
      continue;
    }

    // Tag with 'Action'
    if (!thread.getLabels().map(l => l.getName()).includes(labelAction)) thread.addLabel(labelAction); 

    // Build rows & append each
    actions.forEach(a => {
      sheet.appendRow([
        "",             // Empty column for checkbox
        now,            // Timestamp
        subject,        // Subject
        a.task || "",   // Task
        a.due_date || "",
        a.urgency || "",
        gmailLink
      ]);
    });

    ss.toast(`Added ${actions.length} new task(s) from: "${subject}"`, "Tasks Added", 5);

    // Add to checked emails list
    processedIds.unshift(messageId);
    if (processedIds.length > MAX_REMEMBERED_IDS)
      processedIds = processedIds.slice(0, MAX_REMEMBERED_IDS);
  }

  props.setProperty(LAST_PROCESSED_KEY, JSON.stringify(processedIds));
  ss.toast("Finished checking your inbox.", "Complete", 3);
}

/** --- Helper functions --- **/

function safeParseJson_(s, fallback) {
  try {
    return JSON.parse(s);
  } catch (_) {
    return fallback;
  }
}

function safeGetPlainText_(message) {
  const plain = message.getPlainBody();
  if (plain && plain.trim()) return plain;
  const html = message.getBody() || '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes email content before sending to Gemini.
 * Removes common personal identifiers (emails, phone numbers, URLs, IDs, etc.)
 */
function redactSensitiveInfo_(text) {
  if (!text) return "";

  return text
    // Emails
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED-EMAIL]")
    // Phone numbers (e.g. 555-123-4567, (604) 555-9876)
    .replace(/\+?\d[\d()\-\s]{6,}\d/g, "[REDACTED-PHONE]")
    // URLs
    .replace(/\bhttps?:\/\/[^\s]+/gi, "[REDACTED-URL]")
    // Account numbers or long numeric IDs (6+ digits)
    .replace(/\b\d{6,}\b/g, "[REDACTED-ID]")
    // Credit-card-like patterns (4-4-4-4 digits)
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[REDACTED-CARD]")
    // Street addresses (123 Main St, 45-678 Oak Rd)
    .replace(/\b\d{1,5}\s+[A-Z][A-Za-z0-9\s.,-]+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr)\b/gi, "[REDACTED-ADDRESS]")
    // Extra spaces cleanup
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getUserLabelNames_() {
  return GmailApp.getUserLabels().map(label => label.getName());
}

function buildLabelPrompt_(allowedLabels, subject, body) {
  return `
You classify emails into one label.

Allowed labels:
${allowedLabels.map(l => "- " + l).join("\n")}

RULES:
- Pick **exactly one** label from the allowed list.
- ONLY pick a label if it clearly fits the email.
- If none fit well, return "none".
- Do NOT create new labels.
- Do NOT return more than one label.
- Return the label EXACTLY as written in the allowed list.
- You must return strictly valid JSON:
{
  "label": "ChosenLabelOrNone"
}

Email Subject: ${subject}
Email Body:
${body}
`.trim();
}

function getBestLabelForEmail_(allowedLabels, subject, body) {
  const prompt = buildLabelPrompt_(allowedLabels, subject, body);
  const gem = callGemini_(prompt);
  const result = gem.json || {};

  if (!result?.label) return null;

  const chosen = result.label.trim();
  if (chosen.toLowerCase() === "none") return null;

  // Only accept labels that actually exist
  const normalized = allowedLabels.map(l => l.toLowerCase());
  if (normalized.includes(chosen.toLowerCase())) {
    // Return the original-cased label
    return allowedLabels[normalized.indexOf(chosen.toLowerCase())];
  }

  return null; // "none" or invalid
}

function callGemini_(prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resp = UrlFetchApp.fetch(url, options);
  const data = safeParseJson_(resp.getContentText(), {});

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const cleaned = raw
    .replace(/^```json/i, "")
    .replace(/```$/i, "")
    .replace(/\n/g, " ")
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}")
    .trim();

  let json = null;
  try { json = JSON.parse(cleaned); } 
  catch (_) { json = null; }

  return { rawText: raw, json };
}
