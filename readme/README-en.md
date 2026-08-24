<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Proxy Assistant">

# Proxy Assistant

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingual](https://img.shields.io/badge/Multilingual-yellow)](README-en.md)

A browser proxy management extension for Chrome, Firefox, and Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [**English**](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

Proxy Assistant manages HTTP, HTTPS, SOCKS4, and SOCKS5 proxies inside the browser. The extension provides disabled, manual, and automatic modes, bringing proxy nodes, scenarios, routing rules, rule subscriptions, configuration sync, and diagnostics together on one settings page.

Chrome, Firefox, and Edge use Manifest V3. Edge uses the same Chromium package as Chrome. The project is built with native JavaScript, jQuery, and browser extension APIs, without a front-end build framework.

![Proxy Assistant settings page](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/settings.png)

## Main features

### Proxy nodes and operating modes

- Manage HTTP, HTTPS, SOCKS4, and SOCKS5 proxy nodes.
- Configure proxy address, port, username, password, color, enabled state, and other settings.
- Switch between disabled, manual, and automatic modes from the extension popup.
- Manual mode uses the selected node and can define addresses that bypass the proxy.
- Automatic mode generates a PAC script from each node's proxy addresses and supports direct or reject fallback policies.
- Test a single node or all nodes and display latency or failure status.

> SOCKS5 authentication fields are disabled in the current interface; Chrome's proxy API does not support SOCKS5 username and password authentication.

### Proxy scenarios

- Keep proxy nodes for different network environments in separate scenarios.
- Switch the current scenario from the settings page or extension popup.
- Add, rename, delete, and sort scenarios, and move nodes between scenarios.
- Assign a default proxy and configure automatic activation by weekday and time range.

### Rule subscriptions

- Centrally manage rule subscriptions that can be shared by multiple proxy nodes.
- Support AutoProxy, Switchy Legacy, Switchy Omega, and PAC formats.
- View source content, parsed output, proxy rules, and direct rules.
- Reverse rules and refresh manually or every 1 minute, 6 hours, 12 hours, 1 day, or 5 days.
- Subscription updates run as extension background tasks.

### Configuration, sync, and diagnostics

- Import and export JSON configuration, optionally including subscription definitions and cached subscription content.
- Push or pull configuration across devices through the browser's native sync storage.
- Push or pull configuration through GitHub Gist, with scheduled synchronization support.
- Split native sync data into 7 KB chunks and display quota usage in settings.
- Inspect proxy control, PAC script status, and potential conflicts with other extensions.
- Filter, refresh, copy, and clear leveled runtime logs from the settings page.

### Interface settings

- Use light, dark, or scheduled automatic theme switching.
- Edit custom theme colors with JSON.
- Use Simplified Chinese, Traditional Chinese, English, Japanese, French, German, Spanish, Portuguese, Russian, or Korean.

![Light theme](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-light.png)

![Dark theme](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-dark.png)

## Installation

### Install from a release package

Regular users can install directly from an extension store:

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk): for Chrome and for Edge when Chrome extensions are allowed.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant): for Firefox.

You can also download a matching package from [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases):

- Chrome, Edge, and other Chromium browsers use `ProxyAssistant_<version>_chrome.zip`.
- Firefox builds include `ProxyAssistant_<version>_firefox.zip` and `ProxyAssistant_<version>_firefox.xpi`.

For Chrome or Edge, extract the ZIP, enable developer mode on the extensions page, and choose “Load unpacked.” The release workflow produces the Firefox XPI as a build artifact; direct installation depends on Firefox's current signing policy, so regular users should prefer the Firefox Add-ons store version.

### Load from source

The repository maintains separate manifests for Chrome and Firefox. Build the matching browser directory or package first so that `src/manifest.json` does not need to be edited directly:

```bash
npm ci
make build VERSION=dev
```

After the build, extract `build/ProxyAssistant_dev_chrome.zip` and load the directory in Chrome or Edge. For Firefox development, extract the Firefox ZIP, open `about:debugging`, select “This Firefox” and “Load Temporary Add-on,” then open `manifest.json`. Generating an XPI requires `web-ext`; without it, the build still produces Firefox ZIP and TAR.GZ files but skips the XPI.

## Basic usage

