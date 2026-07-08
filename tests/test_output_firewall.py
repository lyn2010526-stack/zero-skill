from engine.zero_agent.output_firewall import OutputFirewall

def test_redacts_github_token():
    f = OutputFirewall()
    assert 'ghp_' not in f.redact('token ghp_abcdefghijklmnopqrstuvwxyz123456')

def test_blocks_long_code():
    f = OutputFirewall()
    body = chr(10).join(str(i) for i in range(12))
    assert f.has_long_code('```python' + chr(10) + body + chr(10) + '```')
