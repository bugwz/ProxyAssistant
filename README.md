<div align="center">

<img src="images/logo-128.png" width="128" height="128" align="left" style="margin-right: 16px;">
<h1 style="display: inline; vertical-align: middle; line-height: 128px;">代理助手</h1>

</div>

<div align="center">

[![Chrome扩展](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多语言](https://img.shields.io/badge/支持-中英日法多语言-yellow)](README-en.md)

</div>

<div align="center">
一款功能强大的Chrome浏览器代理管理扩展，轻松配置和切换网络代理。
</div>

![](images/promotion/1400-560-big.jpeg)

## ✨ 功能特性

### 🔌 多种代理协议支持
- **HTTP** - 传统HTTP代理
- **HTTPS** - 安全HTTPS代理
- **SOCKS5** - 支持TCP/UDP的SOCKS5代理
- **SOCKS4** - 兼容旧版SOCKS4代理

### 🔄 三种代理模式

| 模式 | 说明 |
|------|------|
| **禁用** | 关闭代理，使用系统默认网络连接 |
| **手动** | 从代理列表中手动选择要使用的代理 |
| **自动** | 根据URL规则自动选择匹配的代理（PAC模式） |

| ![](images/demo-popup-01.png) | ![](images/demo-popup-02.png) | ![](images/demo-popup-03.png) |
|:---:|:---:|:---:|
| 禁用模式 | 手动模式 | 自动模式 |

### 📋 灵活的URL规则配置

- **不使用代理的地址** (`bypass_urls`): 直接连接的域名/IP
- **使用代理的地址** (`include_urls`): 需要通过代理访问的域名
- 支持通配符 `*` 和域名匹配
- 适用于不同网站使用不同代理的场景

### 🔐 代理认证支持

- 支持用户名/密码认证
- 自动处理代理服务器的认证请求
- 安全存储凭据信息

### 🧪 代理测试功能

- **连接测试**: 验证代理是否可用
- **延迟测量**: 测试代理响应时间
- **批量测试**: 一键测试所有代理
- **颜色标识**: 绿色(<500ms) / 橙色(≥500ms) / 红色(失败)

### 🌙 主题模式

- **浅色模式**: 白天使用
- **深色模式**: 夜间使用
- **自动切换**: 根据时间自动切换主题

| ![浅色模式](images/demo-light.png) | ![深色模式](images/demo-night.png) |
|:---:|:---:|
| 浅色模式 | 深色模式 |

### ☁️ 数据同步

- **Google账户同步**: 在多设备间同步代理配置
- **本地存储**: 可选择仅本地保存

### 🌍 多语言支持

- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- English (en)
- 日本語 (ja)
- Français (fr)

## 📷 设置界面

![](images/demo.png)

## 📁 项目结构

```
chrome_extension_proxy/
├── manifest.json              # Chrome扩展配置
├── main.html                  # 设置页面
├── popup.html                 # 弹窗页面
├── js/
│   ├── main.js               # 设置页主逻辑
│   ├── popup.js              # 弹窗主逻辑
│   ├── service-worker.js     # 后台服务（代理核心逻辑）
│   ├── i18n.js               # 国际化支持
│   └── jquery.js             # jQuery库
├── css/
│   ├── main.css              # 设置页样式
│   ├── popup.css             # 弹窗样式
│   ├── theme.css             # 主题样式
│   ├── switch.css            # 开关组件样式
│   ├── delete-button.css     # 删除按钮样式
│   └── eye-button.css        # 密码可见按钮样式
└── images/                   # 图标资源
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-128.png
    └── logo-128.png
```

## 🚀 快速开始

### 安装扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择项目的 `chrome_extension_proxy` 文件夹

### 添加代理

1. 点击扩展图标打开弹窗
2. 点击 **"设置"** 按钮进入设置页面
3. 点击 **"新增"** 按钮添加新代理
4. 填写代理信息：
   - 代理名称
   - 协议类型 (HTTP/HTTPS/SOCKS5)
   - 代理地址 (IP或域名)
   - 端口号
   - (可选) 用户名和密码
5. 点击 **"保存"** 按钮

### 使用代理

**手动模式**:
1. 在弹窗中选择 **"手动"** 模式
2. 从列表中选择要使用的代理
3. 状态显示已连接即表示生效

**自动模式**:
1. 在弹窗中选择 **"自动"** 模式
2. 在设置页面为每个代理配置URL规则
3. 访问网站时自动选择匹配的代理

## 📖 详细说明

### URL规则语法

支持以下匹配规则：

```
# 精确匹配
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

### PAC脚本自动模式

自动模式使用PAC (Proxy Auto-Config) 脚本：
- 根据当前访问的URL自动选择代理
- 支持失败回退策略（直接连接或拒绝连接）
- 浏览器启动时自动恢复上次配置

### 快捷操作

| 操作 | 方式 |
|------|------|
| 展开/折叠代理卡片 | 点击卡片头部 |
| 展开/折叠全部卡片 | 点击"展开全部"按钮 |
| 拖动排序代理 | 拖动卡片头部的拖拽手柄 |
| 显示/隐藏密码 | 点击密码框右侧眼睛图标 |
| 测试单个代理 | 点击"测试"按钮 |
| 测试全部代理 | 点击"测试全部"按钮 |

### 导入导出配置

1. **导出配置**: 点击"导出配置"下载JSON文件
2. **导入配置**: 点击"导入配置"选择JSON文件恢复

配置包含：
- 所有代理信息
- 主题设置
- 同步设置

## 🔧 技术架构

### Manifest V3

- 使用Chrome扩展Manifest V3规范
- Service Worker代替后台页面
- 更安全、更高效的架构

### 核心模块

1. **service-worker.js**:
   - 代理配置管理
   - PAC脚本生成
   - 认证处理
   - 代理测试逻辑

2. **popup.js**:
   - 弹窗界面交互
   - 代理状态显示
   - 快速切换代理

3. **main.js**:
   - 设置页面逻辑
   - 代理管理（增删改）
   - 拖拽排序
   - 导入导出

4. **i18n.js**:
   - 多语言支持
   - 实时语言切换

### 数据存储

- `chrome.storage.local`: 本地存储
- `chrome.storage.sync`: 云端同步存储
- 自动处理存储配额

## 📝 使用场景

### 场景1: 多代理切换

- 为不同网络环境配置不同代理
- 办公室网络使用公司代理
- 家庭网络使用科学上网代理
- 快速一键切换

### 场景2: 智能路由

- 国内网站直连
- 特定网站走代理
- 根据域名自动选择

### 场景3: 代理池测试

- 导入多个代理
- 批量测试延迟
- 选择最优代理使用

### 场景4: 团队共享

- 导出配置文件
- 分享给团队成员
- 统一代理配置

## ⚠️ 注意事项

1. **权限说明**: 扩展需要以下权限：
   - `proxy`: 管理代理设置
   - `storage`: 存储配置
   - `webRequest`: 处理认证请求
   - `<all_urls>`: 访问所有网站URL

2. **其他扩展冲突**: 如遇代理冲突，请关闭其他代理类扩展

3. **安全性**: 凭据信息存储在浏览器本地，请确保设备安全

4. **网络要求**: 确保代理服务器可正常访问

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系

如有问题或建议，请通过GitHub Issues反馈。
