import { Storage } from '../modules/storage.js';
// import { Scraper } from '../content/scraper.js'; // Unused

import { CsvHandler } from '../modules/csv-handler.js';
import { Logger } from '../modules/logger.js';

class PopupApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.contentArea = document.getElementById('content-area');
        this.init();
    }

    async init() {
        this.setupNavigation();
        await this.loadTab('dashboard');
    }

    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                this.switchTab(target);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.nav-tab[data-target="${tabName}"]`).classList.add('active');
        this.currentTab = tabName;
        this.loadTab(tabName);
    }

    async loadTab(tabName) {
        const pagePath = `pages/${tabName}.html`;
        try {
            const response = await fetch(pagePath);
            const html = await response.text();
            this.contentArea.innerHTML = html;

            // Initialize tab specific logic
            if (tabName === 'dashboard') this.initDashboard();
            if (tabName === 'leads') this.initLeads();
            if (tabName === 'campaigns') this.contentArea.innerHTML = '<div class="text-center mt-2">Coming in Phase 2</div>';
            if (tabName === 'settings') this.contentArea.innerHTML = '<div class="text-center mt-2">Coming in Phase 2</div>';

        } catch (e) {
            Logger.error(`Failed to load tab ${tabName}`, e);
            this.contentArea.innerHTML = `<div class="error">Error loading ${tabName}</div>`;
        }
    }

    async initDashboard() {
        // Load stats
        const leads = await Storage.getLeads();
        document.getElementById('total-leads').textContent = leads.length;

        // Load daily stats
        const dailyStats = await Storage.getTodayStats();
        const dailyScrapedEl = document.getElementById('daily-scraped');
        if (dailyScrapedEl) {
            dailyScrapedEl.textContent = dailyStats.count || 0;
        }

        // Check current page status
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Only sendMessage if on LinkedIn
        if (tab.url.includes('linkedin.com')) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_STATS' }, (response) => {
                if (chrome.runtime.lastError) {
                    document.getElementById('page-status').textContent = 'Please refresh LinkedIn page';
                    return;
                }

                if (response && response.validPage) {
                    document.getElementById('page-status').textContent =
                        `Found ${response.profileCount} profiles currently visible`;

                    const scrapeButtons = document.getElementById('scrape-buttons');
                    scrapeButtons.classList.remove('hidden');
                    scrapeButtons.style.display = 'flex';

                    const scrapeBtn = document.getElementById('btn-scrape');
                    scrapeBtn.onclick = () => this.handleScrape();

                    const scrapeAllBtn = document.getElementById('btn-scrape-all');
                    scrapeAllBtn.onclick = () => this.handleScrapeAll();
                } else {
                    document.getElementById('page-status').textContent = 'Navigate to Search Results to scrape';
                }
            });
        } else {
            document.getElementById('page-status').textContent = 'Navigate to LinkedIn';
        }
    }

    async handleScrape() {
        const btn = document.getElementById('btn-scrape');
        btn.textContent = 'Scraping...';
        btn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, async (response) => {
            btn.textContent = 'Scrape This Page';
            btn.disabled = false;

            if (response && response.success) {
                if (response.count === 0 && response.debug) {
                    alert(`Scraped 0 profiles.\nDebug info: ${response.debug}\nTry scrolling down to load more profiles first.`);
                } else {
                    const stats = await Storage.saveLeads(response.leads);
                    let message = `✓ Scraped ${response.count} profiles\nNew: ${stats.stored} | Updated: ${stats.updated}`;

                    // Add daily stats info if available
                    if (response.dailyStats) {
                        message += `\n\nTotal scraped today: ${response.dailyStats.scrapedToday}`;
                    }

                    alert(message);
                }
                // Refresh stats
                const allLeads = await Storage.getLeads();
                document.getElementById('total-leads').textContent = allLeads.length;

                // Refresh daily stats
                const dailyStats = await Storage.getTodayStats();
                const dailyScrapedEl = document.getElementById('daily-scraped');
                if (dailyScrapedEl) {
                    dailyScrapedEl.textContent = dailyStats.count || 0;
                }
            } else {
                alert('Scraping failed: ' + (response ? response.error : 'Unknown error'));
            }
        });
    }

    async handleScrapeAll() {
        const btn = document.getElementById('btn-scrape-all');
        const scrollStatus = document.getElementById('scroll-status');
        const originalText = btn.textContent;

        btn.textContent = 'Auto-scrolling...';
        btn.disabled = true;
        scrollStatus.style.display = 'block';
        scrollStatus.textContent = 'Step 1/2: Scrolling to load all profiles...';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_ALL_PAGES' }, async (response) => {
            btn.textContent = originalText;
            btn.disabled = false;
            scrollStatus.style.display = 'none';

            if (response && response.success) {
                const stats = await Storage.saveLeads(response.leads);
                let message = `✓ Auto-Scroll Complete!\n\n`;
                message += `Scrolled: ${response.scrollInfo.scrollCount} times\n`;
                message += `Profiles loaded: ${response.scrollInfo.profilesLoaded}\n`;
                message += `Scraped: ${response.count} profiles\n`;
                message += `New: ${stats.stored} | Updated: ${stats.updated}`;

                if (response.dailyStats) {
                    message += `\n\nTotal scraped today: ${response.dailyStats.scrapedToday}`;
                }

                alert(message);

                // Refresh stats
                const allLeads = await Storage.getLeads();
                document.getElementById('total-leads').textContent = allLeads.length;

                // Refresh daily stats
                const dailyStats = await Storage.getTodayStats();
                const dailyScrapedEl = document.getElementById('daily-scraped');
                if (dailyScrapedEl) {
                    dailyScrapedEl.textContent = dailyStats.count || 0;
                }
            } else {
                alert('Auto-scroll scraping failed: ' + (response ? response.error : 'Unknown error'));
            }
        });
    }

    async initLeads() {
        const leads = await Storage.getLeads();
        const container = document.getElementById('leads-list');

        if (leads.length === 0) {
            container.innerHTML = '<div class="text-center" style="padding: 20px; color: #666;">No leads scraped yet.</div>';
        } else {
            container.innerHTML = leads.map(lead => `
        <div class="lead-item">
          <div class="lead-info">
            <h3>${lead.fullName}</h3>
            <p>${lead.headline}</p>
            <p style="font-size: 11px; margin-top: 2px;">${lead.company || ''} • ${lead.location || ''}</p>
          </div>
          <div class="lead-status">
            <span style="font-size: 11px; background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${lead.status}</span>
          </div>
        </div>
      `).join('');
        }

        document.getElementById('btn-export').onclick = () => {
            const csv = CsvHandler.leadsToCsv(leads);
            CsvHandler.downloadCsv(csv, `linkedin-leads-${Date.now()}.csv`);
        };

        document.getElementById('btn-clear').onclick = async () => {
            if (confirm('Clear all leads?')) {
                await Storage.clearLeads();
                this.initLeads(); // Refresh
            }
        };
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupApp();
});
