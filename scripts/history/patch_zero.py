from pathlib import Path
from datetime import datetime
root=Path('.')
ts=datetime.now().strftime('%Y%m%d-%H%M%S')
(root/'.backup').mkdir(exist_ok=True)
for name in ['engine/zero_agent/file_guard.py','engine/zero_agent/verifier.py','engine/zero_agent/evidence.py','engine/zero_agent/tool_guard.py','engine/zero_agent/policy_engine.py','engine/zero_agent/output_firewall.py','零.skill','README.md','ARCHITECTURE.md','ROADMAP.md']:
    p=root/name
    if p.exists():
        bp=root/'.backup'/f'{name.replace("/","__")}.{ts}.bak'
        bp.write_text(p.read_text(encoding='utf-8'), encoding='utf-8')

(root/'engine/zero_agent/file_guard.py').write_text('''"""File safety guard for Zero Apex."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import re, shlex
from typing import Iterable, List

SOURCE_SUFFIXES = {'.py','.js','.jsx','.ts','.tsx','.java','.kt','.kts','.go','.rs','.c','.cc','.cpp','.h','.hpp','.swift','.php','.rb','.lua','.sh','.gradle','.xml','.json','.yaml','.yml','.toml','.md','.skill'}
SECRET_NAMES = {'.env','id_rsa','id_dsa','keystore','gradle.properties','local.properties'}
PROJECT_MARKERS = {'.git','build.gradle','settings.gradle','package.json','pyproject.toml','Cargo.toml'}
DELETE_WORDS = {'rm','unlink','rmdir','delete_file','remove','del'}
DANGEROUS_PATTERNS = [
    re.compile(r'(^|\\s)(sudo\\s+)?rm\\s+[^\\n;|&]*-[^\\n;|&]*r[^\\n;|&]*'),
    re.compile(r'(^|\\s)(busybox\\s+)?rm\\s+[^\\n;|&]*'),
    re.compile(r'find\\s+.+\\s-delete(\\s|$)'),
    re.compile(r'git\\s+clean\\s+[^\\n;|&]*-[^\\n;|&]*[fdx]'),
    re.compile(r'shutil\\.rmtree\\s*\\('),
    re.compile(r'os\\.remove\\s*\\('),
    re.compile(r'fs\\.rmSync\\s*\\('),
    re.compile(r'fs\\.unlinkSync\\s*\\('),
]

@dataclass
class DeleteRisk:
    is_delete: bool
    requires_confirmation: bool
    risk_level: str
    reasons: List[str] = field(default_factory=list)
    targets: List[str] = field(default_factory=list)

class FileGuard:
    def is_delete_command(self, command: str) -> bool:
        return self.analyze_command(command).is_delete

    def analyze_command(self, command: str) -> DeleteRisk:
        text = command or ''
        reasons, targets = [], []
        lowered = text.lower()
        pattern_hit = any(p.search(lowered) for p in DANGEROUS_PATTERNS)
        try:
            tokens = shlex.split(text)
        except ValueError:
            tokens = text.replace(';',' ').replace('|',' ').split()
        normalized = [Path(t).name.lower() for t in tokens]
        token_hit = any(t in DELETE_WORDS for t in normalized)
        if pattern_hit: reasons.append('dangerous delete pattern')
        if token_hit: reasons.append('delete token')
        for t in tokens[1:]:
            if t.startswith('-') or '=' in t: continue
            if '/' in t or t.startswith('.') or Path(t).suffix:
                targets.append(t)
        for target in targets:
            reasons.extend(self.path_risk(target).reasons)
        is_delete = pattern_hit or token_hit
        requires = is_delete and (bool(targets) or pattern_hit or token_hit)
        level = 'S3' if is_delete else 'S0'
        if any('project root' in r or 'hidden directory' in r or 'system path' in r for r in reasons): level = 'S4'
        return DeleteRisk(is_delete, requires, level, sorted(set(reasons)), targets)

    def path_risk(self, path: str) -> DeleteRisk:
        p = Path(path)
        reasons = []
        if str(p) in {'/','/sdcard','/storage','/home'} or p.name in PROJECT_MARKERS:
            reasons.append('project root or storage root')
        if any(part.startswith('.') and part not in {'.'} for part in p.parts):
            reasons.append('hidden directory or file')
        if p.suffix in SOURCE_SUFFIXES or p.name in SECRET_NAMES:
            reasons.append('source or sensitive file')
        if str(p).startswith(('/system','/vendor','/data','/proc','/dev')):
            reasons.append('system path')
        requires = bool(reasons)
        level = 'S4' if any('root' in r or 'system path' in r for r in reasons) else ('S3' if requires else 'S1')
        return DeleteRisk(False, requires, level, reasons, [path])

    def requires_confirmation(self, path: str) -> bool:
        return self.path_risk(path).requires_confirmation

    def make_confirmation_checklist(self, paths: Iterable[str], reason: str = '') -> dict:
        items, total_size, contains_source = [], 0, False
        for raw in paths:
            p = Path(raw); risk = self.path_risk(raw)
            contains_source = contains_source or risk.requires_confirmation
            size = p.stat().st_size if p.exists() and p.is_file() else 0
            total_size += size
            items.append({'path': raw, 'size': size, 'risk': risk.risk_level, 'reasons': risk.reasons})
        return {'count': len(items), 'total_size': total_size, 'contains_source_or_sensitive': contains_source, 'reason': reason, 'requires_phrase': '确认删除', 'items': items}
''', encoding='utf-8')

