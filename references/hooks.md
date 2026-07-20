# Hooks Reference — 生命周期钩子

> 借鉴 Grok grok-build hooks 设计，在工具执行前后/会话启停时运行可配置钩子。
> 当 PreToolUse/PostToolUse/Stop/SessionStart 触发时加载本文件。

## 设计目标

将"工具执行前后/会话生命周期"的关键节点暴露为可配置钩子，让外部规则（危险命令拦截、审计、守护条件）能在不允许直接改 engine 的前提下介入。engine 内置 `HookRegistry` 负责调度，manifest.json 的 `hooks` 字段声明钩子清单。

## 四个生命周期阶段

| 阶段 | 触发点 | 典型用途 |
|------|--------|---------|
| `PreToolUse` | `wrapToolExecution` 调用 `func` 之前 | 危险命令拦截、权限预检、参数审计 |
| `PostToolUse` | `func` 返回结果之后、写审计日志之前 | 结果改写、二次审计、触发后续动作 |
| `Stop` | 任务即将结束、`stop_hooks.conditions` 检查时 | 守护条件：未满足则禁止 agent 提前结束 |
| `SessionStart` | 会话启动 | 加载上下文、注册动态规则、检查环境 |

## 钩子返回值

每个钩子 handler 返回 `{ decision, reason?, mutated_result? }`：

- `decision: "allow"` — 放行（仅 PreToolUse 有意义；继续后续 hook）
- `decision: "deny"` — 硬阻断（PreToolUse 会拒绝工具调用；Stop 会阻止任务结束）
- `decision: "continue"` — 继续评估后续 hook（默认）
- `mutated_result` — PostToolUse 钩子可改写工具返回值

## fail_open 策略

默认 `fail_open: true`：钩子 handler 抛异常或超时，按 `continue` 处理，不阻断主流程，异常被记录在 `decisions[].error`。

如需安全边界，将 manifest 的 `hooks.fail_open` 设为 `false`：handler 崩溃即整个阶段返回 `deny`。

## 内置钩子

manifest.json 的 `hooks.registry` 声明了四个内置钩子：

1. **`dangerous_cmd_guard`** (PreToolUse) — 调用 `ShellGuard.analyze()`，命中危险命令清单（rm/chmod/kill 等）时返回 `deny`。
2. **`audit_after`** (PostToolUse) — 将工具执行结果追加到 `audit_log.jsonl`。
3. **`stop_guard`** (Stop) — 调用 `checkStopConditions()`，未满足守护条件时返回 `deny` + `mutated_result`。
4. **`session_init`** (SessionStart) — 占位钩子，预留给会话初始化。

## 自定义钩子

运行时通过 `inst.hooks.register(phase, hook)` 注册：

```js
inst.hooks.register("PreToolUse", {
  id: "my_custom_hook",
  matcher: "file_guard",  // 或 "*" 匹配所有工具
  description: "自定义拦截",
  handler: function (ctx) {
    if (ctx.params.command.indexOf("rm") >= 0) {
      return { decision: "deny", reason: "禁止 rm" };
    }
    return { decision: "continue" };
  },
});
```

## matcher 匹配规则

- `"*"` 匹配所有工具
- 精确工具名（如 `"file_guard"`）匹配该工具
- 大小写不敏感

## 调用顺序

同一阶段的多个钩子按数组顺序执行。任一钩子返回 `deny` 即终止后续钩子，整阶段返回 `deny`。`mutated_result` 会被传递到最终结果。

## 手动触发

通过 `run_hook` 工具手动触发某阶段：

```js
await run_hook({
  phase: "PreToolUse",
  tool: "file_guard",
  tool_params: { command: "rm -rf /tmp" },
  task_id: "task-123",
});
// => { decision: "deny", reason: "危险命令被 Hook 拦截: rm" }
```

## 守护条件（Stop hook）

manifest.json 的 `stop_hooks.conditions` 声明任务结束前必须满足的条件：

| 条件 ID | 含义 |
|---------|------|
| `all_tools_completed` | `ledger.pendingCount() === 0`，所有入队任务完成或取消 |
| `no_active_block` | `enforcer.snapshot().length === 0`，无未过期的 preflight BLOCK |
| `audit_flushed` | `audit.snapshot().length === 0`，审计缓冲已 flush |

任一条件未满足，Stop hook 返回 `deny` + `mutated_result`，agent 不能提前结束。

## 注意事项

- 钩子 handler 必须是同步函数（QuickJS 沙箱约束）
- handler 内不要调用会触发同阶段钩子的工具，避免递归
- 钩子超时（默认 5ms）按 `fail_open` 策略处理
- 关闭钩子：将 manifest 的 `hooks.enabled` 设为 `false`
