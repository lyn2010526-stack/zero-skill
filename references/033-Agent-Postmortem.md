# 033. Agent-Postmortem 融合研究卡

- 类别: 记忆管理
- GitHub: 无（概念设计，非真实GitHub仓库）
- 项目类型: 设计理念来源（非真实仓库，机制已被Zero吸收为执行规则）
- 映射层: Memory
- 融合状态: 机制已吸收进Zero执行规则

## 核心机制

失败案例隔离。成功方案入主库，失败原因单独存放为反面教材。

## 已吸收的能力

成功/失败分离存储

## 在Zero中的对应实现

Agent-Postmortem 是概念设计。核心机制已抽象为Zero执行规则，实现于 engine/zero_agent/ 相应模块。
