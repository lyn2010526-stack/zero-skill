from dataclasses import dataclass
from typing import List

RISK_WORDS = ['删除', '覆盖', '重构', '密钥', '权限', '付费', '卸载', '格式化']
AMBIGUOUS_WORDS = ['优化', '处理一下', '弄好', '搞定', '修一下', '改一下']

@dataclass
class Plan:
    complexity: str
    goal: str
    steps: List[str]
    risks: List[str]
    verification: List[str]
    needs_confirmation: bool

class Planner:
    def classify_complexity(self, text: str) -> str:
        if any(w in text for w in RISK_WORDS):
            return 'high'
        if len(text) > 80 or '多个' in text or '架构' in text:
            return 'medium'
        return 'low'

    def needs_clarification(self, text: str) -> bool:
        return len(text.strip()) < 8 or any(w in text for w in AMBIGUOUS_WORDS)

    def create_plan(self, text: str) -> Plan:
        complexity = self.classify_complexity(text)
        risks = [w for w in RISK_WORDS if w in text]
        return Plan(
            complexity=complexity,
            goal=text.strip(),
            steps=['读取相关文件', '定位问题', '执行最小修改', '运行验证', '交付结果'],
            risks=risks,
            verification=['文件差异', '命令输出', '测试或构建结果'],
            needs_confirmation=complexity == 'high',
        )
