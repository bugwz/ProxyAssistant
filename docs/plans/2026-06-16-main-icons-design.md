# Main Page SVG Icons Redesign

## Goal

将 `main` 设置页面内部所有功能图标统一为重新绘制的 SVG，并确保图标语义更准确、风格一致、静态与动态图标实现一致。

## Scope

本次只覆盖 `main` 页面内部图标：

- `src/main.html` 中的按钮、弹窗、状态、提示、下拉、空状态、操作图标
- `src/js/proxy.js` 动态渲染出的代理卡片图标
- `src/js/main.js` 中运行时切换的 PAC 复制反馈图标

明确不在本次范围内：

- 顶部品牌 logo
- 页面 favicon
- 扩展安装图标与 manifest 中的 PNG 图标
- `popup.html` 与 popup 相关脚本中的图标

## Current State

`main` 页面当前图标存在这些问题：

- 已经是 SVG，但风格来源混杂，有填充、有描边、有 Font Awesome 风格路径，笔画重量不统一
- 一部分交互依赖 `iconfont`/CSS 伪三角占位，而不是明确的 SVG
- 静态 HTML 和 JS 动态插入图标不属于同一体系
- 某些图标语义偏弱，例如通用圆形播放、复制/外链/折叠等图标与页面语义没有统一规则

## Design Direction

采用统一线性风格。

视觉规则：

- 统一 `viewBox="0 0 24 24"`
- 以描边图标为主，默认 `fill="none"`，通过 `stroke="currentColor"` 着色
- 统一圆角端点与圆角连接：`stroke-linecap="round"`、`stroke-linejoin="round"`
- 默认描边粗细统一为 `2`
- 小尺寸图标继续通过现有宽高控制，不为单个图标引入独立视觉比例

这样可以保证按钮区、表单区、弹窗区在密集界面里更轻，也更容易和现有样式融合。

## Icon System

新增一个 `main` 页专用图标定义模块，集中保存 SVG 字符串，供静态页面内联复用与 JS 动态注入复用。

图标系统职责：

- 提供统一 SVG 模板和通用属性
- 为每个语义位点提供稳定名称
- 避免在 `main.html`、`main.js`、`proxy.js` 中散落手写路径

命名原则：

- 按语义命名，而不是按外形命名
- 示例：`scenarioSwitch`、`scenarioManage`、`add`、`test`、`expand`、`collapse`、`syncConfig`、`syncPush`、`syncPull`、`import`、`export`、`close`、`info`、`refresh`、`copy`、`check`

## Semantic Mapping

### Header And Main Actions

- 场景切换：使用分层/堆叠语义图标，表达“场景集合切换”
- 场景管理：使用带铅笔的卡片/面板图标，表达“编辑管理”
- 新增：使用加号
- 测试全部：使用脉冲/雷达/活动检测语义，不再用通用播放图标
- 展开全部：使用向外展开/展开面板语义
- 收起全部：使用向内收拢/折叠面板语义

### System Config Actions

- 云同步配置：使用云加齿轮或云设置语义
- 推送：使用云上传语义
- 拉取：使用云下载语义
- 导出：使用文件/托盘向上导出语义
- 导入：使用文件/托盘向下导入语义
- 代理检测：使用盾牌检查或网络检测语义
- 查看 PAC：使用文档代码/脚本语义
- 版本检测：使用信息或更新检查语义

### Modal And Utility Icons

- 所有关弹窗关闭按钮：统一使用线性 `x`
- 外链：统一使用右上跳转语义
- 信息提示：统一使用圆形 `i`
- 刷新/重新获取：统一使用循环箭头
- 空状态：使用线性文件夹/文档空态图标
- PAC 折叠开关：统一使用 chevron down/up
- 复制：使用双文档
- 复制成功：使用勾选

### Proxy Card Icons

- 拖拽排序：使用 2 列点阵拖拽手柄
- 下拉选择器箭头：统一改为 SVG chevron
- 密码显隐：重绘为线性 eye / eye-off
- 规则区提示：统一使用圆形 info

## Implementation Strategy

1. 在 `src/js` 中新增共享图标模块，例如 `src/js/icons.js`
2. 在该模块中定义主图标集合和返回 SVG 字符串的方法
3. `main.html` 将静态图标替换为该集合的直接内联结果，或至少替换为同一套路径
4. `proxy.js` 与 `main.js` 中的动态 HTML 拼接改为从图标模块取值
5. `main` 页内的 `.iconfont` 下拉箭头占位改为明确 SVG 标记
6. 保持现有 DOM 结构、类名和交互绑定尽量稳定，避免影响现有逻辑

## Styling Constraints

- 不大改 `main.css` 布局
- 可以新增少量通用图标类，例如尺寸对齐、旋转状态、可见性切换
- 图标颜色继续跟随 `currentColor`，以适配现有主题切换
- 需要保留 `spin`、`expanded` 之类已有交互类的兼容性

## Risks And Mitigations

- 风险：替换 `.iconfont` 可能影响下拉按钮对齐
  - 处理：只替换图标节点，不改选择器主要布局结构
- 风险：动态图标字符串改造后容易遗漏某些运行时入口
  - 处理：逐文件搜索 `svg`、`iconfont`、`copyIcon`、`checkIcon`、`eye`、`toggle` 等入口并统一替换
- 风险：测试不覆盖视觉回归
  - 处理：以代码审计加针对性搜索验证“main 页面范围内旧图标残留”

## Verification

完成后必须验证：

- `src/main.html` 中 main 页面范围的功能图标全部为新的统一线性 SVG
- `src/js/proxy.js` 和 `src/js/main.js` 中动态插入图标全部切换到同一体系
- main 页面范围内不再保留 `iconfont` 作为功能图标占位
- 不修改 logo、favicon、popup、manifest 图标
- 运行与 main 页相关的现有单元测试，至少确认没有引入脚本错误
- 使用文本搜索确认 main 页面范围内旧的眼睛、复制、测试、展开、云同步等旧路径未残留

## Success Criteria

- 用户打开 `main` 页时，看到的全部内部功能图标都为统一风格的 SVG
- 图标含义和操作语义对应更准确
- 页面交互不变
- 范围控制准确，没有误改品牌与扩展安装图标
