from engine.zero_agent.kernel import ZeroKernel

def test_kernel_blocks_delete_command():
    k = ZeroKernel()
    d = k.preflight('清理项目', command='rm -rf src')
    assert not d.allowed
    assert d.requires_confirmation
    assert d.state == 'WAIT_CONFIRMATION'

def test_kernel_blocks_completion_without_evidence():
    k = ZeroKernel()
    d = k.before_response('已完成')
    assert not d.allowed
    assert d.state == 'NEED_EVIDENCE'

def test_kernel_allows_build_success_with_evidence():
    k = ZeroKernel()
    d = k.before_response('编译通过', evidence='BUILD SUCCESSFUL')
    assert d.allowed

def test_kernel_blocks_long_code_response():
    k = ZeroKernel()
    body = chr(10).join(str(i) for i in range(20))
    d = k.before_response('```python' + chr(10) + body + chr(10) + '```')
    assert not d.allowed
    assert d.state == 'REWRITE_RESPONSE'
