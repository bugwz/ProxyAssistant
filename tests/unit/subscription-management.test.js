const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const subscriptionPath = path.join(__dirname, '../../src/js/subscription.js');

function loadSubscriptionModule(deps) {
  const source = fs.readFileSync(subscriptionPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'StorageModule',
    'ProxyModule',
    'UtilsModule',
    'I18n',
    'MainIcons',
    'chrome',
    'fetch',
    'console',
    `${source}; return SubscriptionModule;`
  );

  return factory(
    window,
    document,
    window.$,
    deps.StorageModule,
    deps.ProxyModule,
    deps.UtilsModule,
    deps.I18n,
    deps.MainIcons,
    deps.chrome,
    deps.fetch,
    console
  );
}

describe('subscription management cards', () => {
  let subscriptions;
  let storageModule;
  let proxyModule;
  let subscriptionModule;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="subscription-expand-collapse-btn"></button>
      <button id="add-subscription-btn"></button>
      <div id="subscription-manage-list"></div>
      <div id="proxy-list"><div class="proxy-card proxy-sentinel"></div></div>
    `;
    window.eval(fs.readFileSync(jqueryPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;

    subscriptions = [];
    storageModule = {
      getSubscriptions: jest.fn(() => subscriptions),
      getSubscription: jest.fn(id => subscriptions.find(item => item.id === id)),
      addSubscription: jest.fn(subscription => subscriptions.push(subscription)),
      reorderSubscriptions: jest.fn(newOrder => {
        subscriptions = newOrder;
      }),
      deleteSubscription: jest.fn(id => {
        subscriptions = subscriptions.filter(item => item.id !== id);
      }),
      save: jest.fn(() => Promise.resolve())
    };
    proxyModule = { renderList: jest.fn() };

    subscriptionModule = loadSubscriptionModule({
      StorageModule: storageModule,
      ProxyModule: proxyModule,
      UtilsModule: {
        escapeHtml: value => String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;'),
        showTip: jest.fn(),
        showProcessingTip: jest.fn()
      },
      I18n: { t: key => key },
      MainIcons: { render: jest.fn(() => '<svg></svg>') },
      chrome: {
        runtime: {
          lastError: null,
          sendMessage: jest.fn((message, callback) => {
            if (callback) callback({ success: true });
          })
        }
      },
      fetch: jest.fn()
    });
    subscriptionModule.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.$;
    delete global.jQuery;
  });

  test('adds an expanded editable card without opening a modal', () => {
    $('#add-subscription-btn').trigger('click');

    expect(storageModule.addSubscription).toHaveBeenCalledTimes(1);
    expect($('.subscription-card')).toHaveLength(1);
    expect($('.subscription-card').hasClass('collapsed')).toBe(false);
    expect($('.subscription-name-input')).toHaveLength(1);
    expect($('.subscription-url-input')).toHaveLength(1);
    expect($('.subscription-config-tip.show')).toHaveLength(0);
    expect($('.subscription-drag-handle')).toHaveLength(1);
    expect($('.subscription-card .proxy-index').text()).toBe('#1');
    expect($('.subscription-type-badge').text()).toBe('AutoProxy');
    expect($('.subscription-title-preview').text()).toBe('subscription_unnamed');
    expect($('.subscription-last-updated').text()).toBe('-');
    expect($('.subscription-last-updated').attr('title')).toBe('subscription_last_updated');
    expect($('.subscription-count-summary')).toHaveLength(0);
  });

  test('shows only the name and last update time in the card header', () => {
    $('#add-subscription-btn').trigger('click');
    subscriptions[0].name = 'Shared Rules';
    subscriptions[0].lists.autoproxy.url = 'https://example.com/rules.txt';
    subscriptions[0].lists.autoproxy.include_lines = 4317;
    subscriptions[0].lists.autoproxy.bypass_lines = 33;
    subscriptions[0].lists.autoproxy.last_fetch_time = new Date(2026, 7, 19, 10, 54).getTime();

    subscriptionModule.renderManagementList();

    expect($('.subscription-title-preview').text()).toBe('Shared Rules');
    expect($('.subscription-title-preview').text()).not.toContain('https://');
    expect($('.subscription-last-updated').text()).toBe('2026-08-19 10:54');
    expect($('.subscription-card-header').text()).not.toContain('4317');
    expect($('.subscription-card-header').text()).not.toContain('33');
  });

  test('expands and collapses only subscription management cards', () => {
    $('#add-subscription-btn').trigger('click');
    $('#add-subscription-btn').trigger('click');

    expect($('.subscription-card.collapsed')).toHaveLength(0);
    expect($('#subscription-expand-collapse-btn').hasClass('expanded')).toBe(true);

    $('#subscription-expand-collapse-btn').trigger('click');

    expect($('.subscription-card.collapsed')).toHaveLength(2);
    expect($('#proxy-list .proxy-card').hasClass('collapsed')).toBe(false);

    $('#subscription-expand-collapse-btn').trigger('click');

    expect($('.subscription-card.collapsed')).toHaveLength(0);
    expect($('#proxy-list .proxy-card').hasClass('collapsed')).toBe(false);
  });

  test('reorders subscriptions by dragging their card handles', async () => {
    $('#add-subscription-btn').trigger('click');
    $('#add-subscription-btn').trigger('click');
    const originalIds = subscriptions.map(subscription => subscription.id);

    $('.subscription-drag-handle').first().trigger($.Event('mousedown', {
      button: 0,
      clientX: 0,
      clientY: 0
    }));
    $(document).trigger($.Event('mousemove', { clientX: 0, clientY: 100 }));
    $(document).trigger('mouseup');
    await Promise.resolve();
    await Promise.resolve();

    expect(storageModule.reorderSubscriptions).toHaveBeenCalledTimes(1);
    expect(subscriptions.map(subscription => subscription.id)).toEqual([
      originalIds[1],
      originalIds[0]
    ]);
    expect(storageModule.save).toHaveBeenCalledTimes(1);
  });

  test('saves card fields and refreshes proxy selectors', async () => {
    $('#add-subscription-btn').trigger('click');
    $('.subscription-name-input').val('Shared Rules');
    $('.subscription-url-input').val('https://example.com/rules.txt');
    $('.subscription-card-refresh').val('360');
    $('.subscription-card-save').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(subscriptions[0].name).toBe('Shared Rules');
    expect(subscriptions[0].lists.autoproxy.url).toBe('https://example.com/rules.txt');
    expect(subscriptions[0].lists.autoproxy.refresh_interval).toBe(360);
    expect(storageModule.save).toHaveBeenCalledTimes(1);
    expect(proxyModule.renderList).toHaveBeenCalledTimes(1);
  });
});
