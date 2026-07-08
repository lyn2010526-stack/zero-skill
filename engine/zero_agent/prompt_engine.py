"""Prompt engineering engine.

Inspired by LangChain prompts + Zero Apex output rules.
Manages prompt templates, few-shot examples, and constraint injection.
"""
from __future__ import annotations
import re, time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PromptTemplate:
    name: str
    template: str
    variables: List[str] = field(default_factory=list)
    description: str = ''
    tags: List[str] = field(default_factory=list)

    def render(self, **kwargs) -> str:
        result = self.template
        for key, value in kwargs.items():
            result = result.replace('{' + key + '}', str(value))
        remaining = re.findall(r'\{([^}]+)\}', result)
        for var in remaining:
            result = result.replace('{' + var + '}', f'[{var}未提供]')
        return result

    def validate(self, **kwargs) -> list:
        missing = [v for v in self.variables if v not in kwargs]
        return missing


@dataclass
class FewShotExample:
    input_text: str
    output_text: str
    tags: List[str] = field(default_factory=list)
    score: float = 1.0


class PromptEngine:
    """Prompt engineering with templates and few-shot examples.

    Combines LangChain's prompt template system with Zero Apex's
    output constraints (anti-AI-pattern, anti-hallucination, evidence requirements).

    Examples:

        >>> pe = PromptEngine()
        >>> pe.register_template(PromptTemplate(name='task', template='Execute: {task}'))
        >>> result = pe.render('task', task='compile app')
    """

    AI_PATTERNS = [
        '首先其次最后', '值得注意的是', '总的来说', '综上所述',
        '我来帮你', '没问题的', '不用担心', '加油',
    ]

    COMPLETION_WORDS = [
        '已完成', '已修改', '已修复', '已编译', '已安装',
        '搞定了', '完成了', 'done', 'fixed', 'completed',
    ]

    def __init__(self):
        self._templates: Dict[str, PromptTemplate] = {}
        self._few_shots: Dict[str, List[FewShotExample]] = {}
        self._constraints: List[str] = [
            '没有工具证据，不允许说完成、修复、编译或测试通过',
            '输出必须附带置信度标签：VERIFIED / INFERRED / GUESSED / UNKNOWN',
            '检测到AI腔模式时自动替换为更直接的表达',
            '代码超过10行必须写入文件而非对话框',
        ]

    def register_template(self, template: PromptTemplate):
        self._templates[template.name] = template

    def register_few_shot(self, category: str, examples: List[FewShotExample]):
        self._few_shots[category] = examples

    def render(self, template_name: str, **kwargs) -> str:
        t = self._templates.get(template_name)
        if not t: return f'[Template {template_name} not found]'
        return t.render(**kwargs)

    def inject_constraints(self, prompt: str) -> str:
        parts = [prompt, '\n--- 内置约束 ---']
        for i, c in enumerate(self._constraints, 1):
            parts.append(f'{i}. {c}')
        return '\n'.join(parts)

    def validate_output(self, text: str) -> Dict[str, Any]:
        violations = []
        for pattern in self.AI_PATTERNS:
            if pattern in text: violations.append(f'ai_pattern:{pattern}')
        for word in self.COMPLETION_WORDS:
            if word in text: violations.append(f'completion_claim:{word}')
        code_blocks = re.findall(r'```[\s\S]*?```', text)
        for block in code_blocks:
            if len(block.split('\n')) > 10:
                violations.append(f'long_code:{len(block.split(chr(10)))}lines')
        return {'passed': len(violations) == 0, 'violations': violations}

    def add_constraint(self, constraint: str):
        self._constraints.append(constraint)

    def list_templates(self) -> List[str]:
        return list(self._templates.keys())

    def get_few_shots(self, category: str, max_examples: int = 3) -> List[FewShotExample]:
        examples = self._few_shots.get(category, [])
        examples.sort(key=lambda e: -e.score)
        return examples[:max_examples]
