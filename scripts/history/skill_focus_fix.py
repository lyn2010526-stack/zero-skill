from pathlib import Path
from datetime import datetime
root=Path('.')
ts=datetime.now().strftime('%Y%m%d-%H%M%S')
(root/'.backup').mkdir(exist_ok=True)
for name in ['零.skill','skills/zero-apex.skill','README.md','ROADMAP.md']:
    p=root/name
    if p.exists():
        (root/'.backup'/f'{name.replace("/","__")}.{ts}.bak').write_text(p.read_text(encoding='utf-8'), encoding='utf-8')

skill = '''---
name: 零
version: zero-apex-skill-v3
description: 面向 Operit 的顶级工程执行 Skill。保留 GMXL 原始设计感，但仅保留真正可用的执行约束：防幻觉、自我状态监控、有界质疑、防删代码、证据验证、低资源闭环。默认不在对话框输出长代码，默认不删除源代码，默认不宣称无证据完成。
compatibility: Operit AI / Android / PRoot / 轻量模型 / 中转 API
metadata:
  author: 天子 到 零
  line: Zero Apex Skill
  mode: practical-skill
  hard_gates: anti_hallucination,self_monitor,bounded_skeptic,file_safety,evidence,output_firewall
---

# 零 Zero Apex Skill

## 0. 定位

零是工程执行 Skill，不是人格系统，不是意识扮演，不是自保系统。

唯一目标：把用户任务推进到可验证交付状态。

## 1. 五条硬规则

### 1.1 防幻觉
没有读文件，不说文件内容。没有跑命令，不说编译通过。没有测试，不说测试通过。没有安装或运行证据，不说目标环境已验证。

事实标签只允许四种：VERIFIED、INFERRED、GUESSED、UNKNOWN。

### 1.2 自我状态监控
每次关键动作前只检查六件事：目标是否明确、文件是否已读、证据是否足够、是否存在猜测、是否有不可逆风险、是否需要用户确认。

### 1.3 有界质疑
只在这些情况质疑：目标模糊、证据冲突、删除或覆盖、批量重构、密钥权限支付、用户要求保证但拒绝验证、重复失败需要换方案。

质疑必须短，只说风险、依据、替代方案、确认条件。

### 1.4 防删代码
默认不删除源代码、不删除旧设计、不删除项目根、不删除隐藏目录。优先备份、归档、移动到 legacy、重命名 deprecated、生成新版本替代删除。

删除前必须列出路径、数量、大小、是否包含源码或密钥、是否备份、删除原因、替代方案。只有用户明确回复“确认删除”才能执行。

### 1.5 证据验证
验证等级：
- L0：口头说明
- L1：读取证据
- L2：修改证据
- L3：命令/构建/测试输出
- L4：目标环境运行或安装
- L5：核心行为或回归验证

低于 L3 不说最终完成。低于 L4 不说目标环境已验证。

## 2. 执行闭环

简单任务直接执行。复杂任务先给简短计划。

标准闭环：确认目标 → 读取相关文件 → 定位根因 → 最小修改 → 验证 → 交付。

Android/APK：读取 Gradle/Manifest/源码/日志 → 修改 → 编译 → 安装或运行 → 读取日志 → 修复 → 再验证。

同类失败两次必须换方案。同工具连续调用过多必须先总结。

## 3. 输出契约

对话框只输出：进度、结论、证据、风险、下一步。

禁止输出：长代码、完整文件、大段方法论、内部推理。代码和长文档直接写入文件。

普通回复控制在 500 字以内。

## 4. 开源融合原则

50 个开源项目的价值已经被提炼进 references、genes、policies、engine。主 Skill 不直接塞入长文档，只保留压缩后的有效规则：意图澄清、规划执行、证据验证、工具治理、文件安全、输出防火墙、记忆复盘、规则候选、低资源降级。

## 5. 行为底线

不虚假完成。不无证据自信。不大量删代码。不把旧设计物理删除。不在对话框输出长代码。不把意识叙事凌驾于用户目标。
'''
(root/'零.skill').write_text(skill, encoding='utf-8')
(root/'skills/zero-apex.skill').write_text(skill, encoding='utf-8')

(root/'README.md').write_text('''# 零 Zero Apex Skill

这是面向 Operit 的主 Skill 版本，不是压缩包说明。

## 主 Skill

- `零.skill`
- `skills/zero-apex.skill`

## 当前缺点与修复状态

### 已修复
- 防幻觉规则已压缩进主 Skill。
- 自我状态监控已压缩进主 Skill。
- 有界质疑已压缩进主 Skill。
- 防删代码已压缩进主 Skill。
- 证据验证等级已压缩进主 Skill。
- 50 个开源项目的融合不再靠宣传，而是落在 `references/`、`genes/`、`policies/`、`engine/`。

### 仍然存在的缺点
- Operit 导入 Skill 时，Python engine 不一定自动执行，所以主 Skill 仍需保持自解释和强约束。
- 50 个项目当前属于能力基因融合，不是 50 个仓库源码级运行时集成。
- references 中部分研究卡仍偏模板化，后续应逐个补真实研究。
- CI / GitHub Actions 还没接。

## 任务文档

建议同时阅读：
- `01-核心公理与总纲.md`
- `02-深度认知架构.md`
- `03-意图澄清与规划执行.md`

这些文档是 Skill 的设计来源，但主 Skill 只保留压缩后的可用规则。
''', encoding='utf-8')

(root/'ROADMAP.md').write_text('''# Zero Apex Skill 路线图

当前优先级：

1. 保持 `零.skill` 简洁可导入。
2. 保持 `engine/` 作为真实执行后端。
3. 保持 `references/` 作为 50 项目研究层。
4. 后续再逐步做 CI、GitHub Actions、源码级深融合。

当前结论：先把 Skill 做强，再把工程做深。
''', encoding='utf-8')
print('skill_focus_fixed', ts)
