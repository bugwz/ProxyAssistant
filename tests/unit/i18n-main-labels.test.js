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
});
