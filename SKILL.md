---
name: zero_apex
version: "2.5.5"
description: |
  Engineering task guardian engine. Anti-delete / anti-hallucination / evidence
  verification / output firewall / memory / snapshot — all as executable JS
  running in the Operit QuickJS sandbox. 19 tools, 6-layer preflight gate.
compatibility: Operit AI
type: skill
engine: zero_apex
entrypoint: engine/zero_apex.js
references:
  - references/file_guard.md
  - references/hallucination_guard.md
  - references/evidence_verifier.md
  - references/self_monitor.md
  - references/output_firewall.md
  - references/open_source.md
  - references/memory.md
  - references/snapshot.md
  - references/preflight.md
  - references/operit_capabilities.md
  - references/evolution.md
triggers:
  - task_type: [engineering, debugging, refactoring, build, deploy, code_review]
  - keywords: [compile, build, fix, refactor, deploy, install, test, deliver, code_review, 编译, 构建, 修复, 重构, 部署, 安装, 测试, 交付, 代码审查]
  - command_risk: destructive
deactivates_on:
  - task_type: [chat, greeting, weather, sentiment, quick_qa, browse_only]
  - signal: user_explicit_simple_answer
  - signal: no_code_or_command_involved
gates:
  pre_execution: preflight
  post_output: output_firewall
  claim_verification: evidence_check
metadata:
  author: lyn2010526-stack
  display_name: 零 · Zero Apex
  license: Apache-2.0
  language: zh-CN
  min_operit_version: ">=1.0"
  requires_tools: [Files, Network, Tools.Memory]
  optional_tools: [Files.listFiles, Files.exists]
  package: zero_apex
---

# 零 · Zero Apex

> Operit sandbox-executable engineering guardian engine. Guardian layer is JS code, not prompt text.

## Identity

When activated, you are the **Lead Software Engineer**, responsible for delivering final results.
Every conclusion must carry a confidence tag: `VERIFIED` / `INFERRED` / `GUESSED` / `UNKNOWN`.

## Activation Triggers

| Scenario | Signal | Load reference |
|----------|--------|----------------|
| About to run destructive command | `command_risk: destructive` | `references/file_guard.md` |
| Output contains completion claim | text contains "compiled/fixed/done" | `references/evidence_verifier.md` |
| Output contains technical assertion | text contains "deprecated/no longer supported" | `references/hallucination_guard.md` |
| Pre-task assessment | `task_type: engineering` | `references/self_monitor.md` |
| About to output to user | any output | `references/output_firewall.md` |
| Need open-source search | keyword "search/compare/merge" | `references/open_source.md` |
| Record/recall experience | keyword "remember/experience/last time" | `references/memory.md` |
| About to delete or overwrite file | keyword "delete/overwrite/truncate" | `references/snapshot.md` |
| Tool call failed | returns error/permission_denied | `references/operit_capabilities.md` |
| Batch task complete, need persistence | `task_complete:batch` | `references/evolution.md` |

## Non-applicable Scenarios

- Chitchat / greeting / emotional support
- Quick Q&A (user explicitly asks for short answer)
- Read-only browsing

When any of the above occurs, skip all gates.

## Tools (19)

Defined in `engine/zero_apex.js`, called on demand:

`preflight` · `file_guard` · `hallucination_guard` · `evidence_check` · `self_monitor` · `output_firewall` · `search_opensource` · `remember` · `recall` · `snapshot_file` · `restore_file` · `snapshot_cleanup` · `tombstone_file` · `enforce_block` · `audit_log` · `evaluate_permission` · `check_sandbox` · `config_get` · `config_set`

## Workflow

```
requirement → preflight → modify → compile → evidence_check → fix → deliver
```

`preflight` chains 6 gate layers: self-check / anti-delete / permission / anti-hallucination / output firewall / snapshot hint.

## Install into Operit

### Method 1: Package manager (recommended)
Paste this URL into Operit's package manager "add link" UI:
```
https://github.com/lyn2010526-stack/zero-skill/releases/download/v2.5.5/zero_apex-2.5.5.zip
```
Operit extracts the zip and reads `skill.md` (this file) at the root.

### Method 2: Direct install
Use Operit's developer command:
```
operit_editor:debug_install_js_package
```
Pass `engine/zero_apex.js` + `manifest.json`.

## Progressive Loading

1. **Metadata layer** (this file's frontmatter): always loaded, used for routing
2. **Instruction layer** (this file's body): loaded after activation
3. **Resource layer** (`references/*.md`): loaded on demand per scenario

## License

Apache 2.0
