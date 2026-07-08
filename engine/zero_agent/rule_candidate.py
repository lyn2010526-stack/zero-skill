"""Rule candidates: never auto-merge without tests and user confirmation."""
from __future__ import annotations
from dataclasses import dataclass
@dataclass
class RuleCandidate:
    id: str; source: str; rule: str; test: str = ''; status: str = 'candidate'
class RuleCandidateStore:
    def __init__(self): self.items: list[RuleCandidate] = []
    def propose(self, id: str, source: str, rule: str, test: str = '') -> RuleCandidate:
        c = RuleCandidate(id, source, rule, test, 'candidate'); self.items.append(c); return c
    def can_merge(self, c: RuleCandidate, tested: bool = False, user_confirmed: bool = False) -> bool:
        return bool((tested or c.status == 'tested') and user_confirmed)
    def mark_tested(self, id: str) -> None:
        for c in self.items:
            if c.id == id: c.status = 'tested'
class RuleCandidateEngine:
    def __init__(self): self.store = RuleCandidateStore()
    def create_from_postmortem(self, source: str, lesson: str) -> RuleCandidate:
        cid = 'candidate.' + str(abs(hash((source, lesson))) % 1000000)
        return self.store.propose(cid, source, lesson, test='required')
    def propose(self, id: str, source: str, rule: str, test: str = '') -> RuleCandidate:
        return self.store.propose(id, source, rule, test)
    def can_merge(self, candidate: RuleCandidate, tested: bool = False, user_confirmed: bool = False) -> bool:
        return self.store.can_merge(candidate, tested, user_confirmed)
    def mark_tested(self, id: str) -> None: self.store.mark_tested(id)
