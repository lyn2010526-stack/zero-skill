# Zero Apex 产品总纲

Zero Apex 是 Operit 可用的顶级工程师 Skill 产品。

目标不是堆文字，而是把开源 Agent/Skill/Memory/Prompt 项目的有效机制转化为：

```text
能力基因 → policy → engine → tests → compiled skill
```

## 一、产品目标

Zero Apex 要做到：

1. 理解用户真实意图。
2. 对模糊目标主动澄清。
3. 对错误方案有限质疑。
4. 对工具调用设门禁。
5. 对文件删除设保护。
6. 对完成宣称要证据。
7. 对失败任务做复盘。
8. 对可复用经验生成候选规则。
9. 对低资源环境自动降级。
10. 最终能编译成 Operit Skill。

## 二、产品形态

```text
REFERENCE_MEMORY.md   开源项目核心记忆摘要
genes/                能力基因
policies/             可执行策略
engine/               Python 执行引擎
tests/                行为测试
skills/               编译后的 Operit Skill
```

不再维护低质量长篇 reference 模板。

## 三、十二层架构

1. Intent Layer
2. Scope Layer
3. Bounded Skeptic Layer
4. Planner Layer
5. ToolGuard Layer
6. FileSafety Layer
7. Evidence Layer
8. Execution Layer
9. Verifier Layer
10. Memory Layer
11. RuleCandidate Layer
12. Output Layer

## 四、开发顺序

### M1：文档根基

重写主文档和 rules，去掉旧版矛盾。

### M2：能力基因

把开源项目提炼成少量高质量 genes。

### M3：引擎实现

实现 planner、tool_guard、file_guard、verifier、memory、rule_candidate、compiler。

### M4：测试

每个核心能力都有测试。

### M5：编译 Skill

由 compiler 生成真正给 Operit 导入的 `zero-apex.skill`。

## 五、质量门槛

任何能力必须满足：

- 有明确触发条件。
- 有执行动作。
- 有验证方式。
- 有失败策略。
- 有测试。

不满足则只能叫想法，不能叫功能。
