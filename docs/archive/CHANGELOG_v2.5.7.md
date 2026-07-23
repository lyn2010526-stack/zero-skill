# ZeroApex v2.5.7 Changelog — 第四轮审计修复

## 发布日期
2026-07-23

## 修复项

### E1 — 错误码语义修正
- 新增 `E4004_TOOL_CURTAILED`，专用于 manifest/env curtailment 拦截
- curtailment 路径不再误用 `E5002_DEPENDENCY_MISSING`
- ErrorCodeMessages 加入对应中文描述

### I2 — Memory.create 返回格式兼容
- `Tools.Memory.create` 可能返回 string ID 或 `{id, success}` 对象
- 统一归一化：`typeof raw === "string" ? raw : raw.id`
- 避免 `!!id` 在对象值时始终为 true 的假阳性

### S1 — TaskLedger 状态转换校验
- 新增 `TRANSITIONS` 状态机映射和 `canTransition()` 校验
- `complete()` 在 pending 或已 done 状态时返回 `false` 而非静默成功
- 防止跨状态跳转和重复 complete

### SE1 — OutputFirewall tool_leak 精细化
- `/api_key/i` 改为 `/api_key\s*[:=]/i`，排除 `api_key_description` 等无害字段名
- `/token\s*=/i` 改为 `/token\s*[:=]\s*['"\\w]/i`，要求后跟值上下文

### SE2 — /sdcard/ 操作级风险判断
- `risky_paths` 中 sdcard/storage 条目加 `writeOnly: true` 标志
- `analyzeCommand()` 引入 `isWriteCmd` 检测（cp/mv/scp/rsync/tee/dd 等）
- `pathRisk(path, operation)` 新增可选 `operation` 参数（"read"/"write"/"delete"）
- 读操作（ls/cat）不再触发 sdcard 高风险警告

### C1 — ConfigRegistry immutable key 机制
- 新增 `lock()` 和 `isLocked()` 方法
- bootstrap 完成后自动调用 `ConfigRegistry.lock()`
- 七个安全关键 key 被锁定，runtime `config_set` 无法覆盖
- 尝试覆盖时抛出 `"immutable after lock"` 异常

## 测试
- `test_zero_apex.js`：新增 Phase 3 测试组（E1/SE1/SE2/S1/C1/I2），17 个新断言
- `test_skill_activation.js`：更新 sdcard read 断言以匹配新语义
- 两套测试全部通过（test_zero_apex: ALL TESTS PASSED，skill_activation: 108 passed）
