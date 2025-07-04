chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Send message to content script
        await chrome.tabs.sendMessage(tab.id, { cmd: 'toggle-search' });
    } catch (error) {
        console.error('Error sending message to tab:', error);
    }
});