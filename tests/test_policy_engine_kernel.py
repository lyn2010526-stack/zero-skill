from engine.zero_agent.policy_engine import PolicyEngine

def test_policy_engine_loads_kernel_policy():
    p = PolicyEngine('policies')
    p.load()
    ids = [r.id for r in p.rules]
    assert 'kernel.no_false_completion' in ids
    assert 'kernel.file_delete_requires_confirmation' in ids

def test_policy_match_before_response():
    p = PolicyEngine('policies')
    p.load()
    matched = p.match('before_response')
    assert any(r.id == 'kernel.no_false_completion' for r in matched)
