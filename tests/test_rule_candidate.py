from engine.zero_agent.rule_candidate import RuleCandidateEngine

def test_candidate_requires_test_and_confirmation():
    engine = RuleCandidateEngine()
    c = engine.create_from_postmortem('postmortem', 'same error should stop retry')
    assert not engine.can_merge(c, tested=False, user_confirmed=True)
    assert not engine.can_merge(c, tested=True, user_confirmed=False)
    assert engine.can_merge(c, tested=True, user_confirmed=True)
