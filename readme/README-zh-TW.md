<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="代理助手">

# 代理助手

[![Chrome 擴充功能](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox 擴充功能](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多語言](https://img.shields.io/badge/多語言-yellow)](README-zh-TW.md)

適用於 Chrome、Firefox 和 Edge 的瀏覽器代理管理擴充功能

[简体中文](../README.md) | [**繁體中文**](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

代理助手用於在瀏覽器內管理 HTTP、HTTPS、SOCKS4 和 SOCKS5 代理。擴充功能提供停用、手動和自動三種模式，並將代理節點、使用情境、路由規則、規則訂閱、設定同步和診斷工具集中在同一個設定頁面中。

Chrome、Firefox 和 Edge 均使用 Manifest V3；Edge 使用與 Chrome 相同的 Chromium 建置套件。專案採用原生 JavaScript、jQuery 和瀏覽器擴充功能 API 開發。

![代理助手設定頁面](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/settings.png)

## 主要功能

### 代理節點與執行模式

- 管理 HTTP、HTTPS、SOCKS4 和 SOCKS5 代理節點。
- 支援代理位址、連接埠、使用者名稱、密碼、顏色和啟用狀態等設定。
- 從擴充功能彈出視窗切換停用、手動和自動模式。
- 手動模式使用指定節點，並可設定不使用代理的位址。
- 自動模式依節點的使用代理位址產生 PAC 指令碼，支援直接連線或拒絕連線的備援策略。
- 支援單一與批次節點測試，顯示延遲或失敗狀態。

> 目前介面會停用 SOCKS5 認證欄位；Chrome 的代理 API 不支援 SOCKS5 帳號密碼認證。

### 代理情境

- 將不同網路環境的代理節點分別保存在多個情境中。
- 從設定頁面或擴充功能彈出視窗切換目前情境。
- 支援新增、重新命名、刪除、排序情境，以及在情境間移動節點。
- 可指定預設代理，並依星期與時間範圍自動啟用情境。

### 規則訂閱

- 集中管理可供多個節點共用的規則訂閱。
- 支援 AutoProxy、Switchy Legacy、Switchy Omega 和 PAC 格式。
- 可檢視原始內容、解析結果、使用代理規則與直接連線規則。
- 支援規則反轉，以及手動、1 分鐘、6 小時、12 小時、1 天和 5 天更新週期。
- 訂閱更新由擴充功能背景工作執行。

### 設定、同步與診斷

- 匯入及匯出 JSON 設定，可選擇是否包含訂閱設定與快取內容。
- 使用瀏覽器原生同步儲存空間，在相同瀏覽器帳號的裝置間推送或拉取設定。
- 使用 GitHub Gist 推送或拉取設定，並支援定時同步。
- 原生同步資料以 7 KB 分塊寫入，並在設定頁面顯示配額使用量。
- 檢查代理控制權、PAC 狀態與其他擴充功能衝突。
- 篩選、重新整理、複製和清除執行記錄。

### 介面設定

- 支援淺色、深色和依時間自動切換主題。
- 支援使用 JSON 編輯自訂主題顏色。
- 支援簡體中文、繁體中文、英文、日文、法文、德文、西班牙文、葡萄牙文、俄文和韓文。

![淺色主題](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-light.png)

![深色主題](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-dark.png)

## 安裝

### 從發佈套件安裝

從擴充功能商店安裝：

- [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)：適用於 Chrome，也可在允許安裝 Chrome 擴充功能的 Edge 中使用。
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)：適用於 Firefox。

也可從 [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 下載對應版本：

- Chrome、Edge 等 Chromium 瀏覽器使用 `ProxyAssistant_<版本>_chrome.zip`。
- Firefox 建置包含 `ProxyAssistant_<版本>_firefox.zip` 和 `ProxyAssistant_<版本>_firefox.xpi`。

Chrome 或 Edge 需先解壓 ZIP，再於擴充功能頁面開啟開發人員模式並載入未封裝目錄。Firefox XPI 能否直接安裝取決於瀏覽器簽署政策，普通使用者建議使用 Firefox Add-ons 商店版本。

### 從原始碼建置

```bash
npm ci
make build VERSION=dev
```

解壓 `build/ProxyAssistant_dev_chrome.zip` 後，可在 Chrome 或 Edge 載入目錄。Firefox 開發可解壓 Firefox ZIP，在 `about:debugging` 的「此 Firefox」中選擇「暫時載入附加元件」，再開啟 `manifest.json`。產生 XPI 需要 `web-ext`。

## 基本使用

1. 從瀏覽器工具列開啟代理助手。
2. 進入完整設定頁面並新增代理節點。
3. 填寫通訊協定、位址和連接埠，必要時加入認證與路由規則。
4. 回到彈出視窗，選擇停用、手動或自動模式。
5. 手動模式選擇節點；自動模式由 PAC 指令碼決定路由。

常見設定方式：

- 始終使用一個代理：選擇手動模式並選取目標節點。
- 指定網站使用代理：將網站加入節點的「使用代理的位址」，再選擇自動模式。
- 指定網站保持直接連線：將網站加入手動模式節點的「不使用代理的位址」，或由訂閱提供直接連線規則。
- 區分辦公室、住家等環境：分別建立情境，並從彈出視窗快速切換。

## 資料與權限

擴充功能要求以下權限：

| 權限 | 用途 |
| --- | --- |
| `proxy` | 讀取與修改瀏覽器代理設定 |
| `storage` | 儲存本機設定並支援原生同步 |
| `webRequest`、`webRequestAuthProvider` | 回應代理認證要求 |
| `alarms` | 排程訂閱更新、情境啟用和同步 |
| `<all_urls>` | 將代理規則套用至網頁要求並讀取目前網站 |

設定預設儲存在 `chrome.storage.local`。代理帳號和密碼屬於代理設定，會包含在匯出檔案和主動推送的同步資料中；GitHub Token 與 Gist ID 不會寫入匯出或同步內容。請妥善保管匯出檔案，並在啟用同步前確認安全需求。

拉取遠端資料會覆寫本機業務設定，但保留本機同步連線資訊和排程。重要設定建議先匯出備份。

隱私權政策：[Proxy Assistant Privacy Policy](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 開發

### 環境需求

- Node.js 20（與 GitHub Actions 使用的版本一致）
- npm
- Chrome、Firefox 或 Edge，用於瀏覽器內驗證
- `web-ext`，僅在建置 Firefox XPI 時需要

安裝相依套件：

```bash
npm ci
```

### 測試

```bash
npm test                    # 執行全部 Jest 測試
npm run test:unit           # 單元測試
npm run test:integration    # 整合測試
npm run test:e2e            # 端對端測試
npm run test:watch          # 監看模式
npm run test:coverage       # 覆蓋率測試
```

也可以使用 Makefile 中的入口：

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### 建置

```bash
make build VERSION=dev
```

建置指令碼會清理 `build/`，為兩個瀏覽器選擇各自的 Manifest，並產生以下檔案：

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

如果系統中沒有 `web-ext`，最後一個檔案不會產生。

### 專案結構

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # 瀏覽器國際化資源
│   ├── css/                  # 設定頁面和彈出視窗樣式
│   ├── images/               # 擴充功能圖示
│   ├── js/                   # 頁面、代理、儲存、同步和背景邏輯
│   ├── main.html             # 設定頁面
│   ├── popup.html            # 擴充功能彈出視窗
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Chrome 和 Firefox 封裝指令碼
├── readme/                   # 其他語言 README
├── release/                  # 各版本發佈說明
├── Makefile
└── package.json
```

核心模組包括：

| 檔案 | 職責 |
| --- | --- |
| `src/js/worker.js` | 套用代理設定、產生 PAC、處理認證、定時工作與背景訊息 |
| `src/js/main.js` | 初始化設定頁面並協調各模組 |
| `src/js/popup.js` | 彈出視窗中的模式、情境和節點切換 |
| `src/js/proxy.js` | 代理節點表單、清單和測試互動 |
| `src/js/scenarios.js` | 情境管理及時間規則 |
| `src/js/subscription.js` | 訂閱管理、解析和更新排程 |
| `src/js/config.js` | 設定格式、遷移、匯入與匯出 |
| `src/js/storage.js` | 本機設定快取與持久化 |
| `src/js/sync.js` | 瀏覽器原生同步和 GitHub Gist 同步 |
| `src/js/detection.js` | 代理控制狀態和 PAC 診斷 |

專案的程式碼規範和測試需求請參閱 [AGENTS.md](../AGENTS.md)。

## 瀏覽器說明

- Chrome 使用 Manifest V3 Service Worker。
- Firefox 使用 Manifest V3 background script，目前清單要求 Firefox 142 或更新版本。
- Edge 使用 Chrome 建置套件，可從 Chrome 線上應用程式商店安裝或載入解壓後的 Chrome 建置目錄。專案目前的專用清單和自動化建置目標仍為 Chrome 與 Firefox。
- 同時啟用多個代理或 VPN 擴充功能可能造成控制權衝突，可在「代理狀態」頁面診斷。

## 意見回饋與貢獻

問題和功能建議請提交至 [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues)。提交修改前請至少執行相關測試；涉及代理行為時，建議在 Chrome、Firefox 和 Edge 中驗證。

## 授權

本專案採用 [MIT License](../LICENSE)。
