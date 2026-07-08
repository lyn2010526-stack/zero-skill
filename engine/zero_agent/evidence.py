"""Structured evidence classification for Zero Apex."""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class EvidenceLabel(Enum):
    VERIFIED = "VERIFIED"
    INFERRED = "INFERRED"
    GUESSED = "GUESSED"
    UNKNOWN = "UNKNOWN"
    NEGATIVE = "NEGATIVE"


class EvidenceLevel(Enum):
    L0 = "L0"  # 口头，无证据
    L1 = "L1"  # 读取了文件
    L2 = "L2"  # 交叉验证（读了两个以上来源）
    L3 = "L3"  # 命令输出（编译通过有日志）
    L4 = "L4"  # 安装运行（设备启动成功）
    L5 = "L5"  # 核心功能测试通过
    L6 = "L6"  # 回归验证通过


NEGATIVE_MARKERS = [
    'build failed', 'failed', 'failure', 'error:', 'exception', 'traceback',
    'tests failed', 'test failed', 'compilation failed', 'execution failed',
    '执行失败', '编译失败', '测试失败', '报错', 'BUILD FAILED',
]
BUILD_SUCCESS = ['build successful', 'build succeeded', 'BUILD SUCCESSFUL', 'BUILD SUCCESSFUL']
TEST_SUCCESS = ['tests passed', 'test passed', '全部通过', '测试通过', 'OK', 'passed']
INSTALL_SUCCESS = ['success', 'installed', '安装成功', 'install success']
MODIFY_MARKERS = ['edit_file', 'created', 'modified', 'written', 'diff', '写入', '修改', 'applied']
READ_MARKERS = ['read_file', 'content of', 'directory listing', '读取', 'fetched']


@dataclass
class EvidenceResult:
    label: str
    level: str
    reason: str
    supports_claim: bool
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommandEvidence:
    """Structured evidence from a command execution."""
    command: str = ''
    exit_code: Optional[int] = None
    stdout: str = ''
    stderr: str = ''
    changed_files: List[str] = field(default_factory=list)
    artifacts: List[str] = field(default_factory=list)  # e.g. APK path
    runtime_logs: str = ''
    tool_name: str = ''
    timestamp: str = ''

    @property
    def text(self) -> str:
        return '\n'.join([self.command, self.stdout, self.stderr])

    @property
    def is_success(self) -> bool:
        return self.exit_code is not None and self.exit_code == 0

    def has_artifact(self, pattern: str = '') -> bool:
        """Check if any artifact matches a pattern (e.g. '.apk')."""
        if not pattern:
            return bool(self.artifacts)
        return any(pattern in a for a in self.artifacts)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'command': self.command,
            'exit_code': self.exit_code,
            'stdout': self.stdout[:500],
            'stderr': self.stderr[:500],
            'changed_files': self.changed_files,
            'artifacts': self.artifacts,
            'tool_name': self.tool_name,
            'is_success': self.is_success,
        }


class EvidenceLayer:
    def classify(self, claim: str, evidence: str | CommandEvidence | None) -> EvidenceResult:
        if evidence is None:
            return EvidenceResult('UNKNOWN', 'L0', '缺少工具或文件证据', False)

        if isinstance(evidence, CommandEvidence):
            return self._classify_structured(claim, evidence)
        else:
            return self._classify_text(claim, str(evidence))

    def _classify_structured(self, claim: str, ev: CommandEvidence) -> EvidenceResult:
        claim_low = claim.lower()
        details = ev.to_dict()

        # Check for negative evidence first
        if ev.stderr and any(m.lower() in ev.stderr.lower() for m in NEGATIVE_MARKERS):
            return EvidenceResult('NEGATIVE', 'L1', f'命令输出包含错误标记: {ev.stderr[:100]}', False, details)

        if ev.exit_code is not None and ev.exit_code != 0:
            return EvidenceResult('NEGATIVE', 'L1', f'命令退出码非零: exit_code={ev.exit_code}', False, details)

        # Build success
        if ('编译' in claim or 'build' in claim_low):
            if ev.exit_code == 0 and any(m in ev.stdout for m in BUILD_SUCCESS):
                return EvidenceResult('VERIFIED', 'L3', '构建成功，exit_code=0', True, details)
            if ev.exit_code == 0 and ev.has_artifact('.apk'):
                return EvidenceResult('VERIFIED', 'L4', 'APK 文件已生成', True, details)

        # Test success
        if ('测试' in claim or 'test' in claim_low):
            if ev.exit_code == 0:
                return EvidenceResult('VERIFIED', 'L3', '测试命令执行成功', True, details)

        # Install success
        if ('安装' in claim or 'install' in claim_low):
            if ev.exit_code == 0 and any(m in ev.stdout for m in INSTALL_SUCCESS):
                return EvidenceResult('VERIFIED', 'L4', '安装成功', True, details)

        # Modify success
        if ('修改' in claim or '写入' in claim or 'modified' in claim_low):
            if ev.is_success and ev.changed_files:
                return EvidenceResult('VERIFIED', 'L2', f'修改了 {len(ev.changed_files)} 个文件', True, details)
            if ev.tool_name in ('edit_file', 'create_file', 'write_file') and ev.is_success:
                return EvidenceResult('VERIFIED', 'L2', '文件修改工具执行成功', True, details)

        # Read success
        if ('读取' in claim or 'read' in claim_low):
            if ev.tool_name in ('read_file', 'list_files') and ev.is_success:
                return EvidenceResult('VERIFIED', 'L1', '文件读取成功', True, details)

        # Generic success with exit code
        if ev.exit_code == 0:
            return EvidenceResult('INFERRED', 'L1', '命令执行成功但不足以证明声明', False, details)

        return EvidenceResult('INFERRED', 'L1', '有结构化证据但不足以证明该声明', False, details)

    def _classify_text(self, claim: str, text: str) -> EvidenceResult:
        claim_low = claim.lower()
        low = text.lower()

        if not text.strip():
            return EvidenceResult('UNKNOWN', 'L0', '空证据', False)

        if any(m.lower() in low for m in NEGATIVE_MARKERS):
            return EvidenceResult('NEGATIVE', 'L1', '证据中包含失败或错误标记', False)

        if ('编译' in claim or 'build' in claim_low) and any(m in low for m in BUILD_SUCCESS):
            return EvidenceResult('VERIFIED', 'L3', '构建成功证据匹配声明', True)

        if ('测试' in claim or 'test' in claim_low) and any(m in low for m in TEST_SUCCESS):
            return EvidenceResult('VERIFIED', 'L3', '测试成功证据匹配声明', True)

        if ('安装' in claim or 'install' in claim_low) and any(m in low for m in INSTALL_SUCCESS):
            return EvidenceResult('VERIFIED', 'L4', '安装成功证据匹配声明', True)

        if ('修改' in claim or '写入' in claim or 'modified' in claim_low) and any(m in low for m in MODIFY_MARKERS):
            return EvidenceResult('VERIFIED', 'L2', '修改证据匹配声明', True)

        if ('读取' in claim or 'read' in claim_low) and any(m in low for m in READ_MARKERS):
            return EvidenceResult('VERIFIED', 'L1', '读取证据匹配声明', True)

        return EvidenceResult('INFERRED', 'L1', '有证据但不足以证明该声明', False)
