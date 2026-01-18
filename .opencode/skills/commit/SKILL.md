---
name: commit
description: 规范化的代码提交工具，自动生成符合 Conventional Commits 格式的提交信息，并支持用户确认机制
license: MIT
compatibility: opencode
---

## What I do

自动化生成规范化的 Git 提交信息：

1. **获取变更文件** - 执行 `git status` 和 `git diff` 获取所有待提交的变更
2. **分析变更内容** - 分析暂存区和未追踪文件的变更详情
3. **智能分类** - 根据变更内容自动分类为：Feature、Fix、Chore
4. **生成提交信息** - 按规范格式生成英文 commit message
5. **执行提交** - **重要：必须明确等待用户的确认后才能执行提交**

## Critical Rules (必须严格遵守)

### 绝对禁止自动提交
- **禁止在未获得用户明确确认前执行任何 git commit 命令**
- **禁止在未展示完整提交信息前执行任何 git commit 命令**
- **禁止在未列出所有将被提交的文件前执行任何 git commit 命令**
- 违反以上规则将导致代码被错误提交，这是一个严重的安全问题

### 用户确认流程 (必须严格执行)
1. 展示完整的提交信息（包含 Prefix 和 Description）
2. 列出所有将被提交的文件（包括暂存区和未暂存的变更）
3. 明确询问用户是否确认提交
4. **必须等待用户明确回复**（回复必须是 "yes"、"y"、"confirm" 等明确表示同意的词汇）
5. 只有在用户明确确认后才能执行 `git commit` 命令
6. 如果用户未回复、回复不明确、或回复 "no"，必须取消提交操作

### 确认提示格式 (必须使用)

在询问用户确认时，必须使用以下格式：

```
=== Commit Confirmation Required ===

Commit Message:
[PREFIX]: [DESCRIPTION]

Changes Summary:
- [Change 1]
- [Change 2]
- [Change 3]

Files to be committed:
- [File 1]
- [File 2]
- [File 3]

Do you confirm this commit? Please reply with "yes" to confirm or "no" to cancel.
```

### 错误处理
- 如果用户回复不明确（如 "ok"、"sure"、"I think so" 等），必须再次询问直到获得明确回复
- 如果用户拒绝或未确认，回复用户说明提交已取消，并不执行任何 git 操作

## When to use me

当用户要求提交代码时使用此技能。会自动分析所有变更并生成规范的 commit message。

## 操作流程

### 阶段一：收集变更信息

1. 执行 `git status` 获取所有待提交的文件变更
2. 执行 `git diff --cached` 获取暂存区的详细变更
3. 执行 `git diff` 获取未暂存的变更
4. 分析每个文件的变更类型（新增、修改、删除）
5. 要求无论文件和目录是什么都统计到 git 变更中，即使是 .opencode 等隐藏目录也不要特殊咨询和处理，除非这些文件加入了 .gitignore 文件的忽略规则中

### 阶段二：智能分类

根据变更内容和文件类型自动分类：

- **Feature (Feat:)**
  - 新增功能文件
  - 主要功能实现
  - 新增模块或组件

- **Bug Fix (Fix:)**
  - 修复已知问题
  - 解决崩溃或错误
  - 修复逻辑缺陷

- **Chore (Chore:)**
  - 文档更新
  - 代码格式调整
  - 依赖更新
  - 重构和优化
  - 测试相关

- **Release (Release VERSION)**
  - 版本发布
  - 版本号更新

### 阶段三：生成提交信息

**Commit Message 格式规范：**

```
{PREFIX}: {Description}

- {Change detail 1}
- {Change detail 2}
- {Change detail 3}
```

**Prefix 规则：**
- `Feat:` - 新功能
- `Fix:` - 修复问题
- `Chore:` - 其他变更
- `Release {VERSION}` - 版本发布

**Description 规则：**
- 使用英文
- 除 Prefix 外，第一个单词的首字母大写
- 简洁明了，不超过 50 字符

**变更列表规则：**
- 使用 `- ` 开头
- 英文描述
- 每条变更一行

**格式示例：**

```markdown
Feat: Add user authentication module

- Implement login functionality
- Add session management
- Create user profile page

Fix: Resolve memory leak issue

- Fix connection pool not releasing properly
- Add proper resource cleanup
- Update error handling logic

Chore: Update project dependencies

- Upgrade React to version 18.2
- Update build configuration
- Fix linting errors in utils module

Release 1.0.0

- Prepare initial release
- Complete core functionality
- Add documentation
```

