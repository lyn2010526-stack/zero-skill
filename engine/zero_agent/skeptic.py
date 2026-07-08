"""Bounded skeptic layer."""
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
