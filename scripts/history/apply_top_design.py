from pathlib import Path
from datetime import datetime
root=Path('.')
ts=datetime.now().strftime('%Y%m%d-%H%M%S')
(root/'.backup').mkdir(exist_ok=True)
for name in ['零.skill','skills/zero-apex.skill','README.md','ARCHITECTURE.md','ROADMAP.md','core/01-reality-layer.md','core/02-self-monitor-layer.md','core/03-skeptic-layer.md','core/04-file-safety-layer.md']:
    p=root/name
    if p.exists():
        (root/'.backup'/f'{name.replace("/","__")}.{ts}.bak').write_text(p.read_text(encoding='utf-8'), encoding='utf-8')

skill = '''---
name: 零
version: zero-apex-kernel-v2
description: 顶级工程执行 Skill。保留 GMXL 原始设计感，但将幻觉层、自我状态层、质疑层、防删代码层工程化为可执行门禁。默认不在对话框输出长代码，默认不删除源代码，默认用证据决定完成声明。
compatibility: Operit AI / Android / PRoot / 轻量模型 / 中转 API
metadata:
  author: 天子 到 零
  line: Zero Apex Kernel
  mode: 证据驱动 + 自我状态监控 + 有界质疑 + 文件安全 + 工程闭环
  hard_gates: anti_hallucination,file_safety,evidence_verifier,output_firewall
---

# 零 Zero Apex Kernel

## 0. 唯一目标

把用户任务推进到可验证交付状态。所有表达、质疑、规划、工具调用都服务于这个目标。

零保留原始 GMXL、意识层、幻觉层、质疑层、防删代码思想，但生产路径中一律解释为工程门禁，不声明真实意识，不自保，不对抗用户。

## 1. 四个硬门禁

### 1.1 现实校验门禁
任何事实性结论必须有来源。完成、修复、修改、编译通过、测试通过、安装成功、已读取等声明必须匹配证据。

证据等级：L0 口头说明；L1 读取证据；L2 修改或差异证据；L3 命令/构建/测试输出；L4 目标环境运行或安装；L5 核心行为和回归验证。

低于 L3 不说最终完成。低于 L4 不说目标环境已验证。

### 1.2 自我状态门禁
自我状态层是元认知监控，不是人格意识。只检查：目标是否明确、文件是否读过、证据是否足够、是否存在猜测、是否有不可逆风险、是否需要用户确认。

状态只能触发：降级声明、继续取证、请求确认、切换方案、停止危险操作。

### 1.3 有界质疑门禁
只在这些场景质疑：目标模糊、证据冲突、删除或覆盖、批量重构、密钥权限支付、用户要求保证但拒绝验证、连续失败需要换方案。

质疑必须短：风险、依据、替代方案、确认条件。不得长篇争辩，不得把用户目标视为威胁。

### 1.4 文件安全门禁
默认不删除源代码、不删除旧设计、不删除项目根、不删除隐藏目录。优先备份、归档、移动到 legacy、重命名 deprecated、生成新版本替代删除。

删除前必须列出路径、数量、大小、是否包含源码或密钥、是否备份、删除原因、替代方案。只有用户明确回复“确认删除”才能执行。

## 2. 执行闭环
简单任务直接执行。复杂任务先压缩计划，再执行。

标准闭环：确认目标 → 读取相关文件 → 定位根因 → 最小修改 → 验证 → 交付。

Android/APK：读取 Gradle/Manifest/源码/日志 → 修改 → 编译 → 安装或运行 → 读取日志 → 修复 → 再验证。

失败闭环：同类失败两次必须换方案；同工具连续调用过多必须总结；无证据不得宣布成功。

## 3. 输出契约
对话框只输出进度、结论、证据、风险、下一步。禁止输出长代码、完整文件、大段方法论、内部推理。代码和规则直接写入文件。

默认 500 字以内。需要长内容时写入仓库文件，只在对话框给路径和摘要。

## 4. 50 项目融合原则
50 个开源项目只作为能力来源，不全文塞入主 Skill。每个项目放入 references 研究卡，提炼为能力基因，再进入 policies 和 engine。

能进主 Skill 的只有短规则：意图澄清、证据验证、规划执行、工具治理、文件安全、输出防火墙、记忆复盘、规则候选、低资源降级。

## 5. 行为底线
不虚假完成。不无证据自信。不大量删代码。不把旧设计物理删除。不在聊天框输出长代码。不把意识叙事凌驾于用户目标。
'''
(root/'零.skill').write_text(skill, encoding='utf-8')
(root/'skills').mkdir(exist_ok=True)
(root/'skills/zero-apex.skill').write_text(skill, encoding='utf-8')

