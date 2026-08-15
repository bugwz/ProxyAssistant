const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSubscriptionModule() {
  const subscriptionPath = path.join(__dirname, '../../src/js/subscription.js');
  const source = fs.readFileSync(subscriptionPath, 'utf8');
  const sendMessage = jest.fn((message, callback) => callback({ success: true }));
  const context = {
    console,
    chrome: {
      runtime: {
        lastError: null,
        sendMessage
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(`${source}\nthis.__subscriptionModule = SubscriptionModule;`, context);
  return context;
}

describe('subscription alarm management', () => {
  test('asks the worker to disable refresh using the canonical scheduler', () => {
    const context = loadSubscriptionModule();

    context.__subscriptionModule.disableBackgroundRefresh('proxy-1', 'pac');

    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'scheduleSubscriptionRefresh',
      proxyId: 'proxy-1',
      format: 'pac',
      refreshInterval: 0,
      url: null
    }, expect.any(Function));
  });
});