(root/'engine/zero_agent/evidence.py').write_text('''"""Evidence classification for Zero Apex."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

NEGATIVE_MARKERS = ['build failed','failed','failure','error:','exception','traceback','tests failed','test failed','compilation failed','执行失败','编译失败','测试失败','报错']
BUILD_SUCCESS = ['build successful','build succeeded']
TEST_SUCCESS = ['tests passed','test passed','全部通过','测试通过']
INSTALL_SUCCESS = ['success','installed','安装成功']
MODIFY_MARKERS = ['edit_file','created','modified','written','diff','写入','修改']
READ_MARKERS = ['read_file','content of','directory listing','读取']

@dataclass
class EvidenceResult:
    label: str
    level: str
    reason: str
    supports_claim: bool

@dataclass
class CommandEvidence:
    command: str = ''
    exit_code: Optional[int] = None
    stdout: str = ''
    stderr: str = ''
    artifact_exists: bool = False
    @property
    def text(self) -> str:
        return '\n'.join([self.command, self.stdout, self.stderr])

class EvidenceLayer:
    def classify(self, claim: str, evidence: str | CommandEvidence | None) -> EvidenceResult:
        if evidence is None: return EvidenceResult('UNKNOWN','L0','缺少工具或文件证据',False)
        if isinstance(evidence, CommandEvidence): text, exit_code = evidence.text, evidence.exit_code
        else: text, exit_code = str(evidence), None
        if not text.strip(): return EvidenceResult('UNKNOWN','L0','空证据',False)
        low, claim_low = text.lower(), claim.lower()
        if any(m.lower() in low for m in NEGATIVE_MARKERS):
            return EvidenceResult('VERIFIED','L1','证据中包含失败或错误标记',False)
        if ('编译' in claim or 'build' in claim_low) and (exit_code in (0,None)) and any(m in low for m in BUILD_SUCCESS):
            return EvidenceResult('VERIFIED','L3','构建成功证据匹配声明',True)
        if ('测试' in claim or 'test' in claim_low) and (exit_code in (0,None)) and any(m in low for m in TEST_SUCCESS):
            return EvidenceResult('VERIFIED','L3','测试成功证据匹配声明',True)
        if ('安装' in claim or 'install' in claim_low) and (exit_code in (0,None)) and any(m in low for m in INSTALL_SUCCESS):
            return EvidenceResult('VERIFIED','L4','安装成功证据匹配声明',True)
        if ('修改' in claim or '写入' in claim or 'modified' in claim_low) and any(m in low for m in MODIFY_MARKERS):
            return EvidenceResult('VERIFIED','L2','修改证据匹配声明',True)
        if ('读取' in claim or 'read' in claim_low) and any(m in low for m in READ_MARKERS):
            return EvidenceResult('VERIFIED','L1','读取证据匹配声明',True)
        return EvidenceResult('INFERRED','L1','有证据但不足以证明该声明',False)
''', encoding='utf-8')

