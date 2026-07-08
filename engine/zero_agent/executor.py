"""Execution coordinator: checks kernel gates before declaring execution ready."""
from __future__ import annotations
from .kernel import ZeroKernel, KernelDecision
class Executor:
    def __init__(self): self.kernel = ZeroKernel()
    def preflight_command(self, goal: str, command: str, evidence: str | None = None) -> KernelDecision:
        return self.kernel.preflight(goal, command=command, evidence=evidence)
    def allow_response(self, response: str, evidence: str | None = None) -> KernelDecision:
        return self.kernel.before_response(response, evidence=evidence)
