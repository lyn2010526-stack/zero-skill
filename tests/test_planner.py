from engine.zero_agent.planner import Planner

def test_high_risk_needs_confirmation():
    p = Planner()
    plan = p.create_plan('删除项目里的旧源码')
    assert plan.complexity == 'high'
    assert plan.needs_confirmation

def test_ambiguous_needs_clarification():
    p = Planner()
    assert p.needs_clarification('优化')
