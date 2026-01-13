# LinkedIn Outreach & AI Leads Extension

A private, internal chrome extension for automating LinkedIn prospecting and lead generation. This tool helps you scrape leads, manage campaigns, and eventually use AI for personalized messaging.

## 🚀 Features

- **Smart Lead Scraping**: Safely scrape profiles from LinkedIn search results.
  - **Single Page Scrape**: Extract visible profiles on the current page.
  - **Auto-Scroll & Scrape**: Automatically scrolls to load all results and extracts them in one go.
- **Robust Data Extraction**: Captures Name, Headline, Location, Company, and Profile URL.
- **Safety First**: Mimics human behavior with random delays to avoid detection.
- **Local Storage**: All data is stored locally in your browser (Chrome Storage).
- **CSV Export**: Export your leads to CSV for use in other tools.
- **Dashboard**: Track your daily scraping stats.

## 🛠️ Installation

Since this is a private extension, it is not on the Chrome Web Store. You need to load it manually:

1.  **Clone/Download** this repository to a folder on your computer (e.g., `D:\Sparks Projects\linkedin-extension`).
2.  Open Google Chrome.
3.  Navigate to `chrome://extensions`.
4.  Toggle **Developer mode** in the top right corner.
5.  Click the **Load unpacked** button.
6.  Select the folder where you saved the project (`linkedin-extension`).
7.  The extension icon (🚀) should appear in your toolbar.

## 📖 Usage Guide

### 1. Scraping Leads
1.  Go to [LinkedIn](https://www.linkedin.com).
2.  Perform a search (e.g., "Marketing agencies in Chennai") and select the **People** filter.
3.  Click the extension icon to open the popup.
4.  You will see two options:
    *   **Scrape This Page**: Extracts only the profiles currently visible on the screen.
    *   **🚀 Auto-Scroll & Scrape All**: Automatically scrolls down to load 100+ profiles and then scrapes them all.
5.  Wait for the process to finish. A notification will confirm how many leads were saved.

### 2. Managing Leads
1.  Open the extension popup.
2.  Click the **Leads** tab.
3.  View your scraped leads list.
4.  Click **Export CSV** to download all data.
5.  Click **Clear** if you want to remove all stored data and start fresh.

### 3. Settings & Limits
*   The extension tracks your daily activity to keep you safe.
*   You can view your "Scraped Today" count on the Dashboard.

## ⚠️ Important Notes
*   **LinkedIn TOS**: Automating LinkedIn actions technically violates their Terms of Service. Use this tool responsibly and at your own risk.
*   **Rate Limiting**: Do not scrape thousands of profiles in a single day. The extension has built-in delays, but excessive usage can still trigger LinkedIn's security systems.
*   **Internal Use Only**: This tool is for private use and should not be distributed publicly.

## 📂 Project Structure
*   `manifest.json`: Extension configuration.
*   `popup/`: User interface files.
*   `content/`: Scripts that interact with LinkedIn pages (Scraper, AutoScroller).
*   `background/`: Service worker for long-running tasks.
*   `modules/`: Shared utilities (Storage, Logger, CSV Handler).
