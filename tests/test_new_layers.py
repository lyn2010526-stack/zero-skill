from engine.zero_agent.hallucination_guard import HallucinationGuard
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
