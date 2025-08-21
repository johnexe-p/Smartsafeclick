// Intercepts clicks on links; sends URL to background for scoring
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  chrome.runtime.sendMessage({ type: 'CHECK_URL', url: a.href });
});