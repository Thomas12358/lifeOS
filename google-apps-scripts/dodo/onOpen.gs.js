function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📬 Inbox Assistant")
    .addItem("Run Setup", "runSetup")                // one-time initialization
    .addItem("Check Emails for Tasks", "checkEmailsForNewActions") // main action
    .addToUi();
}