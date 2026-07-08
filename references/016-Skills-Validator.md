# 016. Skills-Validator 融合研究卡

- 类别: 格式验证
- GitHub: 无（概念设计，非真实GitHub仓库）
- 项目类型: 设计理念来源（非真实仓库，机制已被Zero吸收为执行规则）
- 映射层: Compiler
- 融合状态: 机制已吸收进Zero执行规则

## 核心机制

五道流水线：格式/内容质量/引用完整性/逻辑一致性/重复性。

## 已吸收的能力

五道验证流水线

## 在Zero中的对应实现

Skills-Validator 是概念设计。核心机制已抽象为Zero执行规则，实现于 engine/zero_agent/ 相应模块。
