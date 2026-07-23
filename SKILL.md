---
name: zero_apex
version: "3.0.0"
description: |
  Engineering task guardian engine — Lean Edition.
  Command safety parsing + file protection + execution audit.
  No fake AI safety, no self-scoring theatre.
compatibility: Operit AI / QuickJS Sandbox
type: skill
engine: zero_apex
entrypoint: engine/zero_apex.js
references:
  - references/file_guard.md
  - references/snapshot.md
triggers:
  - task_type: [engineering, debugging, refactoring, build, deploy, code_review]
  - keywords: [compile, build, fix, refactor, deploy, install, test, deliver, code_review, 编译, 构建, 修复, 重构, 部署, 安装, 测试, 交付, 代码审查]
  - command_risk: destructive
deactivates_on:
  - task_type: [chat, greeting, weather, sentiment, quick_qa, browse_only]
  - signal: user_explicit_simple_answer
  - signal: no_code_or_command_involved
metadata:
  author: lyn2010526-stack
  display_name: 零 · Zero Apex
  license: Apache-2.0
  language: zh-CN
  min_operit_version: ">=1.0"
  requires_tools: [Files]
  optional_tools: [Files.listFiles, Files.exists]
  package: zero_apex
---

# 零 · Zero Apex — Lean Edition

> 只做三件事：命令安全解析 + 文件保护 + 执行审计。
> 不假装能防 AI 闯祸，不造轮子，不打分。

## Identity

When activated, you are the **Software Engineer** delivering results.
This engine protects your file operations and audits command execution.
It does NOT score your confidence, filter your output, or pretend to detect hallucinations.

## What It Does

| Capability | What happens | Real? |
|------------|-------------|-------|
| Command parsing | Splits `cmd1 && cmd2 \| cmd3` into segments, checks each against blocklist | Yes |
| Obfuscation decode | Decodes `\x72\x6d`, `\u0072`, octal escapes (up to 3 layers) | Yes |
| File backup | Before delete/write, backs up to `.trash` with tombstone | Yes |
| File restore | Restores from `.trash` using tombstone metadata | Yes |
| Path traversal | Blocks `../../etc/passwd` patterns | Yes |
| Audit log | Records every tool call with timestamp and result | Yes |

## What It Does NOT Do

- Does NOT detect hallucinations (keyword matching is not semantic understanding)
- Does NOT score your confidence (self-scoring is meaningless)
- Does NOT filter your output (false positives hurt more than help)
- Does NOT prevent AI from ignoring suggestions (no enforcement power)

## Activation Triggers

| Scenario | Signal | Load reference |
|----------|--------|----------------|
| About to run destructive command | `command_risk: destructive` | `references/file_guard.md` |
| About to delete or overwrite file | keyword "delete/overwrite" | `references/snapshot.md` |
| Command contains escape sequences | hex/unicode/octal patterns | `references/file_guard.md` |

## Tools (6)

`file_guard` · `shell_guard` · `normalize_command` · `snapshot_backup` · `snapshot_restore` · `audit_log`

## Workflow

```
requirement → file_guard(command) → [BLOCK/ASK/ALLOW] → execute → audit_log
                                    ↓
                              snapshot_backup(path) → delete/write → audit_log
```

## Install into Operit

### Method 1: Package manager
```
https://github.com/lyn2010526-stack/zero-skill/releases/latest/download/zero_apex-3.0.0.zip
```

### Method 2: Direct install
Use Operit's developer command with `engine/zero_apex.js` + `manifest.json`.

## License

Apache 2.0
