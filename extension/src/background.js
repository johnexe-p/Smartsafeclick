// === SmartSafe Click Background Script ===

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ linksScanned: 0, threatsBlocked: 0 });
});

// --- Helper function to update stats ---
async function updateStats(isRisky) {
  const stats = await chrome.storage.local.get(['linksScanned', 'threatsBlocked']);
  const linksScanned = (stats.linksScanned || 0) + 1;
  const threatsBlocked = isRisky
    ? (stats.threatsBlocked || 0) + 1
    : (stats.threatsBlocked || 0);

  await chrome.storage.local.set({ linksScanned, threatsBlocked });
  console.log('📊 Stats updated:', { linksScanned, threatsBlocked });
}

// --- Google Safe Browsing API key (Replace with your own) ---
const GOOGLE_API_KEY = "AIzaSyCAB8HMse_u0nTHoPy0wl7vdYo6ctapoN4";
const SAFE_BROWSING_URL =
  `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;

// --- Suspicious keyword list (for backup scanning) ---
const suspiciousKeywords = [
  "login", "update", "verify", "secure", "bank", "free", "bonus",
  "account", "crypto", "password", "wallet", "gift", "claim",
  "steam", "paypal", "instagram-security", "suspicious", "alert"
];

// --- Check using Google Safe Browsing API ---
async function checkGoogleSafeBrowsing(url) {
  try {
    const response = await fetch(SAFE_BROWSING_URL, {
      method: "POST",
      body: JSON.stringify({
        client: { clientId: "smartsafe-click", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "POTENTIALLY_HARMFUL_APPLICATION"
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

     // 🧠 Debug log for API response
    console.log("🧠 Google Safe Browsing response:", data);
    return data.matches && data.matches.length > 0;
  } catch (error) {
    console.error("❌ Google Safe Browsing check failed:", error);
    return false; // Fail safe
  }
}

// --- Local keyword check ---
function checkSuspiciousKeywords(url) {
  return suspiciousKeywords.some(keyword =>
    url.toLowerCase().includes(keyword.toLowerCase())
  );
}

// --- Main message listener ---
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'CHECK_URL') return;

  (async () => {
    console.log(`🔍 Checking URL: ${msg.url}`);

    let isRisky = false;
    let reason = "";

    // 1️⃣ Check via Google Safe Browsing
    const googleFlag = await checkGoogleSafeBrowsing(msg.url);

    if (googleFlag) {
      isRisky = true;
      reason = "Reported unsafe by Google Safe Browsing (phishing or malware).";
    } else {
      // 2️⃣ Check for suspicious keywords
      const keywordFlag = checkSuspiciousKeywords(msg.url);
      if (keywordFlag) {
        isRisky = true;
        reason = "URL contains potentially suspicious or phishing-related terms.";
      }
    }

    await updateStats(isRisky);

    // 3️⃣ Respond back to content script safely
    try {
      if (sender?.tab?.id) {
        await chrome.tabs.sendMessage(
          sender.tab.id,
          isRisky
            ? {
                type: 'URL_RISKY',
                risk: googleFlag ? 95 : 70,
                reason,
                url: msg.url
              }
            : { type: 'URL_SAFE' }
        );
      } else {
        console.warn("⚠️ No valid sender tab ID. Message not sent.");
      }
    } catch (err) {
      console.warn("⚠️ Message channel closed or tab inactive:", err.message);
    }

  })();

  return true; // Keeps message channel open for async
});

// --- 🌍 Auto-scan URLs when a new page loads ---
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    console.log("🌍 Auto-scanning URL:", tab.url);

    let isRisky = false;
    let reason = "";

    try {
      // 1️⃣ Check via Google Safe Browsing
      const googleFlag = await checkGoogleSafeBrowsing(tab.url);

      if (googleFlag) {
        isRisky = true;
        reason = "Detected as unsafe by Google Safe Browsing.";
      } else {
        // 2️⃣ Check for suspicious keywords
        const keywordFlag = checkSuspiciousKeywords(tab.url);
        if (keywordFlag) {
          isRisky = true;
          reason = "URL contains potentially suspicious or phishing-related terms.";
        }
      }

      // 3️⃣ Update stats
      await updateStats(isRisky);

      // 4️⃣ Send results to content script (if active)
      try {
        await chrome.tabs.sendMessage(
          tabId,
          isRisky
            ? {
                type: "URL_RISKY",
                risk: googleFlag ? 95 : 70,
                reason,
                url: tab.url,
              }
            : { type: "URL_SAFE" }
        );
      } catch (err) {
        console.warn("⚠️ No active content script to receive message:", err.message);
      }

      // 5️⃣ Optional notification (visual feedback)
      if (isRisky) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/warning.png",
          title: "⚠️ Unsafe Link Detected",
          message: `Blocked risky site:\n${tab.url}`,
          priority: 2,
        });
      } else {
        console.log("✅ Auto-scan result: Safe link.");
      }

    } catch (error) {
      console.error("❌ Auto-scan failed:", error);
    }
  }
});

