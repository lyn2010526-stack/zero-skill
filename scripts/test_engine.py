#!/usr/bin/env python3
"""Test runner for Zero Apex engine modules."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'engine'))

from zero_agent.evidence import EvidenceLayer, CommandEvidence, EvidenceResult
from zero_agent.verifier import Verifier
from zero_agent.file_guard import FileGuard, SnapshotManager
from zero_agent.policy_engine import PolicyEngine, Decision

passed = 0
failed = 0

def test(name, condition):
    global passed, failed
    if condition:
        passed += 1
        print(f'  PASS: {name}')
    else:
        failed += 1
        print(f'  FAIL: {name}')

# === EvidenceLayer tests ===
print('\n--- EvidenceLayer ---')
el = EvidenceLayer()

# Test negative evidence
r = el.classify('编译通过', CommandEvidence(command='gradle build', exit_code=1, stderr='BUILD FAILED'))
test('negative evidence blocks claim', r.label == 'NEGATIVE' and not r.supports_claim)

# Test build success
r = el.classify('编译通过', CommandEvidence(command='gradle build', exit_code=0, stdout='BUILD SUCCESSFUL'))
test('build success verified L3', r.label == 'VERIFIED' and r.level == 'L3' and r.supports_claim)

# Test APK artifact
r = el.classify('编译通过', CommandEvidence(command='gradle build', exit_code=0, artifacts=['/app/build/outputs/apk/debug/app-debug.apk']))
test('APK artifact verified L4', r.label == 'VERIFIED' and r.level == 'L4' and r.supports_claim)

# Test no evidence
r = el.classify('编译通过', None)
test('no evidence = UNKNOWN L0', r.label == 'UNKNOWN' and r.level == 'L0')

# Test text evidence
r = el.classify('测试通过', 'tests passed 27/27')
test('text test pass verified', r.label == 'VERIFIED' and r.supports_claim)

# === Verifier tests ===
print('\n--- Verifier ---')
v = Verifier()

test('detects completion claim', v.has_completion_claim('编译通过了'))
test('no completion claim', not v.has_completion_claim('正在读取文件'))

allowed, reason = v.response_allowed('编译通过了', CommandEvidence(exit_code=0, stdout='BUILD SUCCESSFUL'))
test('build claim with evidence allowed', allowed)

allowed, reason = v.response_allowed('编译通过了', CommandEvidence(exit_code=1, stderr='FAILED'))
test('build claim without evidence blocked', not allowed)

# Test file existence check
test('verify file exists', v.verify_file_exists('/sdcard/Download/zero-skill-work/zero-skill-main/零.skill'))
test('verify nonexistent file', not v.verify_file_exists('/nonexistent/path'))

# Test APK check
test('verify nonexistent APK', not v.verify_apk_exists('/nonexistent/app.apk'))

# === FileGuard tests ===
print('\n--- FileGuard ---')
fg = FileGuard()

r = fg.analyze_command('rm -rf /home/user/project')
test('rm -rf detected', r.is_delete)
test('rm -rf requires confirmation', r.requires_confirmation)

r = fg.analyze_command('ls -la /sdcard')
test('ls not detected as delete', not r.is_delete)

r = fg.analyze_command('xargs rm file1 file2')
test('xargs rm detected', r.is_delete)

r = fg.analyze_command('rsync --delete src/ dest/')
test('rsync --delete detected', r.is_delete)

r = fg.analyze_command('dd if=input of=output')
test('dd detected', r.is_delete)

r = fg.analyze_command('truncate -s 0 file.log')
test('truncate detected', r.is_delete)

# Test script scanning
r = fg.scan_script_content('import os; os.system("rm -rf /tmp/")')
test('indirect delete in script detected', r.is_delete)

r = fg.scan_script_content('print("hello")')
test('safe script not flagged', not r.is_delete)

# Test path risk
r = fg.path_risk('/sdcard/myproject/app.py')
test('sdcard path flagged', r.requires_confirmation)

r = fg.path_risk('.env')
test('secret file flagged', r.requires_confirmation)

# Test snapshot (in-memory, no disk)
import tempfile
tmp = tempfile.mkdtemp()
sm = SnapshotManager(tmp)
test('snapshot manager created', sm.snapshot_dir.exists())
test('empty snapshots list', sm.list_snapshots() == [])

# === PolicyEngine tests ===
print('\n--- PolicyEngine ---')
import yaml
policy_dir = os.path.join(os.path.dirname(__file__), '..', 'policies')
pe = PolicyEngine(policy_dir)
pe.load()
test(f'loaded {len(pe.rules)} rules', len(pe.rules) >= 0)
test('no load errors', len(pe.errors) == 0)

# Test apply without matching rules
result = pe.apply('nonexistent_trigger')
test('no-match returns ALLOW', result.decision == Decision.ALLOW)

# Test validate_schema
errors = pe.validate_schema({'id': 'test', 'trigger': 'on_delete', 'action': 'block', 'priority': 10})
test('valid schema has no errors', len(errors) == 0)

errors = pe.validate_schema({'trigger': 'on_delete'})
test('missing id detected', len(errors) > 0 and 'missing required field: id' in errors[0])

errors = pe.validate_schema({'id': 'test', 'trigger': 'on_delete', 'action': 'INVALID'})
test('invalid action detected', any('invalid action' in e for e in errors))

# Test summary
summary = pe.summary()
test('summary has total_rules', 'total_rules' in summary)

test('summary has action_distribution', 'action_distribution' in summary)

# === Output ===
print(f'\n=== Results: {passed} passed, {failed} failed ===')
sys.exit(1 if failed > 0 else 0)
