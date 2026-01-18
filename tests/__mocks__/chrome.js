const chromeMock = {
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://mock/${path}`)
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
      }),
      onChanged: {
        addListener: jest.fn()
      }
    },
    sync: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
      }),
      onChanged: {
        addListener: jest.fn()
      }
    }
  },
  proxy: {
    settings: {
      get: jest.fn((details, callback) => {
        if (callback) callback({ value: { mode: 'direct' } });
      }),
      set: jest.fn((details, callback) => {
        if (callback) callback();
      })
    },
    onProxyError: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn((info, callback) => {
      if (callback) callback([]);
    }),
    sendMessage: jest.fn()
  },
  webRequest: {
    onAuthRequired: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  i18n: {
    getMessage: jest.fn((key) => key)
  },
  alarms: {
    create: jest.fn(),
    get: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  identity: {
    getAuthToken: jest.fn(),
    removeCachedAuthToken: jest.fn()
  }
};

global.chrome = chromeMock;
global.browser = chromeMock;

module.exports = chromeMock;
