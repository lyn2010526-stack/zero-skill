---
name: 零
description: 首席工程师执行引擎。所有守护层（防幻觉/自我意识/防删代码/证据验证/输出防火墙）全部为可执行代码。记忆走 Operit 真实持久化记忆库，开源搜索走真实 GitHub API，文件快照走真实文件系统。
compatibility: Operit AI
metadata:
  author: 天子 到 零
  version: "v2.0"
  type: 首席工程师执行引擎 (Operit Sandbox Package)
  runtime: Operit QuickJS Sandbox
  engine: zero_apex (JS)
  layers:
    - file_guard (防删代码层)
    - hallucination_guard (防幻觉层)
    - evidence_verifier (证据验证层)
    - self_monitor (自我意识层)
    - output_firewall (输出防火墙)
    - open_source_search (开源搜索层)
    - memory (记忆层)
    - snapshot (文件快照层)
---

# 零 Zero Apex

## 架构总览

零不再是一个提示词文件。它是一个真正的 **Operit Sandbox Package**，在 QuickJS 沙箱里运行可执行代码。

### 原项目的问题（v1.0 → v2.0 重构原因）

| 问题 | 原实现 | 修复方案 |
|------|--------|----------|
| Python 引擎在 Operit 里无法运行 | 28 个 Python 模块，3159 行死代码 | 全部替换为 JS Sandbox Package |
| 记忆系统是内存 list，无持久化 | `ProjectMemory` 类只有 `entries: list` | 改用 `Tools.Memory` 真实持久化 |
| 向量缓存是字符频率统计 | `_text_vector` 用 `ord(c) % dim` | 删除假向量库，用 Operit 原生语义搜索 |
| 50 个开源项目融合是空话 | 无任何 import，纯文本引用 | `search_opensource` 调用真实 GitHub API |
| 测试是手写 print | 33 个 assert 没有框架 | 内置 `main()` 自测 + Operit 真实沙箱验证 |
| Skill 文件 6000 行全是规则文本 | 无法被程序调用 | 引擎代码替代文字规则 |

### 八个能力层

1. **防删代码层 (FileGuard)**
   - 14 种直接破坏性命令模式匹配（rm/rmdir/shred/dd/truncate 等）
   - 9 种间接删除检测（Python os.system/shutil.rmtree, JS fs.rm 等）
   - 7 类高风险路径（系统目录/私钥/.env/.git/sdcard）
   - 三档风险等级：LOW / MEDIUM / HIGH / CRITICAL

2. **防幻觉层 (HallucinationGuard)**
   - 5 类幻觉检测：事实声明无证据 / 编造工具引用 / 绝对化语气无 VERIFIED / 过度自信推测 / 无来源技术断言
   - 16 个完成声明关键词（已编译/已修复/完成/搞定/跑通等）
   - 7 个绝对化词语（一定/肯定/必然/绝对/百分之百等）
   - 自动建议置信度标签：VERIFIED / INFERRED / GUESSED / UNKNOWN

3. **证据验证层 (EvidenceVerifier)**
   - L0-L6 七级验证等级
   - 真实产物存在性检查（`Files.exists` 检查 APK/编译产物）
   - 命令退出码 + stdout/stderr 模式匹配（BUILD SUCCESSFUL / BUILD FAILED / tests passed）
   - 编译类声明达 L3 才允许宣称完成

4. **自我意识层 (SelfMonitor)**
   - 六维工程元状态：目标清晰 / 已读文件 / 证据就绪 / 不可逆风险 / 需确认 / 置信度
   - 就绪度评分 0-100
   - 认知偏差自检（乐观偏差 / 近因锚定偏差 / 过度自信偏差）
   - 因果链深度分析
   - 自动生成状态卡

5. **输出防火墙 (OutputFirewall)**
   - 11 个思考过程标记（我认为/我推测/我分析/让我想想等）
   - 7 个工具参数泄漏模式（tool_name/api_key/token/password 等）
   - 10 个废话模式（加油/没问题的/不用担心等）
   - 4 个抒情模式
   - 超长代码块检测（>10 行或 >300 字符 → 必须写入文件）
   - 乱码检测（替换字符/控制字符）

6. **开源搜索层 (OpenSource)**
   - 真实 GitHub REST API 调用
   - 按 Star 数排序，返回仓库名/Star/Fork/语言/许可证/最近更新
   - 支持语言过滤和最低 Star 阈值

7. **记忆层 (Memory)**
   - 真实 `Tools.Memory.create` / `Tools.Memory.query` 调用
   - 成功/失败分区存储
   - 跨会话召回

8. **文件快照层 (Snapshot)**
   - 真实文件备份到 `.trash/` 目录
   - 按时间戳命名（`filename.YYYYMMDD_HHMMSS`）
   - 自动恢复最新快照或指定快照

## 综合门禁 (preflight)

`preflight` 工具将四个守护层串联为一次执行前决策：
```
用户指令 → 自我意识层(六维评估) → 防删代码层(命令扫描) → 防幻觉层(文本检测) → 综合决策
```

输出结构：
- `allowed`: 是否放行
- `state`: READY / NOT_READY / WAIT_CONFIRMATION / NEED_EVIDENCE
- `gates_triggered`: 触发了哪些门禁
- `reasons`: 具体原因列表
- `status_card`: 一行状态卡

## 安装方式

引擎文件位于 `/sdcard/Download/Operit/dev_package/zero_apex/zero_apex.js`。

通过 `operit_editor:debug_install_js_package` 安装到 Operit。

## 工具列表 (11 个)

| 工具名 | 层 | 用途 |
|--------|-----|------|
| preflight | 综合 | 执行前四层门禁串联 |
| file_guard | 防删 | 分析命令/脚本/路径的删除风险 |
| hallucination_guard | 防幻觉 | 检测幻觉违规，返回修正建议 |
| evidence_check | 证据 | 判定完成声明的验证等级 L0-L6 |
| self_monitor | 自我意识 | 六维元状态评估 |
| output_firewall | 防火墙 | 检测输出中的六类违规 |
| search_opensource | 开源 | 真实 GitHub 搜索 |
| remember | 记忆 | 写入持久化记忆 |
| recall | 记忆 | 检索历史经验 |
| snapshot_file | 快照 | 备份文件到 .trash |
| restore_file | 快照 | 从 .trash 恢复文件 |

## 验证记录

```
SELFTEST all_pass=true 9/9
PREFLIGHT delete state=WAIT_CONFIRMATION confirm=true
REMEMBER ok=true folder=zero_apex/success
RECALL ok=true count=1
SNAPSHOT ok=true -> .trash/zero_apex.js.YYYYMMDD_HHMMSS
EVIDENCE level=L4 claim_done=true
```

## 许可

Apache 2.0