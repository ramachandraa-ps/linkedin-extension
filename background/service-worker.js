import { CONFIG } from '../config/constants.js';
import { Logger } from '../modules/logger.js';
import { Storage } from '../modules/storage.js';

// Initialize Service Worker
chrome.runtime.onInstalled.addListener(async () => {
    Logger.info('Extension installed/updated');
    await Storage.init();
});

// Watch for storage changes (for future campaign logic)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.li_action_queue) {
            // Future: Trigger queue processing
        }
    }
});

// Listen for messages if needed (e.g., from content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'LOG_ACTIVITY') {
        // Handle logging request from content script
    }
});
