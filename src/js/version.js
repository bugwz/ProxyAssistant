// ==========================================
// Version Check Module
// ==========================================

const versionIcons = {
  loading: '<svg class="spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  success: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  update: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  error: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
};

async function showVersionCheck() {
  $(".version-check-tip").show().addClass("show");

  const currentVersion = chrome.runtime.getManifest().version;
  $("#current-version-value").text(currentVersion);

  $("#store-version-value").html(`<span data-i18n="version_checking">${I18n.t('version_checking')}</span>`);
  $("#github-version-value").html(`<span data-i18n="version_checking">${I18n.t('version_checking')}</span>`);

  checkStoreVersion(currentVersion);
  checkGitHubVersion(currentVersion);
}

async function checkStoreVersion(currentVersion, isRetry = false) {
  const $el = $("#store-version-value");
  const FIREFOX_API_URL = 'https://addons.mozilla.org/api/v5/addons/addon/proxy-assistant@bugwz.com/';
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000];

  if (isRetry) {
    $el.html(`<span class="version-status-icon">${versionIcons.loading}</span> <span>${I18n.t('version_checking')}</span>`);
  }

  const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;

  if (isFirefox) {
    async function fetchWithRetry(attempt = 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(FIREFOX_API_URL, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const version = data.current_version?.version;
          if (version) {
            updateVersionUI($el, version, currentVersion, data.url);
            return true;
          }
        } else if (response.status === 403 || response.status === 429 || response.status >= 500) {
          throw new Error(`Firefox Add-ons API error: ${response.status}`);
        }
        return false;
      } catch (e) {
        clearTimeout(timeoutId);
        return e;
      }
    }

    let result = await fetchWithRetry();

    if (result === false || (result instanceof Error && !isRetry)) {
      for (let attempt = 0; attempt < MAX_RETRIES && !(result instanceof Response); attempt++) {
        const delay = RETRY_DELAYS[attempt];
        console.info(`Firefox Add-ons fetch failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`);
        $el.html(`<span class="version-status-icon">${versionIcons.loading}</span>
          <span style="color: #64748b; font-size: 12px;">${I18n.t('version_checking')}</span>`);

        await new Promise(resolve => setTimeout(resolve, delay));
        result = await fetchWithRetry(attempt + 1);
      }
    }

    if (result instanceof Error || !(result === true)) {
      console.info("Firefox Add-ons fetch failed:", result);
    }
  } else {
    const storeUrl = `https://chromewebstore.google.com/detail/${chrome.runtime.id}`;
    $el.html(`<a href="${storeUrl}" target="_blank" class="version-link">
      <span class="version-status-icon">${versionIcons.link}</span> ${I18n.t('check_store')}
    </a>`);
    return;
  }

  const fallbackUrl = 'https://addons.mozilla.org/firefox/addon/proxyassistant/';
  $el.html(`<a href="${fallbackUrl}" target="_blank" class="version-link">
    <span class="version-status-icon">${versionIcons.link}</span> ${I18n.t('check_store')}
  </a>`);
}

async function checkGitHubVersion(currentVersion) {
  const $el = $("#github-version-value");
  const GITHUB_API_URL = 'https://api.github.com/repos/bugwz/ProxyAssistant/releases/latest';
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000];

  $el.html(`<span class="version-status-icon">${versionIcons.loading}</span> <span>${I18n.t('version_checking')}</span>`);

  async function fetchWithRetry(attempt = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: { 'User-Agent': 'ProxyAssistant' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const version = data.tag_name.replace(/^v/, '');
        updateVersionUI($el, version, currentVersion, data.html_url);
        return true;
      } else if (response.status === 403 || response.status === 429 || response.status >= 500) {
        throw new Error(`GitHub API error: ${response.status}`);
      } else {
        throw new Error("GitHub API error");
      }
    } catch (e) {
      clearTimeout(timeoutId);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw e;
    }
  }

  try {
    await fetchWithRetry();
  } catch (e) {
    console.info("GitHub version check failed after retries:", e);
    const refreshBtn = `<button class="version-row-retry-btn github-refresh-btn" data-source="github">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
    </button>`;
    const errorHtml = `<span class="version-status-icon">${versionIcons.error}</span>
      <span style="color: #ef4444; font-size: 12px;">${I18n.t('version_error') || 'Failed'}</span>`;
    $el.html(errorHtml + refreshBtn);
  }
}

function updateVersionUI($el, remoteVersion, currentVersion, url) {
  const comparison = compareVersions(remoteVersion, currentVersion);
  let html = '';

  if (comparison > 0) {
    html = `<a href="${url}" target="_blank" class="version-link" style="color: #f97316; font-weight: 700;">
      <span class="version-status-icon">${versionIcons.update}</span> ${remoteVersion} (${I18n.t('version_mismatch')})
    </a>`;
  } else {
    html = `<a href="${url}" target="_blank" class="version-link" style="color: #22c55e;">
      <span class="version-status-icon">${versionIcons.success}</span> ${remoteVersion} (${I18n.t('version_match')})
    </a>`;
  }

  $el.html(html);

  const refreshBtn = `<button class="version-row-retry-btn github-refresh-btn" data-source="github">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  </button>`;
  $el.append(refreshBtn);
}

function compareVersions(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

// Export for use
window.VersionModule = {
  showVersionCheck,
  checkStoreVersion,
  checkGitHubVersion,
  updateVersionUI,
  compareVersions
};
