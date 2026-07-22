# 零 Zero Apex

> Operit 沙箱可执行工程守护引擎。守护层为 JS 代码，非提示词。

## 这是什么

一个 Operit Sandbox Package，在 QuickJS 沙箱内运行可执行代码，为工程任务提供门禁：防删代码、防幻觉、证据验证、输出防火墙、记忆、快照。所有"守护"行为由代码强制执行并返回结构化结果，不是软提示词。

## 两种运行形态

| 形态 | 守护层 | 能力 | 适用 |
|------|--------|------|------|
| 纯提示词版 | 软约束 | 仅规则指导，无真实检查 | 只读分析、方案设计 |
| ToolPkg 版 | 可执行代码 | 真实文件/API/记忆操作 | 编译/安装/测试/交付 |

纯提示词版**无法**做真实验证。模型在纯提示词版下会主动声明"当前为提示词模式，无法执行真实验证"。

## 架构

```
零.skill (元信息层 + 路由)
 ├── manifest.json (机器可读清单，框架自动索引)
 ├── references/*.md (资源层，按场景按需加载)
 ├── engine/zero_apex.js (指令层，QuickJS 沙箱可执行)
 │    ├── ConfigRegistry      统一配置中心
 │    ├── PathUtils            跨平台路径工具
 │    ├── RetryPolicy          指数退避重试
 │    ├── ConcurrencyLimiter   并发限流
 │    ├── FileLock             路径互斥锁
 │    ├── LRUCache             有界缓存
 │    ├── TemplateStore        模板外部化
 │    ├── OutputChunker        大输出分块
 │    ├── TaskLedger           优先级任务队列
 │    ├── ErrorCode            错误码枚举
 │    ├── AuditLogger          触发日志
 │    ├── BlockEnforcer        硬阻断拦截器
 │    ├── ManifestLoader       环境裁剪
 │    ├── FileGuard            防删代码层
 │    ├── Hallucination        防幻觉层
 │    ├── Evidence             证据验证层
 │    ├── SelfMonitor          自检层（目标清晰度、置信度、准备度评分）
 │    ├── OutputFirewall       输出防火墙（秘密泄露、思考泄漏、填充语）
 │    ├── OpenSource           GitHub API 搜索
 │    ├── Memory               Operit 持久化记忆
 │    └── Snapshot             .trash 备份/恢复/自动清理
 └── scripts/evolve.js (自动进化闭环)
      提取失败经验 → 聚类 → 生成新 reference → 测试 → 备份 → 合并
```

## 能力层

1. **防删代码层 (FileGuard)** — 14 种破坏命令正则匹配 + 9 种间接删除 + 7 类高风险路径 + **CommandNormalizer 混淆解码**（hex/unicode/octal 转义、反引号、$()、eval 字面量、base64 管道）
2. **防幻觉层 (Hallucination)** — **结构化证据分级 L0-L5**（解析 exit_code、BUILD SUCCESSFUL、tests passed、supports 数组、文件路径）+ 5 类幻觉关键词检测
3. **证据验证层 (Evidence)** — L0-L6 七级验证 + 真实产物存在性检查
4. **自检层 (SelfMonitor)** — 评估目标清晰度、置信度、准备度评分（0-100）+ 因果链深度
5. **输出防火墙 (OutputFirewall)** — 6 类违规检测：秘密泄露、思考泄漏、工具泄漏、填充语、情绪化表达、超大代码块
6. **开源搜索层 (OpenSource)** — 真实 GitHub API + 重试 + 限流
7. **记忆层 (Memory)** — Operit 持久化记忆 + 分片 + LRU 缓存
8. **文件快照层 (Snapshot)** — .trash 备份/恢复 + 路径互斥 + 自动清理（TTL/容量）+ **tombstone 墓碑机制**（Files.delete 不可用时用恢复指针替代）

## 工具数量

引擎共有 19 个可执行工具，其中 preflight 串联 6 个门禁层。

## preflight 串联

`preflight` 工具一次性触发全部 6 个门禁层：

| 层 | 触发条件 | 结果 |
|----|---------|------|
| 自检层 | 始终 | 置信度 + 准备度评分 |
| 防删层 | 传入 command | 破坏命令 → BLOCK |
| 权限层 | 传入 command + permissions | DENY → BLOCK |
| 防幻觉层 | 传入 goal + evidence | 无证断言 → BLOCK |
| 输出防火墙 | 传入 goal | SEVERE → BLOCK |
| 快照提示 | 破坏性命令 + 已读文件 | 建议先备份 |

## 安装

```bash
bash install.sh                          # 默认路径（/sdcard/Download/Operit/dev_package/zero_apex）
bash install.sh --version v2.5.1         # 版本锁定，版本不匹配时拒绝
bash install.sh ~/custom-path            # 自定义路径
```

安装时自动备份现有版本，失败时输出回滚命令。

## 工具列表（19 个）

| 工具 | 层 | 用途 |
|------|-----|------|
| `preflight` | 综合 | 六层门禁串联 |
| `file_guard` | 防删 | 命令/脚本/路径风险分析（含混淆解码） |
| `hallucination_guard` | 防幻觉 | 结构化证据分级 L0-L5 |
| `evidence_check` | 证据 | L0-L6 验证等级 |
| `self_monitor` | 自检 | 准备度 + 置信度评分 |
| `output_firewall` | 防火墙 | 六类违规检测 |
| `search_opensource` | 开源 | GitHub API 搜索 |
| `remember` | 记忆 | 写入持久化记忆 |
| `recall` | 记忆 | 检索历史经验 |
| `snapshot_file` | 快照 | 备份到 .trash |
| `restore_file` | 快照 | 从 .trash 恢复 |
| `snapshot_cleanup` | 快照 | 清理过期快照（TTL/容量可配置） |
| `tombstone_file` | 快照 | 逻辑删除（Files.delete 不可用时的墓碑机制） |
| `enforce_block` | 强制拦截 | preflight BLOCK 后硬阻断后续工具调用 |
| `audit_log` | 调试 | 查看最近的工具调用审计记录 |
| `evaluate_permission` | 权限 | 按 deny>ask>allow 规则评估工具调用 |
| `check_sandbox` | 沙箱 | 按 profile 校验路径/命令 |
| `config_get` | 配置 | 读取运行时配置项 |
| `config_set` | 配置 | 运行时修改配置项 |

## 测试

```
node tests/test_zero_apex.js        # 引擎 + DI 集成 + 守卫层
node tests/test_skill_activation.js # skill 层行为约束 + 强制拦截 + 环境裁剪 + 审计日志 + 进化闭环
```

CI/CD：GitHub Actions 在 push/PR 时自动运行测试，覆盖率阈值（self-test ≥19, skill ≥100）未达标时阻断合并。

当前测试覆盖：内置自测 19 项 + DI 集成 100+ 断言 + 守卫层 15+ 断言 + skill 层 113 断言 + P0/P1 真实环境回归 24 断言 + 实际使用审计 10 断言。

## Skill 结构

本仓库遵循渐进式披露的三层结构：

1. **元信息层**（`零.skill` frontmatter）：始终加载，包含触发条件、不适用场景、路由表
2. **指令层**（`零.skill` 正文）：激活后加载，定义工作流和约束
3. **资源层**（`references/*.md`）：按场景按需加载，每层一个文件

模型根据 frontmatter 中的 `triggers` 和"激活条件"表，仅在对应场景出现时读取对应 reference，避免上下文膨胀。

## 许可

Apache 2.0
