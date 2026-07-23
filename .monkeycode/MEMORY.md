# 用户指令记忆

本文件记录了用户的指令、教导，以及 Agent 在执行任务过程中发现的项目知识。

## 格式

### 用户指令条目
[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [提及的场景或时间]
- Instructions:
  - [用户教导或指示的内容，逐行描述]

### 项目知识条目
[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [具体任务描述] 时发现
- Category: [运维部署|构建方法|测试方法|排错调试|工作流协作|环境配置]
- Instructions:
  - [具体的知识点，逐行描述]

## 去重策略
- 添加新条目前，检查是否存在相似或相同的指令
- 若发现重复，跳过新条目或与已有条目合并
- 合并时，更新上下文或日期信息

## 条目

### E1: 推送用 token + 推送后还原 remote URL
- Date: 2026-07-23
- Context: 用户要求发布 release
- Category: 运维部署
- Instructions:
  - 推送用 token 存储在环境变量中，不写入任何文件
  - 推送后必须还原 remote URL（去掉 token）

### E2: 仓库和分支
- Date: 2026-07-23
- Context: 基础项目信息
- Category: 运维部署
- Instructions:
  - 仓库: https://github.com/lyn2010526-stack/zero-skill
  - 默认分支: master
  - 引擎文件: /workspace/engine/zero_apex.js
  - 测试文件: /workspace/tests/test_zero_apex.js

### E3: 引擎架构约定
- Date: 2026-07-23
- Context: 开发引擎时的约束
- Category: 环境配置
- Instructions:
  - 引擎必须保持单文件（QuickJS 沙箱不支持 require()）
  - manifest.json 更新必须从 git HEAD 重建（保留 sandbox/permission 顶层字段）
  - META_TOOLS 集中一处，用 isMetaTool() 消费
  - flushSize=1 每条即时落盘
  - ConfigRegistry.lock() bootstrap 后锁定 7 个安全 key

### E4: 项目审计发现的 12 个问题修复
- Date: 2026-07-23
- Context: 外部审计指出项目存在 12 个缺陷，用户要求全部修复
- Category: 工作流协作
- Instructions:
  - P0: 对抗性测试、Hallucination 语义升级
  - P1: deps 接口规范化、CommandNormalizer 盲区补全
  - P2: 置信度校准、输出防火墙边界清晰化、快照异地备份、进化闭环验证
  - P3: 工具数量认知负担、上下文膨胀控制、英文国际化支持
  - QuickJS 能力天花板属于架构约束，无法修复，需文档化

### E5: 修复后的版本号规则
- Date: 2026-07-23
- Context: v2.5.10 之后修复 12 个审计问题
- Category: 构建方法
- Instructions:
  - 新版本: v2.5.11（审计修复版）
  - 测试组: runV2511AuditFixTests()
  - 新模块编号: §27(AdversarialTest), §28(DepsContract), §29(FirewallBoundary), §30(Calibration)

