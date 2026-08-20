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
    console.log('加载设置失败:', error);
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

### 下拉选择组件约束
- 项目中所有用户可见的**单选下拉框**必须与代理表单的“协议”下拉框保持一致，统一使用 `.lh-select`、`.lh-select-k`、`.lh-select-value` 和 `.lh-select-op` 组件协议；不得直接展示浏览器原生 `<select>` 菜单。
- 业务逻辑需要保留 `<select>` 的 `value`、表单读取或 `change` 事件时，只允许将其作为隐藏数据源，并通过 `window.enhanceNativeSelects(root)` 增强为统一的自定义下拉组件。
- 使用 `html()` 等方式动态渲染包含 `<select>` 的内容后，必须对新渲染的根节点调用 `window.enhanceNativeSelects(root)`；禁止遗漏增强而使原生下拉框直接显示。
- 新增或修改下拉组件时，必须同时覆盖亮色与暗色主题，并保持统一的边框、圆角、阴影、选中态、悬停态、禁用态、箭头状态以及空间不足时向上展开的行为。
- 下拉组件必须保留键盘可访问性，至少支持 Enter、空格、上下方向键和 Escape，并同步维护 `aria-expanded`、`aria-selected` 等状态。
- 多选场景应继续使用项目现有的复选列表式自定义菜单，不得退化为原生 `<select multiple>`。
- 相关测试应验证当前组件结构、选值结果和 `change` 行为；不要只检查 CSS 类名或旧的原生实现是否被删除。

### 表单字段提示约束
- 表单内部字段需要补充简短说明时，应参照“用户名（可选）”的方式，将提示直接写在字段 Label 后的全角括号中，例如“自动切换策略（统一使用‘并且’或‘或者’组合）”；不要在字段下方另起一段重复的描述文案。
- 括号内只描述当前字段必要的可选性、输入格式、组合规则或生效行为，保持简短，避免重复字段名称或使用大段帮助文本。
- 同一组重复表单行共用的字段名称和说明只展示一次，并与各列控件对齐；不要在每一行重复 Label 或提示。
- 字段名称与括号提示都属于用户可见文案，必须通过国际化系统提供，不得直接硬编码在模板或脚本中。
- 只有跨多个字段的概念说明、风险警告或无法压缩进 Label 的复杂帮助内容，才允许使用独立说明区域；使用前应确认其不会与字段 Label 重复。

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

### 测试用例设计
- 测试名称和断言应描述项目当前存在的功能、结构与行为，优先验证用户可见结果或稳定接口。
- 删除或替换旧实现后，不要在新测试中引用已经不存在的旧按钮、旧类名、旧文案或旧实现细节来证明它们已被移除。
- 避免 `expect(html).not.toContain('旧实现标识')` 这类带有历史背景的断言；应改为验证新结构包含所需元素、数据和行为。
- 仅当“不存在”本身是明确的产品、安全或构建契约时使用负向断言，例如防止 XSS、排除错误打包文件、禁止生成无效规则。
- DOM 测试优先通过选择器解析当前结构并验证元素关系，不要依赖与功能无关的大段 HTML 字符串或已废弃实现。

```javascript
test('关于页面展示完整版本信息', () => {
  const panel = pageDocument.querySelector('.about-version-panel');
  const values = panel.querySelectorAll('.version-value');

  expect(panel).toBeTruthy();
  expect(values).toHaveLength(3);
});
```

### 配置文件版本管理
- 配置文件版本表示一个已经对外生效、需要长期兼容的数据结构边界，不表示开发过程中修改字段的次数；不要因为每次重命名、调整层级或改变排序就连续增加版本。
- 开始修改配置结构前，必须先根据 Git 历史、发布标签或已发布代码确认“最近实际发布的配置版本”，不能把当前工作区里尚未提交的临时版本当作新的兼容基线。
- 同一轮尚未提交、尚未发布的配置结构调整只能占用一个目标版本。例如最近发布版本为 v5，则这一轮无论经历多少次字段调整，最终都应保持为 v6。
- 在当前目标版本正式发布或被明确作为外部兼容边界之前，后续调整必须直接修改该目标版本的最终结构，不得继续递增为 v7、v8，也不得为这些临时版本增加迁移分支。
- 代码提交本身不自动代表配置版本已经对外生效。只有已经发布、已分发给用户，或项目明确要求保留的持久化格式，才应进入长期兼容版本列表。
- 迁移逻辑和兼容测试只覆盖当前版本以及实际发布过、仍受支持的历史版本；不得为未提交、未发布、仅存在于本地开发过程中的中间版本保留兼容代码或测试。
- 如果临时版本只写入开发者本地数据，应优先清理或一次性转换开发数据，不要因此污染正式迁移链路；只有该格式已经被其他用户或环境实际使用时，才考虑保留兼容处理。
- 每次准备提交配置结构变更前，必须进行一次版本审计：对比发布基线与当前差异，确认只增加一个必要版本，并删除中间版本号、临时迁移分支及对应测试。
- 配置版本调整必须与最终结构、导入迁移、导出结果和正向测试放在同一变更中，测试应验证当前版本号和实际支持的迁移路径。
- 配置文件版本与扩展自身版本是两个独立概念，不得因扩展功能迭代或界面调整自动增加配置文件版本；只有持久化配置结构发生不兼容变化时才评估是否升级。

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
