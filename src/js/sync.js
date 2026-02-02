// ==========================================
// Sync Module - Native and Gist Sync
// ==========================================

const SYNC_CHUNK_SIZE = 7 * 1024;

let syncConfig = {
  type: 'native',
  gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
};

// ==========================================
// Sync Chunked Storage Helpers
// ==========================================

function chunkString(str, size) {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.substring(i, i + size));
    i += size;
  }
  return chunks;
}

function calculateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'crc:' + Math.abs(hash).toString(16);
}

function buildSyncMeta(chunks) {
  const totalSize = chunks.reduce((sum, chunk) => sum + new Blob([chunk]).size, 0);
  const fullData = chunks.join('');
  return {
    version: 4,
    chunks: {
      start: 0,
      end: chunks.length - 1
    },
    totalSize: totalSize,
    checksum: calculateChecksum(fullData)
  };
}

function isValidMeta(meta) {
  return meta &&
    typeof meta.version === 'number' &&
    meta.chunks &&
    typeof meta.chunks.start === 'number' &&
    typeof meta.chunks.end === 'number' &&
    typeof meta.checksum === 'string';
}

// ==========================================
// Sync UI Functions
// ==========================================

function updateSyncUI() {
  const type = syncConfig.type || 'native';

  const $badge = $('#sync-status-badge');
  const typeTextKey = type === 'native' ? 'sync_native' : 'sync_gist';
  const typeText = I18n.t(typeTextKey);

  $badge.text(typeText).addClass('active');

  const $selectedOption = $(`.sync-selector li[data-value="${type}"]`);
  if ($selectedOption.length) {
    $('#current-sync-display').text($selectedOption.text());
  }

  $('.sync-panel').hide();
  $('#test-sync-connection').hide();

  if (type === 'gist') {
    $('#gist-token').val(syncConfig.gist.token);
    $('#gist-filename').val(syncConfig.gist.filename || 'proxy_assistant_config.json');
    $('#gist-config').show();
    $('#test-sync-connection').show();
  } else {
    $('#native-config').show();
    updateNativeQuotaInfo();
  }
}

function updateNativeQuotaInfo() {
  if (typeof buildConfigData !== 'function') return;
  const data = buildConfigData();
  const jsonStr = JSON.stringify(data);
  const chunks = chunkString(jsonStr, SYNC_CHUNK_SIZE);
  const meta = buildSyncMeta(chunks);

  const quotaItemLimit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8000;
  const quotaTotalLimit = chrome.storage.sync.QUOTA_BYTES || 102400;

  const usageBytes = meta.totalSize;
  const chunksCount = chunks.length;
  const usageKB = (usageBytes / 1024).toFixed(1);
  const quotaItemKB = (quotaItemLimit / 1024).toFixed(1);
  const quotaTotalKB = (quotaTotalLimit / 1024).toFixed(0);

  const percentage = ((usageBytes / quotaTotalLimit) * 100).toFixed(1);

  const usageText = I18n.t('sync_quota_usage_chunked')
    .replace('{usage}', usageKB + 'KB')
    .replace('{chunks}', chunksCount)
    .replace('{quota}', quotaTotalKB + 'KB')
    .replace('{percent}', percentage + '%');
  $('#quota-usage-text').text(usageText);

  const $barFill = $('#quota-bar-fill');
  $barFill.css('width', Math.min(percentage, 100) + '%');

  $barFill.removeClass('normal warning exceeded');
  if (usageBytes > quotaTotalLimit) {
    $barFill.addClass('exceeded');
  } else if (usageBytes > quotaTotalLimit * 0.8) {
    $barFill.addClass('warning');
  } else {
    $barFill.addClass('normal');
  }

  const $warning = $('#quota-warning');
  if (usageBytes > quotaTotalLimit) {
    const exceededText = I18n.t('sync_quota_limit_exceeded')
      .replace('{size}', usageKB + 'KB');
    $warning.text(exceededText).show();
  } else if (usageBytes > quotaTotalLimit * 0.8) {
    const warningText = I18n.t('sync_quota_warning')
      .replace('{percent}', percentage + '%');
    $warning.text(warningText).show();
  } else {
    $warning.hide();
  }
}

// ==========================================
// Native Sync Push (Chunked)
// ==========================================

