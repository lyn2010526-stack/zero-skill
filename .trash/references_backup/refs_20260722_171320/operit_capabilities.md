# Operit Capabilities Reference — 权限与工具失败处理

> 当工具调用失败、或任务涉及需要高权限的操作时加载本文件。

## 适用场景

- 工具返回 `permission_denied` / `error` / `not_available`
- 即将规划需要 Shizuku / root / 特殊权限的操作
- 设备能力未知，需要先探测

## 权限分级

Operit 设备的能力按以下分级递进，高权限层依赖低权限层：

| 级别 | 标识 | 能力范围 |
|------|------|----------|
| L0 | `none` | 仅纯文本应答，无文件/网络/工具访问 |
| L1 | `basic` | `Files.read` / `Files.write`（沙箱目录内） |
| L2 | `network` | L1 + `Network.httpGet` 等网络访问 |
| L3 | `shell` | L2 + 执行 shell 命令（非 root） |
| L4 | `shizuku` | L3 + Shizuku 提权（`android.shizuku_available === true`） |
| L5 | `root` | L4 + root 权限 |

## 能力探测流程

在规划任务前，应先确认当前设备能力：

1. 检查 `Tools.Memory` 是否可用 → 决定记忆层是否启用
2. 检查 `Files` 是否可用 → 决定文件操作层是否启用
3. 检查 `Network` 是否可用 → 决定开源搜索层是否启用
4. 检查 `android.permission_level` / `android.shizuku_available` → 决定 shell 操作规划

## 工具失败降级流程

当任一工具调用返回错误时，按以下流程处理：

```
工具返回 error/permission_denied
 │
 ├─ 1. 识别错误类型
 │   ├─ permission_denied → 权限不足，降级到建议模式
 │   ├─ not_available → 能力缺失，跳过该步骤
 │   ├─ timeout / network → 临时失败，按 RetryPolicy 重试
 │   └─ internal_error → 引擎异常，报告用户
 │
 ├─ 2. 降级策略
 │   ├─ Files 不可用 → 只做分析建议，不规划文件改动
 │   ├─ Network 不可用 → 跳过 search_opensource，改用记忆召回或声明 GUESSED
 │   ├─ Tools.Memory 不可用 → 跳过 remember/recall，任务经验不持久化
 │   └─ shell 不可用 → 只规划文件级改动，不规划命令执行
 │
 └─ 3. 通知用户
     - 明确说明哪些能力不可用
     - 说明降级后的方案限制
     - 由用户决定是否继续
```

## 行为约束

- **低权限设备（L0-L2）**：只做分析与建议，**禁止**规划需要 shell/root 的操作
- **无 Shizuku/root**：规划文件操作时**禁止**涉及系统目录（`/system` `/vendor` 等）
- **Network 不可用**：`search_opensource` 会返回 `DEPENDENCY_MISSING`，此时**禁止**编造搜索结果
- **工具调用失败**：先按降级流程处理，再决定是否报告用户；**禁止**忽略错误继续执行
- **能力未知**：先探测（尝试调用并捕获错误），再规划；**禁止**假设能力可用

## 与引擎的对接

引擎层各模块在依赖缺失时返回的结构化错误码：

| 错误码 | 含义 | 对应降级 |
|--------|------|----------|
| `E5002_DEPENDENCY_MISSING` | Files/Network/Tools 不可用 | 跳过该层，降级到建议模式 |
| `E3001_NETWORK_ERROR` | 网络请求失败 | 重试 3 次后改用记忆或 GUESSED |
| `E3002_RATE_LIMITED` | API 限流 | 退避后重试或降级 |
| `E2001_FILE_NOT_FOUND` | 文件不存在 | 检查路径或跳过 |
| `E4004_PATH_TRAVERSAL` | 路径含 `..` | 拒绝执行，要求绝对路径 |

## "纯提示词版" vs "ToolPkg 版"边界

本 skill 有两种运行形态：

### 纯提示词版（无 engine）
- 仅加载 `零.skill` + `references/*.md`
- 守护层规则作为**软约束**指导模型行为
- **无**可执行工具，无法做真实文件检查、API 调用、记忆持久化
- 适用于：只读分析、方案设计、代码审查建议

### ToolPkg 版（有 engine）
- 通过 `operit_editor:debug_install_js_package` 安装 `engine/zero_apex.js`
- 守护层为**可执行代码**，返回结构化结果
- 支持真实文件检查、GitHub API、Operit 记忆库、`.trash` 备份
- 适用于：实际编译/安装/测试/交付流程

**重要**：纯提示词版**不能**宣称"已验证""已编译"等，因为缺少 `evidence_check` 工具的真实检查能力。模型在纯提示词版下应主动声明"当前为提示词模式，无法执行真实验证"。