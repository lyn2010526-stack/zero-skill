"""Reality check guard for anti-hallucination."""
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
