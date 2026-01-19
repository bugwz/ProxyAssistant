# AGENTS.md - ProxyAssistant 开发指南

## 概述
ProxyAssistant 是一款浏览器代理管理扩展，支持 Chrome (Manifest V3) 和 Firefox。代码库使用原生 JavaScript、jQuery 和 Jest 进行测试。

## 构建命令

### 核心命令
```bash
npm test                    # 运行所有测试（单元测试 + 集成测试 + e2e 测试）
npm run test:unit           # 仅运行单元测试
npm run test:integration    # 仅运行集成测试
npm run test:e2e            # 仅运行 e2e 测试
npm run test:watch          # 以监听模式运行测试
npm run test:coverage       # 运行测试并生成覆盖率报告
```

### 单个测试执行
```bash
npm test -- --testPathPattern="main.test.js"           # 运行指定的测试文件
npm run test:unit -- --testNamePattern="validateIP"    # 运行匹配名称模式的测试
npm test -- tests/unit/main.test.js                    # 直接运行单个测试文件
npm test -- --no-cache                                 # 不使用缓存运行
```

### Make 命令
```bash
make test              # 运行所有测试并检查环境
make test_nocache      # 不使用缓存运行测试
make test_unit         # 仅运行单元测试
make test_integration  # 仅运行集成测试
make test_e2e          # 仅运行 e2e 测试
make build             # 构建 Chrome 和 Firefox 扩展
make clean             # 清理构建产物
make test_init         # 初始化测试环境和依赖
make test_clean        # 清理测试缓存和覆盖率文件
```

## 代码风格指南

### 通用约定
- 使用 **2 个空格** 进行缩进
- 字符串使用 **单引号**
- 变量和函数使用 **小驼峰命名法 (camelCase)**
- 常量使用 **大写下划线命名法 (UPPER_SNAKE_CASE)**
- 左大括号放在同一行：`function name() {`
- 一致地使用分号

### 变量和类型
```javascript
// 常量使用 const，可变变量使用 let，避免在新代码中使用 var
const API_ENDPOINT = 'https://api.example.com';
let currentProxy = null;
var legacyVariable = '';  // 仅用于现有代码

// 布尔值命名模式
const isEnabled = true;
const shouldAutoSync = false;
```

### 函数
```javascript
// 主逻辑使用函数声明
function initApp() {
  // ... 实现
}

// 回调模式（现有代码库风格）
document.addEventListener('DOMContentLoaded', function () {
  initApp();
});

// 简短回调可以使用箭头函数
$('.btn').on('click', () => {
  handleClick();
});
```

### 错误处理
```javascript
// Chrome API 错误处理模式
chrome.storage.local.get({ key: defaultValue }, function (result) {
  if (chrome.runtime.lastError) {
    console.warn('存储错误:', chrome.runtime.lastError);
    return;
  }
  // 处理结果
});

// 异步操作应处理错误
async function loadSettings() {
  try {
    const settings = await getSettings();
    return settings;
  } catch (error) {
    console.error('加载设置失败:', error);
    return defaultSettings;
  }
}
```

### 注释和文档
```javascript
// 用于文件组织的章节标题
// ==========================================
// 状态与常量
// ==========================================

// 复杂逻辑的行内注释
const parsed = parts.map(part => parseInt(part, 10));  // 转换为十进制
```

### 导入和依赖
- jQuery 通过 `$` 全局可用
- Chrome API 通过 `chrome` 命名空间可用
- 浏览器检测模式：
```javascript
const isFirefox = typeof browser !== 'undefined' && browser.runtime;
const isChrome = !isFirefox && typeof chrome !== 'undefined';
```

### 命名约定
```javascript
// 变量：小驼峰 | 常量：大写下划线 | 函数：小驼峰
let proxyList = [];
const DEFAULT_PORT = 8080;
function initApp() {}

// DOM 元素：使用 $ 前缀
const $element = $('.selector');
```

### 文件结构
```
src/
  js/
    main.js        # 主扩展逻辑
    popup.js       # 弹窗 UI 逻辑
    worker.js      # Service Worker (Manifest V3)
    i18n.js        # 国际化
    jquery.js      # jQuery（ vendored）
  css/, images/
  main.html, popup.html
  manifest_*.json  # 浏览器特定清单文件
tests/
  unit/, integration/, e2e/
  jest.config.js   # Jest 配置
```

### 测试模式
```javascript
describe('模块名', () => {
  describe('函数名', () => {
    test('应该处理有效输入', () => {
      const result = functionName(input);
      expect(result).toBe(expected);
    });
  });
});
```

### 浏览器特定代码
```javascript
// Firefox 检测和 polyfill
if (isFirefox) {
  // Firefox 特定实现
} else {
  // Chrome 实现
}

chrome.runtime.onInstalled.addListener((details) => {
  // 扩展安装/更新处理程序
});
```

### 最佳实践
1. 异步 Chrome API 调用后始终检查 `chrome.runtime.lastError`
2. 默认使用 `const`，需要重新赋值时使用 `let`
3. 同时处理 Chrome 和 Firefox 浏览器上下文
4. 对用户可见的字符串使用国际化系统
5. 卸载时清理事件监听器和定时器
6. 在 chrome.storage 中安全地存储代理凭据
7. 提交前使用 Chrome 和 Firefox 进行测试
