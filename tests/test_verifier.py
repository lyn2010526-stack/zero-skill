from engine.zero_agent.verifier import Verifier
from engine.zero_agent.evidence import CommandEvidence

def test_blocks_false_completion_with_failed_log():
    v = Verifier()
    assert not v.verify_claim('编译通过', 'BUILD FAILED error: boom')

def test_accepts_build_success():
    v = Verifier()
    ev = CommandEvidence(command='./gradlew assembleDebug', exit_code=0, stdout='BUILD SUCCESSFUL')
    assert v.verify_claim('编译通过', ev)

def test_response_allowed_blocks_no_evidence():
    v = Verifier()
    ok, reason = v.response_allowed('已完成', None)
    assert not ok
    assert 'blocked' in reason
