# 031. Conversation-Memory 融合研究卡

- 类别: 记忆管理
- GitHub: 无（概念设计，非真实GitHub仓库）
- 项目类型: 设计理念来源（非真实仓库，机制已被Zero吸收为执行规则）
- 映射层: Memory
- 融合状态: 机制已吸收进Zero执行规则

## 核心机制

对话级隔离。对话上下文与项目上下文物理隔离。结束后归档。

## 已吸收的能力

对话级隔离归档

## 在Zero中的对应实现

Conversation-Memory 是概念设计。核心机制已抽象为Zero执行规则，实现于 engine/zero_agent/ 相应模块。
