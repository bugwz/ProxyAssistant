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
  $tip.find('.icon').html('');
  $tip.find('.message').text(msg);
  $tip.stop(true, true).fadeIn("slow").delay(1000).fadeOut("slow");
}

function showProcessingTip(msg) {
  console.log("Show Processing Tip:", msg);
  var $tip = $(".save-success-toast");
  $tip.removeClass("error").addClass("processing");
  $tip.find('.icon').html('<svg class="spin" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" fill="#3b82f6"/></svg>');
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
