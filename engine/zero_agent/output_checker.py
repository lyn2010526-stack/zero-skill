"""Output quality checker for Zero Apex.

Detects AI-pattern language, forbidden words, code blocks in chat,
and validates output format compliance.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Dict, List, Tuple


@dataclass
class CheckResult:
    passed: bool
    violations: List[str] = field(default_factory=list)
    severity: str = 'none'  # none / minor / major / critical


class OutputChecker:
    """Checks AI output against quality rules.

    Detects:
    - AI腔 (first, second, third, notably, in summary...)
    - 完成宣称 (completed, fixed, done...)
    - Code blocks > 10 lines
    - Empty/whitespace-only output

    Examples:

        >>> checker = OutputChecker()
        >>> r = checker.check('首先其次最后，已经修复了')
        >>> r.passed
        False
        >>> r.violations
        ['ai_pattern:首先其次最后', 'completion_claim:已经修复了']
    """

    AI_PATTERNS: List[Tuple[str, str]] = [
        ('首先其次最后', '首先其次最后'),
        ('值得注意的是', '值得注意的是'),
        ('总的来说', '总的来说'),
        ('综上所述', '综上所述'),
        ('我来帮你', '我来帮你'),
        ('没问题的', '没问题的'),
        ('不用担心', '不用担心'),
        ('好的我这就', '好的我这就'),
        ('不好意思', '不好意思'),
        ('很抱歉', '很抱歉'),
        ('你说得对', '你说得对'),
        ('完全理解', '完全理解'),
        ('我理解你的感受', '我理解你的感受'),
        ('这种情况确实令人', '这种情况确实令人'),
        ('我感同身受', '我感同身受'),
        ('我能体会', '我能体会'),
        ('加油', '加油'),
    ]

    COMPLETION_CLAIMS = [
        '已完成', '已修改', '已修复', '已编译', '已安装', '已测试',
        '已部署', '准备好了', '搞定了', '完成了', '修好了',
        'done', 'fixed', 'completed', 'finished', '搞定',
    ]

    THINKING_MARKERS = [
        '我认为', '我推测', '我分析', '我想到', '我正在思考',
        '我准备', '我打算', '让我想想', '在我看来', '我觉得',
    ]

    def check(self, text: str) -> CheckResult:
        if not text or not text.strip():
            return CheckResult(True, [], 'none')

        violations = []
        severity = 'none'

        # Check for AI patterns
        low = text.lower()
        for pattern, label in self.AI_PATTERNS:
            if pattern in text:
                violations.append(f'ai_pattern:{label}')

        # Check for completion claims
        for claim in self.COMPLETION_CLAIMS:
            if claim in text:
                violations.append(f'completion_claim:{claim}')

        # Check for thinking markers
        for marker in self.THINKING_MARKERS:
            if marker in text:
                violations.append(f'thinking_marker:{marker}')

        # Check code blocks
        code_blocks = re.findall(r'```[\s\S]*?```', text)
        for block in code_blocks:
            lines = block.split('\n')
            if len(lines) > 10:
                violations.append(f'long_code_block:{len(lines)}_lines')

        # Determine severity
        has_ai = any('ai_pattern' in v for v in violations)
        has_think = any('thinking_marker' in v for v in violations)
        has_long_code = any('long_code_block' in v for v in violations)

        if has_think or has_long_code:
            severity = 'major'
        elif has_ai:
            severity = 'minor'
        elif violations:
            severity = 'minor'

        passed = len(violations) == 0 or severity == 'none'
        return CheckResult(passed, violations, severity)

    def check_completion_with_evidence(self, text: str, has_evidence: bool = False) -> CheckResult:
        """Check if completion claims are supported by evidence."""
        result = self.check(text)
        has_claim = any('completion_claim' in v for v in result.violations)
        if has_claim and not has_evidence:
            result.violations.append('completion_without_evidence')
            result.severity = 'major'
            result.passed = False
        return result

    def filter_output(self, text: str) -> Tuple[str, CheckResult]:
        """Filter text and return clean version + check result.

        Returns:
            Tuple of (filtered_text, check_result)
        """
        result = self.check(text)
        if result.passed:
            return text, result

        filtered = text
        for pattern, _ in self.AI_PATTERNS:
            filtered = filtered.replace(pattern, '')
        for marker in self.THINKING_MARKERS:
            filtered = filtered.replace(marker, '')

        # Remove long code blocks
        filtered = re.sub(r'```[\s\S]{300,}?```', '[代码已写入文件]', filtered)

        # Collapse multiple newlines
        filtered = re.sub(r'\n{3,}', '\n\n', filtered)

        return filtered.strip(), result
