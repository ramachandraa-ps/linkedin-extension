import { escapeCsvField, formatDate } from './utils.js';

export const CsvHandler = {
    /**
     * Convert leads to CSV string
     * @param {Array} leads 
     * @returns {string} CSV content
     */
    leadsToCsv: (leads) => {
        const headers = [
            'FirstName',
            'LastName',
            'Headline',
            'Company',
            'Location',
            'ProfileURL',
            'Status',
            'ConnectionDeg',
            'ScrapedAt',
            'Notes'
        ];

        const rows = leads.map(lead => {
            return [
                escapeCsvField(lead.firstName || ''),
                escapeCsvField(lead.lastName || ''),
                escapeCsvField(lead.headline || ''),
                escapeCsvField(lead.company || ''),
                escapeCsvField(lead.location || ''),
                escapeCsvField(lead.profileUrl || ''),
                escapeCsvField(lead.status || 'new'),
                escapeCsvField(lead.connectionDegree || ''),
                escapeCsvField(formatDate(lead.scrapedAt)),
                escapeCsvField(lead.notes || '')
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    },

    /**
     * Trigger download of CSV file
     * @param {string} content - CSV string
     * @param {string} filename 
     */
    downloadCsv: (content, filename) => {
        // Add BOM for Excel compatibility
        const bom = '\uFEFF';
        const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Create temporary link and click it
        // Note: In Chrome Extension popup this might work differently, 
        // but standard download attribute usually works if permissions allow.
        // Alternatively use chrome.downloads API in background.

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename || 'export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
