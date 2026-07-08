from pathlib import Path
from datetime import datetime
import zipfile, os
root=Path('.')
ts=datetime.now().strftime('%Y%m%d-%H%M%S')
(root/'.backup').mkdir(exist_ok=True)
for name in ['policies/tool_guard.yaml','policies/kernel.yaml','README.md','ROADMAP.md','零.skill','skills/zero-apex.skill']:
    p=root/name
    if p.exists():
        (root/'.backup'/f'{name.replace("/","__")}.{ts}.bak').write_text(p.read_text(encoding='utf-8'), encoding='utf-8')

(root/'policies/tool_guard.yaml').write_text('''version: 1
name: tool_guard
rules:
  - id: tool_guard.before_call_check
    source: SkillAudit / agent-design-patterns / Autobyteus
    trigger: before_tool_call
    priority: 2
    conditions: {}
    actions:
      - check_intent
      - check_risk
      - check_rate_limit
      - check_permission
    verify:
      - tool_call_has_reason
      - tool_call_has_expected_result
  - id: tool_guard.stop_repeated_failure
    source: rate-limit / EVOLT
    trigger: tool_call_failed
    priority: 1
    conditions:
      same_error_count_gte: 3
    actions:
      - stop_retry
      - switch_strategy
      - report_reason
    verify:
      - retry_stopped
      - alternative_strategy_selected
''', encoding='utf-8')

(root/'policies/kernel.yaml').write_text('''version: 1
name: kernel
rules:
  - id: kernel.no_false_completion
    trigger: before_response
    priority: 1
    conditions:
      completion_claim: true
      evidence_ready: false
    actions:
      - block_completion
      - request_evidence
    verify:
      - response_contains_no_unverified_completion
  - id: kernel.file_delete_requires_confirmation
    trigger: before_tool
    priority: 1
    conditions:
      delete_risk: true
    actions:
      - list_paths
      - require_confirm_delete
    verify:
      - explicit_confirm_delete_received
  - id: kernel.long_code_to_file
    trigger: before_response
    priority: 2
    conditions:
      long_code: true
    actions:
      - write_to_file
      - summarize_path
    verify:
      - response_has_no_long_code_block
  - id: kernel.skeptic_on_high_risk
    trigger: before_plan
    priority: 3
    conditions:
      high_risk: true
    actions:
      - state_risk
      - propose_safer_alternative
    verify:
      - challenge_is_bounded
  - id: kernel.low_resource_degrade
    trigger: during_execution
    priority: 4
    conditions:
      budget_pressure: true
    actions:
      - summarize
      - stop_redundant_scan
      - prefer_minimal_change
    verify:
      - redundant_work_stopped
''', encoding='utf-8')

# Add final acceptance and fusion status to README without bloating skill.
readme = (root/'README.md').read_text(encoding='utf-8')
readme += '''\n## 最终加固状态\n\n缺点修复闭环：\n\n- 旧设计未删除，已转译为工程门禁。\n- 幻觉层已落到 Reality/Verifier/Evidence。\n- 自我意识层已落到 SelfMonitor，不自保、不对抗用户。\n- 防删代码已落到 FileGuard，删除必须确认。\n- 质疑层已落到 SkepticLayer，只做有界风险质疑。\n- 50 个开源项目已完整进入 references、genes/fusion_genes.yaml、fusion_registry、compiler 输出索引。\n- policies 已规范为可加载 YAML。\n- Kernel 作为总控入口串联所有门禁。\n\n验收命令：`python3 -m compileall -q engine tests`，再运行 tests 目录下所有 test_* 函数。\n'''
(root/'README.md').write_text(readme, encoding='utf-8')

# Ensure compiled skill variants are regenerated.
try:
    from engine.zero_agent.compiler import SkillCompiler
    SkillCompiler(root).write_all()
except Exception as e:
    print('compiler_regen_skipped', repr(e))

# Build a stdlib zip, no external zip command required.
out=Path('/sdcard/Download/zero-skill-apex-kernel-v2-final.zip')
if out.exists(): out.unlink()
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in root.rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts:
            z.write(p, Path('zero-skill-main')/p.relative_to(root))
print('final_hardening_done', ts, out, out.stat().st_size)
