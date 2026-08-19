// Restore the last main page before the settings UI is first painted.
(function () {
  const storageKey = 'proxyAssistant.activeMainPage';
  const pageIds = [
    'proxies',
    'scenarios',
    'subscriptions',
    'config',
    'diagnostics',
    'appearance',
    'about'
  ];
  let pageId = 'proxies';

  try {
    const storedPageId = window.localStorage.getItem(storageKey);
    const savedPageId = storedPageId === 'sync' ? 'config' : storedPageId;
    if (pageIds.includes(savedPageId)) {
      pageId = savedPageId;
      if (storedPageId !== savedPageId) {
        window.localStorage.setItem(storageKey, savedPageId);
      }
    }
  } catch (error) {
    // Keep the default page when local storage is unavailable.
  }

  document.documentElement.dataset.initialMainPage = pageId;
})();
