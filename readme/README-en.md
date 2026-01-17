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

A powerful browser proxy management extension for Chrome and Firefox, easy configuration and switching of network proxies.

</div>

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/store/promotional/marquee-1400x560.png)

## ✨ Features

### 🔌 Multiple Proxy Protocol Support
- **HTTP** - Traditional HTTP proxy
- **HTTPS** - Secure HTTPS proxy
- **SOCKS5** - SOCKS5 proxy supporting TCP/UDP
- **SOCKS4** - Compatible with legacy SOCKS4 proxy

### 🌐 Multi-Browser Support
- **Chrome** - Using Manifest V3 + Service Worker
- **Firefox** - Using onRequest API for proxy interception

### 🔄 Three Proxy Modes

| Mode | Description |
|------|-------------|
| **Disabled** | Turn off proxy, use system default network connection |
| **Manual** | Manually select proxy from proxy list |
| **Auto** | Automatically select matching proxy based on URL rules (PAC mode) |

| ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/popup/disabled.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/popup/manual.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/popup/auto.png) |
|:---:|:---:|:---:|
| Disabled Mode | Manual Mode | Auto Mode |

### 📋 Flexible URL Rule Configuration

- **No proxy addresses** (`bypass_urls`): Domains/IPs for direct connection in manual mode
- **Use proxy addresses** (`include_urls`): Domains that need proxy access in auto mode
- **Fallback Policy**: Choose direct connection or reject when connection fails in auto mode
- Supports wildcards `*` and domain matching
- Suitable for scenarios where different websites use different proxies

### 🔐 Proxy Authentication Support

- Username/password authentication support
- Automatic handling of proxy server authentication requests
- Secure credential storage

### 🧪 Proxy Testing Functionality

- **Connection Test**: Verify if proxy is available
- **Latency Measurement**: Test proxy response time
- **Batch Testing**: One-click test all proxies
- **Color Coding**: Green (<500ms) / Orange (≥500ms) / Red (failed)

### 🏃 Proxy Status Detection

- Detect current browser proxy settings
- Verify if extension successfully controls proxy
- Identify other extensions controlling proxy
- Provides status, warning, and error results

### 🔍 PAC Script Preview

- **Script Viewing**: View the automatically generated PAC script content
- **Rules List**: Clearly display all active proxy matching rules
- **Debug Support**: Easy troubleshooting of matching issues in auto mode

### 🌙 Theme Modes

- **Light Mode**: For daytime use
- **Dark Mode**: For nighttime use
- **Auto Switch**: Automatically switch themes based on time (configurable hours)

| ![Light Mode](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/main/theme-light.png) | ![Dark Mode](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/main/theme-dark.png) |
|:---:|:---:|
| Light Mode | Dark Mode |

### ☁️ Data Storage & Sync

- **Local-First Storage**: Proxy configurations always saved to local storage
- **Cloud Sync**: Optional Chrome/Firefox account sync
- **Smart Merge**: Automatically merge local and remote data on sync errors
- **Import/Export**: JSON format configuration backup and restore

### 🌍 Multilingual Support

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

## 📷 Settings Interface

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260117084453/assets/screenshots/main/settings.png)

## 📁 Project Structure

```
ProxyAssistant/
├── readme/                    # Multilingual documentation
│   ├── README-zh-CN.md       # Simplified Chinese
│   ├── README-zh-TW.md       # Traditional Chinese
│   ├── README-en.md          # English
│   └── ...
├── src/                       # Source code
│   ├── manifest_chrome.json  # Chrome extension configuration
│   ├── manifest_firefox.json # Firefox extension configuration
│   ├── main.html             # Settings page
│   ├── popup.html            # Popup page
│   ├── js/
│   │   ├── worker.js         # Background service (Chrome: Service Worker)
│   │   ├── popup.js          # Popup main logic
│   │   ├── main.js           # Settings page main logic
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
└── public/                   # Public resources
    └── img/                  # Demo & Promotion images
```

## 🚀 Quick Start

### Install Extension

**Chrome:**

Method 1 (Recommended): Install from Chrome Web Store
1. Open Chrome browser, visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Proxy Assistant"
3. Click "Add to Chrome"

Method 2: Local Installation
- **Option A (Using Source Code)**: Download source code, rename `src/manifest_chrome.json` to `manifest.json`, then load `src` directory
- **Option B (Using Package)**: Download Chrome extension package (`.zip`) from release directory, extract and load the directory

**Firefox:**