(root/'engine/zero_agent/verifier.py').write_text('''"""Completion verifier for Zero Apex."""
from __future__ import annotations
from .evidence import EvidenceLayer, CommandEvidence, EvidenceResult

class Verifier:
    COMPLETION_WORDS = ['完成','已完成','改完','已修改','已经修改','已修复','已经修复','修好了','编译通过','测试通过','安装成功','搞定','done','fixed']
    def __init__(self): self.evidence = EvidenceLayer()
    def has_completion_claim(self, text: str) -> bool:
        low = (text or '').lower(); return any(w.lower() in low for w in self.COMPLETION_WORDS)
    def verify_claim(self, claim: str, evidence: str | CommandEvidence | None) -> bool:
        return self.verify(claim, evidence).supports_claim
    def verify(self, claim: str, evidence: str | CommandEvidence | None) -> EvidenceResult:
        return self.evidence.classify(claim, evidence)
    def response_allowed(self, response: str, evidence: str | CommandEvidence | None) -> tuple[bool, str]:
        if not self.has_completion_claim(response): return True, 'no completion claim'
        result = self.verify(response, evidence)
        if result.supports_claim: return True, result.reason
        return False, f'completion claim blocked: {result.reason}'
''', encoding='utf-8')

(root/'engine/zero_agent/tool_guard.py').write_text('''"""ToolGuard: call budget, repeated failure and summary gate."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Optional

@dataclass
class ToolState:
    total_calls: int = 0
    last_tool: Optional[str] = None
    consecutive_current: int = 0
    failures_by_key: Dict[str, int] = field(default_factory=dict)
    blocked_tools: set[str] = field(default_factory=set)

class ToolGuard:
    def __init__(self, max_total: int = 80, max_consecutive_normal: int = 8, max_same_error: int = 3):
        self.max_total = max_total; self.max_consecutive_normal = max_consecutive_normal; self.max_same_error = max_same_error; self.state = ToolState()
    def before_call(self, tool_name: str) -> tuple[bool, str]:
        if tool_name in self.state.blocked_tools: return False, 'tool blocked after repeated failures'
        if self.state.total_calls >= self.max_total: return False, 'tool budget exceeded'
        if self.state.last_tool == tool_name:
            if self.state.consecutive_current >= self.max_consecutive_normal: return False, 'summarize before continuing same tool'
            self.state.consecutive_current += 1
        else:
            self.state.last_tool = tool_name; self.state.consecutive_current = 1
        self.state.total_calls += 1; return True, 'allowed'
    def record_failure(self, tool_name: str, error: str) -> tuple[bool, str]:
        key = f'{tool_name}:{self._normalize_error(error)}'; self.state.failures_by_key[key] = self.state.failures_by_key.get(key,0)+1
        if self.state.failures_by_key[key] >= self.max_same_error:
            self.state.blocked_tools.add(tool_name); return False, 'same error repeated, switch strategy'
        return True, 'retry allowed'
    def record_success(self, tool_name: str) -> None:
        for key in list(self.state.failures_by_key):
            if key.startswith(f'{tool_name}:'): del self.state.failures_by_key[key]
    def mark_summarized(self, tool_name: str | None = None) -> None:
        if tool_name is None or self.state.last_tool == tool_name: self.state.consecutive_current = 0
    def reset_task(self) -> None: self.state = ToolState()
    def _normalize_error(self, error: str) -> str: return ' '.join((error or '').lower().split())[:160]
''', encoding='utf-8')

