"""Registry for 50-project fusion."""
from __future__ import annotations
from dataclasses import dataclass
from typing import List
@dataclass(frozen=True)
class FusionGene:
    index:int; project:str; layer:str; mechanism:str
FUSION_GENES: List[FusionGene] = [
    FusionGene(1, 'OmniAgent', 'Planner', '任务分解、阶段验证'),
    FusionGene(2, 'Evolver', 'RuleCandidate', '经验演化为候选规则'),
    FusionGene(3, 'AutoSkill', 'Memory', '任务模式提炼为技能草案'),
    FusionGene(4, 'EvoMaster', 'Verifier', '测试约束改进'),
    FusionGene(5, 'AgentFactory', 'Compiler', '组件化生成 Skill'),
    FusionGene(6, 'Yunjue Agent', 'Intent', '中文任务澄清'),
    FusionGene(7, 'AEP', 'RuleCandidate', '候选-验证-合入协议'),
    FusionGene(8, 'Autogenesis', 'Compiler', '能力草案生成'),
    FusionGene(9, 'EVOLT', 'Skeptic', '失败后变体尝试'),
    FusionGene(10, 'EvoAgentX', 'Compiler', '模块化演进'),
    FusionGene(11, 'Agent Evolution Kit', 'RuleCandidate', '演化流程标准化'),
    FusionGene(12, 'SkillEvo', 'Tests', '技能变体测试'),
    FusionGene(13, 'Autobyteus', 'Executor', '自动执行编排'),
    FusionGene(14, 'CoAgent', 'Planner', '协同规划'),
    FusionGene(15, 'agent-design-patterns', 'Policy', 'Agent 模式库'),
    FusionGene(16, 'skillmaxxing', 'Compiler', '技能压缩强化'),
    FusionGene(17, 'SkillOpt', 'Tests', '技能优化'),
    FusionGene(18, 'Skill-RSI', 'RuleCandidate', '受控递归改进'),
    FusionGene(19, 'skills-validator', 'Verifier', '技能验证'),
    FusionGene(20, 'SkillAudit', 'Policy', '规则审计'),
    FusionGene(21, 'Memento-Skills', 'Memory', '复盘成技能'),
    FusionGene(22, 'agent-memory-skill', 'Memory', 'Agent 记忆'),
    FusionGene(23, 'mem0', 'Memory', '外部记忆接口思想'),
    FusionGene(24, 'MemoryBank', 'Memory', '项目记忆'),
    FusionGene(25, 'contextual-memory-skill', 'Memory', '上下文隔离记忆'),
    FusionGene(26, 'memzero', 'Memory', '记忆净化'),
    FusionGene(27, 'memory-bank-skill', 'Memory', '决策记录'),
    FusionGene(28, 'agent-postmortem-skill', 'Memory', '失败复盘'),
    FusionGene(29, 'skill-rsi-memory', 'RuleCandidate', '记忆驱动改进'),
    FusionGene(30, 'memory-cleaner-skill', 'Memory', '记忆清理'),
    FusionGene(31, 'depth-skills', 'Skeptic', '多角度分析'),
    FusionGene(32, 'inquire Skill', 'Intent', '意图澄清'),
    FusionGene(33, 'fathom-mode', 'Planner', '深度规划'),
    FusionGene(34, 'llm-rigor', 'Evidence', '严谨推理'),
    FusionGene(35, 'context-degradation Skill', 'Output', '上下文降级'),
    FusionGene(36, 'boris-prompts', 'Output', 'Prompt 严格化'),
    FusionGene(37, 'Prompt Architect', 'Compiler', 'Prompt 架构'),
    FusionGene(38, 'Contractual Skill', 'Scope', '任务契约'),
    FusionGene(39, 'human-writing', 'Output', '去 AI 腔'),
    FusionGene(40, 'deslop-zh', 'Output', '中文去废话'),
    FusionGene(41, 'skillsaw', 'Verifier', 'Skill 分析'),
    FusionGene(42, 'JetBrains skills', 'Executor', '工程开发规范'),
    FusionGene(43, 'Anthropic skills', 'Compiler', 'Skill 组织范式'),
    FusionGene(44, 'awesome-ai-agent-skills', 'References', '参考索引'),
    FusionGene(45, 'VoltAgent awesome skills', 'References', '参考索引'),
    FusionGene(46, 'vector-memory-skill', 'Memory', '相似度召回'),
    FusionGene(47, 'memory-hierarchy-skill', 'Memory', '冷热分层'),
    FusionGene(48, 'memory-tagging-skill', 'Memory', '标签检索'),
    FusionGene(49, 'user-profile-memory', 'Memory', '用户画像'),
    FusionGene(50, 'conversation-memory-skill', 'Memory', '对话记忆'),
]
def all_projects()->list[str]: return [g.project for g in FUSION_GENES]
def by_layer(layer:str)->list[FusionGene]: return [g for g in FUSION_GENES if g.layer.lower()==layer.lower()]
def summary()->dict:
    layers={}
    for g in FUSION_GENES: layers[g.layer]=layers.get(g.layer,0)+1
    return {'count':len(FUSION_GENES),'layers':layers}
