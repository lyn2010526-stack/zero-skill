# Preflight Reference — 综合门禁

> 执行前一次性串联多个守护层，返回综合决策。

## 适用场景

- 即将执行某个复杂任务（涉及命令 + 文件 + 断言）
- 需要一次性评估就绪度、命令风险、断言合规

## 不适用场景

- 纯只读查询（无命令、无文件改动、无完成声明）
- 闲聊

## 工具调用

```
preflight({
  goal: "修复登录崩溃并重新编译",        // 必填
  command: "rm -rf build/ && gradle build", // 可选
  evidence: "上次 logcat: NullPointerException", // 可选
  files_read: true                          // 可选
})
```

## 串联的守护层

```
preflight
 ├── SelfMonitor.assess(goal, files_read, evidence_ready)
 ├── FileGuard.analyzeCommand(command)   [如有 command]
 └── Hallucination.check(goal, evidence)
```

注意：preflight **不**调用 `evidence_check`（证据验证在宣称完成时才触发）。

## 状态机

```
WAIT_CONFIRMATION  ← FileGuard.requires_confirmation
NEED_EVIDENCE      ← Hallucination.fact_without_evidence 触发
NOT_READY          ← SelfMonitor.blockers 非空
READY              ← 以上都不满足
```

`allowed === true` 当且仅当 `state === READY`。

## 返回结构

```json
{
  "allowed": false,
  "state": "WAIT_CONFIRMATION",
  "requires_confirmation": true,
  "confidence": "INFERRED",
  "readiness_score": 60,
  "gates_triggered": ["self_awareness", "file_guard", "hallucination"],
  "reasons": ["偏差[过度自信]: ...", "删除操作: rm ..."],
  "self_awareness": { ... },
  "hallucination": { ... },
  "status_card": "[自我意识] 就绪度 60/100 ...",
  "task_id": "T3_20240101_120000"
}
```

`task_id` 由内置 `TaskLedger` 分配，用于任务追踪和优先级排队。

## 行为约束

- `allowed === false` 时，**禁止**开始执行，必须先解决 `reasons` 中列出的问题
- `state === WAIT_CONFIRMATION` 时，必须向用户确认后再执行
- `state === NEED_EVIDENCE` 时，必须补充工具执行证据
- `state === NOT_READY` 时，必须先解决 `self_awareness.blockers`（如读取相关文件）
- `reasons` 数组去重后展示给用户

## 任务队列

每次 preflight 调用会在 `TaskLedger` 中入队一个任务，按优先级排序。任务状态：
- `pending`：未开始
- `running`：已开始（被 preflight 取出）
- `done`：已完成（preflight 返回后标记）

这用于跨任务优先级管理和断点续跑。