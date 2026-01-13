/**
 * Logger utility for debugging and tracking extension activity
 */

const DEBUG = true;

export const Logger = {
    info: (message, data = null) => {
        if (DEBUG) {
            console.log(`[LI-OUTREACH] ℹ️ ${message}`, data || '');
        }
    },

    warn: (message, data = null) => {
        console.warn(`[LI-OUTREACH] ⚠️ ${message}`, data || '');
    },

    error: (message, error = null) => {
        console.error(`[LI-OUTREACH] ❌ ${message}`, error || '');
    },

    // Log to storage for UI display
    logActivity: async (type, message, details = {}) => {
        try {
            const entry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type, // 'info', 'success', 'error', 'warning'
                message,
                details
            };

            const result = await chrome.storage.local.get('li_logs');
            const logs = result.li_logs || [];

            // Keep last 1000 logs
            const updatedLogs = [entry, ...logs].slice(0, 1000);

            await chrome.storage.local.set({ 'li_logs': updatedLogs });
        } catch (e) {
            console.error('Failed to save log to storage', e);
        }
    }
};