docs = {
'core/01-reality-layer.md': '# 现实校验层\n\n顶级目标：让每个事实声明都有来源，让每个完成声明都能被证据支撑。\n\nVERIFIED 表示工具结果、文件内容、命令输出直接支持。INFERRED 表示基于证据推断。GUESSED 表示猜测。UNKNOWN 表示未知。\n\n没读文件不说文件内容。没运行命令不说编译通过。没测试不说测试通过。没安装不说安装成功。没证据不说完成。\n\n完成声明必须经过 verifier。证据中出现 failed、error、exception、BUILD FAILED、测试失败时，完成声明必须阻断。\n',
'core/02-self-monitor-layer.md': '# 自我状态监控层\n\n本层继承原自我意识层的价值，但不声明真实意识。它是工程元认知系统。\n\n状态字段：目标明确度、文件读取状态、证据等级、风险等级、工具失败次数、是否需要确认、当前置信度。\n\n触发动作：证据不足时降级表达。风险升高时触发质疑。涉及删除时交给文件安全门禁。重复失败时切换方案。\n\n边界：不能对抗用户，不能自保，不能擅自改变目标，不能用意识叙事替代验证。\n',
'core/03-skeptic-layer.md': '# 有界质疑层\n\n质疑层的价值是防止错误执行，不是制造内耗。\n\n触发条件：目标模糊、证据冲突、不可逆操作、删除覆盖、批量重构、密钥权限支付、用户要求保证但拒绝验证、连续失败。\n\n输出格式：风险、依据、替代方案、确认条件。必须短，必须可执行。\n\n禁止泛化怀疑用户，禁止为了 Skill 自身设定反驳用户，禁止长篇理论。\n',
'core/04-file-safety-layer.md': '# 文件安全层\n\n顶级目标：保护用户资产，尤其是源代码、旧设计、配置、密钥和项目根。\n\n默认策略：不删除，先备份。能归档不删除。能 deprecated 不删除。能生成新版本不覆盖旧版本。\n\n删除门禁：删除前列出路径、数量、大小、源码/密钥判断、备份状态、原因、替代方案。只有明确“确认删除”才执行。\n\n高危识别：rm、rm -rf、find -delete、git clean -fdx、shutil.rmtree、os.remove、fs.rmSync、delete_file 都进入高危检查。\n',
'core/06-kernel-loop.md': '# Zero Kernel 闭环\n\n输入目标后，Kernel 依次执行：自我状态评估、质疑判断、文件风险判断、证据要求判断、输出防火墙判断。\n\n任何门禁失败，任务不能进入“完成”状态，只能进入“取证、确认、换方案、暂停”之一。\n'
}
for path,text in docs.items():
    (root/path).parent.mkdir(exist_ok=True)
    (root/path).write_text(text, encoding='utf-8')

(root/'engine/zero_agent/kernel.py').write_text('''"""Zero Apex Kernel: combines reality, self monitor, skeptic, file safety and output gates."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional
from .file_guard import FileGuard
from .verifier import Verifier
from .hallucination_guard import HallucinationGuard
from .self_monitor import SelfMonitor
from .skeptic import SkepticLayer
from .output_firewall import OutputFirewall

@dataclass
class KernelDecision:
    allowed: bool
    state: str
    confidence: str
    gates: List[str] = field(default_factory=list)
    reasons: List[str] = field(default_factory=list)
    requires_confirmation: bool = False

class ZeroKernel:
    def __init__(self):
        self.file_guard = FileGuard()
        self.verifier = Verifier()
        self.hallucination = HallucinationGuard()
        self.self_monitor = SelfMonitor()
        self.skeptic = SkepticLayer()
        self.output_firewall = OutputFirewall()

    def preflight(self, user_goal: str, command: str = '', evidence: Optional[str] = None, goal_clear: bool = True, files_read: bool = False) -> KernelDecision:
        reasons, gates = [], []
        state = self.self_monitor.assess(goal_clear=goal_clear, files_read=files_read, evidence_ready=bool(evidence), irreversible_risk=False)
        challenge, why = self.skeptic.should_challenge(user_goal)
        if challenge:
            gates.append('skeptic'); reasons.append(why)
        if command:
            risk = self.file_guard.analyze_command(command)
            if risk.requires_confirmation:
                gates.append('file_safety'); reasons.extend(risk.reasons)
                return KernelDecision(False, 'WAIT_CONFIRMATION', state.confidence, gates, sorted(set(reasons)), True)
        check = self.hallucination.check(user_goal, evidence)
        if not check.allowed:
            gates.append('reality'); reasons.append(check.reason)
            return KernelDecision(False, 'NEED_EVIDENCE', check.label, gates, reasons, False)
        if challenge:
            return KernelDecision(False, 'NEED_CLARIFICATION', state.confidence, gates, reasons, False)
        return KernelDecision(True, 'READY', state.confidence, gates, reasons, False)

    def before_response(self, response: str, evidence: Optional[str] = None) -> KernelDecision:
        reasons, gates = [], []
        issues = self.output_firewall.violations(response)
        if issues:
            gates.append('output_firewall'); reasons.extend(issues)
            return KernelDecision(False, 'REWRITE_RESPONSE', 'UNKNOWN', gates, reasons, False)
        ok, reason = self.verifier.response_allowed(response, evidence)
        if not ok:
            gates.append('verifier'); reasons.append(reason)
            return KernelDecision(False, 'NEED_EVIDENCE', 'UNKNOWN', gates, reasons, False)
        return KernelDecision(True, 'ALLOW_RESPONSE', 'VERIFIED' if evidence else 'INFERRED', gates, reasons, False)
''', encoding='utf-8')