(root/'engine/zero_agent/output_firewall.py').write_text('''"""Output firewall: redact secrets and block long code in chat."""
from __future__ import annotations
import re
SECRET_PATTERNS = [re.compile(r'ghp_[A-Za-z0-9_]+'), re.compile(r'github_pat_[A-Za-z0-9_]+'), re.compile(r'glpat-[A-Za-z0-9_-]+'), re.compile(r'sk-[A-Za-z0-9_-]+'), re.compile(r'(?i)(password|secret|api[_-]?key|token)\\s*[:=]\\s*[^\\s]+'), re.compile(r'(?i)Authorization\\s*:\\s*Bearer\\s+[^\\s]+')]
THINKING_MARKERS = ['我认为','我推测','我分析','我正在思考','让我想想']
SLACK_MARKERS = ['不用担心','好的我这就','完全理解','加油']
class OutputFirewall:
    def redact(self, text: str) -> str:
        result = text or ''
        for pattern in SECRET_PATTERNS: result = pattern.sub('[REDACTED]', result)
        return result
    def is_clean(self, text: str) -> bool: return self.redact(text) == (text or '') and not self.has_long_code(text)
    def has_long_code(self, text: str, max_lines: int = 10, max_chars: int = 300) -> bool:
        blocks = re.findall(r'```.*?```', text or '', flags=re.S)
        for block in blocks:
            body = '\n'.join(block.splitlines()[1:-1])
            if len(body.splitlines()) > max_lines or len(body) > max_chars: return True
        return False
    def violations(self, text: str) -> list[str]:
        issues=[]
        if self.redact(text)!=(text or ''): issues.append('secret')
        if self.has_long_code(text): issues.append('long_code')
        if any(m in (text or '') for m in THINKING_MARKERS): issues.append('thinking_marker')
        if any(m in (text or '') for m in SLACK_MARKERS): issues.append('slack_marker')
        return issues
''', encoding='utf-8')

(root/'engine/zero_agent/hallucination_guard.py').write_text('''"""Reality check guard for anti-hallucination."""
from __future__ import annotations
from dataclasses import dataclass
@dataclass
class RealityCheck:
    allowed: bool; label: str; reason: str
class HallucinationGuard:
    FACT_CLAIMS = ['已读取','已修改','已编译','已安装','已测试','已修复','完成']
    def check(self, text: str, evidence: str | None = None) -> RealityCheck:
        has_fact = any(w in (text or '') for w in self.FACT_CLAIMS)
        if has_fact and not evidence: return RealityCheck(False,'UNKNOWN','事实声明缺少证据')
        if not evidence: return RealityCheck(True,'GUESSED','无证据，只能作为猜测')
        return RealityCheck(True,'VERIFIED','存在证据')
''', encoding='utf-8')

(root/'engine/zero_agent/self_monitor.py').write_text('''"""Self monitor layer: engineering meta-state, not autonomous consciousness."""
from __future__ import annotations
from dataclasses import dataclass
@dataclass
class SelfState:
    goal_clear: bool=False; files_read: bool=False; evidence_ready: bool=False; irreversible_risk: bool=False; needs_user_confirmation: bool=False; confidence: str='UNKNOWN'
class SelfMonitor:
    def assess(self, *, goal_clear=False, files_read=False, evidence_ready=False, irreversible_risk=False) -> SelfState:
        confidence = 'VERIFIED' if evidence_ready else ('INFERRED' if files_read else 'UNKNOWN')
        return SelfState(goal_clear, files_read, evidence_ready, irreversible_risk, irreversible_risk, confidence)
''', encoding='utf-8')

(root/'engine/zero_agent/skeptic.py').write_text('''"""Bounded skeptic layer."""
from __future__ import annotations
class SkepticLayer:
    RISK_WORDS = ['删除','覆盖','清空','重构','rm -rf','token','密钥','权限','支付']
    def should_challenge(self, user_goal: str, evidence_conflict: bool=False) -> tuple[bool, str]:
        text = user_goal or ''
        if evidence_conflict: return True, '目标与现有证据冲突'
        for word in self.RISK_WORDS:
            if word in text: return True, f'包含高风险操作：{word}'
        if len(text.strip()) < 4: return True, '目标过于模糊'
        return False, '无需质疑'
''', encoding='utf-8')

