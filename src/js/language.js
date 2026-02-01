// ==========================================
// Language Module - Language Settings
// ==========================================

function initLanguage() {
  const currentLang = I18n.getCurrentLanguage();
  const $currentLangDisplay = $('#current-language-display');
  const $options = $('#language-options li');

  const currentLangText = $options.filter(`[data-value="${currentLang}"]`).text();
  if (currentLangText) {
    $currentLangDisplay.text(currentLangText);
  }

  $options.off('click').on('click', function () {
    const lang = $(this).data('value');
    const text = $(this).text();

    $currentLangDisplay.text(text);
    $(this).closest('.lh-select').find('.lh-select-op').hide();

    I18n.setLanguage(lang);

    const config = StorageModule.getConfig();
    if (config && config.system) {
      config.system.app_language = lang;
      StorageModule.setConfig(config);
      StorageModule.save();
    }

    if (typeof ProxyModule !== 'undefined' && typeof ProxyModule.renderList === 'function') ProxyModule.renderList();
    if (typeof ScenariosModule !== 'undefined' && typeof ScenariosModule.renderScenarioSelector === 'function') ScenariosModule.renderScenarioSelector();
    if (typeof updateSyncUI === 'function') updateSyncUI();
  });
}

// Export for use
window.LanguageModule = {
  initLanguage
};
