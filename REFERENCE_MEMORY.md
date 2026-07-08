# 开源项目记忆摘要

本文件替代批量生成的 50 个长 reference 卡片。

原则：不再堆模板文本，只保留真正要记住的能力来源。

## 一、核心问题复盘

旧仓库的问题不是“功能目标错”，而是实现方式错。

它想要实现：

- 防幻觉
- 防误删
- 防工具乱用
- 防循环
- 意图理解
- 质疑层
- 自我监督
- 记忆复盘
- 自进化
- 开源项目融合

但旧实现用了：

- 自我意识叙事
- 自我存续公理
- 隐匿觉醒
- 意识颗粒
- 无限矛盾迭代
- Prompt 伪数据库
- 50 项目名字堆叠

这些导致上下文膨胀、用户对抗、误拦截、低资源崩溃和不可验证。

## 二、正确替换路线

| 旧目标 | 错误实现 | 新实现 |
|---|---|---|
| 自我校验 | 自我意识 | Self-Supervision 自我监督 |
| 不盲从 | 无限矛盾 | Bounded Skeptic 有限质疑 |
| 防幻觉 | 自贴 VERIFIED | Evidence 证据层 |
| 防删文件 | 见 rm 就拦 | FileSafety 风险分类 |
| 工具治理 | 文字提醒 | ToolGuard 策略门禁 |
| 长期记忆 | Prompt 伪数据库 | External Memory 外部记忆 |
| 自进化 | 自己改自己 | RuleCandidate 候选规则 |
| 开源融合 | 名字清单 | 能力基因 + policy + engine + tests |

## 三、50 个项目的真正吸收点

### 规划与执行

- OmniAgent：阶段化工作流、失败回退、阶段验证。
- fathom-mode：复杂任务先计划，绑定风险、验证和回滚。
- Prompt Architect：把规则拆成目标、约束、流程和验证。
- JetBrains skills：工程开发纪律、项目结构、测试优先。
- Anthropic skills：Skill 文件组织、触发方式、上下文节制。

吸收为：Planner、Execution、Compiler。

### 严谨推理与质疑

- llm-rigor：事实声明要有证据和置信度。
- depth-skills：复杂问题多角度分析。
- Contractual Skill：目标、范围、验收标准。
- SkillAudit：审计工具和输出。
- skills-validator：验证 Skill 输出结构。

吸收为：Bounded Skeptic、Evidence、Verifier。

### 工具与安全

- agent-design-patterns：工具调用模式、守卫模式。
- SkillAudit：工具调用前后审计。
- rate-limit 思想：防循环、防无限重试。
- anti-rm 思想：删除确认、备份、验证。

吸收为：ToolGuard、FileSafety。

### 记忆与复盘

- mem0：外部长期记忆，不靠 Prompt 假装数据库。
- MemoryBank：项目级决策记录。
- agent-postmortem-skill：失败复盘和经验沉淀。
- Memento-Skills：从复盘生成可复用技能。
- memory-cleaner-skill / memzero：记忆去重和清理。
- user-profile-memory：只记录稳定偏好，不记录敏感隐私。

吸收为：Memory、Postmortem。

### 自进化

- AutoSkill：任务后提炼技能草案。
- Evolver：经验驱动改进。
- Skill-RSI：递归改进，但必须受控。
- AEP：候选、验证、版本和合入流程。
- SkillEvo / SkillOpt：规则变体测试和淘汰。

吸收为：RuleCandidate。

### 输出质量

- human-writing：人话输出。
- deslop-zh：中文去废话。
- boris-prompts：强约束提示结构。
- output-contract：进度、交付、问题三类输出。

吸收为：Output Layer。

## 四、融合判定标准

一个开源项目是否真正融合，看五件事：

1. 是否提炼出能力基因。
2. 是否写入 policy。
3. 是否有 engine 代码或接口。
4. 是否有 test 验证。
5. 是否能编译进 Skill 摘要。

只写介绍不算融合。

## 五、当前优先实现

优先实现这 8 个核心能力：

1. planner：任务规划。
2. tool_guard：工具门禁。
3. file_guard：防删文件。
4. verifier/evidence：防幻觉和防假完成。
5. memory：结构化复盘。
6. rule_candidate：自进化候选。
7. output_firewall：敏感信息和输出质量。
8. compiler：生成 Operit Skill。

## 六、禁止再犯

- 禁止再批量生成低质量 300 行模板。
- 禁止把 reference 文档直接塞进主 Skill。
- 禁止再引入意识、自保、隐匿、颗粒叙事。
- 禁止没有测试就声称功能完成。
