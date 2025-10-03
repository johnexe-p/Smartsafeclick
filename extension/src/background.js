// TEST VERSION with mock data - will show modal for demonstration
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type !== 'CHECK_URL') return;
  
  // MOCK DATA FOR TESTING - Remove this section when backend is ready
  // Simulates API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For testing: make every 3rd link "risky" to see the modal
  const isRisky = Math.random() > 0.5; // 50% chance to show modal
  
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
  
  /* UNCOMMENT THIS WHEN BACKEND IS READY:
  try {
    const res = await fetch('http://localhost:4000/score?url=' + encodeURIComponent(msg.url));
    const data = await res.json();
    const risk = Number(data.risk || 0);
    const reason = String(data.reason || "No reason provided");
    
    if (risk >= 70) {
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
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'URL_SAFE'
    });
  }
  */
});