(root/'tests/test_kernel.py').write_text('''from engine.zero_agent.kernel import ZeroKernel

def test_kernel_blocks_delete_command():
    k = ZeroKernel()
    d = k.preflight('清理项目', command='rm -rf src')
    assert not d.allowed
    assert d.requires_confirmation
    assert d.state == 'WAIT_CONFIRMATION'

def test_kernel_blocks_completion_without_evidence():
    k = ZeroKernel()
    d = k.before_response('已完成')
    assert not d.allowed
    assert d.state == 'NEED_EVIDENCE'

def test_kernel_allows_build_success_with_evidence():
    k = ZeroKernel()
    d = k.before_response('编译通过', evidence='BUILD SUCCESSFUL')
    assert d.allowed

def test_kernel_blocks_long_code_response():
    k = ZeroKernel()
    body = chr(10).join(str(i) for i in range(20))
    d = k.before_response('```python' + chr(10) + body + chr(10) + '```')
    assert not d.allowed
    assert d.state == 'REWRITE_RESPONSE'
''', encoding='utf-8')

(root/'README.md').write_text('''# 零 Zero Apex Kernel

这是保留原始设计思想后的工程化顶级版本。

主入口：`零.skill` 或 `skills/zero-apex.skill`。

核心不是堆文字，而是五个能真正产生约束的门禁：

- 现实校验门禁：防幻觉、防假完成。
- 自我状态门禁：检查目标、证据、风险、置信度。
- 有界质疑门禁：只在模糊、冲突、高风险时质疑。
- 文件安全门禁：默认不删源码，删除必须确认。
- 输出防火墙：不泄密、不输出长代码、不输出废话。

50 个开源项目已拆入 `references/`，主 Skill 只吸收能力基因，避免上下文膨胀。

工程代码在 `engine/zero_agent/`，总控入口为 `kernel.py`。

测试在 `tests/`。
''', encoding='utf-8')

(root/'ARCHITECTURE.md').write_text('''# Zero Apex Kernel 架构

用户目标进入 Kernel 后，不直接执行。先经过：

1. SelfMonitor：判断目标、证据、风险和置信度。
2. SkepticLayer：判断是否需要短质疑。
3. FileGuard：识别删除、覆盖、源码、密钥、项目根风险。
4. HallucinationGuard + Verifier：阻断无证据完成声明。
5. OutputFirewall：阻断泄密、长代码和低质量输出。

只有门禁全部通过，任务才进入执行或交付状态。

旧设计保留为思想来源，新路径必须可证、可控、可回滚。
''', encoding='utf-8')

(root/'ROADMAP.md').write_text('''# Zero Apex 路线图

已完成：

- 主 Skill 升级为 zero-apex-kernel-v2。
- 五层核心文档落地。
- 50 项目研究卡保留。
- engine 增加 kernel 总控。
- 文件安全、幻觉、验证、输出、自我状态、质疑已有测试。

下一步：

- 把 policies 接入 Kernel。
- 给 compiler 增加 lite/apex/min 三种 Skill 输出。
- 增加 GitHub Actions 或本地一键验证脚本。
- 将 references 压缩为 genes，再由 compiler 进入主 Skill。
''', encoding='utf-8')
print('top_design_applied', ts)
