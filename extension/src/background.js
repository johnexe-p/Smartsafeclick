// Minimal pipeline: call backend for risk score, send result back to content script
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type !== 'CHECK_URL') return;
  
  try {
    const res = await fetch('http://localhost:4000/score?url=' + encodeURIComponent(msg.url));
    const data = await res.json();
    const risk = Number(data.risk || 0);
    const reason = String(data.reason || "No reason provided");
    
    if (risk >= 70) {
      // Send risky result back to content script
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'URL_RISKY',
        risk: risk,
        reason: reason,
        url: msg.url
      });
    } else {
      // Send safe result back to content script
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'URL_SAFE'
      });
    }
  } catch (e) {
    // If API fails, assume safe (or you could show an error)
    console.error('SmartSafe API Error:', e);
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'URL_SAFE'
    });
  }
});