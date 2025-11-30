# Dodo (Inbox Assistant)

Dodo is an AI-powered inbox management system that transforms your Gmail into an organized task system. It automatically identifies actionable tasks in your emails, tags them intelligently, and organizes them into a Kanban-style workflow (Do → Doing → Done) so you never miss an important follow-up.

## What It Does

Dodo watches your Gmail inbox and:
- **Extracts actionable tasks** from email content using AI analysis
- **Identifies who sent the email** and what action is expected from you
- **Assigns urgency levels** (low, medium, high) based on email context
- **Auto-tags emails** based on your existing Gmail labels
- **Creates trackable tasks** with due dates when mentioned
- **Archives completed tasks** automatically when you mark them done
- **Runs on a schedule** (configurable, default: every 6 hours)

All tasks are organized into a three-column Kanban board for easy workflow management.

## Features

- **Intelligent Task Extraction**: AI reads emails and identifies only actions directed at you
- **Smart Email Tagging**: Automatically applies your Gmail labels to categorize emails
- **Privacy-Focused**: Redacts sensitive data (emails, phone numbers, URLs) before AI processing
- **Kanban Workflow**: Three sheets (Do, Doing, Done) for visual task management
- **Checkbox Automation**: Mark tasks complete with a checkbox—they auto-move to Done and archive
- **Time-Based Triggering**: Runs automatically at intervals you define
- **Due Date Tracking**: Extracts and tracks due dates from email content
- **User-Friendly Setup**: One-click initialization with guided configuration

## Getting Started

### Prerequisites

