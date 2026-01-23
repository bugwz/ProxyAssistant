<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# 代理助手

</div>

<div align="center">

[![Chrome擴展程式](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox擴展程式](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多語言](https://img.shields.io/badge/多語言-yellow)](README-zh-TW.md)

</div>

<div align="center">

[簡體中文](../README.md) | [**繁體中文**](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

一款功能強大的瀏覽器代理管理擴展，適配 Chrome/Firefox/Edge 等多款瀏覽器，支持多場景管理，幫助您輕鬆配置和切換網絡代理。

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ 功能特性

### 1.1 🔌 多種代理協議支持
- **HTTP** - 傳統HTTP代理
- **HTTPS** - 安全HTTPS代理
- **SOCKS5** - 支持TCP/UDP的SOCKS5代理
- **SOCKS4** - 兼容舊版SOCKS4代理

### 1.2 🌐 多瀏覽器支持
- **Chrome** - 使用 Manifest V3 + Service Worker
- **Firefox** - 使用 Manifest V3 + `proxy.onRequest` API 進行代理攔截
- **Edge** - 完美兼容 Chrome 擴展，基於 Chromium 內核

### 1.3 🔄 三種代理模式

| 模式 | 說明 |
|------|------|
| **禁用** | 關閉代理，使用系統默認網絡連接 |
| **手動** | 從代理列表中手動選擇要使用的代理 |
| **自動** | 根據URL規則自動選擇匹配的代理（PAC模式） |

![](../public/img/promotion/1280-800-03.png)

### 1.4 🎬 場景模式

- **多場景支持**: 創建不同的代理配置集合（如：公司、家庭、開發環境）
- **快速切換**: 一鍵在不同場景間切換代理列表
- **靈活管理**: 支持場景的新增、重命名、刪除及排序
- **代理遷移**: 支持將代理在不同場景間移動

### 1.5 📋 靈活的URL規則配置

- **不使用代理的地址** (`bypass_urls`): 手動模式下直接連接的域名/IP
- **使用代理的地址** (`include_urls`): 自動模式下需要通過代理訪問的域名
- **失敗回退策略**: 自動模式下連接失敗時選擇直接連接或拒絕連接
- 支持通配符 `*` 和域名匹配
- 適用於不同網站使用不同代理的場景

### 1.6 🔐 代理認證支持

- 用戶名/密碼認證支持
- 自動處理代理服務器的認證請求
- 安全存儲憑證信息

### 1.7 🧪 代理測試功能

- **連接測試**: 驗證代理是否可用
- **延遲測量**: 測試代理響應時間
- **批量測試**: 一鍵測試所有代理
- **顏色標識**: 綠色(<500ms) / 橙色(≥500ms) / 紅色(失敗)

### 1.8 🏃 代理狀態檢測

- 檢測當前瀏覽器代理設置
- 驗證擴展是否成功控制代理
- 識別其他擴展對代理的控制
- 提供狀態、警告、錯誤三種結果

### 1.9 🔍 PAC 腳本預覽

- **腳本查看**: 查看自動生成的 PAC 腳本內容
- **規則列表**: 清晰展示所有生效的代理匹配規則
- **調試支持**: 方便排查自動模式下的匹配問題

### 1.10 🌙 主題模式

- **淺色模式**: 白天使用
- **深色模式**: 夜間使用
- **自動切換**: 根據時間自動切換主題（可配置時段）

![](../public/img/promotion/1280-800-02.png)

### 1.11 ☁️ 數據存儲與同步

#### 1.11.1 存儲策略

| 存儲類型 | 存儲內容 | 說明 |
|---------|----------|------|
| **本地存儲 (local)** | 代理列表、主題設置、語言設置、同步配置 | 始終啟用，確保離線可用和數據持久化 |
| **雲端同步 (sync)** | 完整配置數據（分塊存儲） | 可選功能，使用分塊存儲繞過配額限制 |

#### 1.11.2 同步方式

##### 1.11.2.1 瀏覽器原生同步 (Native Sync)
- 使用 `chrome.storage.sync` API（Chrome）或 `browser.storage.sync`（Firefox）
- 通過 Chrome/Firefox 帳號自動同步
- 適合同一瀏覽器帳號的多設備同步
- **分塊存儲**: 配置數據自動分塊（每塊 7KB）存儲，繞過 8KB 單項配額限制
- **數據校驗**: 使用校驗和確保同步數據的完整性
- **原子操作**: Push 操作先清空舊數據再寫入新數據，保證一致性
- **配額顯示**: 實時顯示已用/總配額（100KB）和分塊數量

##### 1.11.2.2 GitHub Gist 同步
- 通過 GitHub Gist 實現跨瀏覽器、跨設備的配置同步
- 需要配置 GitHub Personal Access Token
- 支持手動推送/拉取或自動同步
- 配置內容加密存儲，導出時自動清除敏感信息

| 配置項 | 說明 |
|--------|------|
| **訪問密鑰** | GitHub Personal Access Token (需擁有 gist 權限) |
| **文件名** | Gist 中的文件名，默認 `proxy_assistant_config.json` |
| **Gist ID** | 自動識別並保存，無需手動輸入 |

#### 1.11.3 同步操作

| 操作 | 說明 |
|------|------|
| **推送 (Push)** | 將本地配置上傳至雲端/Gist |
| **拉取 (Pull)** | 從雲端/Gist 下載配置到本地 |
| **測試連接** | 驗證 Gist Token 有效性及配置狀態 |

#### 1.11.4 導入導出

- **導出配置**: 生成 JSON 文件，包含所有代理信息、主題設置、語言設置等
- **導入配置**: 支持從 JSON 文件恢復配置
- **數據安全**: 導出文件自動清除敏感信息（Token、密碼）
- **格式兼容**: 支持新舊版本配置文件的導入

**導出內容結構:**
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

### 1.12 🌍 多語言支持

本擴展支持以下語言：

| 語言 | 代碼 | 支持狀態 |
|------|------|----------|
| 簡體中文 | zh-CN | ✅ 已支持 |
| 繁體中文 | zh-TW | ✅ 已支持 |
| English | en | ✅ 已支持 |
| 日本語 | ja | ✅ 已支持 |
| Français | fr | ✅ 已支持 |
| Deutsch | de | ✅ 已支持 |
| Español | es | ✅ 已支持 |
| Português | pt | ✅ 已支持 |
| Русский | ru | ✅ 已支持 |
| 한국어 | ko | ✅ 已支持 |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 設置界面

![](../public/img/demo.png)

## 3. 📁 項目結構

```
ProxyAssistant/
├── conf/                     # 示例配置
│   └── demo.json             # 示例配置文件
├── readme/                   # 多語言文檔
│   ├── README-zh-TW.md       # 繁體中文
│   ├── README-en.md          # 英文
│   ├── README-ja.md          # 日文
│   ├── README-fr.md          # 法文
│   ├── README-de.md          # 德文
│   ├── README-es.md          # 西班牙文
│   ├── README-pt.md          # 葡萄牙文
│   ├── README-ru.md          # 俄文
│   └── README-ko.md          # 韓文
├── src/                      # 源代碼
│   ├── manifest_chrome.json  # Chrome 擴展配置 (Manifest V3)
│   ├── manifest_firefox.json # Firefox 擴展配置
│   ├── main.html             # 設置頁面
│   ├── popup.html            # 彈窗頁面
│   ├── js/
│   │   ├── main.js           # 設置頁面主邏輯
│   │   ├── popup.js          # 彈窗 UI 邏輯
│   │   ├── worker.js         # Service Worker (Chrome) / Background Script (Firefox)
│   │   ├── i18n.js           # 國際化支持
│   │   └── jquery.js         # jQuery 庫
│   ├── css/
│   │   ├── main.css          # 設置頁面樣式 (含通用組件)
│   │   ├── popup.css         # 彈窗樣式
│   │   ├── theme.css         # 主題樣式
│   │   └── eye-button.css    # 顯示密碼按鈕樣式
│   └── images/               # 圖片資源
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # 公共資源
│   └── img/                  # 演示和宣傳圖片
├── tests/                    # 測試目錄
│   ├── jest.config.js        # Jest 測試配置
│   ├── setup.js              # 測試環境設置
│   ├── __mocks__/            # Mock 文件
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # 單元測試
│   ├── integration/          # 集成測試
│   └── e2e/                  # 端到端測試
├── script/                   # 構建腳本
│   └── build.sh              # 擴展構建腳本
├── release/                  # 版本發佈說明
│   └── *.md                  # 各版本更新日誌
├── build/                    # 構建產物目錄
├── package.json              # 項目依賴配置
├── package-lock.json         # 鎖定依賴版本
├── Makefile                  # 構建命令入口
├── jest.config.js            # Jest 配置（指向 tests/jest.config.js）
└── AGENTS.md                 # 開發指南
```

## 4. 🚀 快速開始

### 4.1 安裝擴展

#### 4.1.1 Chrome

**方式一（推薦）**：從 Chrome 官方擴展商店安裝
1. 打開 Chrome 瀏覽器，訪問 [Chrome 網上應用店](https://chrome.google.com/webstore)
2. 搜索"代理助手"
3. 點擊"添加至 Chrome"

**方式二**：本地安裝
- **方案 A（使用源碼）**：下載源碼，將 `src/manifest_chrome.json` 重命名為 `manifest.json`，然後加載 `src` 目錄
- **方案 B（使用安裝包）**：
  1. 前往 [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 頁面
  2. 下載 `proxy-assistant-chrome-x.x.x.zip` 文件
  3. 解壓下載的 ZIP 文件到任意目錄
  4. 打開 Chrome 瀏覽器，訪問 `chrome://extensions/`
  5. 開啟右上角的 **"開發者模式"** 開關
  6. 點擊左上角的 **"加載解壓的擴展"** 按鈕
  7. 選擇步驟3解壓的文件夾
  8. 擴展安裝成功後會顯示在擴展列表中

#### 4.1.2 Firefox

**方式一（推薦）**：從 Firefox 官方附加組件安裝
1. 打開 Firefox 瀏覽器，訪問 [Firefox 附加組件](https://addons.mozilla.org/)
2. 搜索"代理助手"
3. 點擊"添加到 Firefox"

**方式二**：本地安裝
1. 下載 release 目錄中的 Firefox 擴展安裝包（`.xpi` 文件）
2. 打開 Firefox 瀏覽器，訪問 `about:addons`
3. 點擊 **齒輪圖標** → **從文件安裝附加組件**
4. 選擇下載的 `.xpi` 文件

#### 4.1.3 Microsoft Edge

Edge 瀏覽器基於 Chromium 內核，可直接安裝 Chrome 擴展。

**方式一（推薦）**：從 Chrome 網上應用店安裝
1. 打開 Edge 瀏覽器，訪問 `edge://extensions/`
2. 在 "查找新擴展欄目" 中點擊從 `Chrome Web Store` 獲取擴展， 訪問 [Chrome 網上應用店](https://chrome.google.com/webstore)
3. 搜索"代理助手"
4. 點擊獲取後，"添加至 Microsoft Edge"

**方式二**：本地安裝
1. 前往 [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 頁面
2. 下載 `proxy-assistant-chrome-x.x.x.zip` 文件
3. 解壓下載的 ZIP 文件到任意目錄
4. 打開 Edge 瀏覽器，訪問 `edge://extensions/`
5. 開啟左下角的 **"開發者模式"** 開關
6. 點擊 **"選擇解壓的目錄"** 按鈕
7. 選擇步驟3解壓的文件夾
8. 擴展安裝成功後會顯示在擴展列表中

### 4.2 添加代理

1. 點擊擴展圖標打開彈窗
2. 點擊 **"設置"** 按鈕進入設置頁面
3. 點擊 **"新增代理"** 按鈕添加新代理
4. 填寫代理信息：
   - 代理名稱
   - 協議類型 (HTTP/HTTPS/SOCKS4/SOCKS5)
   - 代理地址 (IP或域名)
   - 端口號
   - (可選) 用戶名和密碼
   - (可選) URL規則配置
5. 點擊 **"保存"** 按鈕

### 4.3 使用代理

**手動模式**:
1. 在彈窗中選擇 **"手動"** 模式
2. 從列表中選擇要使用的代理
3. 狀態顯示已連接即表示生效

**自動模式**:
1. 在彈窗中選擇 **"自動"** 模式
2. 在設置頁面為每個代理配置URL規則
3. 訪問網站時自動選擇匹配的代理

## 5. 🛠️ 開發指南

### 5.1 開發環境

**前置要求**:
- Node.js >= 14
- npm >= 6
- Chrome / Firefox 瀏覽器（用於測試）
- web-ext（用於構建 Firefox XPI，可選）

**安裝依賴**:
```bash
make test_init
# 或
npm install
```

### 5.2 測試命令

| 命令 | 說明 |
|------|------|
| `make test` | 運行所有測試（單元 + 集成 + e2e） |
| `make test_nocache` | 不使用緩存運行測試 |
| `make test_unit` | 僅運行單元測試 |
| `make test_integration` | 僅運行集成測試 |
| `make test_e2e` | 僅運行 e2e 測試 |
| `make test_watch_nocache` | 監聽模式運行測試 |

**直接使用 npm**:
```bash
npm test                    # 運行所有測試
npm run test:unit           # 僅運行單元測試
npm run test:integration    # 僅運行集成測試
npm run test:e2e            # 僅運行 e2e 測試
npm run test:watch          # 監聽模式運行測試
npm run test:coverage       # 運行測試並生成覆蓋率報告
```

### 5.3 構建命令

| 命令 | 說明 |
|------|------|
| `make build` | 構建 Chrome 和 Firefox 擴展 |
| `make clean` | 清理構建產物 |
| `make test_clean` | 清理測試緩存和覆蓋率文件 |

**指定版本號**:
```bash
make build VERSION=dev
# 或
./script/build.sh dev
```

**構建產物**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Chrome 安裝包
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Chrome 源碼包
├── ProxyAssistant_{VERSION}_firefox.zip     # Firefox 安裝包
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Firefox 源碼包
└── ProxyAssistant_{VERSION}_firefox.xpi     # Firefox 官方擴展包
```

### 5.4 本地開發測試

**Chrome 本地安裝**:
1. 修改 `src/manifest_chrome.json` 為 `manifest.json`
2. 打開 Chrome，訪問 `chrome://extensions/`
3. 開啟 **"開發者模式"**
4. 點擊 **"加載已解壓的擴展程序"**
5. 選擇 `src` 目錄

**Firefox 本地安裝**:
1. 使用 `make build` 生成 XPI 文件
2. 打開 Firefox，訪問 `about:addons`
3. 點擊 **齒輪圖標** → **從文件安裝附加組件**
4. 選擇生成的 `.xpi` 文件

### 5.5 代碼風格

- **縮進**: 2 個空格
- **引號**: 單引號
- **命名**: 小駝峰 (camelCase)，常量使用大寫下劃線
- **分號**: 一致使用

詳細規範請參考 [AGENTS.md](../AGENTS.md)

## 6. 📖 詳細說明

### 6.1 URL規則語法

支持以下匹配規則：

```
# 精確匹配
google.com

# 子域名匹配
.google.com
www.google.com

# 通配符匹配
*.google.com
*.twitter.com

# IP地址
192.168.1.1
10.0.0.0/8
```

### 6.2 失敗回退策略

在自動模式下，當代理連接失敗時：

| 策略 | 說明 |
|------|------|
| **直接連接 (DIRECT)** | 繞過代理，直接連接目標網站 |
| **拒絕連接 (REJECT)** | 拒絕該請求 |

### 6.3 PAC腳本自動模式

自動模式使用 PAC (Proxy Auto-Config) 腳本：
- 根據當前訪問的URL自動選擇代理
- 按代理列表順序匹配，返回第一個匹配的代理
- 支持失敗回退策略
- 瀏覽器啟動時自動恢復上次配置

### 6.4 快捷操作

| 操作 | 方式 |
|------|------|
| 展開/折疊代理卡片 | 點擊卡片頭部 |
| 展開/折疊全部卡片 | 點擊"展開/折疊全部"按鈕 |
| 拖動排序代理 | 拖動卡片頭部的拖拽手柄 |
| 顯示/隱藏密碼 | 點擊密碼框右側眼睛圖標 |
| 單獨啟用/禁用代理 | 切換卡片上的開關 |
| 測試單個代理 | 點擊"連接測試"按鈕 |
| 測試全部代理 | 點擊"測試全部"按鈕 |
| 快速關閉彈窗 | 頁面內按 `ESC` 鍵 |

### 6.5 導入導出配置

1. **導出配置**: 點擊"導出配置"下載 JSON 文件
2. **導入配置**: 點擊"導入配置"選擇 JSON 文件恢復

配置包含：
- 所有代理信息
- 主題設置
- 夜間模式時段
- 語言設置
- 同步開關狀態

### 6.6 代理狀態檢測

點擊"檢測代理效果"按鈕可以：
- 查看當前瀏覽器代理模式
- 驗證擴展是否成功控制代理
- 檢測其他擴展是否搶佔控制權
- 獲得問題診斷和建議

## 7. 🔧 技術架構

### 7.1 Manifest V3

- Chrome 使用 Manifest V3 規範
- Service Worker 代替後台頁面
- Firefox 使用 background scripts + onRequest API

### 7.2 核心模塊

1. **worker.js (Chrome)**:
   - 代理配置管理
   - PAC腳本生成
   - 認證處理
   - 代理測試邏輯
   - 存儲變更監聽

2. **popup.js**:
   - 彈窗界面交互
   - 代理狀態顯示
   - 快速切換代理
   - 自動匹配顯示

3. **main.js**:
   - 設置頁面邏輯
   - 場景管理（Scenarios）
   - 代理管理（增刪改）
   - 拖拽排序
   - 導入導出
   - 代理檢測功能

4. **i18n.js**:
   - 多語言支持
   - 實時語言切換

### 7.3 數據存儲

- `chrome.storage.local`: 本地存儲（始終使用）
- `chrome.storage.sync`: 雲端同步存儲（可選）
- 遵循本地優先原則，解決同步配額問題

### 7.4 瀏覽器兼容性

| 功能 | Chrome | Firefox |
|------|--------|---------|
| 手動模式 | ✅ | ✅ |
| 自動模式 | ✅ | ✅ |
| 代理認證 | ✅ | ✅ |
| 代理測試 | ✅ | ✅ |
| 主題切換 | ✅ | ✅ |
| 數據同步 | ✅ | ✅ |
| 代理檢測 | ✅ | ✅ |

## 8. 📝 使用場景

### 8.1 場景1: 多代理切換

- 為不同網絡環境配置不同代理
- 辦公室網絡使用公司代理
- 家庭網絡使用科學上網代理
- 快速一鍵切換

### 8.2 場景2: 智能路由

- 國內網站直連
- 特定網站走代理
- 根據域名自動選擇

### 8.3 場景3: 代理池測試

- 導入多個代理
- 批量測試延遲
- 選擇最優代理使用

### 8.4 場景4: 團隊共享

- 導出配置文件
- 分享給團隊成員
- 統一代理配置

## 9. ⚠️ 注意事項

1. **權限說明**: 擴展需要以下權限：
   - `proxy`: 管理代理設置
   - `storage`: 存儲配置
   - `webRequest` / `webRequestAuthProvider`: 處理認證請求
   - `<all_urls>`: 訪問所有網站URL

2. **其他擴展衝突**: 如遇代理衝突，請關閉其他代理/VPN類擴展

3. **安全性**: 憑證信息存儲在瀏覽器本地，請確保設備安全

4. **網絡要求**: 確保代理服務器可正常訪問

5. **Firefox 限制**: Firefox 最低版本要求 142.0

## 10. 📄 隱私權政策

[隱私權政策](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 許可證

MIT License - 詳見 [LICENSE](../LICENSE) 文件

## 12. 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 13. 📧 聯繫

如有問題或建議，請通過 GitHub Issues 反饋。

---

<div align="center">

**如果這個項目對您有幫助，歡迎 Star ⭐ 支持！**

</div>
