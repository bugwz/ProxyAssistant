const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const iconsPath = path.join(__dirname, '../../src/js/icons.js');
const detectionPath = path.join(__dirname, '../../src/js/detection.js');

function createDiagnosticsDom() {
  document.body.innerHTML = `
    <section class="diagnostics-card diagnostics-detection-card">
      <button id="detect-proxy-btn"></button>
      <div class="proxy-detection-content">
        <div id="detection-status-icon"></div>
        <div id="detection-status-text"></div>
        <div id="detection-checked-time"></div>
        <div id="detection-details"></div>
        <div id="detection-warning"></div>
        <div id="detection-suggestion"><span id="detection-suggestion-text"></span></div>
      </div>
    </section>
    <section class="diagnostics-card diagnostics-logs-card" id="diagnostics-logs">
      <select id="runtime-log-level"><option value="all">All</option><option value="info">Info</option><option value="error">Error</option></select>
      <button id="refresh-runtime-logs-btn"></button>
      <button id="clear-runtime-logs-btn"></button>
      <div class="runtime-log-shell">
        <div class="runtime-log-meta-toolbar">
          <span id="runtime-log-count-total">0</span>
          <span id="runtime-log-count-info">0</span>
          <span id="runtime-log-count-warning">0</span>
          <span id="runtime-log-count-error">0</span>
          <button id="runtime-log-live-btn"></button>
          <button id="runtime-log-sort-btn"></button>
          <button id="runtime-log-copy-btn"></button>
        </div>
        <div id="runtime-log-wrapper">
          <div class="runtime-log-loading" aria-hidden="true"><span>获取中...</span></div>
          <div id="runtime-log-list"></div>
          <div id="runtime-log-empty" hidden><span></span></div>
        </div>
      </div>
    </section>
    <div class="runtime-log-clear-tip" hidden>
      <button class="runtime-log-clear-close-btn"></button>
      <button class="runtime-log-clear-cancel-btn"></button>
      <button id="confirm-clear-runtime-logs-btn"></button>
    </div>
    <section class="diagnostics-card diagnostics-pac-card">
      <button id="pac-details-btn"></button>
      <div class="pac-details-content">
        <span id="pac-rules-count-text"></span>
        <span id="pac-rules-count-value"></span>
        <span id="pac-last-fetched-at">-</span>
        <div id="pac-script-wrapper">
          <div class="pac-script-loading" aria-hidden="true"><span>获取中...</span></div>
          <div id="pac-script-content"></div>
        </div>
      </div>
    </section>
  `;
}

function loadDetectionModule(chrome) {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  const MainIcons = require(iconsPath);
  const I18n = { t: jest.fn(key => key) };
  const UtilsModule = {
    escapeHtml: jest.fn(value => String(value)),
    showTip: jest.fn()
  };
  const source = fs.readFileSync(detectionPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'MainIcons',
    'I18n',
    'UtilsModule',
    'chrome',
    'navigator',
    `${source}; return window.DetectionModule;`
  );

  return factory(
    window,
    document,
    window.$,
    MainIcons,
    I18n,
    UtilsModule,
    chrome,
    window.navigator
  );
}

