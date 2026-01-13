/**
 * Utility functions for common operations
 */

// Sleep function for delays
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random delay with variance
export const calculateDelay = (baseDelaySeconds, variance) => {
    const minDelay = baseDelaySeconds * (1 - variance);
    const maxDelay = baseDelaySeconds * (1 + variance);
    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    return Math.floor(randomDelay * 1000); // ms
};

// Generate hash for ID (simple implementation)
export const generateHash = (str) => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
};

// Date formatting
export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
};

export const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

// CSV escaping
export const escapeCsvField = (field) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};
