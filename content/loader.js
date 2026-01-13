(async () => {
    const src = chrome.runtime.getURL('content/content-script.js');
    try {
        await import(src);
    } catch (e) {
        console.error('[LI-OUTREACH] Failed to load content script module:', e);
    }
})();