- A Google Drive account with Gmail access
- A [Gemini API key](https://ai.google.dev/pricing) (free tier available)

### Setup

1. **Copy the template sheet**: [Open Dodo Sheet](https://docs.google.com/spreadsheets/d/1tdZuVwMfPCt8fJwxI1ABaO5Dv54fSJ-6q6Sb7U7hZxc/edit)
   - Click **File** > **Make a copy** to save it to your Drive

2. **Open Apps Script**:
   - In your copied sheet, go to **Extensions** > **Apps Script**

3. **Add all script files**:
   - Create one file for each of:
     - `onOpen.gs`
     - `runSetup.gs`
     - `checkEmailsForNewActions.gs`
     - `onEditHandler.gs`
   - Paste the corresponding code into each file
   - Click **Save**

4. **Configure in the Setup tab**:
   - Fill in the **Setup** sheet with:
     - **Your Name**: Your full name (used in AI analysis)
     - **Gemini API Key**: Your API key (securely stored, then deleted from sheet)
     - **Hours Between Checks**: How often to scan emails (e.g., 6 = every 6 hours)
     - **TAG_AI**: Label for all checked emails (default: "AI")
     - **TAG_ACTION**: Label for emails with actionable tasks (default: "Action Needed")

5. **Run Setup**:
   - Go back to your sheet
   - Click **📬 Inbox Assistant** > **Run Setup**
   - This will:
     - Create the Do, Doing, Done sheets
     - Set up automatic email scanning triggers
     - Connect to your Gmail
     - Clear your API key from the sheet for security

6. **Start using it**:
   - Click **📬 Inbox Assistant** > **Check Emails for Tasks** to manually scan
   - Or wait for the automatic checks to run

## How It Works

### Email Processing

1. **Inbox Scan**: Dodo reads your 10 most recent unread emails
2. **Content Analysis**: Gemini AI analyzes the email for actionable tasks
3. **Task Extraction**: If a task is found, it's added to the "Do" sheet
4. **Smart Filtering**: Only tasks explicitly assigned to you are extracted (ignores FYIs, newsletters, etc.)
5. **Email Tagging**: Your Gmail labels are applied automatically
6. **Action Labeling**: Emails with tasks get the "Action Needed" label

### Task Workflow

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Do Sheet   │  -->  │ Doing Sheet │  -->  │ Done Sheet  │
│ (New Tasks) │       │(In Progress)│       │(Completed)  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ ☐ Task 1    │  -->  │ ☐ Task 1    │  -->  │ ✓ Task 1    │
│ ☐ Task 2    │  -->  │ ☐ Task 2    │  -->  │ ✓ Task 2    │
└─────────────┘       └─────────────┘       └─────────────┘

**To move a task:**
- Check the checkbox (☐) in the **Do** sheet → task moves to **Doing**
- Check the checkbox (☐) in the **Doing** sheet → task moves to **Done** and optionally archives the email

## Sheet Structure

### Do Sheet (New Tasks)
| Column | Description |
|--------|------------|
| ☐ | Checkbox—check to mark in progress |
| Date | When the task was discovered |
| Subject | Email subject line |
| Task | The actionable task extracted from the email |
| Due | Due date (if mentioned) |
| Urgency | Low, Medium, or High |
| Gmail Link | Direct link back to the original email |

### Doing Sheet (In Progress)
Same structure as Do sheet, but for tasks you're actively working on.

### Done Sheet (Completed)
Same structure, but with a **Completed** date added when the task is marked done.

## Configuration

### Setup Tab Options

| Setting | Purpose | Example |
|---------|---------|---------|
| **UserName** | Your name (used in AI context) | "John Smith" |
| **GeminiAPIKey** | Your Gemini API key (auto-cleared) | `sk_live_...` |
| **HoursBetweenChecks** | How often to auto-scan emails | 6 |
| **TAG_AI** | Label for all checked emails | "AI" |
| **TAG_ACTION** | Label for actionable emails | "Action Needed" |
| **ArchiveEmails** | Auto-archive when task marked done | "YES" or "NO" |

## Tips & Best Practices

- **Clear subject lines**: Dodo understands context better with descriptive subjects
- **First-person requests**: Emails like "Can you send me..." are clearer than "Someone should..."
- **Review weekly**: Check the Done sheet to see completed tasks and adjust label preferences
- **Adjust check frequency**: Increase intervals for less-busy inboxes, decrease for high-volume senders
- **Use meaningful labels**: Create labels in Gmail that match your workflow (e.g., "Client", "Internal", "Finance")

## What Gets Extracted (and What Doesn't)

### ✅ Gets Extracted as Tasks

- Direct requests: "Can you send me the report?"
- Your commitments: "I'll prepare a proposal"
- Action deadlines: "Please review by Friday"
- Follow-ups: "Let me know when you're available"
- Decisions needed: "Do you approve this budget?"

### ❌ NOT Extracted (Filtered Out)

- FYIs and newsletters
- Automated notifications and system alerts
- Meeting invitations
- Suggestions ("consider looking at...")
- Low-importance comments ("keep in mind...")
- Casual mentions ("let me know if interested")
- Bulk/marketing emails

## Troubleshooting

**"Missing 'Setup' sheet" error**
- Ensure you're using the official Dodo template sheet
- Manually create a "Setup" sheet if missing

**"All fields must be complete in the settings table" error**
- Fill in all required fields: UserName, GeminiAPIKey, HoursBetweenChecks
- Don't leave any blank

**No tasks are being extracted**
- Check that your emails contain clear, actionable language
- Review the email content—Dodo filters out low-importance emails intentionally
- Try manual run: **📬 Inbox Assistant** > **Check Emails for Tasks**

**"Missing API key" error**
- Go to the Setup tab and re-enter your Gemini API key
- Click Run Setup again

**Tasks aren't auto-moving between sheets**
- Ensure you check the checkbox in Column A (not other columns)
- Refresh the sheet if it doesn't update immediately

**Emails aren't being archived**
- Set **ArchiveEmails** to "YES" in the Setup tab
- Ensure the email has a valid Gmail link in the last column

## Limitations

- Scans only the 10 most recent emails per check (to avoid rate limits)
- Only processes emails from the last 7 days
- May not capture highly context-dependent or ambiguous requests
- Requires standard Gmail access permissions

## API Costs

Dodo uses the Gemini 2.5 Flash model, which is part of Google's free tier. See [Gemini Pricing](https://ai.google.dev/pricing) for current rates and quota limits.

## Privacy & Security

- **API keys** are stored securely in script properties and cleared from the sheet after setup
- **Email content** is sent to Gemini but sensitive data (emails, phone numbers, URLs) is redacted first
- **Gmail access** uses standard Google scopes and cannot access other users