# Sandbox Reference — 沙箱配置

> 借鉴 Grok grok-build sandbox profiles，按 profile 限制可写路径与可执行命令。
> 当 path_write / command_exec 触发时加载本文件。

## 设计目标

将"哪些路径可写、哪些命令可执行"从代码逻辑下沉到可配置清单，让同一份 engine 在不同信任环境下用不同严格度运行。engine 内置 `SandboxProfile`，manifest.json 的 `sandbox` 字段声明 profile。

## 三个内置 profile

| profile | 描述 | writable_paths | executable_commands | deny_paths |
|---------|------|----------------|---------------------|------------|
| `workspace`（默认） | 仅 `.zero_apex/` 可写，其他路径需显式 allow | `.zero_apex/**` `.trash/**` | `*`（通配） | `/proc/**` `/sys/**` `/dev/**` `/etc/shadow` `/etc/passwd` |
| `read-only` | 默认禁止一切写，只允许只读命令集 | 空 | ls/cat/git status 等只读命令 | `**` |
| `strict` | 最严格：只允许 ls/cat/pwd，写全禁，读限 `.zero_apex/` | 空 | `ls` `cat` `pwd` | `**` |

## 校验流程

`SandboxProfile.check(params)` 按以下顺序校验：

1. 取 profile 配置（默认 `workspace`）
2. 若是路径写操作：先检查 `deny_paths` 是否命中，命中即 DENY；再检查是否在 `writable_paths`，不在即 DENY
3. 若是命令执行：`executable_commands` 为 `*` 则放行；否则按 ShellGuard 分段解析，每段必须在白名单
4. 返回 `{ allowed, verdict, reason, matched_pattern? }`

## glob 匹配规则

- `*` 不跨 `/`（匹配单层）
- `**` 跨任意层级（含子目录）
- `/proc/**` 匹配 `/proc/self/environ`
- `.zero_apex/**` 匹配 `.zero_apex/sub/deep/file.json`
- `**` 单独使用匹配任意路径

## read-only profile 的命令识别

read-only profile 的 `executable_commands` 为空数组时，fallback 到 `ShellGuard.analyze()`：

- 所有分段都是只读命令 → ALLOW
- 任一分段非只读 → DENY

只读命令清单见 `references/permissions.md` 的"只读命令白名单"章节。

## 切换 profile

通过 manifest 修改 `sandbox.default_profile`，或调用时传 `params.profile`：

```js
await check_sandbox({
  profile: "strict",
  path: "/etc/hosts",
  action: "write",
});
// => { allowed: false, verdict: "DENY", reason: "denied by pattern: **" }
```

## 默认 profile 选择建议

| 场景 | 推荐 profile |
|------|-------------|
| 日常开发、本工具包默认 | `workspace` |
| CI/无交互、审计场景 | `read-only` |
| 不信任代码、最小权限 | `strict` |

## 注意事项

- Sandbox 校验在 `wrapToolExecution` 链路中，位于 PreToolUse hook + PermissionRules 之后、`func` 执行之前
- 命令分段解析借用 `ShellGuard`，自动剥除 timeout/nice/env 等 wrapper 和环境变量前缀
- 无 host 级隔离（不像 Grok 的 Landlock/Seatbelt），仅是"engine 层的路径/命令白名单"
- 真正的 OS 级隔离需由 Operit 沙箱本身提供