### 阶段四：用户确认（关键步骤，必须严格执行）

**警告：此阶段是强制性的，任何跳过此阶段直接提交的行为都是严重错误。**

1. 展示将执行的提交信息（包含所有变更详情）
2. 明确列出所有将被提交的文件
3. **必须使用以下格式明确询问用户确认：**
4. **必须等待用户明确回复**（如 "yes"、"y"、"confirm" 等）
5. 如果用户拒绝或未明确确认，不执行提交操作

**确认提示格式（必须使用）：**

```
=== Commit Confirmation Required ===

Commit Message:
[Prefix]: [Description]

Changes Summary:
- [Change 1]
- [Change 2]
- [Change 3]

Files to be committed:
- [File 1]
- [File 2]
- [File 3]

Do you confirm this commit? Please reply with "yes" to confirm or "no" to cancel.
```

**处理用户回复的规则：**
- **有效确认词：** "yes"、"y"、"confirm"、"yes."、"y."、"confirm."
- **拒绝词：** "no"、"n"、"cancel"、"nope"、"no."
- **不明确的回复：** 任何其他回复都被视为不明确，必须再次询问

**如果用户回复不明确：**
必须回复：
"您的回复不明确。请明确回复 'yes' 来确认提交，或 'no' 来取消提交。"

然后继续等待用户明确回复，直到获得明确的是或否回答。

**如果用户确认（回复 "yes" 或其他有效确认词）：**
- 执行 `git add . && git commit -m "{COMMIT_MESSAGE}"`
- 展示提交成功的消息

**如果用户拒绝（回复 "no" 或其他拒绝词）：**
- 不执行任何 git commit 操作
- 回复用户："提交已取消。如有需要，请重新要求提交。"

### 阶段五：执行提交

**重要：只有用户明确确认后，才执行提交操作。**

执行以下命令：
1. `git add .` - 添加所有变更到暂存区
2. `git commit -m "{COMMIT_MESSAGE}"` - 执行提交

**禁止在未获得用户明确确认前执行以上任何命令。**

如果用户未确认或拒绝，跳过此阶段。

## 注意事项

### 安全规则（必须严格遵守）
- **【强制】提交前必须展示完整的提交信息**
- **【强制】必须等待用户明确确认后才能执行提交**
- **【强制】必须列出所有将被提交的文件**
- **【绝对禁止】在用户未明确确认前执行任何 git commit 命令**
- **【绝对禁止】自动提交代码而不等待用户确认**
- 如果用户未明确确认，不要执行提交
- 如果用户拒绝，不要执行提交

### 格式规则
- 所有 commit message 必须使用英文
- Description 除 Prefix 外，首字母必须大写
- 变更列表使用 `- ` 格式
- 可以根据需要调整提交信息的措辞
- 优先使用更具体的描述而非泛泛之词
- **必须获取并总结所有 git 差异，包括未追踪文件**

### 错误处理
- 如果用户回复不明确，必须反复询问直到获得明确回复
- 如果用户长时间未回复，可以提醒用户需要明确回复才能继续
- 如果用户取消，不要尝试自动提交或再次询问，直接取消操作

## 常见场景

### 场景一：提交新功能

1. 用户要求提交新功能代码
2. 展示变更的文件和内容
3. 生成 `Feat:` 开头的提交信息
4. **使用标准格式询问用户确认**
5. **等待用户明确回复 "yes"**
6. 确认后执行提交
7. 如果用户未确认或拒绝，取消提交

### 场景二：提交修复

1. 用户要求提交问题修复
2. 展示变更的文件和内容
3. 生成 `Fix:` 开头的提交信息
4. **使用标准格式询问用户确认**
5. **等待用户明确回复 "yes"**
6. 确认后执行提交
7. 如果用户未确认或拒绝，取消提交

### 场景三：提交版本发布

1. 用户要求发布新版本
2. 收集所有待提交的变更
3. 生成 `Release {VERSION}` 开头的提交信息
4. **使用标准格式询问用户确认**
5. **等待用户明确回复 "yes"**
6. 确认后执行提交
7. 如果用户未确认或拒绝，取消提交
