from engine.zero_agent.fusion_registry import FUSION_GENES, summary, by_layer
from engine.zero_agent.compiler import SkillCompiler

def test_all_50_projects_fused():
    assert len(FUSION_GENES) == 50
    assert summary()['count'] == 50

def test_memory_layer_exists():
    assert len(by_layer('Memory')) >= 10

def test_compiler_outputs_apex_contains_fusion():
    text = SkillCompiler('.').compile('apex')
    assert '50 项目融合索引' in text
    assert 'OmniAgent' in text
    assert 'conversation-memory-skill' in text
