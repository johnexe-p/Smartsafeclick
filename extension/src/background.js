// Initialize stats on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ linksScanned: 0, threatsBlocked: 0 });
});

// Helper function to update stats
async function updateStats(isRisky) {
  const stats = await chrome.storage.local.get(['linksScanned', 'threatsBlocked']);
  const linksScanned = (stats.linksScanned || 0) + 1;
  const threatsBlocked = isRisky ? (stats.threatsBlocked || 0) + 1 : (stats.threatsBlocked || 0);
  
  await chrome.storage.local.set({ linksScanned, threatsBlocked });
  console.log('Stats updated:', { linksScanned, threatsBlocked }); // Debug log
}

// TEST VERSION with mock data - will show modal for demonstration
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'CHECK_URL') return;
  
 // MOCK DATA FOR TESTING - Remove this section when backend is ready
    // Simulates API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For testing: make every other link "risky" to see the modal
    const isRisky = Math.random() > 0.5; // 50% chance to show modal
    
    // Update stats FIRST
    await updateStats(isRisky);
    
    if (isRisky) {
      // Mock risky response
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'URL_RISKY',
        risk: 85,
        reason: "This link matches known phishing patterns and may steal your personal information.",
        url: msg.url
      });
    } else {
      // Mock safe response
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'URL_SAFE'
      });
    }
  })();
  
  // Return true to indicate async response
  return true; // Handle async operations
  (async () => {
    
  
  /* UNCOMMENT THIS WHEN BACKEND IS READY:
  (async () => {
    try {
      const res = await fetch('http://localhost:4000/score?url=' + encodeURIComponent(msg.url));
      const data = await res.json();
      const risk = Number(data.risk || 0);
      const reason = String(data.reason || "No reason provided");
      
      const isRisky = risk >= 70;
      await updateStats(isRisky);
      
      if (isRisky) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'URL_RISKY',
          risk: risk,
          reason: reason,
          url: msg.url
        });
      } else {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'URL_SAFE'
        });
      }
    } catch (e) {
      console.error('SmartSafe API Error:', e);
      await updateStats(false);
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'URL_SAFE'
      });
    }
  })();
  return true;
  */
});