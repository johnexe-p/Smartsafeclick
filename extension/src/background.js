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
  
