// Restore the last main page before the settings UI is first painted.
(function () {
  const storageKey = 'proxyAssistant.activeMainPage';
  const pageIds = [
    'proxies',
    'scenarios',
    'subscriptions',
    'sync',
    'config',
    'diagnostics',
    'appearance',
    'about'
  ];
  let pageId = 'proxies';

  try {
    const savedPageId = window.localStorage.getItem(storageKey);
    if (pageIds.includes(savedPageId)) {
      pageId = savedPageId;
    }
  } catch (error) {
    // Keep the default page when local storage is unavailable.
  }

  document.documentElement.dataset.initialMainPage = pageId;
})();
