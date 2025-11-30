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

*Scripts will be added here as they are developed.*

## Contributing

When adding new scripts:

1. Create a new directory for each script project
2. Include a `README.md` explaining what the script does
3. Include all `.gs` files needed for the script
4. Document any required setup or configuration
