// ================================
// SmartSafeClick Content Script
// ================================

// Store pending navigation
let pendingUrl = null;
let pendingEvent = null;
let pendingTimeout = null;

// Intercept clicks on links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;

  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

  // Prevent default navigation temporarily
  e.preventDefault();
  e.stopPropagation();

  pendingUrl = a.href;
  pendingEvent = e;

  // Ask background to check URL
  chrome.runtime.sendMessage({ type: 'CHECK_URL', url: a.href }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Background unreachable:', chrome.runtime.lastError.message);
      window.location.href = pendingUrl;
      clearPending();
      return;
    }

    if (response && response.type === 'URL_SAFE') {
      showSafePopup(pendingUrl);
      setTimeout(() => {
        window.location.href = pendingUrl;
        clearPending();
      }, 3000);
    } else if (response && response.type === 'URL_RISKY') {
      showWarningModal(response.risk, response.reason, pendingUrl);
      clearPending();
    }
  });

  // Fallback — allow if no response
  pendingTimeout = setTimeout(() => {
    if (pendingUrl) {
      console.warn('No response from background, allowing navigation...');
      window.location.href = pendingUrl;
      clearPending();
    }
  }, 1500);
}, true);

// Clear stored pending data
function clearPending() {
  pendingUrl = null;
  pendingEvent = null;
  if (pendingTimeout) clearTimeout(pendingTimeout);
  pendingTimeout = null;
}

// Handle async responses
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'URL_SAFE' && pendingUrl) {
    showSafePopup(pendingUrl);
    setTimeout(() => {
      window.location.href = pendingUrl;
      clearPending();
    }, 3000);
  } else if (msg.type === 'URL_RISKY' && pendingUrl) {
    showWarningModal(msg.risk, msg.reason, pendingUrl);
    clearPending();
  }
});

// ================================
// Safe Link Popup
// ================================
function showSafePopup(url) {
  const existing = document.getElementById('smartsafe-safe-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'smartsafe-safe-popup';
  popup.innerHTML = `
    <div class="smartsafe-safe-container">
      ✅ Link Safe: <span class="smartsafe-safe-url">${truncateUrl(url)}</span>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #smartsafe-safe-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      z-index: 999999;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }
    #smartsafe-safe-popup.show {
      opacity: 1;
      transform: translateY(0);
    }
    .smartsafe-safe-url {
      font-weight: bold;
      color: #155724;
    }
  `;
  popup.appendChild(style);

  document.body.appendChild(popup);

  // Animate in and auto remove
  setTimeout(() => popup.classList.add('show'), 50);
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

// ================================
// Warning Modal (Dangerous Link)
// ================================
function showWarningModal(risk, reason, url) {
  const existing = document.getElementById('smartsafe-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'smartsafe-modal';
  modal.innerHTML = `
    <div class="smartsafe-overlay">
      <div class="smartsafe-modal-content">
        <div class="smartsafe-icon">⚠️</div>
        <h2 class="smartsafe-title">Suspicious Link</h2>
        <div class="smartsafe-url">${truncateUrl(url)}</div>
        <p class="smartsafe-reason">${reason}</p>
        <div class="smartsafe-buttons">
          <button id="smartsafe-cancel">Stay Safe (Cancel)</button>
          <button id="smartsafe-proceed">Proceed Anyway</button>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .smartsafe-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
    }
    .smartsafe-modal-content {
      background: #fff;
      padding: 20px 30px;
      border-radius: 10px;
      width: 380px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      text-align: center;
      font-family: Arial, sans-serif;
      animation: fadeIn 0.3s ease;
    }
    .smartsafe-icon {
      font-size: 42px;
      margin-bottom: 10px;
    }
    .smartsafe-title {
      color: #b71c1c;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .smartsafe-url {
      background: #f8f9fa;
      padding: 6px;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 13px;
      word-break: break-all;
    }
    .smartsafe-reason {
      color: #555;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .smartsafe-buttons button {
      margin: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    #smartsafe-cancel {
      background: #4caf50;
      color: white;
    }
    #smartsafe-cancel:hover {
      background: #45a049;
    }
    #smartsafe-proceed {
      background: #b71c1c;
      color: white;
    }
    #smartsafe-proceed:hover {
      background: #a31515;
    }
    @keyframes fadeIn {
      from {opacity: 0; transform: scale(0.95);}
      to {opacity: 1; transform: scale(1);}
    }
  `;
  modal.appendChild(style);
  document.body.appendChild(modal);

  // Buttons
  document.getElementById('smartsafe-cancel').addEventListener('click', () => {
    modal.remove();
    clearPending();
  });

  document.getElementById('smartsafe-proceed').addEventListener('click', () => {
    modal.remove();
    if (url) window.location.href = url;
    clearPending();
  });
}

// ================================
// Helpers
// ================================
function truncateUrl(url) {
  return url.length > 60 ? url.substring(0, 57) + '...' : url;
}
