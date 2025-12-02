# 🐦 **Dodo — Your AI Inbox Assistant**
_Dodo automatically turns your Gmail inbox into a clean, organized, actionable task list._

Dodo scans your recent emails, uses AI to extract real tasks that you personally need to complete, and inserts them into a Google Sheet ("DoDo" tab) with automatic sorting, filtering, and check-off workflow. Think of it as a lightweight AI-powered GTD system that lives inside Google Sheets + Gmail.

---

# ✨ What Dodo Does

Dodo automatically:

### 🔍 **Scans your Gmail inbox**
- Reads your 10 most recent emails (configurable)
- Redacts sensitive data before sending to AI

### 🤖 **Extracts actionable tasks**
- Only tasks **explicitly assigned to you**  
- Ignores FYIs, newsletters, alerts, receipts, junk  
- Adds urgency labels (high / medium / low)

### 🏷️ **Tags your emails**
- Applies your chosen Gmail label for:
  - All scanned emails (`TAG_AI`)
  - Emails containing tasks (`TAG_ACTION`)

### 📥 **Creates task entries in Google Sheets**
Each new task appears automatically in the **DoDo** sheet with:
- Checkbox  
- Date discovered  
- Email subject  
- Task description  
- Urgency  
- Direct Gmail link to the message  

### ✔️ **Hides completed tasks automatically**
When you check a task:
- It's archived (optional)
- Auto-filter removes it from view
- Sheet auto-sorts with newest tasks on top

### ⏱️ **Runs automatically every X hours**
(Default: every 6 hours)

---

# 🧠 How It Works

### 1️⃣ Inbox Scan  
Dodo looks at your most recent Gmail threads.

### 2️⃣ Redaction  
Email bodies + subjects are scrubbed for:
- email addresses  
- phone numbers  
- URLs  
- long numeric IDs  
- credit card patterns  

### 3️⃣ AI Task Extraction  
Gemini 2.5 Flash analyzes the cleaned email and returns only:

- real, explicit tasks  
- assigned directly to you  
- commitments you've made  
- meaningful actions (reply, decide, schedule, produce something)

### 4️⃣ Task Storage  
Tasks are added to the **DoDo** sheet and sorted by newest first.

### 5️⃣ Smart Filtering  
Column A checkboxes hide completed tasks automatically.

### 6️⃣ Optional Auto-Archive  
Checking a task also archives the Gmail thread instantly.

---

# 🧱 Sheet Structure (DoDo)

| Column | Purpose |
|--------|---------|
| A (checkbox) | Mark task complete |
| B (Date) | When task was detected |
| C (Subject) | Email subject |
| D (Task) | AI-extracted task |
| E (Urgency) | low / medium / high |
| F (Gmail Link) | Direct link to the original email |

### Automatic Behaviors
- Checking a task → hides it via filter  
- List auto-sorts by date (newest first)  
- Only unchecked tasks remain visible  
- No Kanban boards — simple & clean list view  

---

# 🚀 Getting Started

### 1️⃣ Make a copy of the Dodo sheet  
*(Insert template link here)*

### 2️⃣ Open Apps Script  
`Extensions → Apps Script`

### 3️⃣ Replace code with the single-file Dodo script  
Paste the full Dodo script into Code.gs.

### 4️⃣ Fill the Setup tab  
Provide:
- Your name  
- Gemini API key  
- Hours between checks  
- TAG_AI label  
- TAG_ACTION label  
- Whether to auto-archive done emails  

### 5️⃣ Run Setup  
Use the custom menu:  
**📬 Inbox Assistant → Run Setup**

### 6️⃣ Start using it  
Scan emails manually or let the automatic scheduler run.

---

# 🛠️ Configuration Options

| Setting | Description |
|---------|-------------|
| **UserName** | Used in AI prompt for identifying your responsibilities |
| **GeminiAPIKey** | Stored safely in Script Properties |
| **HoursBetweenChecks** | How often Dodo runs automatically |
| **TAG_AI** | Gmail label for all processed emails |
| **TAG_ACTION** | Gmail label for actionable emails |
| **ArchiveEmails** | “YES” → tasks archive the email when completed |

---

# 🔍 What Gets Extracted

### ✅ Extracted as tasks:
- “Can you send the updated file today?”  
- “Please review this document”  
- “Let’s finalize the decision by Thursday”  
- “I will prepare the slides”  
- “Follow up with the client”  

### ❌ Ignored:
- FYIs  
- Newsletters  
- System alerts  
- Bulk email  
- Marketing  
- Auto-generated receipts  
- Vague suggestions  
- Anything not explicitly assigned to you  

---

# 🔧 Automation Details

### ✔ Filter refresh  
- Automatically applied on sheet open  
- Automatically applied when editing checkboxes  
- Only modifies the checkbox filter and date sort  
- Does **not** modify any other user filters

### ✔ Sorting  
- Column B sorted descending (newest tasks first)

### ✔ Auto-archive  
If enabled:
- Checking a task archives the Gmail thread instantly

### ✔ Processed message tracking  
Tasks are never duplicated; messages are tracked via Script Properties.

---

# 🛡️ Privacy & Security

Dodo:
- Redacts sensitive data before sending to AI  
- Stores API keys in Script Properties  
- Clears API key from the sheet  
- Uses safe Gmail + Sheets scopes  

---

# 🩺 Troubleshooting

See the full README for detailed troubleshooting steps.

---

# ❤️ Author
Built by **Thomas Charlton**  
Powered by **Gemini 2.5 Flash**
