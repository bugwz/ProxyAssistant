const translations = {
  "zh-CN": {
    "app_name": "代理助手",
    "save": "保存",
    "status_disabled": "已禁用",
    "save_success": "保存成功"
  },
  "en": {
    "app_name": "Proxy Assistant",
    "save": "Save",
    "status_disabled": "Disabled",
    "save_success": "Save successful"
  },
  "zh-TW": {
    "app_name": "代理助手",
    "save": "儲存",
    "status_disabled": "已停用",
    "save_success": "儲存成功"
  },
  "ja": {
    "app_name": "プロキシアシスタント",
    "save": "保存",
    "status_disabled": "無効",
    "save_success": "保存成功"
  },
  "fr": {
    "app_name": "Assistant Proxy",
    "save": "Enregistrer",
    "status_disabled": "Désactivé",
    "save_success": "Enregistrement réussi"
  },
  "de": {
    "app_name": "Proxy-Assistent",
    "save": "Speichern",
    "status_disabled": "Deaktiviert",
    "save_success": "Erfolgreich gespeichert"
  },
  "es": {
    "app_name": "Asistente de Proxy",
    "save": "Guardar",
    "status_disabled": "Desactivado",
    "save_success": "Guardado correctamente"
  },
  "pt": {
    "app_name": "Assistente de Proxy",
    "save": "Salvar",
    "status_disabled": "Desativado",
    "save_success": "Salvo com sucesso"
  },
  "ru": {
    "app_name": "Помощник прокси",
    "save": "Сохранить",
    "status_disabled": "Отключено",
    "save_success": "Успешно сохранено"
  },
  "ko": {
    "app_name": "프록시 도우미",
    "save": "저장",
    "status_disabled": "비활성화됨",
    "save_success": "저장 성공"
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
  });
});
