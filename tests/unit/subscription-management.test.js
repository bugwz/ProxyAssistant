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
  let chromeApi;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="subscription-expand-collapse-btn"></button>
      <button id="add-subscription-btn"></button>
      <div id="subscription-manage-list"></div>
      <div id="proxy-list"><div class="proxy-card proxy-sentinel"></div></div>
      <div class="scenario-dialog-tip delete-subscription-tip" style="display: none;">
        <button class="delete-subscription-close-btn"></button>
        <p id="delete-subscription-message"></p>
        <strong id="delete-subscription-name"></strong>
        <button class="delete-subscription-cancel-btn"></button>
        <button id="confirm-delete-subscription-btn"></button>
      </div>
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
    chromeApi = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn((message, callback) => {
          if (callback) callback({ success: true });
        })
      }
    };

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
      chrome: chromeApi,
      fetch: jest.fn()
    });
    subscriptionModule.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.$;
    delete global.jQuery;
  });

  test('shows a themed empty state when no subscriptions exist', () => {
    const emptyState = document.querySelector('.subscription-manage-empty');

    expect(emptyState).toBeTruthy();
    expect(emptyState.querySelector('svg')).toBeTruthy();
    expect(emptyState.querySelector('span').textContent).toBe('subscription_empty_management');
  });

  test('uses the themed confirmation dialog when deleting a subscription', async () => {
    subscriptions.push({
      id: 'subscription_1',
      name: 'Office rules',
      enabled: true,
      current: 'autoproxy',
      lists: { autoproxy: {} }
    });
    subscriptionModule.renderManagementList();
    const nativeConfirm = jest.spyOn(window, 'confirm');

    $('.subscription-card-delete').trigger('click');

    expect(nativeConfirm).not.toHaveBeenCalled();
    expect($('.delete-subscription-tip').hasClass('show')).toBe(true);
    expect($('#delete-subscription-name').text()).toBe('Office rules');
    expect(storageModule.deleteSubscription).not.toHaveBeenCalled();

    $('#confirm-delete-subscription-btn').trigger('click');
    await Promise.resolve();

    expect(storageModule.deleteSubscription).toHaveBeenCalledWith('subscription_1');
    expect(storageModule.save).toHaveBeenCalledTimes(1);
    nativeConfirm.mockRestore();
  });

  test('adds an expanded editable card without opening a modal', () => {
    $('#add-subscription-btn').trigger('click');

    expect(storageModule.addSubscription).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].id).toMatch(/^subscription_\d{14}$/);
    expect($('.subscription-card')).toHaveLength(1);
    expect($('.subscription-card').hasClass('collapsed')).toBe(false);
    expect($('.subscription-name-input')).toHaveLength(1);
    expect($('.subscription-url-input')).toHaveLength(1);
    expect($('.subscription-config-tip.show')).toHaveLength(0);
    expect($('.subscription-drag-handle')).toHaveLength(1);
    expect($('.subscription-card .proxy-index').text()).toBe('#1');
    expect($('.subscription-type-badge').text()).toBe('AutoProxy');
    expect($('.subscription-type-badge').hasClass('autoproxy')).toBe(true);
    expect($('.subscription-title-preview').text()).toBe('subscription_unnamed');
    expect($('.subscription-last-updated').text()).toBe('-');
    expect($('.subscription-last-updated').attr('title')).toBe('subscription_last_updated');
    expect($('.subscription-count-summary')).toHaveLength(0);
  });

  test('rejects oversized subscription responses before reading the body', async () => {
    const text = jest.fn(() => Promise.resolve('ignored'));
    const response = {
      headers: { get: jest.fn(() => '6') },
      text
    };

    await expect(subscriptionModule.readResponseTextWithLimit(response, 5)).rejects.toMatchObject({
      code: 'response_too_large'
    });
    expect(text).not.toHaveBeenCalled();
  });

  test('requests one worker reconciliation for a batch of subscriptions', () => {
    subscriptionModule.scheduleAllBackgroundRefreshes({
      subscriptions: [
        { id: 'subscription-1' },
        { id: 'subscription-2' },
        { id: 'subscription-3' }
      ]
    });

    expect(chromeApi.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(chromeApi.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'scheduleAllSubscriptionRefreshes' },
      expect.any(Function)
    );
  });

  test('shows only the name and last update time in the card header', () => {
    $('#add-subscription-btn').trigger('click');
    subscriptions[0].name = 'Shared Rules';
    subscriptions[0].lists.autoproxy.url = 'https://example.com/rules.txt';
    subscriptions[0].lists.autoproxy.include_lines = 4317;
    subscriptions[0].lists.autoproxy.bypass_lines = 33;
    subscriptions[0].lists.autoproxy.last_fetch_time = new Date(2026, 7, 19, 10, 54, 17).getTime();

    subscriptionModule.renderManagementList();

    expect($('.subscription-title-preview').text()).toBe('Shared Rules');
    expect($('.subscription-title-preview').text()).not.toContain('https://');
    expect($('.subscription-last-updated').text()).toBe('2026-08-19 10:54:17');
    expect($('.subscription-card-header').text()).not.toContain('4317');
    expect($('.subscription-card-header').text()).not.toContain('33');
  });

  test('renders subscription cards according to their order field', () => {
    $('#add-subscription-btn').trigger('click');
    $('#add-subscription-btn').trigger('click');
    const firstId = subscriptions[0].id;
    const secondId = subscriptions[1].id;
    subscriptions[0].order = 1;
    subscriptions[1].order = 0;

    subscriptionModule.renderManagementList();

    expect($('.subscription-card').map(function () {
      return $(this).data('id');
    }).get()).toEqual([secondId, firstId]);
    expect($('.subscription-card .proxy-index').map(function () {
      return $(this).text();
    }).get()).toEqual(['#1', '#2']);
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
    subscriptions[0].lists.pac = {
      url: 'https://example.com/unused.pac',
      refresh_interval: 360,
      process_rule: '{}'
    };
    $('.subscription-name-input').val('Shared Rules');
    $('.subscription-url-input').val('https://example.com/rules.txt');
    $('.subscription-card-refresh').val('360');
    $('.subscription-card-save').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(subscriptions[0].name).toBe('Shared Rules');
    expect(subscriptions[0].lists.autoproxy.url).toBe('https://example.com/rules.txt');
    expect(subscriptions[0].lists.autoproxy.refresh_interval).toBe(360);
    expect(Object.keys(subscriptions[0].lists)).toEqual(['autoproxy']);
    expect(storageModule.save).toHaveBeenCalledTimes(1);
    expect(proxyModule.renderList).toHaveBeenCalledTimes(1);
  });
});
