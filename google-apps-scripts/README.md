# Google Apps Scripts

This directory contains Google Apps Script projects designed to work with Google Sheets and other Google Workspace applications.

## What are Google Apps Scripts?

[Google Apps Script](https://developers.google.com/apps-script) is a cloud-based scripting language for lightweight application development in the Google Workspace platform. It provides easy ways to automate tasks, create custom functions, and integrate with Google services.

## How to Use These Scripts

### Method 1: Copy and Paste

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Delete any existing code in the editor
4. Copy the script code from the desired `.gs` file
5. Paste it into the Apps Script editor
6. Save the project (Ctrl/Cmd + S)
7. Run the script or use the custom functions

### Method 2: Using clasp (Command Line Apps Script)

For more advanced users, you can use [clasp](https://github.com/google/clasp) to manage your Apps Scripts locally:

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to your Google account
clasp login

# Clone an existing Apps Script project
clasp clone <script-id>

# Push local changes to Apps Script
clasp push

# Pull remote changes
clasp pull
```

## Available Scripts

### Disco (Customer Discovery)

Disco is a customer discovery tool that uses Google's Gemini AI with Google Search grounding to find potential sales leads. It searches for individuals matching specific job titles and industries, returning their names, current positions, companies, and direct website links.

**Features:**
- AI-powered lead discovery using Gemini 2.5 Flash
- Google Search grounding for real-time web data
- Batch processing for multiple job titles and industries
- Secure API key management
- Automated output to a Google Sheet

**Setup:**
1. [Copy the Disco Sheet](https://docs.google.com/spreadsheets/d/124o3VQippZKDitiJLsPbS2D8xLSKj6EUTHXa-gO0L2s/edit) to your Google Drive
2. Open **Extensions** > **Apps Script**
3. Add your Gemini API key via the **Set API Key…** menu option
4. Use the **Find New Customers** button to start discovering leads

**Requirements:**
- [Gemini API key](https://ai.google.dev/pricing) (requires setup in Google Cloud)

### Dodo (Inbox Assistant)

Dodo is an AI-powered inbox assistant that automatically extracts actionable tasks from your emails and tags them for follow-up. It uses Gemini AI to intelligently parse emails, identify high-priority actions directed at you, and organize them into a trackable task system.

**Features:**
- Automatic task extraction from Gmail using AI
- Smart email tagging based on user-defined labels
- Auto-categorization of emails (AI-generated tags)
- Time-based checking (configurable intervals)
- Task tracking with due dates and urgency levels
- Privacy-focused email processing with sensitive data redaction
- Kanban-style workflow (Do → Doing → Done sheets)

**Setup:**
1. [Copy the Dodo Sheet](https://docs.google.com/spreadsheets/d/1tdZuVwMfPCt8fJwxI1ABaO5Dv54fSJ-6q6Sb7U7hZxc/edit) to your Google Drive
2. Open **Extensions** > **Apps Script**
3. Click **Run Setup** to initialize the script and connect to your Gmail
4. Enter your name, Gemini API key, and label preferences in the Setup tab
5. Use the **Check Emails for Tasks** button to start processing your inbox

**Requirements:**
- [Gemini API key](https://ai.google.dev/pricing) (requires setup in Google Cloud)
- Gmail inbox access (script uses standard Gmail scopes)

## Contributing

When adding new scripts:

1. Create a new directory for each script project
2. Include a `README.md` explaining what the script does
3. Include all `.gs.js` files needed for the script
4. Document any required setup or configuration
