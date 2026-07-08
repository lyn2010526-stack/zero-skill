from engine.zero_agent.evidence import EvidenceLayer

def test_no_evidence_is_l0():
    e = EvidenceLayer().classify('已完成', None)
    assert e.level == 'L0'

def test_build_success_is_l3():
    e = EvidenceLayer().classify('编译通过', 'BUILD SUCCESSFUL')
    assert e.label == 'VERIFIED'
    assert e.level == 'L3'
