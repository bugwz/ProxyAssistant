const translations = {
  "zh-CN": {
    "app_name": "代理助手",
    "save": "保存",
    "status_disabled": "已禁用",
    "save_success": "保存成功",
    "sync_quota_usage": "存储使用: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "存储使用: {usage} ({chunks} 块) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ 已使用 {percent}，接近限制",
    "sync_quota_limit_exceeded": "⚠️ 已超出限制 ({size})！请减少代理数量"
  },
  "en": {
    "app_name": "Proxy Assistant",
    "save": "Save",
    "status_disabled": "Disabled",
    "save_success": "Save successful",
    "sync_quota_usage": "Usage: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Usage: {usage} ({chunks} chunks) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} used, approaching limit",
    "sync_quota_limit_exceeded": "⚠️ Limit Exceeded ({size})! Please reduce proxies."
  },
  "zh-TW": {
    "app_name": "代理助手",
    "save": "儲存",
    "status_disabled": "已停用",
    "save_success": "儲存成功",
    "sync_quota_usage": "儲存使用: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "儲存使用: {usage} ({chunks} 塊) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ 已使用 {percent}，接近限制",
    "sync_quota_limit_exceeded": "⚠️ 已超出限制 ({size})！請減少代理數量"
  },
  "ja": {
    "app_name": "プロキシアシスタント",
    "save": "保存",
    "status_disabled": "無効",
    "save_success": "保存成功",
    "sync_quota_usage": "使用量: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "使用量: {usage} ({chunks} ブロック) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} 使用、上限に近づいています",
    "sync_quota_limit_exceeded": "⚠️ 制限超過 ({size})！プロキシを減らしてください"
  },
  "fr": {
    "app_name": "Assistant Proxy",
    "save": "Enregistrer",
    "status_disabled": "Désactivé",
    "save_success": "Enregistrement réussi",
    "sync_quota_usage": "Usage: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Usage: {usage} ({chunks} blocs) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} utilisé,接近限制",
    "sync_quota_limit_exceeded": "⚠️ Limite dépassée ({size})! Réduisez les proxys."
  },
  "de": {
    "app_name": "Proxy-Assistent",
    "save": "Speichern",
    "status_disabled": "Deaktiviert",
    "save_success": "Erfolgreich gespeichert",
    "sync_quota_usage": "Nutzung: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Nutzung: {usage} ({chunks} Blöcke) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} verwendet,接近限制",
    "sync_quota_limit_exceeded": "⚠️ Limit überschritten ({size})! Proxys reduzieren."
  },
  "es": {
    "app_name": "Asistente de Proxy",
    "save": "Guardar",
    "status_disabled": "Desactivado",
    "save_success": "Guardado correctamente",
    "sync_quota_usage": "Uso: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Uso: {usage} ({chunks} bloques) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} utilizado,接近限制",
    "sync_quota_limit_exceeded": "⚠️ Límite excedido ({size})! Reduzca los proxies."
  },
  "pt": {
    "app_name": "Assistente de Proxy",
    "save": "Salvar",
    "status_disabled": "Desativado",
    "save_success": "Salvo com sucesso",
    "sync_quota_usage": "Uso: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Uso: {usage} ({chunks} blocos) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} utilizado,接近限制",
    "sync_quota_limit_exceeded": "⚠️ Limite excedido ({size})! Reduza proxies."
  },
  "ru": {
    "app_name": "Помощник прокси",
    "save": "Сохранить",
    "status_disabled": "Отключено",
    "save_success": "Успешно сохранено",
    "sync_quota_usage": "Использование: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "Использование: {usage} ({chunks} блоков) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ Использовано {percent},接近限制",
    "sync_quota_limit_exceeded": "⚠️ Лимит превышен ({size})! Уменьшите прокси."
  },
  "ko": {
    "app_name": "프록시 도우미",
    "save": "저장",
    "status_disabled": "비활성화됨",
    "save_success": "저장 성공",
    "sync_quota_usage": "사용량: {usage} / {quota} ({percent})",
    "sync_quota_usage_chunked": "사용량: {usage} ({chunks} 블록) / {quota} ({percent})",
    "sync_quota_warning": "⚠️ {percent} 사용,接近限制",
    "sync_quota_limit_exceeded": "⚠️ 제한 초과 ({size})! 프록시를 줄이세요."
  }
};

let currentLang = 'zh-CN';

