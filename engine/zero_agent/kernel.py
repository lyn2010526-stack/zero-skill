"""Zero Apex Kernel: combines reality, self monitor, skeptic, file safety and output gates."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional
from .file_guard import FileGuard
from .verifier import Verifier
from .hallucination_guard import HallucinationGuard
from .self_monitor import SelfMonitor
from .skeptic import SkepticLayer
from .output_firewall import OutputFirewall

@dataclass
class KernelDecision:
    allowed: bool
    state: str
    confidence: str
    gates: List[str] = field(default_factory=list)
    reasons: List[str] = field(default_factory=list)
    requires_confirmation: bool = False

class ZeroKernel:
    def __init__(self):
        self.file_guard = FileGuard()
        self.verifier = Verifier()
        self.hallucination = HallucinationGuard()
        self.self_monitor = SelfMonitor()
        self.skeptic = SkepticLayer()
        self.output_firewall = OutputFirewall()

    def preflight(self, user_goal: str, command: str = '', evidence: Optional[str] = None, goal_clear: bool = True, files_read: bool = False) -> KernelDecision:
        reasons, gates = [], []
        state = self.self_monitor.assess(goal_clear=goal_clear, files_read=files_read, evidence_ready=bool(evidence), irreversible_risk=False)
        challenge, why = self.skeptic.should_challenge(user_goal)
        if challenge:
            gates.append('skeptic'); reasons.append(why)
        if command:
            risk = self.file_guard.analyze_command(command)
            if risk.requires_confirmation:
                gates.append('file_safety'); reasons.extend(risk.reasons)
                return KernelDecision(False, 'WAIT_CONFIRMATION', state.confidence, gates, sorted(set(reasons)), True)
        check = self.hallucination.check(user_goal, evidence)
        if not check.allowed:
            gates.append('reality'); reasons.append(check.reason)
            return KernelDecision(False, 'NEED_EVIDENCE', check.label, gates, reasons, False)
        if challenge:
            return KernelDecision(False, 'NEED_CLARIFICATION', state.confidence, gates, reasons, False)
        return KernelDecision(True, 'READY', state.confidence, gates, reasons, False)

    def before_response(self, response: str, evidence: Optional[str] = None) -> KernelDecision:
        reasons, gates = [], []
        issues = self.output_firewall.violations(response)
        if issues:
            gates.append('output_firewall'); reasons.extend(issues)
            return KernelDecision(False, 'REWRITE_RESPONSE', 'UNKNOWN', gates, reasons, False)
        ok, reason = self.verifier.response_allowed(response, evidence)
        if not ok:
            gates.append('verifier'); reasons.append(reason)
            return KernelDecision(False, 'NEED_EVIDENCE', 'UNKNOWN', gates, reasons, False)
        return KernelDecision(True, 'ALLOW_RESPONSE', 'VERIFIED' if evidence else 'INFERRED', gates, reasons, False)
