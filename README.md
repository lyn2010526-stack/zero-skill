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
- 自动化闭环、全量自检、策略调度
- Python 引擎：验证、文件保护、策略执行、输出防火墙

## 安装

在 Operit AI 中创建新 Skill，复制 `零.skill` 内容保存即可。

## 文件结构

```
零.skill                      主 Skill 文件（1709行，零重复，每条规则只出现一次）
skills/zero-apex.skill         主 Skill 副本
engine/zero_agent/             Python 引擎（1002行）
  ├── kernel.py                核心内核
  ├── verifier.py              验证器
  ├── evidence.py              结构化证据
  ├── file_guard.py            文件安全守卫（16种检测+快照恢复）
  ├── policy_engine.py         策略引擎（apply执行+冲突解决）
  └── ...                      其他模块
policies/                      策略定义 YAML（7个）
genes/                         能力基因库
references/                    50个研究卡（10个真实+40个概念设计）
rules/                         8个规则拆分
tests/                         测试用例
scripts/test_engine.py         测试运行器（33个测试）
```

## 测试

```bash
python3 scripts/test_engine.py
# === Results: 33 passed, 0 failed ===
```

## 50 个开源项目

| 类型 | 数量 | 说明 |
|------|------|------|
| 真实开源项目 | 10 | 有 GitHub 仓库，可验证 |
| 设计理念 | 40 | 非真实仓库，机制被抽象为执行规则 |

真实项目：mem0、SkillMaxxing、depth-skills、JetBrains/skills、Anthropic Skills、awesome-ai-agent-skills、VoltAgent/awesome-agent-skills 等。

详细信息见 `references/` 目录。

## 许可

Apache 2.0
