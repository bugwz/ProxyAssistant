// ==========================================
// Utilities Module - Common Utility Functions
// ==========================================

// Browser detection - must be defined early as it's used by other modules
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;

// ==========================================
// UI Utilities
// ==========================================

function showTip(msg, isError) {
  console.log("Show Tip:", msg, isError);
  var $tip = $(".save-success-toast");
  $tip.removeClass("error processing");
  if (isError) $tip.addClass("error");
  $tip.find('.icon').html(isError ? MainIcons.render('close', { width: 12, height: 12 }) : MainIcons.render('check', { width: 12, height: 12 }));
  $tip.find('.message').text(msg);
  $tip.stop(true, true).fadeIn("slow").delay(1000).fadeOut("slow");
}

function showProcessingTip(msg) {
  console.log("Show Processing Tip:", msg);
  var $tip = $(".save-success-toast");
  $tip.removeClass("error").addClass("processing");
  $tip.find('.icon').html(MainIcons.render('loading', { width: 16, height: 16, className: 'spin' }));
  $tip.find('.message').text(msg);
  $tip.stop(true, true).show();
}

// ==========================================
// HTML Escape
// ==========================================

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// Protocol Cleaning
// ==========================================

function cleanProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') return 'http';
  let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim().toLowerCase();
  const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
  if (!validProtocols.includes(cleaned)) return 'http';
  return cleaned;
}

// ==========================================
// Initialization
// ==========================================

(function initSpinAnimation() {
  var style = document.createElement('style');
  style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
  document.head.appendChild(style);
})();

// Export for use
window.UtilsModule = {
  showTip,
  showProcessingTip,
  escapeHtml,
  cleanProtocol
};
