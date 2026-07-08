"""Skill compiler: builds lite/apex/min from kernel rules and fusion genes."""
from __future__ import annotations
from pathlib import Path
from .fusion_registry import FUSION_GENES
class SkillCompiler:
    def __init__(self, root: str | Path = '.'):
        self.root = Path(root)
    def fusion_summary(self) -> str:
        return chr(10).join(f'- {g.index:02d}. {g.project}: {g.layer} / {g.mechanism}' for g in FUSION_GENES)
    def compile(self, mode: str = 'apex') -> str:
        base = (self.root/'零.skill').read_text(encoding='utf-8')
        if mode == 'min':
            return base.split('## 4. 50 项目融合原则')[0].strip() + chr(10)
        if mode == 'lite':
            return base
        return base + chr(10) + '## 6. 50 项目融合索引' + chr(10)*2 + self.fusion_summary() + chr(10)
    def write_all(self) -> dict:
        out = self.root/'skills'; out.mkdir(exist_ok=True)
        result = {}
        for mode in ['min','lite','apex']:
            path = out/f'zero-{mode}.skill'
            path.write_text(self.compile(mode), encoding='utf-8')
            result[mode] = str(path)
        return result
