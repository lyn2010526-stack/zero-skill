from engine.zero_agent.tool_guard import ToolGuard

def test_summary_gate_and_reset():
    g = ToolGuard(max_consecutive_normal=2)
    assert g.before_call('read')[0]
    assert g.before_call('read')[0]
    assert not g.before_call('read')[0]
    g.mark_summarized('read')
    assert g.before_call('read')[0]

def test_repeated_failure_blocks_tool():
    g = ToolGuard(max_same_error=2)
    assert g.record_failure('x', 'same')[0]
    assert not g.record_failure('x', 'same')[0]
    assert not g.before_call('x')[0]
