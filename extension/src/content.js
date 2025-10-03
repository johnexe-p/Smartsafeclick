// Store pending navigation
let pendingUrl = null;
let pendingEvent = null;

// Intercepts clicks on links; sends URL to background for scoring
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  
  // Prevent default navigation temporarily
  e.preventDefault();
  e.stopPropagation();
  
  // Store the event and URL
  pendingUrl = a.href;
  pendingEvent = e;
  
  // Send to background for checking
  chrome.runtime.sendMessage({ type: 'CHECK_URL', url: a.href });
}, true);

// Listen for response from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'URL_SAFE') {
    // Link is safe, proceed with navigation
    if (pendingUrl) {
      window.location.href = pendingUrl;
      pendingUrl = null;
    }
  } else if (msg.type === 'URL_RISKY') {
    // Show warning modal
    showWarningModal(msg.risk, msg.reason, pendingUrl);
  }
});

// Create and show warning modal
function showWarningModal(risk, reason, url) {
  // Remove any existing modal
  const existing = document.getElementById('smartsafe-modal');
  if (existing) existing.remove();
  
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'smartsafe-modal';
  modal.innerHTML = `
    <div class="smartsafe-overlay">
      <div class="smartsafe-modal-content">
        <div class="smartsafe-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 class="smartsafe-title">⚠️ Dangerous Link Detected</h2>
        <div class="smartsafe-risk-badge">Risk Level: ${risk}%</div>
        <p class="smartsafe-reason">${reason}</p>
        <div class="smartsafe-url">
          <span class="smartsafe-url-label">Blocked URL:</span>
          <span class="smartsafe-url-text">${truncateUrl(url)}</span>
        </div>
        <div class="smartsafe-warning-text">
          This link may lead to phishing, malware, or other security threats. Proceeding could compromise your data and device security.
        </div>
        <div class="smartsafe-buttons">
          <button class="smartsafe-btn smartsafe-btn-safe" id="smartsafe-go-back">
            <span>Go Back (Safe)</span>
          </button>
          <button class="smartsafe-btn smartsafe-btn-danger" id="smartsafe-proceed">
            <span>Proceed Anyway</span>
          </button>
        </div>
        <div class="smartsafe-footer">
          Protected by SmartSafe Click
        </div>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .smartsafe-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: smartsafe-fadein 0.3s ease;
    }
    
    @keyframes smartsafe-fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .smartsafe-modal-content {
      background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: smartsafe-slideup 0.3s ease;
    }
    
    @keyframes smartsafe-slideup {
      from { 
        transform: translateY(30px);
        opacity: 0;
      }
      to { 
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .smartsafe-icon {
      margin: 0 auto 20px;
      width: 64px;
      height: 64px;
      color: #ff4757;
      animation: smartsafe-pulse 2s ease-in-out infinite;
    }
    
    @keyframes smartsafe-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .smartsafe-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .smartsafe-risk-badge {
      display: inline-block;
      background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
    }
    
    .smartsafe-reason {
      color: #e0e0e0;
      font-size: 16px;
      margin: 20px 0;
      line-height: 1.6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .smartsafe-url {
      background: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      border-left: 3px solid #ff4757;
    }
    
    .smartsafe-url-label {
      display: block;
      color: #888;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
      font-weight: 600;
    }
    
    .smartsafe-url-text {
      color: #ff4757;
      font-size: 14px;
      word-break: break-all;
      font-family: monospace;
    }
    
    .smartsafe-warning-text {
      color: #b0b0b0;
      font-size: 13px;
      line-height: 1.6;
      margin: 20px 0;
      padding: 15px;
      background: rgba(255, 71, 87, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(255, 71, 87, 0.2);
    }
    
    .smartsafe-buttons {
      display: flex;
      gap: 15px;
      margin-top: 30px;
    }
    
    .smartsafe-btn {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: relative;
      overflow: hidden;
    }
    
    .smartsafe-btn:before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .smartsafe-btn:hover:before {
      width: 300px;
      height: 300px;
    }
    
    .smartsafe-btn span {
      position: relative;
      z-index: 1;
    }
    
    .smartsafe-btn-safe {
      background: linear-gradient(135deg, #5f27cd 0%, #341f97 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(95, 39, 205, 0.4);
    }
    
    .smartsafe-btn-safe:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(95, 39, 205, 0.5);
    }
    
    .smartsafe-btn-danger {
      background: rgba(255, 255, 255, 0.1);
      color: #ff4757;
      border: 2px solid rgba(255, 71, 87, 0.3);
    }
    
    .smartsafe-btn-danger:hover {
      background: rgba(255, 71, 87, 0.1);
      border-color: #ff4757;
      transform: translateY(-2px);
    }
    
    .smartsafe-btn:active {
      transform: translateY(0);
    }
    
    .smartsafe-footer {
      margin-top: 25px;
      color: #666;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  `;
  
  modal.appendChild(style);
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('smartsafe-go-back').addEventListener('click', () => {
    modal.remove();
    pendingUrl = null;
  });
  
  document.getElementById('smartsafe-proceed').addEventListener('click', () => {
    modal.remove();
    if (pendingUrl) {
      window.location.href = pendingUrl;
      pendingUrl = null;
    }
  });
}

// Helper function to truncate long URLs
function truncateUrl(url) {
  if (url.length > 60) {
    return url.substring(0, 57) + '...';
  }
  return url;
}