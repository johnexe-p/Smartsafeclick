// Minimal pipeline: call backend for risk score, show warning if risky
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type !== 'CHECK_URL') return;
  try {
    const res = await fetch('http://localhost:4000/score?url=' + encodeURIComponent(msg.url));
    const data = await res.json();
    const risk = Number(data.risk || 0);
    const reason = String(data.reason || "No reason");
    if (risk >= 70) {
      chrome.notifications.create('', {
        type: "basic",
        title: "SmartSafe Click Warning",
        message: `This link looks risky (${risk}%). Reason: ${reason}`,
        iconUrl: "assets/icon128.png"
      });
    }
  } catch (e) {
    // Optional: log errors
  }
});