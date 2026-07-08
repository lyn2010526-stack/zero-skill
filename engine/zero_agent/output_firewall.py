"""Output firewall: redact secrets and block long code in chat."""
from __future__ import annotations
import re
SECRET_PATTERNS = [re.compile(r'ghp_[A-Za-z0-9_]+'), re.compile(r'github_pat_[A-Za-z0-9_]+'), re.compile(r'glpat-[A-Za-z0-9_-]+'), re.compile(r'sk-[A-Za-z0-9_-]+'), re.compile(r'(?i)(password|secret|api[_-]?key|token)\s*[:=]\s*[^\s]+'), re.compile(r'(?i)Authorization\s*:\s*Bearer\s+[^\s]+')]
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
            body = chr(10).join(block.splitlines()[1:-1])
            if len(body.splitlines()) > max_lines or len(body) > max_chars: return True
        return False
    def violations(self, text: str) -> list[str]:
        issues=[]
        if self.redact(text)!=(text or ''): issues.append('secret')
        if self.has_long_code(text): issues.append('long_code')
        if any(m in (text or '') for m in THINKING_MARKERS): issues.append('thinking_marker')
        if any(m in (text or '') for m in SLACK_MARKERS): issues.append('slack_marker')
        return issues
