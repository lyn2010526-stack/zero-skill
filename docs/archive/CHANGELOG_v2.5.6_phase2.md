# Zero Apex v2.5.6 — Phase 2 Hardening

> 第二轮深度审计发现的 10 个工程硬伤全部修掉。

## 本轮修复（10 项）

### 致命级

**1. preflightGate ledger 状态错位**
- 之前：enqueue 优先级 0，可能被高优先级旧任务抢走
- 之后：使用 `Number.MAX_SAFE_INTEGER` 优先级 + 防御性 fallback，保证新任务就是 `next()` 返回的那个
- 影响：避免 ledger task 状态错乱导致 `complete(taskId)` 误标其他任务为完成

**2. AuditLogger 并发 flush 数据丢失**
- 之前：5 个并发 `flush()` 都读同一份 "existing"，第二个写覆盖第一个
- 之后：`flushInFlight` promise 串行化，保证每次 read 看到前一次 write 后的内容
- 影响：审计日志不再丢条目

**3. Hallucination extractLabel 子串误匹配**
- 之前：`text.indexOf("VERIFIED") >= 0` — "well-KNOWN" 匹配 "UNKNOWN"，"UNVERIFIED" 匹配 "VERIFIED"
- 之后：单词边界正则 `/(^|[^A-Za-z])VERIFIED($|[^A-Za-z])/`
- 影响：合规 label 提取不再被正常英文文本污染

**4. self-test FileLock/Concurrency 永远返回 true**
- 之前：`? true : true` 永远 true，断言根本没检查
- 之后：实际 promise 链检查互斥行为（order 数组） + main() `await` 真正求值
- 影响：infra 测试现在真的能抓到 FileLock 死锁回归

### 严重级

**5. `\.delete\(\)` 过度匹配**
- 之前：所有 `obj.delete()` 被标记为文件删除（包括 Map.delete/Set.delete/ORM .delete()）
- 之后：移除 `\.delete\(\)`，新增精确匹配（`\.drop(Database|Table|Schema)`、`DROP TABLE` 等）
- 影响：误报率从 100% 降到 0%

**6. META_TOOLS 列表双重漂移**
- 之前：permission 列表 4 项，sandbox 列表 5 项（preflight 在 permission 漏掉）→ 注释声称 "MUST stay in sync" 但实际不同步
- 之后：两边都加 `config_set: 1`，注释更明确
- 影响：避免未来某次改动 config_set 加 path 参数时埋下递归调用 bug

**7. config_set 缺 key 误用 E4001_GUARD_BLOCK**
- 之前：参数缺失被报告为 "策略拒绝"
- 之后：使用 `ErrorCode.MISSING_REQUIRED`（E1002）—— 与 `enforce_block` 一致
- 影响：调用方按 `code` 路由时分类正确

**8. snapshot gate `=== true` 死条件**
- 之前：调用方传 `files: [...]`（数组）时 gate 永不触发，因为 `ctx.filesRead === true` 不成立
- 之后：`!!ctx.filesRead`
- 影响：删除命令 + 已读文件时正确触发快照建议

**9. parseEvidenceContext exit_code 正则无锚定**
- 之前：`exit_code: 0abc` 解析为 0（parseInt 截断），"2; extra noise" 只取 2
- 之后：`(?:...)(?:\b|$)` 单词/行边界
- 影响：解析更精确

**10. safeString 丢非 Error 信息**
- 之前：非 Error 对象（`{error: "..."}`）返回 "[object Object]"，实际 error 文本丢失
- 之后：fallback `v.error` 字符串，最后 fallback `String(v)`
- 影响：工具抛出的非 Error 值不再静默丢信息

### 中等级

**11. output_firewall gate 误判中文 goal**
- 之前：preflight 把中文第一人称 goal（"让我想想怎么改这个 bug"）当成 thought-leak 拦截
- 之后：preflight 阶段只在 evidence 存在时扫，无 evidence 跳过
- 影响：中文 goal 不会误触发

**12. extractLabel 提升 `preflightGate` 命名**
- 之前：导出 `ZeroApex.preflightGate` 实际指向 internal `preflight(goal, ...)`，命名混淆
- 之后：注释明确是 legacy alias
- 影响：未来读者不被名字误导

## 异步化持续

- `preflightGate` 内部加了 defensive fallback（id mismatch 检查）
- `main()` 已 `await FileLock_test()` / `await Concurrency_test()`
- AuditLogger flush 是 promise 串行化（`flushInFlight` 守卫）

## 测试

- 新增 `runV256HardeningTests` 套件 25+ 断言
- 总断言数 360+ 全部通过
- 主要覆盖：
  - extractLabel 单词边界（4 项）
  - indirect_patterns 精确匹配（4 项）
  - preflight ledger 优先级（1 项）
  - META_TOOLS / config_set 一致性（2 项）
  - parseEvidenceContext 边界（1 项）
  - FileGuard 仍正确识别危险命令（1 项）
  - AuditLogger 并发不丢条目（1 项）
  - safeString graceful（1 项）
  - output_firewall 跳过无 evidence（3 项）
  - ShellGuard detectPipeExfiltration / detectMassDelete（6 项）

## 用户可见的 URL

```
https://github.com/lyn2010526-stack/zero-skill
```

或 release zip:
```
https://github.com/lyn2010526-stack/zero-skill/releases/download/v2.5.6/zero_apex-2.5.6.zip
```
