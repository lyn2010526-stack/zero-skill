# 零 Zero Apex

> Operit 沙箱可执行工程守护引擎。守护层为 JS 代码，非提示词。

## 这是什么

一个 Operit Sandbox Package，在 QuickJS 沙箱内运行可执行代码，为工程任务提供四层门禁：防删代码、防幻觉、证据验证、自我意识。所有"守护"行为由代码强制执行并返回结构化结果，不是软提示词。

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
 │    ├── ResultEnvelope       统一返回体
 │    ├── ErrorCode            错误码枚举
 │    ├── AuditLogger          触发日志 (#8)
 │    ├── BlockEnforcer        硬阻断拦截器 (#5)
 │    ├── ManifestLoader       环境裁剪 (#7)
 │    ├── FileGuard            防删代码层
 │    ├── Hallucination        防幻觉层
 │    ├── Evidence             证据验证层
 │    ├── SelfMonitor          自我意识层
 │    ├── OutputFirewall       输出防火墙
 │    ├── OpenSource           GitHub API 搜索
 │    ├── Memory               Operit 持久化记忆
 │    └── Snapshot             .trash 备份/恢复
 └── scripts/evolve.js (自动进化闭环 #6)
      提取失败经验 → 聚类 → 生成新 reference → 测试 → 备份 → 合并
```

## 八个能力层

1. **防删代码层 (FileGuard)** — 14 种破坏命令 + 9 种间接删除 + 7 类高风险路径 + 路径遍历检测
2. **防幻觉层 (Hallucination)** — 5 类幻觉检测 + 自动置信度标签建议
3. **证据验证层 (Evidence)** — L0-L6 七级验证 + 真实产物存在性检查
4. **自我意识层 (SelfMonitor)** — 六维元状态 + 认知偏差自检 + 因果链深度
5. **输出防火墙 (OutputFirewall)** — 6 类违规检测
6. **开源搜索层 (OpenSource)** — 真实 GitHub API + 重试 + 限流
7. **记忆层 (Memory)** — Operit 持久化记忆 + 分片 + LRU 缓存
8. **文件快照层 (Snapshot)** — .trash 备份/恢复 + 路径互斥

## 安装

引擎文件：`engine/zero_apex.js`

```
operit_editor:debug_install_js_package
```

详见 `references/operit_capabilities.md` 中的权限分级和能力探测流程。

## 工具列表（13 个）

| 工具 | 层 | 用途 |
|------|-----|------|
| `preflight` | 综合 | 四层门禁串联 |
| `file_guard` | 防删 | 命令/脚本/路径风险分析 |
| `hallucination_guard` | 防幻觉 | 幻觉检测 + 标签建议 |
| `evidence_check` | 证据 | L0-L6 验证等级 |
| `self_monitor` | 自我意识 | 六维元状态评估 |
| `output_firewall` | 防火墙 | 六类违规检测 |
| `search_opensource` | 开源 | GitHub API 搜索 |
| `remember` | 记忆 | 写入持久化记忆 |
| `recall` | 记忆 | 检索历史经验 |
| `snapshot_file` | 快照 | 备份到 .trash |
| `restore_file` | 快照 | 从 .trash 恢复 |
| `enforce_block` | 强制拦截 | preflight BLOCK 后硬阻断后续工具调用 |
| `audit_log` | 调试 | 查看最近的工具调用审计记录 |

## 测试

```
node tests/test_zero_apex.js        # 引擎 + DI 集成 + 守卫层
node tests/test_skill_activation.js # skill 层行为约束 + 强制拦截 + 环境裁剪 + 审计日志 + 进化闭环
```

当前测试覆盖：内置自测 19 项 + DI 集成 40+ 断言 + 守卫层 15+ 断言 + skill 层 113 断言。

## Skill 结构

本仓库遵循渐进式披露的三层结构：

1. **元信息层**（`零.skill` frontmatter）：始终加载，包含触发条件、不适用场景、路由表
2. **指令层**（`零.skill` 正文）：激活后加载，定义工作流和约束
3. **资源层**（`references/*.md`）：按场景按需加载，每层一个文件

模型根据 frontmatter 中的 `triggers` 和"激活条件"表，仅在对应场景出现时读取对应 reference，避免上下文膨胀。

## 许可

Apache 2.0