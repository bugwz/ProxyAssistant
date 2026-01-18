jest.setTimeout(10000);

global.chrome = {
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      onChanged: {
        addListener: jest.fn()
      }
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      onChanged: {
        addListener: jest.fn()
      }
    }
  },
  proxy: {
    settings: {
      get: jest.fn(),
      set: jest.fn()
    },
    onProxyError: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
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
  }
};

global.browser = {
  proxy: {
    settings: {
      get: jest.fn(),
      set: jest.fn()
    },
    onProxyError: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  i18n: {
    getMessage: jest.fn((key) => key)
  }
};
