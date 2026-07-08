# 零 Zero Apex Skill

首席工程师执行 Skill，面向 Operit AI。

## 核心能力

- 8 个行为钢印：防乱删、限流、输出防火墙、执行验证、防幻觉、输出契约、禁止对话框写代码、自我提醒
- GMXL 四层意识协议：感知层、记忆层、执行层、逻辑层
- 终身记忆系统：遗忘曲线、冷热分层、自进化
- 深度认知架构：19 个认知子协议
- 防降智模块：理解锁、降智检测、救命指令
- 意图澄清：三层漏斗扫描、模糊词检测、多轮澄清
- 50 个开源项目能力基因融合（10 个真实项目 + 40 个设计理念）
- 10 个工作流：senior-developer / software-architect / code-reviewer / sre / devops / minimal-change / systematic-debug / context-engineering / error-recovery / verification-checklist
- AI 编程最佳实践：任务分解、上下文工程、错误恢复、质量门禁
- Python 引擎：28 个模块，含 attention / chain_of_thought / reflection / semantic_cache / agent_runtime / tool_registry / prompt_engine / state_manager / tracer / audit / rate_limiter / output_checker 等

## 安装

在 Operit AI 中创建新 Skill，复制 `零.skill` 内容保存即可。

## 文件结构

```
零.skill                主 Skill 文件（6106行）
engine/zero_agent/      Python 引擎（28个模块，3159行）
policies/               策略定义 YAML
genes/                  能力基因库
references/             50个研究卡
rules/                  8个规则拆分
tests/                  测试用例
scripts/test_engine.py  测试运行器
examples/               使用示例
docs/                   文档
core/                   核心层
legacy/                 历史设计文档
```

## 测试

```bash
python3 scripts/test_engine.py
# === Results: 33 passed, 0 failed ===
```

## 融合的顶级项目

| 项目 | Star | 融合内容 |
|------|------|----------|
| agency-agents | 129k | 6个工作流 |
| LangChain | 141k | tools/prompts/tracers/caches/rate_limiters |
| AutoGen | 59.6k | runtime/multi-agent/state/message |
| mem0 | 25k+ | 语义缓存/记忆检索 |
| depth-skills | -- | 16个认知架构技能 |
| JetBrains/skills | -- | 127个验证技能库 |
| Anthropic Skills | -- | 官方技能标准 |

## 许可

Apache 2.0
