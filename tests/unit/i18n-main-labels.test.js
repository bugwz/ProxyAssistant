const fs = require('fs');
const path = require('path');

describe('main page translated section labels', () => {
  beforeEach(() => {
    jest.resetModules();
    document.documentElement.innerHTML = '<html><head></head><body></body></html>';

    const jqueryJsPath = path.join(__dirname, '../../src/js/jquery.js');
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };

    window.eval(fs.readFileSync(jqueryJsPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;

    const i18nJsPath = path.join(__dirname, '../../src/js/i18n.js');
    window.eval(fs.readFileSync(i18nJsPath, 'utf8'));
  });

  afterEach(() => {
    delete global.chrome;
    delete global.$;
    delete global.jQuery;
    delete window.I18n;
  });

  test('proxy status and version info labels should be updated in every language', () => {
    const expectations = {
      'zh-CN': {
        proxy_detection: '代理状态',
        proxy_detection_title: '代理状态',
        version_check: '版本信息',
        version_check_btn: '查看',
        version_check_title: '版本信息'
      },
      'zh-TW': {
        proxy_detection: '代理狀態',
        proxy_detection_title: '代理狀態',
        version_check: '版本資訊',
        version_check_btn: '查看',
        version_check_title: '版本資訊'
      },
      'en': {
        proxy_detection: 'Proxy Status',
        proxy_detection_title: 'Proxy Status',
        version_check: 'Version Info',
        version_check_btn: 'View',
        version_check_title: 'Version Info'
      },
      'ja': {
        proxy_detection: 'プロキシ状態',
        proxy_detection_title: 'プロキシ状態',
        version_check: 'バージョン情報',
        version_check_btn: '表示',
        version_check_title: 'バージョン情報'
      },
      'fr': {
        proxy_detection: 'Statut du proxy',
        proxy_detection_title: 'Statut du proxy',
        version_check: 'Infos version',
        version_check_btn: 'Voir',
        version_check_title: 'Infos version'
      },
      'de': {
        proxy_detection: 'Proxy-Status',
        proxy_detection_title: 'Proxy-Status',
        version_check: 'Versionsinfo',
        version_check_btn: 'Anzeigen',
        version_check_title: 'Versionsinfo'
      },
      'es': {
        proxy_detection: 'Estado del proxy',
        proxy_detection_title: 'Estado del proxy',
        version_check: 'Información de versión',
        version_check_btn: 'Ver',
        version_check_title: 'Información de versión'
      },
      'ko': {
        proxy_detection: '프록시 상태',
        proxy_detection_title: '프록시 상태',
        version_check: '버전 정보',
        version_check_btn: '보기',
        version_check_title: '버전 정보'
      },
      'pt': {
        proxy_detection: 'Status do Proxy',
        proxy_detection_title: 'Status do Proxy',
        version_check: 'Informações da versão',
        version_check_btn: 'Ver',
        version_check_title: 'Informações da versão'
      },
      'ru': {
        proxy_detection: 'Состояние прокси',
        proxy_detection_title: 'Состояние прокси',
        version_check: 'Информация о версии',
        version_check_btn: 'Просмотр',
        version_check_title: 'Информация о версии'
      }
    };

    Object.entries(expectations).forEach(([lang, labels]) => {
      window.I18n.setLanguage(lang);
      expect(window.I18n.t('proxy_detection')).toBe(labels.proxy_detection);
      expect(window.I18n.t('proxy_detection_title')).toBe(labels.proxy_detection_title);
      expect(window.I18n.t('version_check')).toBe(labels.version_check);
      expect(window.I18n.t('version_check_btn')).toBe(labels.version_check_btn);
      expect(window.I18n.t('version_check_title')).toBe(labels.version_check_title);
    });
  });

  test('proxy status navigation label should be translated in every language', () => {
    const expectations = {
      'zh-CN': '代理状态',
      'zh-TW': '代理狀態',
      'en': 'Proxy Status',
      'ja': 'プロキシ状態',
      'fr': 'État du proxy',
      'de': 'Proxy-Status',
      'es': 'Estado del proxy',
      'ko': '프록시 상태',
      'pt': 'Status do proxy',
      'ru': 'Состояние прокси'
    };

    Object.entries(expectations).forEach(([lang, label]) => {
      window.I18n.setLanguage(lang);
      expect(window.I18n.t('nav_diagnostics')).toBe(label);
    });
  });

  test('runtime log interface uses internationalized labels in every language', () => {
    ['zh-CN', 'zh-TW', 'en', 'ja', 'fr', 'de', 'es', 'ko', 'pt', 'ru'].forEach(lang => {
      window.I18n.setLanguage(lang);
      expect(window.I18n.t('runtime_logs_title')).not.toBe('runtime_logs_title');
      expect(window.I18n.t('runtime_log_level_error')).not.toBe('runtime_log_level_error');
      expect(window.I18n.t('runtime_log_event_proxy_apply_failed')).not.toBe('runtime_log_event_proxy_apply_failed');
      expect(window.I18n.t('runtime_logs_clear_confirm_title')).not.toBe('runtime_logs_clear_confirm_title');
      expect(window.I18n.t('runtime_logs_clear_confirm_message')).not.toBe('runtime_logs_clear_confirm_message');
      expect(window.I18n.t('runtime_logs_copy')).not.toBe('runtime_logs_copy');
      expect(window.I18n.t('runtime_logs_copy_success')).not.toBe('runtime_logs_copy_success');
      expect(window.I18n.t('runtime_logs_copy_failed')).not.toBe('runtime_logs_copy_failed');
      expect(window.I18n.t('pac_details_title')).not.toBe('pac_details_title');
      expect(window.I18n.t('pac_fetching')).not.toBe('pac_fetching');
      expect(window.I18n.t('pac_last_fetched')).not.toBe('pac_last_fetched');
      expect(window.I18n.t('config_last_fetched')).not.toBe('config_last_fetched');
      expect(window.I18n.t('config_refresh')).not.toBe('config_refresh');
      expect(window.I18n.t('config_fetching')).not.toBe('config_fetching');
      expect(window.I18n.t('config_file_size_details')).not.toBe('config_file_size_details');
    });
  });

  test('does not write a partial configuration while initializing without stored data', () => {
    global.chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
    const callback = jest.fn();

    window.I18n.init(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('can update the page language without persisting the whole configuration', () => {
    window.I18n.setLanguage('en', { persist: false });

    expect(window.I18n.getCurrentLanguage()).toBe('en');
    expect(global.chrome.storage.local.get).not.toHaveBeenCalled();
    expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
