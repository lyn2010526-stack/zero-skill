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

### E3: 引擎架构约定（v3.0.0 精简版）
- Date: 2026-07-23
- Context: 用户指出过度工程化问题，要求精简到真正有用的功能
- Category: 环境配置
- Instructions:
  - 引擎必须保持单文件（QuickJS 沙箱不支持 require()）
  - 只做三件事：命令安全解析 + 文件保护 + 执行审计
  - 不造轮子：不写正则匹配的"AI 安全"层
  - 不假装：不写自评分、不写幻觉检测、不写输出防火墙
  - manifest.json 保留 sandbox/permission 顶层字段
  - 精简后引擎约 536 行，6 个工具

