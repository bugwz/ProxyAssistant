<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Proxy Assistant

</div>

<div align="center">

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingual](https://img.shields.io/badge/Multilingual-yellow)](README-en.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [**English**](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

A powerful browser proxy management extension, compatible with Chrome/Firefox/Edge, supports multi-scenario management, helping you easily configure and switch network proxies.

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ Features

### 1.1 🔌 Multiple Proxy Protocol Support
- **HTTP** - Traditional HTTP proxy
- **HTTPS** - Secure HTTPS proxy
- **SOCKS5** - SOCKS5 proxy supporting TCP/UDP
- **SOCKS4** - Compatible with legacy SOCKS4 proxy

### 1.2 🌐 Multi-Browser Support
- **Chrome** - Using Manifest V3 + Service Worker
- **Firefox** - Using Manifest V3 + `proxy.onRequest` API for proxy interception
- **Edge** - Perfectly compatible with Chrome extensions, based on Chromium kernel

### 1.3 🔄 Three Proxy Modes

| Mode | Description |
|------|-------------|
| **Disabled** | Turn off proxy, use system default network connection |
| **Manual** | Manually select proxy from proxy list |
| **Auto** | Automatically select matching proxy based on URL rules (PAC mode) |

![](../public/img/promotion/1280-800-03.png)

### 1.4 🎬 Scene Mode

- **Multi-scenario Support**: Create different sets of proxy configurations (e.g., Company, Home, Dev environment)
- **Quick Switch**: One-click switch of proxy lists between different scenarios
- **Flexible Management**: Support adding, renaming, deleting, and sorting scenarios
- **Proxy Migration**: Support moving proxies between different scenarios

### 1.5 📋 Flexible URL Rule Configuration

- **No proxy addresses** (`bypass_urls`): Domains/IPs for direct connection in manual mode
- **Use proxy addresses** (`include_urls`): Domains that need proxy access in auto mode
- **Fallback Policy**: Choose direct connection or reject when connection fails in auto mode
- Supports wildcards `*` and domain matching
- Suitable for scenarios where different websites use different proxies

### 1.6 🔐 Proxy Authentication Support

- Username/password authentication support
- Automatic handling of proxy server authentication requests
- Secure credential storage

### 1.7 🧪 Proxy Testing Functionality

- **Connection Test**: Verify if proxy is available
- **Latency Measurement**: Test proxy response time
- **Batch Testing**: One-click test all proxies
- **Color Coding**: Green (<500ms) / Orange (≥500ms) / Red (failed)

### 1.8 🏃 Proxy Status Detection

- Detect current browser proxy settings
- Verify if extension successfully controls proxy
- Identify other extensions controlling proxy
- Provides status, warning, and error results

### 1.9 🔍 PAC Script Preview

- **Script Viewing**: View the automatically generated PAC script content
- **Rules List**: Clearly display all active proxy matching rules
- **Debug Support**: Easy troubleshooting of matching issues in auto mode

### 1.10 🌙 Theme Modes

- **Light Mode**: For daytime use
- **Dark Mode**: For nighttime use
- **Auto Switch**: Automatically switch themes based on time (configurable hours)

![](../public/img/promotion/1280-800-02.png)

### 1.11 ☁️ Data Storage & Sync

#### 1.11.1 Storage Strategy

| Storage Type | Storage Content | Description |
|--------------|-----------------|-------------|
| **Local Storage** | Proxy list, theme settings, language settings, sync config | Always enabled, ensuring offline availability and data persistence |
| **Cloud Sync** | Complete configuration data (chunked storage) | Optional, uses chunked storage to bypass quota limits |

#### 1.11.2 Sync Methods

##### 1.11.2.1 Native Browser Sync
- Uses `chrome.storage.sync` API (Chrome) or `browser.storage.sync` (Firefox)
- Automatic sync via Chrome/Firefox account
- Suitable for multi-device sync with same browser account
- **Chunked Storage**: Configuration data automatically chunked (7KB per chunk) to bypass 8KB single item quota limit
- **Data Integrity**: Uses checksums to ensure sync data integrity
- **Atomic Operations**: Push operation clears old data before writing new data to ensure consistency
- **Quota Display**: Real-time display of used/total quota (100KB) and chunk count

##### 1.11.2.2 GitHub Gist Sync
- Sync configuration across browsers and devices via GitHub Gist
- Requires GitHub Personal Access Token
- Supports manual push/pull or automatic sync
- Configuration content is encrypted, sensitive info is automatically cleared during export

| Config Item | Description |
|-------------|-------------|
| **Access Token** | GitHub Personal Access Token (requires gist permission) |
| **Filename** | Filename in Gist, default `proxy_assistant_config.json` |
| **Gist ID** | Automatically recognized and saved, no manual input needed |

#### 1.11.3 Sync Operations

| Operation | Description |
|-----------|-------------|
| **Push** | Upload local configuration to cloud/Gist |
| **Pull** | Download configuration from cloud/Gist to local |
| **Test Connection** | Verify Gist Token validity and configuration status |

#### 1.11.4 Import/Export

- **Export Configuration**: Generate JSON file with all proxy info, theme settings, language settings, etc.
- **Import Configuration**: Restore configuration from JSON file
- **Data Security**: Export file automatically clears sensitive info (Token, Password)
- **Format Compatibility**: Supports import of configuration files from old versions

**Export Structure:**
```json
{
  "version": 1,
  "settings": {
    "appLanguage": "zh-CN",
    "themeMode": "light",
    "nightModeStart": "22:00",
    "nightModeEnd": "06:00"
  },
  "sync": {
    "type": "native",
    "gist": { "filename": "proxy_assistant_config.json" }
  },
  "proxies": [
    {
      "name": "My Proxy",
      "protocol": "http",
      "ip": "192.168.1.1",
      "port": "8080",
      "username": "",
      "password": "",
      "fallback_policy": "direct",
      "include_urls": "",
      "bypass_urls": ""
    }
  ]
}
```

### 1.12 🌍 Multilingual Support

This extension supports the following languages:

| Language | Code | Support Status |
|----------|------|----------------|
| Simplified Chinese | zh-CN | ✅ Supported |
| Traditional Chinese | zh-TW | ✅ Supported |
| English | en | ✅ Supported |
| Japanese | ja | ✅ Supported |
| French | fr | ✅ Supported |
| German | de | ✅ Supported |
| Spanish | es | ✅ Supported |
| Portuguese | pt | ✅ Supported |
| Russian | ru | ✅ Supported |
| Korean | ko | ✅ Supported |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 Settings Interface

![](../public/img/demo.png)

## 3. 📁 Project Structure

```
ProxyAssistant/
├── conf/                     # Example configuration
│   └── demo.json             # Example configuration file
├── readme/                   # Multilingual documentation
│   ├── README-zh-CN.md       # Simplified Chinese
│   ├── README-zh-TW.md       # Traditional Chinese
│   ├── README-en.md          # English
│   ├── README-ja.md          # Japanese
│   ├── README-fr.md          # French
│   ├── README-de.md          # German
│   ├── README-es.md          # Spanish
│   ├── README-pt.md          # Portuguese
│   ├── README-ru.md          # Russian
│   └── README-ko.md          # Korean
├── src/                      # Source code
│   ├── manifest_chrome.json  # Chrome extension configuration (Manifest V3)
│   ├── manifest_firefox.json # Firefox extension configuration
│   ├── main.html             # Settings page
│   ├── popup.html            # Popup page
│   ├── js/
│   │   ├── main.js           # Settings page main logic
│   │   ├── popup.js          # Popup UI logic
│   │   ├── worker.js         # Service Worker (Chrome) / Background Script (Firefox)
│   │   ├── i18n.js           # Internationalization support
│   │   └── jquery.js         # jQuery library
│   ├── css/
│   │   ├── main.css          # Settings page styles (incl. common components)
│   │   ├── popup.css         # Popup styles
│   │   ├── theme.css         # Theme styles
│   │   └── eye-button.css    # Password visibility button styles
│   └── images/               # Icon resources
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # Public resources
│   └── img/                  # Demo & Promotion images
├── tests/                    # Tests
│   ├── jest.config.js        # Jest configuration
│   ├── setup.js              # Test environment setup
│   ├── __mocks__/            # Mock files
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── script/                   # Build scripts
│   └── build.sh              # Extension build script
├── release/                  # Release notes
│   └── *.md                  # Update logs for versions
├── build/                    # Build output directory
├── package.json              # Project dependencies
├── package-lock.json         # Dependency versions lock
├── Makefile                  # Build command entry
├── jest.config.js            # Jest configuration (points to tests/jest.config.js)
└── AGENTS.md                 # Development guide
```

## 4. 🚀 Quick Start

### 4.1 Install Extension

#### 4.1.1 Chrome

**Method 1 (Recommended)**: Install from Chrome Web Store
1. Open Chrome browser, visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Proxy Assistant"
3. Click "Add to Chrome"

**Method 2**: Local Installation
- **Option A (Using Source Code)**: Download source code, rename `src/manifest_chrome.json` to `manifest.json`, then load `src` directory
- **Option B (Using Package)**:
  1. Go to [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) page
  2. Download `proxy-assistant-chrome-x.x.x.zip` file
  3. Extract the downloaded ZIP file to any directory
  4. Open Chrome browser, visit `chrome://extensions/`
  5. Enable **"Developer mode"** toggle in the top right
  6. Click **"Load unpacked extension"** button in the top left
  7. Select the folder extracted in step 3
  8. Extension will appear in the extension list after successful installation

#### 4.1.2 Firefox

**Method 1 (Recommended)**: Install from Firefox Add-ons
1. Open Firefox browser, visit [Firefox Add-ons](https://addons.mozilla.org/)
2. Search for "Proxy Assistant"
3. Click "Add to Firefox"

**Method 2**: Local Installation
1. Download Firefox extension package (`.xpi` file) from release directory
2. Open Firefox browser, visit `about:addons`
3. Click **Gear Icon** → **Install Add-on From File**
4. Select the downloaded `.xpi` file

#### 4.1.3 Microsoft Edge

Edge browser is based on Chromium kernel, can directly install Chrome extensions.

**Method 1 (Recommended)**: Install from Chrome Web Store
1. Open Edge browser, visit `edge://extensions/`
2. In "Find new extensions" section, click "Get extensions from Chrome Web Store", visit [Chrome Web Store](https://chrome.google.com/webstore)
3. Search for "Proxy Assistant"
4. Click "Get" then "Add to Microsoft Edge"

**Method 2**: Local Installation
1. Go to [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) page
2. Download `proxy-assistant-chrome-x.x.x.zip` file
3. Extract the downloaded ZIP file to any directory
4. Open Edge browser, visit `edge://extensions/`
5. Enable **"Developer mode"** toggle in the bottom left
6. Click **"Select unpacked directory"** button
7. Select the folder extracted in step 3
8. Extension will appear in the extension list after successful installation

### 4.2 Add Proxy

1. Click the extension icon to open popup
2. Click **"Settings"** button to enter settings page
3. Click **"Add Proxy"** button to add new proxy
4. Fill in proxy information:
   - Proxy name
   - Protocol type (HTTP/HTTPS/SOCKS4/SOCKS5)
   - Proxy address (IP or domain)
   - Port number
   - (Optional) Username and password
   - (Optional) URL rules configuration
5. Click **"Save"** button

### 4.3 Use Proxy

**Manual Mode**:
1. Select **"Manual"** mode in popup
2. Choose proxy from the list
3. Status shows connected means it's active

**Auto Mode**:
1. Select **"Auto"** mode in popup
2. Configure URL rules for each proxy in settings page
3. Automatically select matching proxy when visiting websites

## 5. 🛠️ Development Guide

### 5.1 Development Environment

**Prerequisites**:
- Node.js >= 14
- npm >= 6
- Chrome / Firefox browser (for testing)
- web-ext (for building Firefox XPI, optional)

**Install Dependencies**:
```bash
make test_init
# or
npm install
```

### 5.2 Test Commands

| Command | Description |
|---------|-------------|
| `make test` | Run all tests (unit + integration + e2e) |
| `make test_nocache` | Run tests without cache |
| `make test_unit` | Run unit tests only |
| `make test_integration` | Run integration tests only |
| `make test_e2e` | Run e2e tests only |
| `make test_watch_nocache` | Run tests in watch mode |

**Using npm directly**:
```bash
npm test                    # Run all tests
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run test:e2e            # Run e2e tests only
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests and generate coverage report
```

### 5.3 Build Commands

| Command | Description |
|---------|-------------|
| `make build` | Build Chrome and Firefox extensions |
| `make clean` | Clean build artifacts |
| `make test_clean` | Clean test cache and coverage files |

**Specify Version**:
```bash
make build VERSION=dev
# or
./script/build.sh dev
```

**Build Artifacts**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Chrome package
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Chrome source package
├── ProxyAssistant_{VERSION}_firefox.zip     # Firefox package
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Firefox source package
└── ProxyAssistant_{VERSION}_firefox.xpi     # Firefox official extension package
```

### 5.4 Local Development

**Chrome Local Installation**:
1. Rename `src/manifest_chrome.json` to `manifest.json`
2. Open Chrome, visit `chrome://extensions/`
3. Enable **"Developer mode"**
4. Click **"Load unpacked"**
5. Select `src` directory

**Firefox Local Installation**:
1. Use `make build` to generate XPI file
2. Open Firefox, visit `about:addons`
3. Click **Gear Icon** → **Install Add-on From File**
4. Select the generated `.xpi` file

### 5.5 Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Naming**: camelCase, constants use UPPER_SNAKE_CASE
- **Semicolons**: Consistent usage

For detailed specifications, please refer to [AGENTS.md](../AGENTS.md)

## 6. 📖 Detailed Instructions

### 6.1 URL Rule Syntax

Supports the following matching rules:

```
# Exact match
google.com

# Subdomain matching
.google.com
www.google.com

# Wildcard matching
*.google.com
*.twitter.com

# IP address
192.168.1.1
10.0.0.0/8
```

### 6.2 Fallback Policy

In auto mode, when proxy connection fails:

| Policy | Description |
|--------|-------------|
| **Direct Connection (DIRECT)** | Bypass proxy, connect directly to target website |
| **Reject Connection (REJECT)** | Reject the request |

### 6.3 PAC Script Auto Mode

Auto mode uses PAC (Proxy Auto-Config) script:
- Automatically select proxy based on currently visited URL
- Match in proxy list order, return first matched proxy
- Supports fallback policy
- Automatically restore last configuration when browser starts

### 6.4 Quick Operations

| Operation | Method |
|-----------|--------|
| Expand/Collapse proxy card | Click card header |
| Expand/Collapse all cards | Click "Expand/Collapse All" button |
| Drag to sort proxies | Drag the handle on card header |
| Show/Hide password | Click eye icon on right side of password field |
| Enable/Disable single proxy | Toggle switch on card |
| Test single proxy | Click "Connection Test" button |
| Test all proxies | Click "Test All" button |
| Quick close popup | Press `ESC` key on page |

### 6.5 Import/Export Configuration

1. **Export Configuration**: Click "Export Configuration" to download JSON file
2. **Import Configuration**: Click "Import Configuration" to select JSON file to restore

Configuration includes:
- All proxy information
- Theme settings
- Night mode hours
- Language settings
- Sync toggle status

### 6.6 Proxy Status Detection

Click "Detect Proxy Effect" button to:
- View current browser proxy mode
- Verify if extension successfully controls proxy
- Detect if other extensions seize control
- Get problem diagnosis and suggestions

## 7. 🔧 Technical Architecture

### 7.1 Manifest V3

- Chrome uses Manifest V3 specification
- Service Worker replaces background page
- Firefox uses background scripts + onRequest API

### 7.2 Core Modules

1. **worker.js (Chrome)**:
   - Proxy configuration management
   - PAC script generation
   - Authentication handling
   - Proxy testing logic
   - Storage change monitoring

2. **popup.js**:
   - Popup interface interaction
   - Proxy status display
   - Quick proxy switching
   - Auto-match display

3. **main.js**:
   - Settings page logic
   - Scenario Management
   - Proxy management (CRUD)
   - Drag and drop sorting
   - Import/Export
   - Proxy detection function

4. **i18n.js**:
   - Multilingual support
   - Real-time language switching

### 7.3 Data Storage

- `chrome.storage.local`: Local storage (always used)
- `chrome.storage.sync`: Cloud sync storage (optional)
- Follow local-first principle, solves sync quota issues

### 7.4 Browser Compatibility

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Manual Mode | ✅ | ✅ |
| Auto Mode | ✅ | ✅ |
| Proxy Auth | ✅ | ✅ |
| Proxy Test | ✅ | ✅ |
| Theme Switch | ✅ | ✅ |
| Data Sync | ✅ | ✅ |
| Proxy Detection | ✅ | ✅ |

## 8. 📝 Use Cases

### 8.1 Scenario 1: Multi-Proxy Switching

- Configure different proxies for different network environments
- Use company proxy for office network
- Use scientific proxy for home network
- Quick one-click switching

### 8.2 Scenario 2: Smart Routing

- Direct connection for domestic websites
- Use proxy for specific websites
- Automatic selection based on domain

### 8.3 Scenario 3: Proxy Pool Testing

- Import multiple proxies
- Batch test latency
- Select optimal proxy to use

### 8.4 Scenario 4: Team Sharing

- Export configuration file
- Share with team members
- Unified proxy configuration

## 9. ⚠️ Notes

1. **Permission Description**: Extension requires the following permissions:
   - `proxy`: Manage proxy settings
   - `storage`: Store configuration
   - `webRequest` / `webRequestAuthProvider`: Handle authentication requests
   - `<all_urls>`: Access all website URLs

2. **Other Extension Conflicts**: If proxy conflicts occur, please disable other proxy/VPN extensions

3. **Security**: Credential information is stored locally in browser, please ensure device security

4. **Network Requirements**: Ensure proxy server is accessible

5. **Firefox Limitation**: Firefox minimum version required: 142.0

## 10. 📄 Privacy Policy

[Privacy Policy](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 License

MIT License - See [LICENSE](../LICENSE) file for details

## 12. 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 13. 📧 Contact

For questions or suggestions, please provide feedback through GitHub Issues.

---

<div align="center">

**If this project helps you, please consider giving it a Star ⭐!**

</div>
