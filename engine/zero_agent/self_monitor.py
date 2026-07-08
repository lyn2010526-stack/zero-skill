"""Self monitor layer: engineering meta-state, not autonomous consciousness."""
from __future__ import annotations
from dataclasses import dataclass
@dataclass
class SelfState:
    goal_clear: bool=False; files_read: bool=False; evidence_ready: bool=False; irreversible_risk: bool=False; needs_user_confirmation: bool=False; confidence: str='UNKNOWN'
class SelfMonitor:
    def assess(self, *, goal_clear=False, files_read=False, evidence_ready=False, irreversible_risk=False) -> SelfState:
        confidence = 'VERIFIED' if evidence_ready else ('INFERRED' if files_read else 'UNKNOWN')
        return SelfState(goal_clear, files_read, evidence_ready, irreversible_risk, irreversible_risk, confidence)
