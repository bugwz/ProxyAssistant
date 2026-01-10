<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Proxy Assistant

</div>

<div align="center">

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingual](https://img.shields.io/badge/Multilingual-yellow)](README-en.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [**English**](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

A powerful Chrome browser proxy management extension for easy configuration and switching of network proxies.
</div>

![](../public/img/promotion/1400-560-big.jpeg)

## ✨ Features

### 🔌 Multiple Proxy Protocol Support
- **HTTP** - Traditional HTTP proxy
- **HTTPS** - Secure HTTPS proxy
- **SOCKS5** - SOCKS5 proxy supporting TCP/UDP
- **SOCKS4** - Compatible with legacy SOCKS4 proxy

### 🔄 Three Proxy Modes

| Mode | Description |
|------|-------------|
| **Disabled** | Turn off proxy, use system default network connection |
| **Manual** | Manually select proxy from proxy list |
| **Auto** | Automatically select matching proxy based on URL rules (PAC mode) |

| ![](../public/img/demo-popup-01.png) | ![](../public/img/demo-popup-02.png) | ![](../public/img/demo-popup-03.png) |
|:---:|:---:|:---:|
| Disabled Mode | Manual Mode | Auto Mode |

### 📋 Flexible URL Rule Configuration

- **No proxy addresses** (`bypass_urls`): Domains/IPs for direct connection
- **Use proxy addresses** (`include_urls`): Domains that need proxy access
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

### 🌙 Theme Modes

- **Light Mode**: For daytime use
- **Dark Mode**: For nighttime use
- **Auto Switch**: Automatically switch themes based on time

| ![Light Mode](../public/img/demo-light.png) | ![Dark Mode](../public/img/demo-night.png) |
|:---:|:---:|
| Light Mode | Dark Mode |

### ☁️ Data Synchronization

- **Google Account Sync**: Sync proxy configurations across devices
- **Local Storage**: Option to save only locally

### 🌍 Multilingual Support

This extension supports the following 5 languages:

| Language | Code | Support Status |
|----------|------|----------------|
| Simplified Chinese | zh-CN | ✅ Supported |
| Traditional Chinese | zh-TW | ✅ Supported |
| English | en | ✅ Supported |
| Japanese | ja | ✅ Supported |
| French | fr | ✅ Supported |

## 📷 Settings Interface

![](../public/img/demo.png)

## 📁 Project Structure

```
ProxyAssistant/
├──                     # Multilingual documentation
│   ├── README-zh-CN.md       # Simplified Chinese
│   ├── README-zh-TW.md       # Traditional Chinese
│   ├── README-en.md          # English
│   └── ...
├── src/                       # Source code
│   ├── manifest.json         # Chrome extension configuration
│   ├── main.html             # Settings page
│   ├── popup.html            # Popup page
│   ├── js/
│   │   ├── main.js           # Settings page main logic
│   │   ├── popup.js          # Popup main logic
│   │   ├── service-worker.js # Background service (proxy core logic)
│   │   ├── i18n.js           # Internationalization support
│   │   └── jquery.js         # jQuery library
│   ├── css/
│   │   ├── main.css          # Settings page styles
│   │   ├── popup.css         # Popup styles
│   │   ├── theme.css         # Theme styles
│   │   ├── switch.css        # Switch component styles
│   │   ├── delete-button.css # Delete button styles
│   │   └── eye-button.css    # Password visibility button styles
│   └── images/               # Icon resources
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       ├── logo-128.png
│       ├── demo.png
│       ├── demo-light.png
│       ├── demo-night.png
│       ├── demo-popup-01.png
│       ├── demo-popup-02.png
│       ├── demo-popup-03.png
│       └── promotion/
│           └── 1400-560-big.jpeg
└── public/                   # Public resources
    └── ...
```

## 🚀 Quick Start

### Install Extension

1. Open Chrome browser, visit `chrome://extensions/`
2. Enable **"Developer mode"** in the top right corner
3. Click **"Load unpacked"**
4. Select the project's `ProxyAssistant/src` folder

### Add Proxy

1. Click the extension icon to open popup
2. Click **"Settings"** button to enter settings page
3. Click **"Add"** button to add new proxy
4. Fill in proxy information:
   - Proxy name
   - Protocol type (HTTP/HTTPS/SOCKS5)
   - Proxy address (IP or domain)
   - Port number
   - (Optional) Username and password
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

### PAC Script Auto Mode

Auto mode uses PAC (Proxy Auto-Config) script:
- Automatically select proxy based on currently visited URL
- Supports failure fallback strategy (direct connection or reject connection)
- Automatically restore last configuration when browser starts

### Quick Operations

| Operation | Method |
|-----------|--------|
| Expand/Collapse proxy card | Click card header |
| Expand/Collapse all cards | Click "Expand All" button |
| Drag to sort proxies | Drag the handle on card header |
| Show/Hide password | Click eye icon on right side of password field |
| Test single proxy | Click "Test" button |
| Test all proxies | Click "Test All" button |

### Import/Export Configuration

1. **Export Configuration**: Click "Export Configuration" to download JSON file
2. **Import Configuration**: Click "Import Configuration" to select JSON file to restore

Configuration includes:
- All proxy information
- Theme settings
- Sync settings

## 🔧 Technical Architecture

### Manifest V3

- Uses Chrome extension Manifest V3 specification
- Service Worker replaces background page
- More secure and efficient architecture

### Core Modules

1. **service-worker.js**:
   - Proxy configuration management
   - PAC script generation
   - Authentication handling
   - Proxy testing logic

2. **popup.js**:
   - Popup interface interaction
   - Proxy status display
   - Quick proxy switching

3. **main.js**:
   - Settings page logic
   - Proxy management (CRUD)
   - Drag and drop sorting
   - Import/Export

4. **i18n.js**:
   - Multilingual support
   - Real-time language switching

### Data Storage

- `chrome.storage.local`: Local storage
- `chrome.storage.sync`: Cloud sync storage
- Automatic storage quota handling

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
   - `webRequest`: Handle authentication requests
   - `<all_urls>`: Access all website URLs

2. **Other Extension Conflicts**: If proxy conflicts occur, please disable other proxy extensions

3. **Security**: Credential information is stored locally in browser, please ensure device security

4. **Network Requirements**: Ensure proxy server is accessible

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📧 Contact

For questions or suggestions, please provide feedback through GitHub Issues.