(root/'tests/test_file_guard.py').write_text('''from engine.zero_agent.file_guard import FileGuard

def test_detects_rm_rf_variants():
    g = FileGuard()
    assert g.is_delete_command('rm -r -f src')
    assert g.is_delete_command('busybox rm -rf src')
    assert g.is_delete_command('find . -delete')
    assert g.is_delete_command('git clean -fdx')
    assert g.is_delete_command('python -c "import shutil; shutil.rmtree(\\\'src\\\')"')

def test_source_and_secret_need_confirmation():
    g = FileGuard()
    assert g.requires_confirmation('src/MainActivity.kt')
    assert g.requires_confirmation('.env')
    assert g.requires_confirmation('build.gradle')

def test_confirmation_checklist():
    g = FileGuard()
    data = g.make_confirmation_checklist(['src/MainActivity.kt'], 'cleanup')
    assert data['count'] == 1
    assert data['requires_phrase'] == '确认删除'
    assert data['contains_source_or_sensitive']
''', encoding='utf-8')

(root/'tests/test_verifier.py').write_text('''from engine.zero_agent.verifier import Verifier
from engine.zero_agent.evidence import CommandEvidence

def test_blocks_false_completion_with_failed_log():
    v = Verifier()
    assert not v.verify_claim('编译通过', 'BUILD FAILED error: boom')

def test_accepts_build_success():
    v = Verifier()
    ev = CommandEvidence(command='./gradlew assembleDebug', exit_code=0, stdout='BUILD SUCCESSFUL')
    assert v.verify_claim('编译通过', ev)

def test_response_allowed_blocks_no_evidence():
    v = Verifier()
    ok, reason = v.response_allowed('已完成', None)
    assert not ok
    assert 'blocked' in reason
''', encoding='utf-8')

(root/'tests/test_tool_guard.py').write_text('''from engine.zero_agent.tool_guard import ToolGuard

def test_summary_gate_and_reset():
    g = ToolGuard(max_consecutive_normal=2)
    assert g.before_call('read')[0]
    assert g.before_call('read')[0]
    assert not g.before_call('read')[0]
    g.mark_summarized('read')
    assert g.before_call('read')[0]

def test_repeated_failure_blocks_tool():
    g = ToolGuard(max_same_error=2)
    assert g.record_failure('x', 'same')[0]
    assert not g.record_failure('x', 'same')[0]
    assert not g.before_call('x')[0]
''', encoding='utf-8')

(root/'tests/test_output_firewall.py').write_text('''from engine.zero_agent.output_firewall import OutputFirewall

def test_redacts_github_token():
    f = OutputFirewall()
    assert 'ghp_' not in f.redact('token ghp_abcdefghijklmnopqrstuvwxyz123456')

def test_blocks_long_code():
    f = OutputFirewall()
    body = '\n'.join(str(i) for i in range(12))
    assert f.has_long_code('```python\n' + body + '\n```')
''', encoding='utf-8')

(root/'tests/test_new_layers.py').write_text('''from engine.zero_agent.hallucination_guard import HallucinationGuard
from engine.zero_agent.skeptic import SkepticLayer
from engine.zero_agent.self_monitor import SelfMonitor

def test_hallucination_guard_blocks_fact_without_evidence():
    r = HallucinationGuard().check('已修复')
    assert not r.allowed

def test_skeptic_challenges_delete():
    ok, reason = SkepticLayer().should_challenge('删除整个项目')
    assert ok
    assert '删除' in reason

def test_self_monitor_confidence():
    s = SelfMonitor().assess(goal_clear=True, files_read=True, evidence_ready=False)
    assert s.confidence == 'INFERRED'
''', encoding='utf-8')

readme = (root/'README.md').read_text(encoding='utf-8')
if '## 当前修复状态' not in readme:
    readme += '\n## 当前修复状态\n\n已补齐文件安全、证据验证、工具限流、输出防火墙、反幻觉、自我状态、有界质疑的最小可执行闭环。旧设计保留，生产路径工程化。\n'
(root/'README.md').write_text(readme, encoding='utf-8')
print('patched', ts)
