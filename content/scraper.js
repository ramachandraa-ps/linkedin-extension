import { Logger } from '../modules/logger.js';
import { generateHash } from '../modules/utils.js';

export const Scraper = {
    /**
     * Scrape profiles from LinkedIn Search Results
     * @returns {Array} List of lead objects
     */
    scrapeSearchResults: () => {
        Logger.info('Starting search results scrape...');
        const leads = [];

        try {
            // 2026 LinkedIn DOM Structure: Use stable semantic selectors
            // Primary: role="listitem" (semantic HTML - most stable)
            // Fallback: Old class-based selectors for backwards compatibility
            const potentialSelectors = [
                'div[role="listitem"]', // 2026 structure - MOST STABLE
                '.reusable-search__result-container', // 2024-2025 fallback
                'li.reusable-search__result-container', // Older fallback
                'div.entity-result', // Legacy fallback
            ];

            let cards = [];
            for (const selector of potentialSelectors) {
                cards = document.querySelectorAll(selector);
                if (cards.length > 0) {
                    Logger.info(`Found ${cards.length} cards using selector: ${selector}`);
                    break;
                }
            }

            if (cards.length === 0) {
                Logger.warn('No profile cards found - LinkedIn may have changed DOM structure');
                return [];
            }

            Logger.info(`Processing ${cards.length} profile cards`);

            cards.forEach(card => {
                try {
                    // 2026: Use stable data-view-name attribute
                    let profileLink = card.querySelector('a[data-view-name="search-result-lockup-title"]');

                    // Fallback to href pattern if data attribute not found
                    if (!profileLink) {
                        profileLink = card.querySelector('a[href*="/in/"]');
                    }

                    if (!profileLink) {
                        Logger.warn('No profile link found in card');
                        return;
                    }

                    const rawUrl = profileLink.href;
                    const profileUrl = rawUrl.split('?')[0]; // Clean URL

                    if (profileUrl.includes('/miniprofile/')) return;

                    // Extract Name (from the profile link text)
                    let name = profileLink.textContent.trim();

                    // Clean up name (remove connection degree if included)
                    name = name.split('•')[0].trim();
                    name = name.replace(/\s+/g, ' '); // Normalize whitespace

                    if (!name) {
                        Logger.warn('Empty name found, skipping card');
                        return;
                    }

                    // Split name into first/last
                    const nameParts = name.split(' ');
                    const firstName = nameParts[0] || 'Unknown';
                    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

                    // Connection Degree (extract from paragraph containing name)
                    // Format in 2026: "Name • 3rd+" or "Name • 2nd" or "Name • 1st"
                    const titleParagraph = profileLink.closest('p');
                    let connectionDegree = 'N/A';
                    if (titleParagraph) {
                        const fullText = titleParagraph.textContent;
                        const degreeMatch = fullText.match(/•\s*(\d+(?:st|nd|rd|th)\+?)/);
                        if (degreeMatch) {
                            connectionDegree = degreeMatch[1];
                        }
                    }

                    // Headline and Location (2026: positioned as sibling divs after title)
                    // Structure: title paragraph → div with headline → div with location
                    const titleContainer = profileLink.closest('div');
                    let headline = '';
                    let location = '';

                    if (titleContainer) {
                        // Get all paragraph elements after the title
                        const allParagraphs = titleContainer.querySelectorAll('p');

                        // First p after title is typically headline, second is location
                        if (allParagraphs.length >= 2) {
                            headline = allParagraphs[1].textContent.trim();
                        }
                        if (allParagraphs.length >= 3) {
                            location = allParagraphs[2].textContent.trim();
                        }
                    }

                    // Fallback: try old selectors for headline/location
                    if (!headline) {
                        const headlineSelectors = ['.entity-result__primary-subtitle', '.entity-result__summary'];
                        for (const sel of headlineSelectors) {
                            const el = card.querySelector(sel);
                            if (el) {
                                headline = el.textContent.trim();
                                break;
                            }
                        }
                    }

                    if (!location) {
                        const locationSelectors = ['.entity-result__secondary-subtitle'];
                        for (const sel of locationSelectors) {
                            const el = card.querySelector(sel);
                            if (el) {
                                location = el.textContent.trim();
                                break;
                            }
                        }
                    }

                    // Extract Company from headline (common pattern: "Position at Company")
                    let company = '';
                    if (headline.includes(' at ')) {
                        company = headline.split(' at ').pop().trim();
                    } else if (headline.includes(' | ')) {
                        company = headline.split(' | ').pop().trim();
                    }

                    // Only save if we have minimum required data
                    if (name && profileUrl && !profileUrl.includes('/miniprofile/')) {
                        leads.push({
                            id: generateHash(profileUrl),
                            firstName,
                            lastName,
                            fullName: name,
                            headline,
                            location,
                            company,
                            profileUrl,
                            connectionDegree,
                            source: 'search_result',
                            scrapedAt: Date.now()
                        });
                    }
                } catch (err) {
                    Logger.warn('Error scraping individual card', err);
                }
            });

            Logger.info(`Successfully scraped ${leads.length} leads`);
            return leads;

        } catch (e) {
            Logger.error('Critical error during search scrape', e);
            return [];
        }
    },

    /**
     * Scrape current profile page (deep scrape)
     */
    scrapeProfilePage: () => {
        // Placeholder for Phase 4
        return null;
    }
};