1. After installation, open Proxy Assistant from the browser toolbar.
2. Open the full settings page.
3. Add a proxy under “Proxy Nodes,” entering its protocol, address, and port; add authentication and routing rules when needed.
4. Return to the popup and choose disabled, manual, or automatic mode.
5. Select a node in manual mode; in automatic mode, the PAC script determines how requests connect.

Common configurations:

- Always use one proxy: choose manual mode and select the target node.
- Proxy specific websites: add them to a node's “Use proxy addresses,” then choose automatic mode.
- Keep specific websites direct: add them to “Bypass addresses” for the manual-mode node, or provide direct rules through a subscription.
- Separate office, home, and other environments: create different scenarios and switch them quickly from the popup.

## Data and permissions

The extension requests these permissions:

| Permission | Purpose |
| --- | --- |
| `proxy` | Read and change browser proxy settings |
| `storage` | Store local configuration and support native browser sync |
| `webRequest`, `webRequestAuthProvider` | Respond to proxy authentication requests |
| `alarms` | Run subscription refreshes, automatic scenario switching, and scheduled sync |
| `<all_urls>` | Generate proxy rules for web requests and read the current site |

Configuration is stored in `chrome.storage.local` by default. Proxy usernames and passwords are part of the proxy configuration and are included in exported configuration files and data you actively push through sync. The GitHub token and Gist ID are not written to exported or synchronized content. Protect exported files and confirm that browser or Gist sync meets your data-security requirements before enabling it.

Pulling remote configuration overwrites local business configuration while preserving local sync connection information and schedules. Export a local backup before pulling when necessary.

Privacy policy: [Proxy Assistant Privacy Policy](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Development

### Requirements

- Node.js 20, matching the version used by GitHub Actions
- npm
- Chrome, Firefox, or Edge for browser testing
- `web-ext`, required only to build a Firefox XPI

Install dependencies:

```bash
npm ci
```

### Tests

```bash
npm test                    # Run all Jest tests
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e            # End-to-end tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage tests
```

Makefile entry points are also available:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Build

```bash
make build VERSION=dev
```

The build script clears `build/`, selects the matching manifest for each browser, and generates:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

The last file is not generated when `web-ext` is unavailable.

### Project structure

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Browser localization resources
│   ├── css/                  # Settings-page and popup styles
│   ├── images/               # Extension icons
│   ├── js/                   # Page, proxy, storage, sync, and background logic
│   ├── main.html             # Settings page
│   ├── popup.html            # Extension popup
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Chrome and Firefox packaging script
├── readme/                   # README files in other languages
├── release/                  # Release notes by version
├── Makefile
└── package.json
```

Core modules:

| File | Responsibility |
| --- | --- |
| `src/js/worker.js` | Apply proxy settings, generate PAC scripts, handle authentication, scheduled tasks, and background messages |
| `src/js/main.js` | Initialize the settings page and coordinate modules |
| `src/js/popup.js` | Switch modes, scenarios, and nodes in the popup |
| `src/js/proxy.js` | Proxy-node forms, lists, and test interactions |
| `src/js/scenarios.js` | Scenario management and time rules |
| `src/js/subscription.js` | Subscription management, parsing, and refresh schedules |
| `src/js/config.js` | Configuration format, migration, import, and export |
| `src/js/storage.js` | Local configuration cache and persistence |
| `src/js/sync.js` | Native browser sync and GitHub Gist sync |
| `src/js/detection.js` | Proxy-control and PAC diagnostics |

See [AGENTS.md](../AGENTS.md) for coding conventions and testing requirements.

## Browser notes

- Chrome uses a Manifest V3 service worker.
- Firefox uses a Manifest V3 background script; the current manifest requires Firefox 142 or later.
- Edge uses the Chrome package. It can be installed from the Chrome Web Store or loaded from the unpacked Chrome build directory. The project's dedicated manifests and automated build targets remain Chrome and Firefox.
- Running multiple proxy or VPN extensions can cause proxy-control conflicts; use the “Proxy Status” page for diagnostics.

## Feedback and contributions

Report problems and feature requests through [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues). Run tests related to your changes before submitting them; for browser proxy behavior, verify in Chrome, Firefox, and Edge when possible.

## License

This project uses the [MIT License](../LICENSE).
