---
name: release
description: 自动化处理项目版本发布流程，包括收集版本号、提取变更日志、智能分类、生成 Release Notes 并创建 Git 标签
license: MIT
compatibility: opencode
---

## What I do

自动化处理项目版本发布流程：

1. **确认版本号** - 向用户请求版本号并验证格式
2. **获取变更记录** - 提取自上次标签以来的所有 Git 提交
3. **智能分类** - 将变更归类为：特性、问题修复、其他
4. **翻译总结** - 将英文 commit message 转化为中文描述
5. **生成 Release Notes** - 在 release/ 目录创建版本日志文件
6. **更新版本号** - 更新 manifest 和 popup.html 中的版本号
7. **提交代码** - **必须经用户确认后才能提交本地变更**
8. **创建标签** - **必须经用户确认后才能创建 Git 标签**

## Critical Rules (必须严格遵守)

### 绝对禁止自动操作
- **禁止在未获得用户明确确认前执行任何 git commit 命令**
- **禁止在未获得用户明确确认前执行任何 git tag 命令**
- **禁止在未展示完整操作信息前执行任何 git 操作**
- 违反以上规则将导致代码和标签被错误操作，这是一个严重的安全问题

### 用户确认流程 (必须严格执行)
1. 展示完整的操作信息
2. 明确列出所有将被修改的文件
3. 明确询问用户是否确认执行
4. **必须等待用户明确回复**（回复必须是 "yes"、"y"、"confirm" 等明确表示同意的词汇）
5. 只有在用户明确确认后才能执行 git commit 和 git tag 命令
6. 如果用户未回复、回复不明确、或回复 "no"，必须取消操作

### 错误处理
- 如果用户回复不明确（如 "ok"、"sure"、"I think so" 等），必须再次询问直到获得明确回复
- 如果用户拒绝或未确认，回复用户说明操作已取消，并不执行任何 git 操作

## When to use me

当用户要求执行发布操作时使用此技能。会自动分析变更内容并生成规范的 Release Notes。

## 操作流程

### 阶段一：初始化与信息收集

1. 询问用户版本号（格式示例：1.0.0，无需 v 前缀）
2. 验证版本号格式是否为三段式数字

### 阶段二：获取与分析变更

1. 执行 `git describe --tags --abbrev=0` 获取上一个标签
2. 根据是否有标签确定对比范围：
   - 如果有标签：对比范围为 `LAST_TAG..HEAD`
   - 如果无标签：对比范围为所有提交
3. 执行 `git log --pretty=format:"%h|%s|%an" --no-merges <对比范围>` 提取提交信息

### 阶段三：智能分类

根据前缀和语义将变更归类：

- **特性 (Features)**
  - 前缀：`Feat:`
  - 语义：新增功能、添加文件、主要逻辑变更

- **问题修复 (Bug Fixes)**
  - 前缀：`Fix:`
  - 语义：修复错误、解决崩溃

- **其他变更 (Other Changes)**
  - 前缀：`Chore:`、`Refactor:`、`Docs:`、`Style:`、`Test:` 等
  - 语义：文档更新、格式调整、依赖升级、重构、测试、代码优化

### 阶段四：生成 Release Notes

1. 语义分析每条提交，将技术性描述转化为用户友好的中文
2. 合并重复或相似的变更点
3. 按分类整理为 Markdown 格式
4. 确保 `release/` 目录存在
5. 写入 `release/{VERSION}.md` 文件

**Release Notes 文件格式示例：**

```markdown
# 1.0.0 Release Notes

## ✨ 特性
- 新增功能A
- 新增功能B

## 🐛 问题修复
- 修复了XX问题

## 📋 其他
- 更新文档
- 优化代码结构
```

**如果某项没有匹配的变动，需要设置一个为空的列表：**

```markdown
# 1.3.0 Release Notes

## ✨ 特性
- 无

## 🐛 问题修复
- 无

## 📋 其他
- 更新扩展名称以包含英文标题
```

### 阶段五：提交代码（必须确认）

**警告：此阶段是强制性的，任何跳过此阶段直接提交的行为都是严重错误。**

1. 展示将被提交的文件列表
2. 征求用户明确确认
3. **必须等待用户明确回复**（如 "yes"、"y"、"confirm" 等）
4. 如果用户明确同意提交，执行 `git add . && git commit -m "Release {VERSION}"`
5. 如果用户拒绝或未明确确认，**禁止提交**，并告知用户提交已取消

**确认提示格式：**

```
=== Commit Confirmation Required ===

This operation will commit the following files:
- [File 1]
- [File 2]
- [File 3]

Commit message: Release {VERSION}

Do you confirm this commit? Please reply with "yes" to confirm or "no" to cancel.
```

### 阶段六：Git 标记（必须确认）

**警告：此阶段是强制性的，任何跳过此阶段直接打 tag 的行为都是严重错误。**

1. 展示将执行的操作
2. 征求用户明确确认
3. **必须等待用户明确回复**（如 "yes"、"y"、"confirm" 等）
4. 如果用户明确确认，执行 `git tag {VERSION}` 创建标签
5. 如果用户拒绝或未明确确认，**禁止打标签**，并告知用户操作已取消

**确认提示格式：**

```
=== Tag Confirmation Required ===

This operation will create a git tag: v{VERSION}

Do you confirm this tag creation? Please reply with "yes" to confirm or "no" to cancel.
```

## 注意事项

### 安全规则（必须严格遵守）
- **【强制】发版前必须先从用户处确认版本号**
- **【强制】执行 git commit 前必须获得用户明确确认**
- **【强制】执行 git tag 前必须获得用户明确确认**
- **【强制】必须展示完整的操作信息和将被修改的文件列表**
- **【绝对禁止】在用户未明确确认前执行任何 git commit 命令**
- **【绝对禁止】在用户未明确确认前执行任何 git tag 命令**
- 版本号不使用 v 前缀
- Commit message 必须翻译为中文描述
- 所有变更内容必须为中文
- 不要直接使用原始 commit message，需进行语义总结
- 每次发版必须更新 `src/manifest_chrome.json`、`src/manifest_firefox.json` 和 `src/popup.html` 中的版本号
- 如果某项没有匹配的变动，在 Release Notes 中设置一个为空的列表（如：`- 无`）

### 错误处理
- 如果用户回复不明确，必须反复询问直到获得明确回复
- 如果用户长时间未回复，可以提醒用户需要明确回复才能继续
- 如果用户取消提交或打标签，不要尝试自动执行或再次询问，直接取消操作
