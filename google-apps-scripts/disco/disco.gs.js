/**
 * @OnlyCurrentDoc
 */

// --- CONFIG ---
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"; // stable grounding model

/**
 * Main function: Find potential customers using Gemini + Google Search Grounding
 */
function findPotentialCustomersWithGroundedGemini() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const jobTable = SpreadsheetApp.getActive().getRangeByName("INPUTS").getValues();
  const industries = jobTable.map(r => r[0]).filter(v => v && v.toString().trim() !== ""); // first column
  const jobTitles = jobTable.map(r => r[1]).filter(v => v && v.toString().trim() !== ""); // second column

  // Check API key is set
  const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    SpreadsheetApp.getUi().alert("Gemini API key not set.");
    return;
  }

  const startTime = Date.now();

  industries.forEach(industry => {
    jobTitles.forEach(jobTitle => {

      logStatus(`Searching for: ${jobTitle} in ${industry}`);

      const queryPrompt = `
  You are helping me generate sales lead data.

  Perform a grounded Google Search for individuals who match:
  • Job title similar to: "${jobTitle}"
  • Industry: "${industry}"

  Return a MAXIMUM of 3 people.

  For each person provide:
  - Full name
  - Job title
  - Company name
  - The REAL source URL

  IMPORTANT:
  • Return the ACTUAL webpage URL (e.g. https://company.com/leadership/…).
  • Do NOT return Google redirect URLs.
  • Do NOT return grounding redirect URLs.
  • Do NOT return URLs beginning with:
      - https://vertexaisearch.cloud.google.com/
      - https://google.com/url?
      - https://www.google.com/url?
      - Tracking links
  • Only return direct links to the original website.

  Respond ONLY with valid JSON in this exact format:
  {
    "results": [
      {
        "name": "Full Name",
        "title": "Job Title",
        "company": "Company Name",
        "url": "https://actual-website.com/page"
      }
    ]
  }

  Your entire output must fit within 1200 characters. Do NOT include explanations, HTML, or citations.
`;

      const results = callGeminiWithGrounding(queryPrompt, GEMINI_API_KEY);
      if (!results || !results.results) {
        logError("Gemini failed, check API key and API limits.");
        return;
      }
      
      results.results.forEach(result => {
        if (!result.name || !result.company) return;

        const rowData = [
          result.url,
          result.name,
          result.title,
          result.company,
          industry,
          new Date()
        ];

        appendToNamedRange("OUTPUTS", rowData);

      });

      Utilities.sleep(1500);
    });
  });

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  logStatus(`✓ All done! (Completed in ${seconds} seconds)`);

  SpreadsheetApp.flush();
}


/**
 * Call Gemini with Google Search Grounding enabled
 */
function callGeminiWithGrounding(promptText, apiKey) {
  const url = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const text = response.getContentText();
  let json;

  try {
    json = JSON.parse(text);
  } catch (e) {
    logError("Gemini failed, check API key and API limits.");
    Logger.log("❌ Could not parse Gemini JSON:");
    Logger.log(text);
    return null;
  }

  // --- HARDENED SAFETY CHECK ---
  if (!json.candidates || json.candidates.length === 0) {
    logError("Gemini returned no candidates.");
    Logger.log("❌ Gemini returned no candidates:");
    Logger.log(JSON.stringify(json, null, 2));
    return null;
  }

  const candidate = json.candidates[0];

  if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
    logError("Gemini candidate has no content.parts.");
    Logger.log("❌ Gemini candidate has no content.parts:");
    Logger.log(JSON.stringify(candidate, null, 2));
    return null;
  }

  let outputText = candidate.content.parts[0].text || "";

  // Clean markdown fences if present
  outputText = outputText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(outputText);
  } catch (e) {
    logError("Gemini output was not valid JSON.");
    Logger.log("❌ Gemini output was not valid JSON:");
    Logger.log(outputText);
    return null;
  }
}

function appendToNamedRange(rangeName, rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(rangeName);

  if (!range) throw new Error(`Named range "${rangeName}" not found.`);

  const values = range.getValues();   // 2D array
  
  // Find first empty row in the named range
  let targetRowIndex = values.findIndex(row =>
    row.every(cell => cell === "" || cell === null)
  );

  if (targetRowIndex === -1) {
    throw new Error(`Named range "${rangeName}" is full.`);
  }

  // Convert index inside named range → absolute sheet row
  const startRow = range.getRow();
  const startCol = range.getColumn();
  const writeRow = startRow + targetRowIndex;

  const width = values[0].length;
  sheet.getRange(writeRow, startCol, 1, width).setValues([rowValues]);
}

function logStatus(message) {
  const range = SpreadsheetApp.getActive().getRangeByName("STATUS");
  if (range) {
    range.setValue(message);
  }
}

function logError(message) {
  const range = SpreadsheetApp.getActive().getRangeByName("STATUS");
  if (range) {
    range.setValue("❌ ERROR: " + message);
  }
}

function promptForApiKey() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const response = ui.prompt(
    "Set Gemini API Key",
    "Enter your Gemini API key (will be securely stored):",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    ui.alert("API key update cancelled.");
    return;
  }

  const newKey = response.getResponseText().trim();

  if (!newKey) {
    ui.alert("API key cannot be empty.");
    return;
  }

  props.setProperty("GEMINI_API_KEY", newKey);

  // Optional: clear the API_KEY cell if it exists
  const range = SpreadsheetApp.getActive().getRangeByName("API_KEY");
  if (range) {
    range.clearContent();
  }

  ui.alert("Gemini API key updated successfully!");
}

// This just adds a button to run the script in the file menu
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CRM Bot')
    .addItem('Find New Customers', 'findPotentialCustomersWithGroundedGemini')
    .addSeparator()
    .addItem('Set API Key…', 'promptForApiKey')
    .addToUi();
}