const I18n = {
  t: function (key) {
    return translations[currentLang][key] || key;
  },
  setLanguage: function (lang) {
    if (translations[lang]) {
      currentLang = lang;
    }
  },
  getCurrentLanguage: function () {
    return currentLang;
  }
};

describe('i18n.js - Internationalization Functions', () => {
  describe('I18n.t', () => {
    test('should return translation for existing key', () => {
      I18n.setLanguage('zh-CN');
      expect(I18n.t('app_name')).toBe('代理助手');
      expect(I18n.t('save')).toBe('保存');
    });

    test('should return key itself for missing translation', () => {
      I18n.setLanguage('zh-CN');
      expect(I18n.t('nonexistent_key')).toBe('nonexistent_key');
    });

    test('should return different translations for different languages', () => {
      I18n.setLanguage('zh-CN');
      expect(I18n.t('app_name')).toBe('代理助手');

      I18n.setLanguage('en');
      expect(I18n.t('app_name')).toBe('Proxy Assistant');
    });
  });

  describe('I18n.getCurrentLanguage', () => {
    test('should return current language', () => {
      expect(I18n.getCurrentLanguage()).toBeDefined();
    });

    test('should change after setLanguage', () => {
      I18n.setLanguage('en');
      expect(I18n.getCurrentLanguage()).toBe('en');
    });
  });

  describe('I18n.setLanguage', () => {
    test('should update language to valid language code', () => {
      I18n.setLanguage('en');
      expect(I18n.getCurrentLanguage()).toBe('en');
      expect(I18n.t('save')).toBe('Save');
    });

    test('should not change language for invalid language code', () => {
      const previousLang = I18n.getCurrentLanguage();
      I18n.setLanguage('invalid-lang');
      expect(I18n.getCurrentLanguage()).toBe(previousLang);
    });
  });

  describe('translations object', () => {
    test('should contain zh-CN translations', () => {
      expect(I18n.t('app_name')).toBeDefined();
    });

    test('should contain en translations', () => {
      I18n.setLanguage('en');
      expect(I18n.t('app_name')).toBe('Proxy Assistant');
    });

    test('should contain multiple languages', () => {
      const languages = ['zh-CN', 'zh-TW', 'en', 'ja', 'fr', 'de', 'es', 'pt', 'ru', 'ko'];

      languages.forEach(lang => {
        I18n.setLanguage(lang);
        expect(I18n.getCurrentLanguage()).toBe(lang);
      });
    });

    test('should have consistent key structure across languages', () => {
      const zhCNKeys = Object.keys(translations['zh-CN']);
      const enKeys = Object.keys(translations['en']);

      expect(enKeys.sort()).toEqual(zhCNKeys.sort());
    });
  });

  describe('Translation content', () => {
    test('should have app_name defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['app_name']).toBeDefined();
      });
    });

    test('should have status_disabled defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['status_disabled']).toBeDefined();
      });
    });

    test('should have save_success defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['save_success']).toBeDefined();
      });
    });

    // New sync quota translation tests
    test('should have sync_quota_usage defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['sync_quota_usage']).toBeDefined();
        expect(translations[lang]['sync_quota_usage']).toContain('{usage}');
        expect(translations[lang]['sync_quota_usage']).toContain('{quota}');
        expect(translations[lang]['sync_quota_usage']).toContain('{percent}');
      });
    });

    test('should have sync_quota_usage_chunked defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['sync_quota_usage_chunked']).toBeDefined();
        expect(translations[lang]['sync_quota_usage_chunked']).toContain('{usage}');
        expect(translations[lang]['sync_quota_usage_chunked']).toContain('{chunks}');
        expect(translations[lang]['sync_quota_usage_chunked']).toContain('{quota}');
        expect(translations[lang]['sync_quota_usage_chunked']).toContain('{percent}');
      });
    });

    test('should have sync_quota_warning defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['sync_quota_warning']).toBeDefined();
        expect(translations[lang]['sync_quota_warning']).toContain('{percent}');
      });
    });

    test('should have sync_quota_limit_exceeded defined in all languages', () => {
      Object.keys(translations).forEach(lang => {
        I18n.setLanguage(lang);
        expect(translations[lang]['sync_quota_limit_exceeded']).toBeDefined();
        expect(translations[lang]['sync_quota_limit_exceeded']).toContain('{size}');
      });
    });
  });
});
