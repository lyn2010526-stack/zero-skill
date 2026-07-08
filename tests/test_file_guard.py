from engine.zero_agent.file_guard import FileGuard

def test_detects_rm_rf_variants():
    g = FileGuard()
    assert g.is_delete_command('rm -r -f src')
    assert g.is_delete_command('busybox rm -rf src')
    assert g.is_delete_command('find . -delete')
    assert g.is_delete_command('git clean -fdx')
    assert g.is_delete_command('python -c "import shutil; shutil.rmtree(\'src\')"')

def test_source_and_secret_need_confirmation():
    g = FileGuard()
    assert g.requires_confirmation('src/MainActivity.kt')
    assert g.requires_confirmation('.env')
    assert g.requires_confirmation('build.gradle')

def test_confirmation_checklist():
    g = FileGuard()
    data = g.make_confirmation_checklist(['src/MainActivity.kt'], 'cleanup')
    assert data['count'] == 1
    assert data['requires_phrase'] == '确认删除'
    assert data['contains_source_or_sensitive']
