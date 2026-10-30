/* Runs before Expo so missing release bundles cannot leave an empty document. */
(function () {
  const notice = document.getElementById('aarvika-startup');
  const message = document.getElementById('aarvika-startup-message');
  const retry = document.getElementById('aarvika-startup-retry');
  const key = 'aarvika:bundle-recovery';
  let recovering = false;
  function freshUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('_aarvika_retry', String(Date.now()));
    return url.href;
  }
  function showRetry() {
    notice.hidden = false;
    message.textContent = 'The app could not finish loading. Check your connection and try again.';
    retry.hidden = false;
    retry.href = freshUrl();
  }
  function recover() {
    if (recovering) return;
    let last = Number(new URL(window.location.href).searchParams.get('_aarvika_retry') || 0);
    try { last = Math.max(last, Number(sessionStorage.getItem(key) || 0)); } catch { /* Private browsing may block storage. */ }
    if (Date.now() - last < 60000) { showRetry(); return; }
    recovering = true;
    try { sessionStorage.setItem(key, String(Date.now())); } catch { /* URL also limits retries. */ }
    window.location.replace(freshUrl());
  }
  window.addEventListener('error', function (event) {
    const script = event.target;
    if (script && script.tagName === 'SCRIPT' && script.src) {
      const url = new URL(script.src, window.location.href);
      if (url.origin === window.location.origin && url.pathname.startsWith('/_expo/')) recover();
    }
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    const message = String(event.reason && (event.reason.message || event.reason) || '');
    if (/ChunkLoadError|LoadBundleError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) recover();
  });
  const timer = setTimeout(showRetry, 15000);
  const observer = new MutationObserver(function () {
    const root = document.getElementById('root');
    if (root && root.childElementCount) {
      notice.hidden = true;
      clearTimeout(timer);
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
}());
