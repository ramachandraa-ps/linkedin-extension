import { Logger } from '../modules/logger.js';
import { Scraper } from './scraper.js';
import { Storage } from '../modules/storage.js';
import { AutoScroller } from './auto-scroller.js';

// Initialize
Logger.info('Content script loaded');

// Listen for messages from Popup or Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SCRAPE_PAGE') {
        handleScrapeRequest(sendResponse);
        return true; // Keep channel open for async response
    }

    if (request.type === 'SCRAPE_ALL_PAGES') {
        handleScrapeAllPages(sendResponse);
        return true;
    }

    if (request.type === 'GET_PAGE_STATS') {
        handlePageStats(sendResponse);
        return true;
    }

    if (request.type === 'CHECK_DAILY_LIMIT') {
        handleCheckDailyLimit(sendResponse);
        return true;
    }
});

async function handleScrapeRequest(sendResponse) {
    try {
        if (window.location.href.includes('/search/results/')) {
            // Add small delay to simulate human behavior (500-1500ms)
            const delay = 500 + Math.random() * 1000;
            Logger.info(`Adding ${Math.round(delay)}ms delay to simulate human behavior...`);

            await new Promise(resolve => setTimeout(resolve, delay));

            const leads = Scraper.scrapeSearchResults();

            // Track daily count (for stats only, not enforcing limit)
            if (leads.length > 0) {
                await Storage.incrementTodayCount(leads.length);
            }

            // Get stats info
            const stats = await Storage.getTodayStats();

            sendResponse({
                success: true,
                count: leads.length,
                leads: leads,
                debug: `Found ${leads.length} leads`,
                dailyStats: {
                    scrapedToday: stats.count
                }
            });
        } else {
            sendResponse({ success: false, error: 'Not a supported page for scraping' });
        }
    } catch (e) {
        Logger.error('Scrape request failed', e);
        sendResponse({ success: false, error: e.message });
    }
}

async function handleCheckDailyLimit(sendResponse) {
    try {
        const limitCheck = await Storage.checkDailyLimit();
        sendResponse(limitCheck);
    } catch (e) {
        Logger.error('Failed to check daily limit', e);
        sendResponse({ canScrape: true, remaining: 100, limit: 100, scrapedToday: 0 });
    }
}

async function handleScrapeAllPages(sendResponse) {
    try {
        if (!window.location.href.includes('/search/results/')) {
            sendResponse({ success: false, error: 'Not a supported page for scraping' });
            return;
        }

        Logger.info('Starting auto-scroll + batch scrape...');

        // Get user settings or use defaults
        const maxScrolls = 10; // Can be made configurable
        const scrollDelay = 2000; // 2 seconds between scrolls

        // Step 1: Auto-scroll to load all profiles
        const scrollResult = await AutoScroller.smartScroll({
            maxScrolls: maxScrolls,
            scrollDelay: scrollDelay
        });

        if (!scrollResult.success) {
            sendResponse({
                success: false,
                error: `Auto-scroll failed: ${scrollResult.error}`
            });
            return;
        }

        Logger.info(`Auto-scroll loaded ${scrollResult.profilesLoaded} profiles`);

        // Step 2: Add delay before scraping (human-like)
        await AutoScroller.sleep(1000 + Math.random() * 1000);

        // Step 3: Scrape all loaded profiles
        const leads = Scraper.scrapeSearchResults();

        // Step 4: Track stats
        if (leads.length > 0) {
            await Storage.incrementTodayCount(leads.length);
        }

        const stats = await Storage.getTodayStats();

        sendResponse({
            success: true,
            count: leads.length,
            leads: leads,
            scrollInfo: {
                scrollCount: scrollResult.scrollCount,
                profilesLoaded: scrollResult.profilesLoaded
            },
            dailyStats: {
                scrapedToday: stats.count
            }
        });

    } catch (e) {
        Logger.error('Scrape all pages failed', e);
        sendResponse({ success: false, error: e.message });
    }
}

function handlePageStats(sendResponse) {
    let stats = {
        validPage: false,
        profileCount: 0,
        pageType: 'unknown'
    };

    if (window.location.href.includes('/search/results/people/')) {
        stats.validPage = true;
        stats.pageType = 'search_people';

        // 2026: Use updated selectors
        const potentialSelectors = [
            'div[role="listitem"]', // 2026 structure
            '.reusable-search__result-container', // Fallback
            'li.reusable-search__result-container',
            'div.entity-result'
        ];
        let count = 0;
        for (const sel of potentialSelectors) {
            count = document.querySelectorAll(sel).length;
            if (count > 0) break;
        }
        stats.profileCount = count;
    } else if (window.location.href.includes('/in/')) {
        stats.validPage = true;
        stats.pageType = 'profile';
        stats.profileCount = 1;
    }

    sendResponse(stats);
}
