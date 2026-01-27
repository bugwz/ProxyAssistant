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
    if (typeof renderList === 'function') renderList();
    if (typeof renderScenarioSelector === 'function') renderScenarioSelector();
    if (typeof updateSyncUI === 'function') updateSyncUI();
  });
}

// Export for use
window.LanguageModule = {
  initLanguage
};
