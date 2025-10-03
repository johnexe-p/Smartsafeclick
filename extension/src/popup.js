// Load and display stats from storage
async function loadStats() {
  const stats = await chrome.storage.local.get(['linksScanned', 'threatsBlocked']);
  
  const linksScanned = stats.linksScanned || 0;
  const threatsBlocked = stats.threatsBlocked || 0;
  
  // Animate the numbers
  animateValue('links-scanned', 0, linksScanned, 800);
  animateValue('threats-blocked', 0, threatsBlocked, 800);
}

// Animate number counting up
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Button handlers
document.getElementById('view-settings').addEventListener('click', () => {
  // For now, just show an alert. You can expand this later
  alert('Settings feature coming soon!');
});

document.getElementById('view-history').addEventListener('click', () => {
  // For now, just show an alert. You can expand this later
  alert('History feature coming soon!');
});

// Load stats when popup shows
loadStats();

// Listen for updates from background script
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.linksScanned) {
      animateValue('links-scanned', changes.linksScanned.oldValue || 0, changes.linksScanned.newValue, 300);
    }
    if (changes.threatsBlocked) {
      animateValue('threats-blocked', changes.threatsBlocked.oldValue || 0, changes.threatsBlocked.newValue, 300);
    }
  }
});