# Disco (Customer Discovery)

Disco is an AI-powered customer discovery tool that helps you find and research potential sales leads. Using Google's Gemini AI with live Google Search grounding, Disco automatically searches for individuals matching specific job titles and industries, gathering their contact information and company details directly from the web.

## What It Does

Disco searches the web for individuals based on criteria you define (job title + industry), then extracts:
- **Full names** of decision-makers and key contacts
- **Current job titles** and roles
- **Company names** and organizations
- **Direct website links** to verified company pages (not redirects)

All results are automatically added to your Google Sheet for easy review and outreach.

## Features

- **AI-Powered Search**: Uses Gemini 2.5 Flash for intelligent, natural-language-based prospecting
- **Live Web Grounding**: Real-time Google Search integration ensures current, verified data
- **Batch Processing**: Define multiple job titles and industries to search simultaneously
- **Verified Links**: Returns actual company URLs, not Google redirect links
- **Automatic Logging**: Results are timestamped and organized in a spreadsheet
- **Secure API Management**: API keys stored securely in script properties (never exposed)

## Getting Started

### Prerequisites

- A Google Drive account
- A [Gemini API key](https://ai.google.dev/pricing) (free tier available)

### Setup

1. **Copy the template sheet**: [Open Disco Sheet](https://docs.google.com/spreadsheets/d/124o3VQippZKDitiJLsPbS2D8xLSKj6EUTHXa-gO0L2s/edit)
   - Click **File** > **Make a copy** to save it to your Drive

2. **Open Apps Script**:
   - In your copied sheet, go to **Extensions** > **Apps Script**

3. **Add the script**:
   - Copy the code from `disco.gs`
   - Paste it into the Apps Script editor
   - Click **Save**

4. **Set your API key**:
   - Go back to your sheet
   - You should see a new menu: **CRM Bot**
   - Click **CRM Bot** > **Set API Key…**
   - Enter your Gemini API key (will be securely stored)

5. **Define your search criteria**:
   - In the **INPUTS** named range, enter:
     - Column A: Industries (e.g., "Technology", "Healthcare", "Finance")
     - Column B: Job Titles (e.g., "VP of Sales", "Marketing Manager")

6. **Run the search**:
   - Click **CRM Bot** > **Find New Customers**
   - Results will populate in the **OUTPUTS** named range
   - Timestamps show when each lead was discovered

## How It Works

1. **Batch Processing**: Disco iterates through each combination of industry + job title
2. **Gemini Search**: For each combination, it sends a natural-language query to Gemini with Google Search grounding enabled
3. **Data Extraction**: Gemini analyzes search results and extracts verified contact information
4. **Link Verification**: Only actual company URLs are returned (no Google/tracking redirects)
5. **Sheet Integration**: Results are automatically appended to your spreadsheet with timestamps

## Sheet Structure

| Column | Purpose |
|--------|---------|
| URL | Direct link to the company or person's page |
| Name | Full name of the potential customer |
| Title | Job title or role |
| Company | Organization name |
| Industry | The industry searched |
| Date | Timestamp of discovery |

## Tips & Best Practices

- **Be specific with job titles**: "VP of Sales" will give better results than "Sales"
- **Use 2-3 industries at a time**: Running too many searches simultaneously may hit API limits
- **Check the log**: The timestamp in your results shows when each lead was found
- **Verify links**: Always click through to verify the lead is still accurate
- **Rate limiting**: Add delays between large batch runs to avoid hitting API quotas

## Troubleshooting

**"Gemini API key not set" error**
- Go to **CRM Bot** > **Set API Key…** and enter your API key
- Ensure you have an active Gemini API key with quota available

**No results found**
- Check your search criteria (industry/job title combinations)
- Try broader job titles (e.g., "Sales Manager" instead of "VP of East Coast Sales")
- Ensure your API key has available quota

**"Gemini failed" error**
- Check your API quota at [Google AI Studio](https://aistudio.google.com/)
- Wait a few minutes and try again
- Consider using fewer search combinations

## Limitations

- Batch size is limited to available API quota (default: 10 industries × 10 job titles per run)
- Search results depend on web availability and Gemini's grounding data
- Large batch runs may take several minutes to complete

## API Costs

Disco uses the Gemini 2.5 Flash model, which is part of Google's free tier. See [Gemini Pricing](https://ai.google.dev/pricing) for current rates.
