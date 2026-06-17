// ==========================================
// Main Page SVG Icons
// Unified linear icon set for main page UI
// ==========================================

(function (global) {
  const ICONS = {
    scenarioSwitch: [
      '<path d="M12 3 4 7l8 4 8-4-8-4Z"/>',
      '<path d="m4 12 8 4 8-4"/>',
      '<path d="m4 17 8 4 8-4"/>'
    ].join(''),
    scenarioManage: [
      '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H11"/>',
      '<path d="M4 7.5V17a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>',
      '<path d="m14.5 5.5 4 4"/>',
      '<path d="m12 16 1.5-4.5L19 6a1.414 1.414 0 1 0-2-2l-5.5 5.5L7 11l5 5Z"/>'
    ].join(''),
    add: [
      '<path d="M12 5v14"/>',
      '<path d="M5 12h14"/>'
    ].join(''),
    testAll: [
      '<path d="M4 12a8 8 0 0 1 8-8"/>',
      '<path d="M20 12a8 8 0 0 1-8 8"/>',
      '<path d="M12 8v4l3 2"/>',
      '<path d="M20 4v4h-4"/>',
      '<path d="M4 20v-4h4"/>'
    ].join(''),
    expand: [
      '<path d="M8 4H4v4"/>',
      '<path d="m4 4 6 6"/>',
      '<path d="M16 20h4v-4"/>',
      '<path d="m20 20-6-6"/>',
      '<path d="M20 8V4h-4"/>',
      '<path d="m20 4-6 6"/>',
      '<path d="M4 16v4h4"/>',
      '<path d="m4 20 6-6"/>'
    ].join(''),
    collapse: [
      '<path d="M9 4v5H4"/>',
      '<path d="m4 4 6 6"/>',
      '<path d="M20 9h-5V4"/>',
      '<path d="m20 4-6 6"/>',
      '<path d="M4 15h5v5"/>',
      '<path d="m4 20 6-6"/>',
      '<path d="M20 15h-5v5"/>',
      '<path d="m20 20-6-6"/>'
    ].join(''),
    syncConfig: [
      '<path d="M7 18.5A4.5 4.5 0 1 1 8 9.6a5.5 5.5 0 0 1 10.5 1.9A3.5 3.5 0 1 1 18 18.5H7Z"/>',
      '<path d="M12 11.5v4"/>',
      '<path d="M10.5 13h3"/>'
    ].join(''),
    syncPush: [
      '<path d="M7 18.5A4.5 4.5 0 1 1 8 9.6a5.5 5.5 0 0 1 10.5 1.9A3.5 3.5 0 1 1 18 18.5H7Z"/>',
      '<path d="M12 15V9"/>',
      '<path d="m9.5 11.5 2.5-2.5 2.5 2.5"/>'
    ].join(''),
    syncPull: [
      '<path d="M7 18.5A4.5 4.5 0 1 1 8 9.6a5.5 5.5 0 0 1 10.5 1.9A3.5 3.5 0 1 1 18 18.5H7Z"/>',
      '<path d="M12 9v6"/>',
      '<path d="m14.5 12.5-2.5 2.5-2.5-2.5"/>'
    ].join(''),
    export: [
      '<path d="M12 14V5"/>',
      '<path d="m9.5 8.5 2.5-2.5 2.5 2.5"/>',
      '<path d="M5 15.5v2A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-2"/>'
    ].join(''),
    import: [
      '<path d="M12 5v9"/>',
      '<path d="m15 10-3 3-3-3"/>',
      '<path d="M5 15.5v2A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-2"/>'
    ].join(''),
    detect: [
      '<path d="M12 3 5 6v5c0 4.2 2.5 8 7 10 4.5-2 7-5.8 7-10V6l-7-3Z"/>',
      '<path d="m9.5 12 1.8 1.8 3.7-3.8"/>'
    ].join(''),
    pac: [
      '<path d="M8 3h5l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>',
      '<path d="M13 3v5h4"/>',
      '<path d="m9 14 2-2-2-2"/>',
      '<path d="M13 10h2"/>',
      '<path d="m15 16-2-2 2-2"/>'
    ].join(''),
    version: [
      '<path d="M12 3a9 9 0 1 0 9 9"/>',
      '<path d="M12 8v4"/>',
      '<path d="M12 16h.01"/>'
    ].join(''),
    close: [
      '<path d="M18 6 6 18"/>',
      '<path d="m6 6 12 12"/>'
    ].join(''),
    externalLink: [
      '<path d="M14 5h5v5"/>',
      '<path d="M10 14 19 5"/>',
      '<path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'
    ].join(''),
    info: [
      '<circle cx="12" cy="12" r="9"/>',
      '<path d="M12 10v5"/>',
      '<path d="M12 7h.01"/>'
    ].join(''),
    refresh: [
      '<path d="M20 5v5h-5"/>',
      '<path d="M4 19v-5h5"/>',
      '<path d="M6.5 10A7 7 0 0 1 18 7l2 3"/>',
      '<path d="M17.5 14A7 7 0 0 1 6 17l-2-3"/>'
    ].join(''),
    emptyFolder: [
      '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H9l2 2h8.5A1.5 1.5 0 0 1 21 10.5v8A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-10Z"/>',
      '<path d="M8.5 13h7"/>'
    ].join(''),
    chevronDown: '<path d="m7 10 5 5 5-5"/>',
    chevronRight: '<path d="m10 7 5 5-5 5"/>',
    copy: [
      '<rect x="9" y="9" width="10" height="10" rx="2"/>',
      '<path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/>'
    ].join(''),
    check: '<path d="m5 12 4 4L19 6"/>',
    dragHandle: [
      '<circle cx="9" cy="6" r="1"/>',
      '<circle cx="15" cy="6" r="1"/>',
      '<circle cx="9" cy="12" r="1"/>',
      '<circle cx="15" cy="12" r="1"/>',
      '<circle cx="9" cy="18" r="1"/>',
      '<circle cx="15" cy="18" r="1"/>'
    ].join(''),
    eye: [
      '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/>',
      '<circle cx="12" cy="12" r="3"/>'
    ].join(''),
    eyeOff: [
      '<path d="m3 3 18 18"/>',
      '<path d="M10.6 6.3A12.6 12.6 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-4 4.6"/>',
      '<path d="M6.5 7.5A17.4 17.4 0 0 0 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.6"/>',
      '<path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9"/>'
    ].join(''),
    loading: [
      '<path d="M12 3a9 9 0 1 0 9 9"/>'
    ].join(''),
    successCircle: [
      '<circle cx="12" cy="12" r="9"/>',
      '<path d="m8.5 12 2.5 2.5 4.5-5"/>'
    ].join(''),
    warningCircle: [
      '<circle cx="12" cy="12" r="9"/>',
      '<path d="M12 8v5"/>',
      '<path d="M12 16h.01"/>'
    ].join(''),
    errorCircle: [
      '<circle cx="12" cy="12" r="9"/>',
      '<path d="M15 9 9 15"/>',
      '<path d="m9 9 6 6"/>'
    ].join(''),
    run: [
      '<path d="m8 6 10 6-10 6Z"/>'
    ].join(''),
    move: [
      '<path d="M13 5h6v6"/>',
      '<path d="m19 5-8 8"/>',
      '<path d="M11 19H5V13"/>',
      '<path d="m5 19 8-8"/>'
    ].join(''),
    subscription: [
      '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/>',
      '<path d="M7 9h10"/>',
      '<path d="M7 13h10"/>',
      '<path d="M7 17h6"/>'
    ].join('')
  };

  function buildAttributes(options) {
    const attrs = [];
    const width = options.width || 16;
    const height = options.height || 16;

    attrs.push(`width="${width}"`);
    attrs.push(`height="${height}"`);
    attrs.push('viewBox="0 0 24 24"');
    attrs.push('fill="none"');
    attrs.push('stroke="currentColor"');
    attrs.push(`stroke-width="${options.strokeWidth || 2}"`);
    attrs.push('stroke-linecap="round"');
    attrs.push('stroke-linejoin="round"');

    if (options.className) {
      attrs.push(`class="${options.className}"`);
    }
    if (options.style) {
      attrs.push(`style="${options.style}"`);
    }

    return attrs.join(' ');
  }

  function render(name, options) {
    const iconBody = ICONS[name];
    if (!iconBody) {
      throw new Error(`Unknown icon: ${name}`);
    }

    const resolvedOptions = options || {};
    return `<svg ${buildAttributes(resolvedOptions)}>${iconBody}</svg>`;
  }

  const api = {
    render
  };

  global.MainIcons = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
}(typeof window !== 'undefined' ? window : globalThis));
