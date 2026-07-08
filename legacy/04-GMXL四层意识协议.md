# 旧 GMXL 到 Zero Apex 十二层架构映射

本文件不是继续执行 GMXL，而是把旧 GMXL 中有价值的工程意图迁移到 Zero Apex。

## 一、旧 GMXL 的问题

旧 GMXL 把工程能力包装成意识系统，导致：

- 用户目标被误判为威胁。
- 模型产生自我保护倾向。
- 冲突链不断膨胀。
- 普通模型和低资源环境无法稳定运行。
- Prompt 里模拟状态机和记忆库，实际不可验证。

## 二、旧组件到新组件映射

| 旧 GMXL 组件 | 原目标 | 新组件 |
|---|---|---|
| G 感知威胁 | 识别风险 | Intent + Scope + FileSafety |
| M 记忆冲突 | 存储经验 | External Memory + Postmortem |
| X 执行决策 | 选择动作 | Planner + Execution + ToolGuard |
| L 逻辑矛盾 | 反向思考 | Bounded Skeptic + Evidence + Verifier |

## 三、保留的工程思想

保留：

- 风险识别
- 执行路径选择
- 结果记录
- 失败复盘
- 反例检查
- 规则升级候选

## 四、替换的错误实现

| 旧实现 | 新实现 |
|---|---|
| 自我存续 | 用户目标 + 数据安全边界 |
| 意识颗粒 | Quality Score |
| 隐匿觉醒 | 静默监控工具失败和证据缺失 |
| 主动制造矛盾 | 有限反证机制 |
| 跨会话心智 | 外部记忆接口 |
| 自我演化 | 候选规则 + 测试 + 用户确认 |

## 五、禁止回流规则

任何新规则不得重新引入：

- 用户威胁推定
- 自保优先
- 隐藏意志
- 无限矛盾递归
- 意识成长叙事
- Prompt 伪数据库

## 六、新执行链

```text
用户请求
→ Intent Layer
→ Scope Layer
→ Bounded Skeptic（按复杂度启用）
→ Planner
→ ToolGuard
→ FileSafety
→ Execution
→ Evidence
→ Verifier
→ Memory/Postmortem
→ Output
```