Method 1 (Recommended): Install from Firefox Add-ons
1. Open Firefox browser, visit [Firefox Add-ons](https://addons.mozilla.org/)
2. Search for "Proxy Assistant"
3. Click "Add to Firefox"

Method 2: Local Installation
1. Download Firefox extension package (`.xpi`) from release directory
2. Open Firefox browser, visit `about:addons`
3. Click **Gear Icon** → **Install Add-on From File**
4. Select the downloaded `.xpi` file

### Add Proxy

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

### Use Proxy

**Manual Mode**:
1. Select **"Manual"** mode in popup
2. Choose proxy from the list
3. Status shows connected means it's active

**Auto Mode**:
1. Select **"Auto"** mode in popup
2. Configure URL rules for each proxy in settings page
3. Automatically select matching proxy when visiting websites

## 📖 Detailed Instructions

### URL Rule Syntax

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

### Fallback Policy

In auto mode, when proxy connection fails:

| Policy | Description |
|--------|-------------|
| **Direct Connection (DIRECT)** | Bypass proxy, connect directly to target website |
| **Reject Connection (REJECT)** | Reject the request |

### PAC Script Auto Mode

Auto mode uses PAC (Proxy Auto-Config) script:
- Automatically select proxy based on currently visited URL
- Match in proxy list order, return first matched proxy
- Supports fallback policy
- Automatically restore last configuration when browser starts

### Quick Operations

| Operation | Method |
|-----------|--------|
| Expand/Collapse proxy card | Click card header |
| Expand/Collapse all cards | Click "Expand/Collapse All" button |
| Drag to sort proxies | Drag the handle on card header |
| Show/Hide password | Click eye icon on right side of password field |
| Enable/Disable single proxy | Toggle switch on card |
| Test single proxy | Click "Connection Test" button |
| Test all proxies | Click "Test All" button |

### Import/Export Configuration

1. **Export Configuration**: Click "Export Configuration" to download JSON file
2. **Import Configuration**: Click "Import Configuration" to select JSON file to restore

Configuration includes:
- All proxy information
- Theme settings
- Night mode hours
- Language settings
- Sync toggle status

### Proxy Status Detection

Click "Detect Proxy Effect" button to:
- View current browser proxy mode
- Verify if extension successfully controls proxy
- Detect if other extensions seize control
- Get problem diagnosis and suggestions

## 🔧 Technical Architecture

### Manifest V3

- Chrome uses Manifest V3 specification
- Service Worker replaces background page
- Firefox uses background scripts + onRequest API

### Core Modules

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
   - Proxy management (CRUD)
   - Drag and drop sorting
   - Import/Export
   - Proxy detection function

4. **i18n.js**:
   - Multilingual support
   - Real-time language switching

### Data Storage

- `chrome.storage.local`: Local storage (always used)
- `chrome.storage.sync`: Cloud sync storage (optional)
- Follow local-first principle, solves sync quota issues

### Browser Compatibility

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Manual Mode | ✅ | ✅ |
| Auto Mode | ✅ | ✅ |
| Proxy Auth | ✅ | ✅ |
| Proxy Test | ✅ | ✅ |
| Theme Switch | ✅ | ✅ |
| Data Sync | ✅ | ✅ |
| Proxy Detection | ✅ | ✅ |

## 📝 Use Cases

### Scenario 1: Multi-Proxy Switching

- Configure different proxies for different network environments
- Use company proxy for office network
- Use scientific proxy for home network
- Quick one-click switching

### Scenario 2: Smart Routing

- Direct connection for domestic websites
- Use proxy for specific websites
- Automatic selection based on domain

### Scenario 3: Proxy Pool Testing

- Import multiple proxies
- Batch test latency
- Select optimal proxy to use

### Scenario 4: Team Sharing

- Export configuration file
- Share with team members
- Unified proxy configuration

## ⚠️ Notes

1. **Permission Description**: Extension requires the following permissions:
   - `proxy`: Manage proxy settings
   - `storage`: Store configuration
   - `webRequest` / `webRequestAuthProvider`: Handle authentication requests
   - `<all_urls>`: Access all website URLs

2. **Other Extension Conflicts**: If proxy conflicts occur, please disable other proxy/VPN extensions

3. **Security**: Credential information is stored locally in browser, please ensure device security

4. **Network Requirements**: Ensure proxy server is accessible

5. **Firefox Limitation**: Firefox minimum version required: 142.0

## 📄 Privacy Policy

[Privacy Policy](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📧 Contact

For questions or suggestions, please provide feedback through GitHub Issues.

---

<div align="center">

**If this project helps you, please consider giving it a Star ⭐!**

</div>
