# 014. Agent-Design-Patterns 融合研究卡

- 类别: 工具治理
- GitHub: 无（概念设计，非真实GitHub仓库）
- 项目类型: 设计理念来源（非真实仓库，机制已被Zero吸收为执行规则）
- 映射层: OutputFirewall
- 融合状态: 机制已吸收进Zero执行规则

## 核心机制

LLM视为不可信组件。每次输出严格校验。格式不对自动修复。三次走备用路径。

## 已吸收的能力

输出校验层、自动修复、降级策略

## 在Zero中的对应实现

Agent-Design-Patterns 是概念设计。核心机制已抽象为Zero执行规则，实现于 engine/zero_agent/ 相应模块。