describe('diagnostics workspace', () => {
  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
    delete window.navigator.clipboard;
    document.body.innerHTML = '';
    delete window.DetectionModule;
    delete window.$;
    delete window.jQuery;
  });

  test('updates the PAC card without hiding the detection card and manages its listener', () => {
    createDiagnosticsDom();
    const chrome = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn((message, callback) => callback({
          success: true,
          script: 'function FindProxyForURL() {\n  if (true) return "DIRECT";\n}'
        }))
      },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ state: { proxy: { mode: 'auto' } } }))
        },
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    DetectionModule.showPacDetails();

    expect($('.diagnostics-detection-card').prop('hidden')).toBe(false);
    expect($('.diagnostics-pac-card').prop('hidden')).toBe(false);
    expect($('#pac-script-content').text()).toContain('FindProxyForURL');
    expect($('#pac-script-content .config-json-line-number').toArray().map(element => element.textContent)).toEqual(['1', '2', '3']);
    expect($('#pac-script-content .config-json-line-content').toArray().map(element => element.textContent)).toEqual([
      'function FindProxyForURL() {',
      '  if (true) return "DIRECT";',
      '}'
    ]);
    expect($('#pac-rules-count-text').text()).toBe('pac_rules_count');
    expect($('#pac-rules-count-value').text()).toBe('1');
    expect($('#pac-last-fetched-at').text()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(chrome.storage.onChanged.addListener).toHaveBeenCalledTimes(1);

    const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
    listener({ state: { newValue: { proxy: { mode: 'auto' } } } }, 'local');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);

    DetectionModule.closePacDetails();
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(listener);
  });

  test('renders proxy detection results in one consolidated configuration group', async () => {
    createDiagnosticsDom();
    const chrome = {
      proxy: {
        settings: {
          get: jest.fn((options, callback) => callback({
            levelOfControl: 'controlled_by_this_extension',
            value: { mode: 'pac_script', pacScript: { data: 'function FindProxyForURL() {}' } }
          }))
        }
      },
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({
            state: { proxy: { mode: 'auto', current: { name: 'Node A', ip: '127.0.0.1', port: 8080 } } },
            config: {
              scenarios: {
                current: 'scenario-a',
                lists: [{ id: 'scenario-a', name: 'Office', proxies: [{ name: 'Node A' }, { name: 'Node B' }] }]
              }
            }
          }))
        },
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    await DetectionModule.detectProxy();

    expect($('.diagnostics-detection-card').prop('hidden')).toBe(false);
    expect($('.diagnostics-pac-card').prop('hidden')).toBe(false);
    expect($('#detection-status-text').text()).toBe('proxy_status_auto_mode');
    expect($('#detection-status-icon').html()).toContain('m9 15 3-6 3 6');
    expect($('#detection-status-icon svg').attr('style')).toContain('#22c55e');
    expect($('#detection-details .detection-info-group')).toHaveLength(1);
    expect($('#detection-details .detection-row')).toHaveLength(6);
    expect($('#detection-details').text()).toContain('proxy_extension_section');
    expect($('#detection-details').text()).toContain('PAC Script');
    expect($('#detection-details').text()).toContain('Node A');
    expect($('#detection-details').text()).toContain('Office');
    expect($('#detection-details').text()).toContain('proxy_auth_none');
    expect($('#detection-checked-time').text()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect($('#detect-proxy-btn').prop('disabled')).toBe(false);

    chrome.proxy.settings.get.mockImplementation((options, callback) => callback({
      levelOfControl: 'controlled_by_this_extension',
      value: {
        mode: 'fixed_servers',
        rules: { singleProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 } }
      }
    }));
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({
      state: { proxy: { mode: 'manual', current: { name: 'Node A', ip: '127.0.0.1', port: 8080, username: 'user' } } },
      config: {
        scenarios: {
          current: 'scenario-a',
          lists: [{ id: 'scenario-a', name: 'Office', proxies: [{ name: 'Node A' }] }]
        }
      }
    }));

    await DetectionModule.detectProxy();

    expect($('#detection-status-text').text()).toBe('proxy_status_manual_mode');
    expect($('#detection-status-icon').html()).toContain('M9 15V9l3 4 3-4v6');
    expect($('#detection-status-icon svg').attr('style')).toContain('var(--accent-color)');
    expect($('#detection-details .detection-value').map((index, element) => $(element).text()).get()).toEqual([
      'mode_manual',
      'proxy_control_this',
      'Office',
      'Node A',
      'HTTP · 127.0.0.1:8080',
      'proxy_auth_configured'
    ]);
    expect($('#detection-details').text()).not.toContain('user');
  });

  test('uses a neutral disabled icon when extension proxying is disabled', async () => {
    createDiagnosticsDom();
    const chrome = {
      proxy: {
        settings: {
          get: jest.fn((options, callback) => callback({
            levelOfControl: 'controlled_by_this_extension',
            value: { mode: 'direct' }
          }))
        }
      },
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({
            state: { proxy: { mode: 'disabled', current: null } },
            config: { scenarios: { current: 'default', lists: [] } }
          }))
        },
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    await DetectionModule.detectProxy();

    expect($('#detection-status-text').text()).toBe('status_disabled');
    expect($('#detection-status-icon path').attr('d')).toBe('M8 12h8');
    expect($('#detection-status-icon').html()).not.toContain('m9 12 2 2 4-4');
  });

  test('keeps click refresh feedback visible for a short minimum duration', async () => {
    jest.useFakeTimers();
    createDiagnosticsDom();
    const chrome = {
      proxy: {
        settings: {
          get: jest.fn((options, callback) => callback({
            levelOfControl: 'controlled_by_this_extension',
            value: { mode: 'direct' }
          }))
        }
      },
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({
            state: { proxy: { mode: 'disabled', current: null } },
            config: { scenarios: { current: 'default', lists: [] } }
          }))
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    const detectionPromise = DetectionModule.detectProxy({ type: 'click' });
    await Promise.resolve();
    await Promise.resolve();

    expect($('#detect-proxy-btn').prop('disabled')).toBe(true);
    expect($('.proxy-detection-content').hasClass('is-refreshing')).toBe(true);
    expect($('.proxy-detection-content').attr('aria-busy')).toBe('true');
    expect($('#detection-status-text').text()).toBe('proxy_effect_testing');
    expect($('#detection-details .detection-info-group')).toHaveLength(1);
    expect($('#detection-details .detection-row')).toHaveLength(6);
    expect($('#detection-details .detection-label').map((index, element) => $(element).text()).get()).toEqual([
      'proxy_extension_mode',
      'proxy_control',
      'scenario_name',
      'proxy_current_node',
      'proxy_server',
      'authentication'
    ]);
    expect($('#detection-details .detection-value').map((index, element) => $(element).text()).get()).toEqual(Array(6).fill('-'));

    await jest.advanceTimersByTimeAsync(599);
    expect($('#detect-proxy-btn').prop('disabled')).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    await detectionPromise;

    expect($('#detect-proxy-btn').prop('disabled')).toBe(false);
    expect($('.proxy-detection-content').hasClass('is-refreshing')).toBe(false);
    expect($('.proxy-detection-content').attr('aria-busy')).toBe('false');
    expect($('#detection-status-text').text()).toBe('status_disabled');
  });

  test('keeps PAC click refresh feedback visible for a short minimum duration', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 0));
    createDiagnosticsDom();
    const chrome = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn((message, callback) => callback({
          success: true,
          script: 'function FindProxyForURL() { return "DIRECT"; }'
        }))
      },
      storage: {
        local: { get: jest.fn() },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);
    $('#pac-script-wrapper')[0].getBoundingClientRect = jest.fn(() => ({ height: 318 }));

    const refreshPromise = DetectionModule.updatePacDetails({ type: 'click' });
    await Promise.resolve();

    expect($('#pac-details-btn').prop('disabled')).toBe(true);
    expect($('#pac-script-content').text()).toBe('');
    expect($('#pac-rules-count-value').text()).toBe('-');
    expect($('.pac-details-content').hasClass('is-refreshing')).toBe(true);
    expect($('.pac-details-content').attr('aria-busy')).toBe('true');
    expect($('.pac-script-loading').attr('aria-hidden')).toBe('false');
    expect($('.pac-script-loading').text()).toBe('获取中...');
    expect($('#pac-script-wrapper')[0].style.height).toBe('318px');

    await jest.advanceTimersByTimeAsync(599);
    expect($('#pac-details-btn').prop('disabled')).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    await refreshPromise;

    expect($('#pac-details-btn').prop('disabled')).toBe(false);
    expect($('#pac-script-content').text()).toContain('FindProxyForURL');
    expect($('#pac-last-fetched-at').text()).toBe('2026-08-22 08:00:00');
    expect($('.pac-details-content').hasClass('is-refreshing')).toBe(false);
    expect($('.pac-details-content').attr('aria-busy')).toBe('false');
    expect($('.pac-script-loading').attr('aria-hidden')).toBe('true');
    expect($('#pac-script-wrapper')[0].style.height).toBe('');
  });

  test('polls runtime logs every second while preserving selected log text', () => {
    jest.useFakeTimers();
    createDiagnosticsDom();
    const logs = [
      { id: '1', time: '2026-08-22T08:00:00.000Z', level: 'info', category: 'proxy', event: 'proxy_manual_enabled', details: { proxyName: 'Node A' } },
      { id: '2', time: '2026-08-22T08:01:00.000Z', level: 'error', category: 'subscription', event: 'subscription_refresh_failed', details: { error: 'HTTP 500' } }
    ];
    let storedLogs = logs;
    const chrome = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn()
      },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ runtime_logs: storedLogs })),
          set: jest.fn((values, callback) => callback())
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    DetectionModule.initRuntimeLogs();
    DetectionModule.loadRuntimeLogs();

    expect($('.diagnostics-detection-card').prop('hidden')).toBe(false);
    expect($('.diagnostics-logs-card').prop('hidden')).toBe(false);
    expect($('.diagnostics-pac-card').prop('hidden')).toBe(false);
    expect($('.runtime-log-item')).toHaveLength(2);
    expect([
      $('#runtime-log-count-total').text(),
      $('#runtime-log-count-info').text(),
      $('#runtime-log-count-warning').text(),
      $('#runtime-log-count-error').text()
    ]).toEqual(['2', '1', '0', '1']);
    expect($('.runtime-log-line-number').map((index, element) => $(element).text()).get()).toEqual(['1', '2']);
    expect($('.runtime-log-time').toArray().every(element => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test($(element).text()))).toBe(true);
    const firstLogFields = $('.runtime-log-item').first().children().map((index, element) => $(element).text()).get();
    expect(firstLogFields[0]).toBe('1');
    expect(firstLogFields[1]).toMatch(/^2026-08-22 \d{2}:00:00$/);
    expect(firstLogFields.slice(2)).toEqual([
      'INFO',
      'Manual proxy enabled, proxy: node a'
    ]);
    expect($('.runtime-log-message').eq(1).text()).toBe('Rule subscription refresh failed, error: http 500');
    expect($('.runtime-log-message').toArray().every(element => {
      const content = $(element).text();
      return content === content.charAt(0).toUpperCase() + content.slice(1).toLowerCase();
    })).toBe(true);
    expect($('#runtime-log-sort-btn').attr('data-sort-order')).toBe('asc');
    expect($('#runtime-log-sort-btn').attr('aria-pressed')).toBe('false');

    $('#runtime-log-sort-btn').trigger('click');
    expect($('.runtime-log-line-number').map((index, element) => $(element).text()).get()).toEqual(['2', '1']);
    expect($('.runtime-log-message').first().text()).toBe('Rule subscription refresh failed, error: http 500');
    expect($('#runtime-log-sort-btn').attr('data-sort-order')).toBe('desc');
    expect($('#runtime-log-sort-btn').attr('aria-pressed')).toBe('true');
    expect(window.localStorage.getItem('proxyAssistant.runtimeLogSortOrder')).toBe('desc');
    expect($('.runtime-log-category')).toHaveLength(0);
    expect($('.runtime-log-details')).toHaveLength(0);

    $('#runtime-log-level').val('error').trigger('change');
    expect($('.runtime-log-item')).toHaveLength(1);
    expect($('#runtime-log-count-total').text()).toBe('2');
    expect($('.runtime-log-line-number').text()).toBe('1');
    expect($('.runtime-log-item').hasClass('runtime-log-error')).toBe(true);

    $('#runtime-log-live-btn').trigger('click');
    expect($('#runtime-log-live-btn').attr('aria-pressed')).toBe('true');
    expect($('#runtime-log-live-btn').attr('data-i18n-title')).toBe('runtime_logs_auto_update_disable');
    expect($('#runtime-log-live-btn svg')).toHaveLength(0);
    expect($('#runtime-log-live-btn .runtime-log-live-indicator > .runtime-log-live-dot')).toHaveLength(1);

    storedLogs = [logs[0]];
    jest.advanceTimersByTime(999);
    expect($('#runtime-log-count-total').text()).toBe('2');
    jest.advanceTimersByTime(1);
    expect($('#runtime-log-count-total').text()).toBe('1');
    expect($('#runtime-log-count-info').text()).toBe('1');
    expect($('#runtime-log-empty').prop('hidden')).toBe(false);

    $('#runtime-log-level').val('all').trigger('change');
    expect($('.runtime-log-item')).toHaveLength(1);

    const retainedLogItem = $('.runtime-log-item')[0];
    const retainedMessage = retainedLogItem.querySelector('.runtime-log-message').firstChild;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(retainedMessage);
    selection.removeAllRanges();
    selection.addRange(range);
    const selectedText = selection.toString();
    const newestLog = { id: '3', time: '2026-08-22T08:02:00.000Z', level: 'warning', event: 'proxy_apply_failed', details: {} };
    storedLogs = [logs[0], newestLog];
    jest.advanceTimersByTime(1000);
    expect($('.runtime-log-line-number').map((index, element) => $(element).text()).get()).toEqual(['2', '1']);
    expect($('.runtime-log-item')[1]).toBe(retainedLogItem);
    expect(selection.toString()).toBe(selectedText);
    expect($('.runtime-log-shell').hasClass('is-refreshing')).toBe(false);
    expect($('.runtime-log-loading').attr('aria-hidden')).toBe('true');

    $('#runtime-log-live-btn').trigger('click');
    expect($('#runtime-log-live-btn').attr('aria-pressed')).toBe('false');
    storedLogs = [];
    jest.advanceTimersByTime(1000);
    expect($('#runtime-log-count-total').text()).toBe('2');

    $('#clear-runtime-logs-btn').trigger('click');
    expect($('.runtime-log-clear-tip').hasClass('show')).toBe(true);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();

    $('.runtime-log-clear-cancel-btn').trigger('click');
    expect($('.runtime-log-clear-tip').hasClass('show')).toBe(false);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();

    $('#clear-runtime-logs-btn').trigger('click');
    $('#confirm-clear-runtime-logs-btn').trigger('click');
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['runtime_logs'], expect.any(Function));
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ runtime_logs: [] }, expect.any(Function));
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect($('.runtime-log-item')).toHaveLength(0);
    expect($('#runtime-log-empty').prop('hidden')).toBe(false);
  });

  test('copies every runtime log in the current sort order regardless of the level filter', async () => {
    createDiagnosticsDom();
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue() }
    });
    const logs = [
      { id: '1', time: '2026-08-22T08:00:00.000Z', level: 'info', event: 'proxy_manual_enabled', details: { proxyName: 'Node A' } },
      { id: '2', time: '2026-08-22T08:01:00.000Z', level: 'error', event: 'subscription_refresh_failed', details: { error: 'HTTP 500' } }
    ];
    const chrome = {
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ runtime_logs: logs })),
          set: jest.fn()
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    DetectionModule.initRuntimeLogs();
    DetectionModule.loadRuntimeLogs();
    $('#runtime-log-level').val('error').trigger('change');
    $('#runtime-log-sort-btn').trigger('click');
    $('#runtime-log-copy-btn').trigger('click');
    await Promise.resolve();

    const copiedLines = window.navigator.clipboard.writeText.mock.calls[0][0].split('\n');
    expect(copiedLines).toHaveLength(2);
    expect(copiedLines[0]).toMatch(/^2026-08-22 \d{2}:01:00 ERRO Rule subscription refresh failed, error: http 500$/);
    expect(copiedLines[1]).toMatch(/^2026-08-22 \d{2}:00:00 INFO Manual proxy enabled, proxy: node a$/);
  });

  test('restores the saved runtime log sort order after reopening the main page', () => {
    createDiagnosticsDom();
    const logs = [
      { id: '1', time: '2026-08-22T08:00:00.000Z', level: 'info', event: 'extension_updated', details: {} },
      { id: '2', time: '2026-08-22T08:01:00.000Z', level: 'warning', event: 'proxy_apply_failed', details: {} }
    ];
    const chrome = {
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ runtime_logs: logs })),
          set: jest.fn()
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const firstDetectionModule = loadDetectionModule(chrome);

    firstDetectionModule.initRuntimeLogs();
    firstDetectionModule.loadRuntimeLogs();
    $('#runtime-log-sort-btn').trigger('click');

    expect(window.localStorage.getItem('proxyAssistant.runtimeLogSortOrder')).toBe('desc');

    createDiagnosticsDom();
    const reopenedDetectionModule = loadDetectionModule(chrome);
    reopenedDetectionModule.initRuntimeLogs();
    reopenedDetectionModule.loadRuntimeLogs();

    expect($('#runtime-log-sort-btn').attr('data-sort-order')).toBe('desc');
    expect($('#runtime-log-sort-btn').attr('aria-pressed')).toBe('true');
    expect($('.runtime-log-line-number').map((index, element) => $(element).text()).get()).toEqual(['2', '1']);
  });

  test('keeps the runtime log refresh animation visible after a click', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 0));
    createDiagnosticsDom();
    const chrome = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn((message, callback) => callback({
          success: true,
          logs: [{ id: '1', time: '2026-08-22T08:00:00.000Z', level: 'info', category: 'system', event: 'extension_updated', details: {} }]
        }))
      },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({
            runtime_logs: [{ id: '1', time: '2026-08-22T08:00:00.000Z', level: 'info', category: 'system', event: 'extension_updated', details: {} }]
          })),
          set: jest.fn()
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);
    $('#runtime-log-wrapper')[0].getBoundingClientRect = jest.fn(() => ({ height: 286 }));

    DetectionModule.initRuntimeLogs();
    $('#refresh-runtime-logs-btn').trigger('click');

    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(true);
    expect($('.runtime-log-item')).toHaveLength(0);
    expect($('.runtime-log-shell').hasClass('is-refreshing')).toBe(true);
    expect($('.runtime-log-shell').attr('aria-busy')).toBe('true');
    expect($('.runtime-log-loading').attr('aria-hidden')).toBe('false');
    expect($('#runtime-log-wrapper')[0].style.height).toBe('286px');
    expect($('#runtime-log-count-total').text()).toBe('-');

    await jest.advanceTimersByTimeAsync(599);
    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(false);
    expect($('.runtime-log-item')).toHaveLength(1);
    expect($('.runtime-log-shell').hasClass('is-refreshing')).toBe(false);
    expect($('.runtime-log-shell').attr('aria-busy')).toBe('false');
    expect($('.runtime-log-loading').attr('aria-hidden')).toBe('true');
    expect($('#runtime-log-wrapper')[0].style.height).toBe('');
  });

  test('restores runtime log loading state after failure and blocks duplicate refreshes', async () => {
    jest.useFakeTimers();
    createDiagnosticsDom();
    const chrome = {
      runtime: { lastError: { message: 'Storage unavailable' } },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn()
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    DetectionModule.loadRuntimeLogs({ type: 'click' });
    DetectionModule.loadRuntimeLogs({ type: 'click' });

    expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(true);
    expect($('.runtime-log-shell').attr('aria-busy')).toBe('true');

    await jest.advanceTimersByTimeAsync(600);

    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(false);
    expect($('.runtime-log-shell').hasClass('is-refreshing')).toBe(false);
    expect($('.runtime-log-shell').attr('aria-busy')).toBe('false');
    expect($('.runtime-log-loading').attr('aria-hidden')).toBe('true');
    expect($('#runtime-log-empty').prop('hidden')).toBe(false);
    expect($('#runtime-log-count-total').text()).toBe('0');
  });

  test('does not add feedback delay after a slow runtime log refresh', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 0));
    createDiagnosticsDom();
    let storageCallback;
    const chrome = {
      runtime: { lastError: null },
      storage: {
        local: {
          get: jest.fn((keys, callback) => { storageCallback = callback; }),
          set: jest.fn()
        },
        onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
      }
    };
    const DetectionModule = loadDetectionModule(chrome);

    DetectionModule.loadRuntimeLogs({ type: 'click' });
    const timerCountBeforeResponse = jest.getTimerCount();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 1));
    storageCallback({ runtime_logs: [] });

    expect($('#refresh-runtime-logs-btn').prop('disabled')).toBe(false);
    expect($('.runtime-log-shell').hasClass('is-refreshing')).toBe(false);
    expect(jest.getTimerCount()).toBe(timerCountBeforeResponse);
  });
});
