const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const iconsPath = path.join(__dirname, '../../src/js/icons.js');
const detectionPath = path.join(__dirname, '../../src/js/detection.js');

function createDiagnosticsDom() {
  document.body.innerHTML = `
    <section class="diagnostics-card diagnostics-detection-card">
      <button id="detect-proxy-btn"></button>
      <div id="detection-status-icon"></div>
      <div id="detection-status-text"></div>
      <div id="detection-checked-time"></div>
      <div id="detection-details"></div>
      <div id="detection-warning"></div>
      <div id="detection-suggestion"><span id="detection-suggestion-text"></span></div>
    </section>
    <section class="diagnostics-card diagnostics-pac-card">
      <button id="pac-details-btn"></button>
      <span id="pac-mode-value"></span>
      <span id="pac-generated-time"></span>
      <pre id="pac-script-content"></pre>
      <span id="pac-rules-count-text"></span>
      <span id="pac-rules-count-value"></span>
    </section>
  `;
}

function loadDetectionModule(chrome) {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  const MainIcons = require(iconsPath);
  const I18n = { t: jest.fn(key => key) };
  const UtilsModule = { escapeHtml: jest.fn(value => String(value)) };
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
          script: 'function FindProxyForURL() { if (true) return "DIRECT"; }'
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
    expect($('#pac-mode-value').text()).toBe('mode_auto');
    expect($('#pac-script-content').text()).toContain('FindProxyForURL');
    expect($('#pac-rules-count-value').text()).toBe('1');
    expect(chrome.storage.onChanged.addListener).toHaveBeenCalledTimes(1);

    const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
    listener({ state: { newValue: { proxy: { mode: 'auto' } } } }, 'local');
    expect(chrome.storage.local.get).toHaveBeenCalledTimes(2);

    DetectionModule.closePacDetails();
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(listener);
  });

  test('renders enriched proxy detection results in two information groups', async () => {
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
                lists: [{ id: 'scenario-a', proxies: [{ name: 'Node A' }, { name: 'Node B' }] }]
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
    expect($('#detection-status-icon').html()).toContain('m8.5 16 3.5-8 3.5 8');
    expect($('#detection-status-icon svg').attr('style')).toContain('#22c55e');
    expect($('#detection-details .detection-info-group')).toHaveLength(2);
    expect($('#detection-details .detection-row')).toHaveLength(8);
    expect($('#detection-details').text()).toContain('proxy_browser_section');
    expect($('#detection-details').text()).toContain('proxy_extension_section');
    expect($('#detection-details').text()).toContain('Node A');
    expect($('#detection-details').text()).toContain('2');
    expect($('#detection-checked-time').text()).not.toBe('-');
    expect($('#detect-proxy-btn').prop('disabled')).toBe(false);

    chrome.proxy.settings.get.mockImplementation((options, callback) => callback({
      levelOfControl: 'controlled_by_this_extension',
      value: {
        mode: 'fixed_servers',
        rules: { singleProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 } }
      }
    }));
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({
      state: { proxy: { mode: 'manual', current: { name: 'Node A', ip: '127.0.0.1', port: 8080 } } },
      config: {
        scenarios: {
          current: 'scenario-a',
          lists: [{ id: 'scenario-a', proxies: [{ name: 'Node A' }] }]
        }
      }
    }));

    await DetectionModule.detectProxy();

    expect($('#detection-status-text').text()).toBe('proxy_status_manual_mode');
    expect($('#detection-status-icon').html()).toContain('M8.5 16V8l3.5 5 3.5-5v8');
    expect($('#detection-status-icon svg').attr('style')).toContain('#22c55e');
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
});
