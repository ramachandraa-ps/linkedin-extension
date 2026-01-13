import { CONFIG } from '../config/constants.js';
import { Logger } from './logger.js';
import { generateHash } from './utils.js';

export const Storage = {
    /**
     * Initialize default settings if not present
     */
    init: async () => {
        try {
            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SETTINGS);
            if (!result[CONFIG.STORAGE_KEYS.SETTINGS]) {
                await chrome.storage.local.set({
                    [CONFIG.STORAGE_KEYS.SETTINGS]: CONFIG.DEFAULT_SETTINGS
                });
                Logger.info('Initialized default settings');
            }
        } catch (e) {
            Logger.error('Failed to initialize storage', e);
        }
    },

    /**
     * Save a single lead
     * @param {Object} lead - Lead object
     * @returns {Promise<boolean>} - True if saved (new), false if duplicate
     */
    saveLead: async (lead) => {
        try {
            // Ensure lead has an ID
            if (!lead.id && lead.profileUrl) {
                lead.id = generateHash(lead.profileUrl);
            } else if (!lead.id) {
                lead.id = crypto.randomUUID();
            }

            lead.scrapedAt = Date.now();
            lead.status = 'new'; // default status

            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LEADS);
            const leads = result[CONFIG.STORAGE_KEYS.LEADS] || {};

            // Check for duplicate by ID or Profile URL
            if (leads[lead.id]) {
                // Update existing lead but preserve some fields
                const existing = leads[lead.id];
                leads[lead.id] = { ...existing, ...lead, updatedAt: Date.now() };
                await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.LEADS]: leads });
                Logger.info('Updated existing lead', lead.id);
                return false; // Not new
            }

            // Add new lead
            leads[lead.id] = lead;
            await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.LEADS]: leads });
            Logger.info('Saved new lead', lead.id);
            return true; // New
        } catch (e) {
            Logger.error('Failed to save lead', e);
            throw e;
        }
    },

    /**
     * Save multiple leads
     * @param {Array} leadsList 
     * @returns {Promise<Object>} - { stored: number, updated: number, errors: number }
     */
    saveLeads: async (leadsList) => {
        let stats = { stored: 0, updated: 0, errors: 0 };

        try {
            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LEADS);
            const leads = result[CONFIG.STORAGE_KEYS.LEADS] || {};

            for (const lead of leadsList) {
                try {
                    if (!lead.id && lead.profileUrl) {
                        lead.id = generateHash(lead.profileUrl);
                    } else if (!lead.id) {
                        lead.id = crypto.randomUUID();
                    }

                    lead.scrapedAt = lead.scrapedAt || Date.now();
                    lead.status = lead.status || 'new';

                    if (leads[lead.id]) {
                        leads[lead.id] = { ...leads[lead.id], ...lead, updatedAt: Date.now() };
                        stats.updated++;
                    } else {
                        leads[lead.id] = lead;
                        stats.stored++;
                    }
                } catch (err) {
                    stats.errors++;
                }
            }

            await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.LEADS]: leads });
        } catch (e) {
            Logger.error('Failed to save batch leads', e);
            throw e;
        }
        return stats;
    },

    /**
     * Get all leads as an array
     */
    getLeads: async () => {
        try {
            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.LEADS);
            const leadsMap = result[CONFIG.STORAGE_KEYS.LEADS] || {};
            return Object.values(leadsMap).sort((a, b) => b.scrapedAt - a.scrapedAt);
        } catch (e) {
            Logger.error('Failed to get leads', e);
            return [];
        }
    },

    /**
     * Get settings
     */
    getSettings: async () => {
        try {
            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SETTINGS);
            return result[CONFIG.STORAGE_KEYS.SETTINGS] || CONFIG.DEFAULT_SETTINGS;
        } catch (e) {
            Logger.error('Failed to get settings', e);
            return CONFIG.DEFAULT_SETTINGS;
        }
    },

    /**
     * Save settings
     */
    saveSettings: async (settings) => {
        try {
            await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: settings });
            Logger.info('Settings saved');
        } catch (e) {
            Logger.error('Failed to save settings', e);
        }
    },

    /**
     * Clear all leads
     */
    clearLeads: async () => {
        await chrome.storage.local.remove(CONFIG.STORAGE_KEYS.LEADS);
        Logger.info('All leads cleared');
    },

    /**
     * Get today's scraping stats
     * @returns {Promise<Object>} - { date: string, count: number, lastScrapeTime: timestamp }
     */
    getTodayStats: async () => {
        try {
            const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.STATS);
            const stats = result[CONFIG.STORAGE_KEYS.STATS] || {};
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            if (stats.date !== today) {
                // New day, reset stats
                return { date: today, count: 0, lastScrapeTime: null };
            }

            return stats;
        } catch (e) {
            Logger.error('Failed to get today stats', e);
            return { date: new Date().toISOString().split('T')[0], count: 0, lastScrapeTime: null };
        }
    },

    /**
     * Increment today's scrape count
     * @param {number} count - Number of leads scraped
     */
    incrementTodayCount: async (count) => {
        try {
            const stats = await Storage.getTodayStats();
            const today = new Date().toISOString().split('T')[0];

            await chrome.storage.local.set({
                [CONFIG.STORAGE_KEYS.STATS]: {
                    date: today,
                    count: stats.count + count,
                    lastScrapeTime: Date.now()
                }
            });

            Logger.info(`Today's scrape count: ${stats.count + count}`);
        } catch (e) {
            Logger.error('Failed to increment today count', e);
        }
    },

    /**
     * Check if user can scrape more today
     * @returns {Promise<Object>} - { canScrape: boolean, remaining: number, limit: number }
     */
    checkDailyLimit: async () => {
        try {
            const settings = await Storage.getSettings();
            const stats = await Storage.getTodayStats();
            const limit = settings.dailyProfileVisitLimit || 100;
            const remaining = Math.max(0, limit - stats.count);

            return {
                canScrape: stats.count < limit,
                remaining,
                limit,
                scrapedToday: stats.count
            };
        } catch (e) {
            Logger.error('Failed to check daily limit', e);
            return { canScrape: true, remaining: 100, limit: 100, scrapedToday: 0 };
        }
    }
};
