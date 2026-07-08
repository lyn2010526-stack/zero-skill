# 045. Agent-Evolution-Kit 融合研究卡

- 类别: 自进化
- GitHub: 无（概念设计，非真实GitHub仓库）
- 项目类型: 设计理念来源（非真实仓库，机制已被Zero吸收为执行规则）
- 映射层: RuleCandidate
- 融合状态: 机制已吸收进Zero执行规则

## 核心机制

从失败中学习。失败后记录上下文/分析原因/更新规则/存入记忆。

## 已吸收的能力

失败驱动进化

## 在Zero中的对应实现

Agent-Evolution-Kit 是概念设计。核心机制已抽象为Zero执行规则，实现于 engine/zero_agent/ 相应模块。