async function nativePush(data) {
  const jsonStr = JSON.stringify(data);
  const chunks = chunkString(jsonStr, SYNC_CHUNK_SIZE);

  const meta = buildSyncMeta(chunks);

  const toWrite = { 'meta': meta };
  chunks.forEach((chunk, index) => {
    toWrite['data.' + index] = chunk;
  });

  await new Promise((resolve, reject) => {
    chrome.storage.sync.clear(function () {
      if (chrome.runtime.lastError) {
        reject(new Error('Clear failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });

  await new Promise((resolve, reject) => {
    chrome.storage.sync.set(toWrite, function () {
      if (chrome.runtime.lastError) {
        reject(new Error('Write failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });

  return {
    chunks: chunks.length,
    totalSize: meta.totalSize
  };
}

// ==========================================
// Native Sync Pull (Chunked)
// ==========================================

async function nativePull() {
  const metaResult = await new Promise((resolve, reject) => {
    chrome.storage.sync.get('meta', function (items) {
      if (chrome.runtime.lastError) {
        reject(new Error('Read meta failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve(items);
      }
    });
  });

  const meta = metaResult.meta;

  if (!isValidMeta(meta)) {
    throw new Error('Invalid or missing metadata');
  }

  const keys = ['meta'];
  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    keys.push('data.' + i);
  }

  const items = await new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error('Read chunks failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });

  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    if (!items['data.' + i]) {
      throw new Error('Missing chunk: data.' + i);
    }
  }

  const mergedData = [];
  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    mergedData.push(items['data.' + i]);
  }
  const fullData = mergedData.join('');

  const calculatedChecksum = calculateChecksum(fullData);
  if (calculatedChecksum !== meta.checksum) {
    throw new Error('Checksum mismatch - data may be corrupted');
  }

  return JSON.parse(fullData);
}

// ==========================================
// Manual Sync Handlers
// ==========================================

async function manualPush() {
  const type = syncConfig.type || 'native';
  var $btn = $("#sync-push-btn");
  $btn.prop('disabled', true);

  // Use buildConfigData to get data in export format
  const data = buildConfigData ? buildConfigData() : (StorageModule ? StorageModule.getConfig() : {});

  try {
    if (type === 'native') {
      const result = await nativePush(data);
      console.log('Native sync: Pushed ' + result.chunks + ' chunks, ' + result.totalSize + ' bytes');
    } else if (type === 'gist') {
      await pushToGist(data);
    }
    showTip(I18n.t('push_success'), false);
  } catch (e) {
    console.log("Sync Push Error:", e);
    showTip(I18n.t('push_failed') + ': ' + (e.message || e), true);
  } finally {
    $btn.prop('disabled', false);
  }
}

async function manualPull() {
  const type = syncConfig.type || 'native';
  var $btn = $("#sync-pull-btn");
  $btn.prop('disabled', true);

  try {
    let remoteData = null;

    if (type === 'native') {
      remoteData = await nativePull();
    } else if (type === 'gist') {
      remoteData = await pullFromGist();
    }

    if (remoteData) {
      console.log("Sync: Pulled data from " + type);

      // Use migrateConfig to ensure correct format
      const data = ConfigModule && ConfigModule.migrateConfig
        ? ConfigModule.migrateConfig(remoteData)
        : remoteData;

      // Preserve local sync config
      const localSyncConfig = syncConfig;

      // Merge sync config
      if (data.system && data.system.sync) {
        const remoteSync = data.system.sync;
        data.system.sync = {
          type: remoteSync.type || localSyncConfig.type,
          gist: {
            token: localSyncConfig.gist?.token || '',
            filename: remoteSync.gist?.filename || localSyncConfig.gist?.filename || 'proxy_assistant_config.json',
            gist_id: remoteSync.gist?.gist_id || localSyncConfig.gist?.gist_id || ''
          }
        };
      } else {
        data.system = data.system || {};
        data.system.sync = localSyncConfig;
      }

      // Parse subscription rules
      if (data.scenarios && data.scenarios.lists) {
        data.scenarios.lists.forEach(scenario => {
          if (scenario.proxies && SubscriptionModule && SubscriptionModule.parseProxyListSubscriptions) {
            SubscriptionModule.parseProxyListSubscriptions(scenario.proxies);
          }
        });
      }

      // Save to new format
      if (StorageModule) {
        StorageModule.setConfig(data);
        await StorageModule.save();

        // Update syncConfig
        syncConfig = data.system.sync;

        // Refresh UI
        if (typeof loadSettings === 'function') {
          loadSettings();
        } else {
          // Fallback
          ProxyModule.setList(StorageModule.getProxies());
          ProxyModule.renderList();
          ScenariosModule.renderScenarioSelector();
        }

        showTip(I18n.t('pull_success'), false);
      } else {
        // Fallback: save to legacy format
        const toSave = {
          config: data
        };

        chrome.storage.local.set(toSave, function () {
          if (chrome.runtime.lastError) {
            showTip(I18n.t('pull_failed') + ': ' + chrome.runtime.lastError.message, true);
            return;
          }
          syncConfig = data.system.sync;
          if (typeof loadSettings === 'function') {
            loadSettings();
          }
          showTip(I18n.t('pull_success'), false);
        });
      }
    } else {
      showTip(I18n.t('pull_failed'), true);
    }
  } catch (e) {
    console.log("Sync Pull Error:", e);
    showTip(I18n.t('pull_failed') + ': ' + (e.message || e), true);
  } finally {
    $btn.prop('disabled', false);
  }
}

// ==========================================
// GitHub Gist Implementation
// ==========================================

async function pushToGist(data) {
  const token = syncConfig.gist.token;
  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  if (!token) return;

  const validateResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!validateResponse.ok) {
    if (validateResponse.status === 401) throw new Error(I18n.t('sync_error_invalid_token'));
    throw new Error(I18n.t('sync_error_connection') + ': ' + validateResponse.status);
  }

  const content = JSON.stringify(data, null, 2);

  let gistId = syncConfig.gist.gist_id;
  let fileExists = false;

  if (gistId) {
    try {
      const gistContent = await getGistContent(token, gistId, filename);
      if (gistContent) {
        fileExists = true;
      }
    } catch (e) {
      console.info("Gist not found or inaccessible, will try to find or create:", e);
      gistId = null;
    }
  }

  if (!gistId || !fileExists) {
    gistId = await findGistByFilename(token, filename);
    if (gistId) {
      fileExists = true;
      syncConfig.gist.gist_id = gistId;
      if (StorageModule) {
        StorageModule.setSyncConfig(syncConfig);
        StorageModule.save();
      } else {
        chrome.storage.local.get(['config'], function (result) {
          const config = result.config || {};
          if (!config.system) config.system = {};
          config.system.sync = syncConfig;
          chrome.storage.local.set({ config: config });
        });
      }
    }
  }

  if (gistId && fileExists) {
    await updateGist(token, gistId, filename, content);
  } else {
    const newId = await createGist(token, filename, content);
    syncConfig.gist.gist_id = newId;
    if (StorageModule) {
      StorageModule.setSyncConfig(syncConfig);
      StorageModule.save();
    } else {
      chrome.storage.local.get(['config'], function (result) {
        const config = result.config || {};
        if (!config.system) config.system = {};
        config.system.sync = syncConfig;
        chrome.storage.local.set({ config: config });
      });
    }
  }
}

async function pullFromGist() {
  const token = syncConfig.gist.token;
  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  if (!token) return null;

  let gistId = syncConfig.gist.gist_id;

  if (!gistId) {
    gistId = await findGistByFilename(token, filename);
    if (gistId) {
      syncConfig.gist.gist_id = gistId;
      if (StorageModule) {
        StorageModule.setSyncConfig(syncConfig);
        StorageModule.save();
      } else {
        chrome.storage.local.get(['config'], function (result) {
          const config = result.config || {};
          if (!config.system) config.system = {};
          config.system.sync = syncConfig;
          chrome.storage.local.set({ config: config });
        });
      }
    } else {
      return null;
    }
  }

  return await getGistContent(token, gistId, filename);
}

async function findGistByFilename(token, filename) {
  let page = 1;
  const perPage = 100;
  let foundGistId = null;

  while (page <= 10 && !foundGistId) {
    const response = await fetch(`https://api.github.com/gists?page=${page}&per_page=${perPage}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid Token");
      if (response.status === 403) {
        console.info("GitHub API rate limited while searching for gist");
        break;
      }
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const gists = await response.json();

    if (gists.length === 0) {
      break;
    }

    for (const gist of gists) {
      if (gist.files && gist.files[filename]) {
        foundGistId = gist.id;
        break;
      }
    }

    page++;
  }

  return foundGistId;
}

async function createGist(token, filename, content) {
  const files = {};
  files[filename] = { content: content };

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Proxy Assistant Configuration',
      public: false,
      files: files
    })
  });

  if (!response.ok) throw new Error(I18n.t('sync_error_create_gist'));
  const data = await response.json();
  return data.id;
}

async function updateGist(token, gistId, filename, content) {
  const files = {};
  files[filename] = { content: content };

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: files })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("Gist update error:", response.status, errorText);
    throw new Error(I18n.t('sync_error_update_gist') + ` (${response.status})`);
  }
}

async function getGistContent(token, gistId, filename) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) throw new Error(I18n.t('sync_error_get_gist'));
  const data = await response.json();

  if (data.files && data.files[filename]) {
    const content = data.files[filename].content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.log("Parse Gist Content Error", e);
      return null;
    }
  }
  return null;
}

async function testGistConnection() {
  const token = syncConfig.gist.token;
  if (!token) throw new Error(I18n.t('sync_error_token_empty'));

  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error(I18n.t('sync_error_invalid_token'));
    throw new Error(I18n.t('sync_error_connection') + response.status);
  }

  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  const gistId = await findGistByFilename(token, filename);

  if (gistId) {
    syncConfig.gist.gist_id = gistId;
    if (StorageModule) {
      StorageModule.setSyncConfig(syncConfig);
      StorageModule.save();
    } else {
      chrome.storage.local.get(['config'], function (result) {
        const config = result.config || {};
        if (!config.system) config.system = {};
        config.system.sync = syncConfig;
        chrome.storage.local.set({ config: config });
      });
    }
    return I18n.t('sync_success_found') + filename;
  } else {
    return I18n.t('sync_success_new');
  }
}

// Export for use
window.SyncModule = {
  nativePush,
  nativePull,
  manualPush,
  manualPull,
  pushToGist,
  pullFromGist,
  testGistConnection,
  updateSyncUI,
  updateNativeQuotaInfo,
  getSyncConfig: () => syncConfig,
  setSyncConfig: (config) => { syncConfig = config; },
  chunkString,
  calculateChecksum,
  buildSyncMeta,
  isValidMeta
};
