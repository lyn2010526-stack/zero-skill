# ZeroApex v2.5.9 Changelog

## 新功能

### F8: OutputValidator (§21g2)
Guardrails AI 风格的结构化输出校验器。支持 type/range/enum/pattern/array 元素校验，可选自动类型强转（coerce）。
内置3个 schema：preflight_result、file_guard_result、evidence_result。
新增工具：validate_output，支持 coerce 参数触发自动类型强转。

### F9: EvidenceCollector (§21g3)
LangSmith Tracing 风格的跨步骤证据聚合器。多步任务中累积各工具调用输出，consolidate() 生成完整证据链，bestGrade() 返回最高 L 级，allSucceeded() 快速判断整链成功。
新增工具：evidence_collect，actions: create / add / consolidate / snapshot。

## Bug 修复

### Bug#2: tombstone 测试异步 Promise 未正确 await
runTombstoneTests() 改为 async，确保异步断言失败能被捕获。

### Bug#5: snapshot_cleanup 路径语义混淆
传入 path: "/tmp/test.txt" 时自动取父目录作为 base_path，避免 cleanup 目标 .trash 位置错误。

### Bug#7: FileGuard 路径提取正则不处理带引号路径
新增双引号和单引号路径模式匹配，正确处理 rm "/path/with spaces/file" 等命令。

### Bug#8: OutputFirewall 只检测代码块，纯文本大输出漏网
去除代码块后检测剩余纯文本：超过 150 行或 6000 字符触发 oversized_plain_output violation。

## 工程原则落地

### 原则1 根因修复：Reflexion _extractRule 加 root_cause + fallback_suggestion
规则格式：[rule text] [root_cause=xxx; fallback=yyy]，新增 repeat_call 模式。

### 原则2 Token 节约：SelfMonitor 加重复工具调用检测
assess() 新接受 recent_tools 参数，同一工具 >=2 次调用自动产生 blocker 和 repeat_warnings。

### 原则3 最小修改 scope 评估：preflightGate 返回 scope_warning
检测递归操作、通配符和广泛修改信号，给出缩小范围建议。

### 原则5 工具失败自动恢复：_extractRule 加 fallback_suggestion
每种失败模式附带具体 fallback 建议，注入 preflight 上下文。

### 原则6 验证闭环：ReasoningChain observation 加 verified 标志
自动检测 BUILD SUCCESSFUL/tests passed/exit code 0 等信号，meta.verified=true。

## 测试
新增 runV259UpgradeTests()，覆盖 OV/EC/SM/RC/RF/PF/FG/OF/SC 共 25 个断言。
全套测试通过：test_zero_apex.js ALL PASSED，test_skill_activation.js 108 passed。
