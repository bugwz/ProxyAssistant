<div align="center">

<img src="src/images/logo-128.png" width="80" height="80" alt="代理助手">

# 代理助手

[![Chrome 扩展](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox 扩展](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多语言](https://img.shields.io/badge/多语言-yellow)](README.md)

适用于 Chrome、Firefox 和 Edge 的浏览器代理管理扩展

[**简体中文**](README.md) | [繁體中文](readme/README-zh-TW.md) | [English](readme/README-en.md) | [日本語](readme/README-ja.md) | [Français](readme/README-fr.md) | [Deutsch](readme/README-de.md) | [Español](readme/README-es.md) | [Português](readme/README-pt.md) | [Русский](readme/README-ru.md) | [한국어](readme/README-ko.md)

</div>

代理助手用于在浏览器内管理 HTTP、HTTPS、SOCKS4 和 SOCKS5 代理。扩展提供禁用、手动和自动三种运行模式，并将代理节点、使用场景、路由规则、规则订阅、配置同步和诊断工具集中在同一个设置页面中。

Chrome、Firefox 和 Edge 均使用 Manifest V3。Edge 使用与 Chrome 相同的 Chromium 构建包。项目采用原生 JavaScript、jQuery 和浏览器扩展 API 开发，不依赖前端构建框架。

![代理助手设置页面](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/localized/zh-CN.png)

## 主要功能

### 代理节点与运行模式

- 管理 HTTP、HTTPS、SOCKS4 和 SOCKS5 代理节点。
- 支持代理地址、端口、用户名、密码、颜色和启用状态等配置。
- 在扩展弹窗中切换禁用、手动和自动模式。
- 手动模式使用选定节点，可配置不使用代理的地址。
- 自动模式根据节点的使用代理地址生成 PAC 脚本，并支持直连或拒绝连接两种回退策略。
- 支持单个测试和批量测试代理节点，并显示测试耗时或失败状态。

> 当前界面对 SOCKS5 节点禁用认证字段；Chrome 的代理 API 不支持 SOCKS5 用户名和密码认证。

### 代理场景

- 将不同网络环境的代理节点分别保存在多个场景中。
- 在设置页面或扩展弹窗中切换当前场景。
- 支持场景新增、重命名、删除、排序和节点迁移。
- 可为场景指定默认代理，并按星期和时间段配置自动启用规则。

### 规则订阅

- 集中维护可被多个代理节点复用的规则订阅。
- 支持 AutoProxy、Switchy Legacy、Switchy Omega 和 PAC 格式。
- 可查看订阅原文、解析结果、使用代理规则和直连规则。
- 支持规则反转以及手动、1 分钟、6 小时、12 小时、1 天和 5 天更新周期。
- 订阅更新由扩展后台任务执行。

### 配置、同步与诊断

- 使用 JSON 文件导入和导出配置，可选择是否包含订阅配置及订阅缓存。
- 使用浏览器原生同步存储在同一浏览器账号的设备间推送或拉取配置。
- 使用 GitHub Gist 推送或拉取配置，并支持定时同步。
- 原生同步数据按 7 KB 分块写入，并在设置页面显示当前配额占用情况。
- 检查当前代理控制状态、PAC 脚本状态以及可能的扩展冲突。
- 提供分级运行日志，可在设置页面筛选、刷新、复制或清空。

### 界面设置

- 支持浅色、深色和按时间自动切换主题。
- 支持使用 JSON 编辑自定义主题颜色。
- 支持简体中文、繁体中文、英语、日语、法语、德语、西班牙语、葡萄牙语、俄语和韩语。

## 安装

### 从发布包安装

普通用户可以直接从浏览器扩展商店安装：

- [Chrome 网上应用店](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)：适用于 Chrome，也可在允许安装 Chrome 扩展的 Edge 中使用。
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)：适用于 Firefox。

也可以前往 [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 下载对应版本：

- Chrome、Edge 等 Chromium 浏览器使用 `ProxyAssistant_<版本>_chrome.zip`。
- Firefox 构建包含 `ProxyAssistant_<版本>_firefox.zip` 和 `ProxyAssistant_<版本>_firefox.xpi`。

在 Chrome 或 Edge 中安装 ZIP 包时，需要先解压文件，然后在扩展管理页面开启开发者模式并选择“加载已解压的扩展程序”。仓库发布流程生成的 Firefox XPI 是构建产物，能否直接安装取决于当前 Firefox 的扩展签名策略；普通用户建议使用 Firefox Add-ons 商店版本。

### 从源码加载

仓库为 Chrome 和 Firefox 分别维护了清单文件。建议先使用构建脚本生成对应浏览器的完整目录或安装包，避免直接修改 `src/manifest.json`：

```bash
npm ci
make build VERSION=dev
```

构建完成后，解压 `build/ProxyAssistant_dev_chrome.zip`，再通过 Chrome 或 Edge 的扩展管理页面加载解压后的目录。调试 Firefox 时，可以解压 Firefox ZIP，在 `about:debugging` 的“此 Firefox”页面选择“临时载入附加组件”，并打开目录中的 `manifest.json`。生成 XPI 需要本机已安装 `web-ext`；如果未安装，构建脚本仍会生成 Firefox 的 ZIP 和 TAR.GZ 文件，但会跳过 XPI。

## 基本使用

1. 安装后点击浏览器工具栏中的代理助手图标。
2. 点击设置按钮进入完整设置页面。
3. 在“代理节点”中新增代理，填写协议、地址和端口；需要时再填写认证和路由规则。
4. 返回弹窗，选择禁用、手动或自动模式。
5. 手动模式下选择一个节点；自动模式下由 PAC 脚本按节点规则决定连接方式。

常见配置方式：

- 始终使用一个代理：选择手动模式并选中目标节点。
- 指定网站使用代理：为节点填写“使用代理的地址”，然后选择自动模式。
- 指定网站保持直连：为手动模式节点填写“不使用代理的地址”，或通过订阅提供直连规则。
- 区分办公、家庭等环境：分别创建场景，并在弹窗中快速切换。

## 数据与权限

扩展申请以下权限：

| 权限 | 用途 |
| --- | --- |
| `proxy` | 读取和修改浏览器代理配置 |
| `storage` | 保存本地配置，并支持浏览器原生同步 |
| `webRequest`、`webRequestAuthProvider` | 响应代理认证请求 |
| `alarms` | 执行订阅更新、场景自动切换和定时同步 |
| `<all_urls>` | 生成适用于网页请求的代理规则并读取当前站点信息 |

配置默认保存在 `chrome.storage.local`。代理用户名和密码是代理配置的一部分，也会进入导出的配置文件以及主动推送的同步数据；GitHub Token 和 Gist ID 不会写入导出或同步内容。请妥善保管导出文件，并在启用浏览器同步或 Gist 同步前确认其符合你的数据安全要求。

拉取远端配置会覆盖本地业务配置，但保留本地同步连接信息和同步计划。执行拉取前，建议先导出一份本地配置作为备份。

隐私政策：[Proxy Assistant Privacy Policy](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 开发

### 环境要求

- Node.js 20（与 GitHub Actions 使用的版本一致）
- npm
- Chrome、Firefox 或 Edge，用于浏览器内验证
- `web-ext`，仅在构建 Firefox XPI 时需要

安装依赖：

```bash
npm ci
```

### 测试

```bash
npm test                    # 运行全部 Jest 测试
npm run test:unit           # 单元测试
npm run test:integration    # 集成测试
npm run test:e2e            # 端到端测试
npm run test:watch          # 监听模式
npm run test:coverage       # 覆盖率测试
```

也可以使用 Makefile 中的入口：

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### 构建

```bash
make build VERSION=dev
```

构建脚本会清理 `build/`，为两个浏览器选择各自的 Manifest，并生成以下文件：

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

如果系统中没有 `web-ext`，最后一个文件不会生成。

### 项目结构

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # 浏览器国际化资源
│   ├── css/                  # 设置页面和弹窗样式
│   ├── images/               # 扩展图标
│   ├── js/                   # 页面、代理、存储、同步和后台逻辑
│   ├── main.html             # 设置页面
│   ├── popup.html            # 扩展弹窗
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Chrome 和 Firefox 打包脚本
├── readme/                   # 其他语言 README
├── release/                  # 各版本发布说明
├── Makefile
└── package.json
```

核心模块包括：

| 文件 | 职责 |
| --- | --- |
| `src/js/worker.js` | 应用代理设置、生成 PAC、处理认证、定时任务与后台消息 |
| `src/js/main.js` | 设置页面初始化和跨模块协调 |
| `src/js/popup.js` | 弹窗中的模式、场景和节点切换 |
| `src/js/proxy.js` | 代理节点表单、列表和测试交互 |
| `src/js/scenarios.js` | 场景管理及时间规则 |
| `src/js/subscription.js` | 订阅管理、解析和刷新计划 |
| `src/js/config.js` | 配置格式、迁移、导入与导出 |
| `src/js/storage.js` | 本地配置缓存与持久化 |
| `src/js/sync.js` | 浏览器原生同步和 GitHub Gist 同步 |
| `src/js/detection.js` | 代理控制状态和 PAC 诊断 |

项目的代码约定和测试要求见 [AGENTS.md](AGENTS.md)。

## 浏览器说明

- Chrome 使用 Manifest V3 Service Worker。
- Firefox 使用 Manifest V3 background script，最低支持版本由当前清单设为 Firefox 142。
- Edge 使用 Chrome 构建包，可通过 Chrome 网上应用店安装，也可在开发者模式下加载解压后的 Chrome 构建目录。项目当前的专用清单和自动化构建目标仍为 Chrome 与 Firefox。
- 同时启用多个代理或 VPN 扩展可能造成浏览器代理控制权冲突，可在“代理状态”页面查看诊断结果。

## 反馈与贡献

问题和功能建议请提交到 [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues)。提交改动前，请至少运行与改动相关的测试；涉及浏览器代理行为时，建议在 Chrome、Firefox 和 Edge 中进行验证。

## 许可证

本项目使用 [MIT License](LICENSE)。
