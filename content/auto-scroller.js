import { Logger } from '../modules/logger.js';

/**
 * Auto-Scroller for LinkedIn Infinite Scroll
 * Automatically scrolls down to load more profiles
 */
export const AutoScroller = {
    /**
     * Auto-scroll to load all profiles on the page
     * @param {Object} options - Configuration options
     * @param {number} options.maxScrolls - Maximum number of scroll attempts (default: 10)
     * @param {number} options.scrollDelay - Delay between scrolls in ms (default: 2000)
     * @param {number} options.targetCount - Stop when this many profiles loaded (optional)
     * @returns {Promise<Object>} - { success: boolean, profilesLoaded: number, scrollCount: number }
     */
    autoScroll: async (options = {}) => {
        const {
            maxScrolls = 10,
            scrollDelay = 2000,
            targetCount = null
        } = options;

        Logger.info(`Starting auto-scroll (max: ${maxScrolls} scrolls, delay: ${scrollDelay}ms)`);

        let scrollCount = 0;
        let previousHeight = 0;
        let noChangeCount = 0;
        let previousProfileCount = 0;

        try {
            while (scrollCount < maxScrolls) {
                // Get current page height
                const currentHeight = document.documentElement.scrollHeight;

                // Count current profiles
                const currentProfileCount = AutoScroller.countProfiles();

                Logger.info(`Scroll ${scrollCount + 1}: Height=${currentHeight}, Profiles=${currentProfileCount}`);

                // Check if target count reached
                if (targetCount && currentProfileCount >= targetCount) {
                    Logger.info(`Target count ${targetCount} reached. Stopping scroll.`);
                    break;
                }

                // Scroll to bottom with smooth behavior (human-like)
                window.scrollTo({
                    top: currentHeight,
                    behavior: 'smooth'
                });

                // Wait for content to load
                await AutoScroller.sleep(scrollDelay);

                // Check if height changed (new content loaded)
                if (currentHeight === previousHeight) {
                    noChangeCount++;
                    Logger.info(`No height change detected (${noChangeCount}/3)`);

                    // If height hasn't changed for 3 consecutive scrolls, we've reached the end
                    if (noChangeCount >= 3) {
                        Logger.info('Reached end of results (no new content loading)');
                        break;
                    }
                } else {
                    noChangeCount = 0; // Reset counter if height changed
                }

                // Check if profile count changed
                if (currentProfileCount === previousProfileCount) {
                    Logger.warn('Profile count unchanged after scroll');
                } else {
                    Logger.info(`Loaded ${currentProfileCount - previousProfileCount} new profiles`);
                }

                previousHeight = currentHeight;
                previousProfileCount = currentProfileCount;
                scrollCount++;

                // Random delay variance (human-like behavior)
                if (scrollCount < maxScrolls) {
                    const variance = Math.random() * 500; // 0-500ms variance
                    await AutoScroller.sleep(variance);
                }
            }

            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await AutoScroller.sleep(500);

            const finalCount = AutoScroller.countProfiles();
            Logger.info(`Auto-scroll complete: ${scrollCount} scrolls, ${finalCount} profiles loaded`);

            return {
                success: true,
                profilesLoaded: finalCount,
                scrollCount: scrollCount
            };

        } catch (error) {
            Logger.error('Auto-scroll failed', error);
            return {
                success: false,
                profilesLoaded: 0,
                scrollCount: scrollCount,
                error: error.message
            };
        }
    },

    /**
     * Count currently loaded profile cards on the page
     * @returns {number} - Number of profile cards found
     */
    countProfiles: () => {
        const selectors = [
            'div[role="listitem"]', // 2026 structure
            '.reusable-search__result-container',
            'li.reusable-search__result-container',
            'div.entity-result'
        ];

        for (const selector of selectors) {
            const count = document.querySelectorAll(selector).length;
            if (count > 0) return count;
        }
        return 0;
    },

    /**
     * Sleep helper
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Smart scroll that monitors for "End of results" message
     * LinkedIn shows a message when no more results available
     * @param {Object} options - Same as autoScroll
     * @returns {Promise<Object>}
     */
    smartScroll: async (options = {}) => {
        const {
            maxScrolls = 10,
            scrollDelay = 2000,
            targetCount = null
        } = options;

        Logger.info('Starting smart scroll with end-of-results detection');

        let scrollCount = 0;
        let previousProfileCount = 0;

        try {
            while (scrollCount < maxScrolls) {
                const currentProfileCount = AutoScroller.countProfiles();

                // Check for "end of results" indicators
                if (AutoScroller.isEndOfResults()) {
                    Logger.info('Detected end of results message. Stopping scroll.');
                    break;
                }

                // Check target count
                if (targetCount && currentProfileCount >= targetCount) {
                    Logger.info(`Target count ${targetCount} reached.`);
                    break;
                }

                // Scroll down gradually (more human-like)
                const scrollStep = 300; // pixels per step
                const currentScroll = window.scrollY;
                const targetScroll = currentScroll + window.innerHeight;

                for (let i = 0; i < 5; i++) {
                    window.scrollBy({
                        top: scrollStep,
                        behavior: 'smooth'
                    });
                    await AutoScroller.sleep(100);
                }

                // Wait for content to load
                await AutoScroller.sleep(scrollDelay);

                const newProfileCount = AutoScroller.countProfiles();

                if (newProfileCount > previousProfileCount) {
                    Logger.info(`Loaded ${newProfileCount - previousProfileCount} new profiles (total: ${newProfileCount})`);
                } else {
                    Logger.warn('No new profiles loaded after scroll');
                }

                previousProfileCount = newProfileCount;
                scrollCount++;

                // Random delay
                await AutoScroller.sleep(Math.random() * 500);
            }

            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await AutoScroller.sleep(500);

            const finalCount = AutoScroller.countProfiles();
            Logger.info(`Smart scroll complete: ${finalCount} profiles loaded`);

            return {
                success: true,
                profilesLoaded: finalCount,
                scrollCount: scrollCount
            };

        } catch (error) {
            Logger.error('Smart scroll failed', error);
            return {
                success: false,
                profilesLoaded: 0,
                scrollCount: scrollCount,
                error: error.message
            };
        }
    },

    /**
     * Check if we've reached the end of search results
     * LinkedIn displays messages like "You've viewed all results" or similar
     * @returns {boolean}
     */
    isEndOfResults: () => {
        const endMessages = [
            'You\'ve viewed all',
            'No more results',
            'End of results',
            'That\'s all the results',
            'You\'ve seen all'
        ];

        const bodyText = document.body.innerText;

        for (const message of endMessages) {
            if (bodyText.includes(message)) {
                return true;
            }
        }

        return false;
    }
};
