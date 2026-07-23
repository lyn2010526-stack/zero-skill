# Requirements Document: ZeroApex 真正推理核心

## Introduction

当前 ZeroApex 引擎是一个基于规则的安全网 + 流程控制器，缺乏真正的推理能力。本需求补全四个核心能力：证据链验证、自动校准、上下文感知调度、ReAct 推理循环。

## Glossary

- **证据链 (Evidence Chain)**: 每个声明必须关联具体的工具执行记录，引擎验证该执行确实产出了声明结果
- **自动校准 (Auto-Calibration)**: 工具执行结果自动反馈到 Calibration 模块，无需手动 record()
- **上下文感知调度 (Context-Aware Dispatch)**: 根据当前上下文、历史工具调用、目标结构推荐工具
- **ReAct 循环**: Reason→Act→Observe→Reflect 推理模式，带步骤记忆和回溯能力
- **工具沙箱 (Tool Sandbox)**: 每个工具调用有独立超时、资源限制、输出截断

## Requirements

### REQ-1: 证据链验证

**User Story:** AS 引擎，I want 验证每个声明背后的证据链，so that 防止 LLM 编造不存在的结果。

#### Acceptance Criteria

1. WHEN LLM 输出包含结果声明（如"编译通过"、"部署成功"），引擎 SHALL 要求该声明关联一个工具执行 ID
2. IF 声明无关联执行 ID 或关联执行不存在，引擎 SHALL 标记该声明为 unverified 并拦截
3. WHEN 工具执行成功返回，引擎 SHALL 自动提取执行结果摘要，关联到后续声明
4. WHILE 证据链验证模式开启，引擎 SHALL 维护声明→执行的映射表

### REQ-2: 自动校准

**User Story:** AS 引擎，I want 从工具执行结果自动学习校准数据，so that 不需要手动喂数据就能评估就绪度。

#### Acceptance Criteria

1. WHEN 工具执行完成（成功或失败），引擎 SHALL 自动调用 Calibration.record(预测值, 实际值)
2. IF 工具执行成功，实际值 SHALL 映射为对应成功率区间（如 81-100）
3. IF 工具执行失败，实际值 SHALL 映射为 0
4. WHEN 校准数据 >= 5 条，引擎 SHALL 自动调整 SelfMonitor 的 readiness_score

### REQ-3: 上下文感知调度

**User Story:** AS 引擎，I want 根据上下文和历史推荐工具，so than 不再依赖简单的正则匹配。

#### Acceptance Criteria

1. WHEN LLM 提交目标，引擎 SHALL 分析目标的依赖关系（如"部署"依赖"构建成功"）
2. IF 历史工具调用中有失败记录，引擎 SHALL 优先推荐诊断/修复类工具
3. WHILE 目标包含多个步骤，引擎 SHALL 按依赖拓扑排序推荐工具序列
4. IF 上下文中有未解决的 blockers，引擎 SHALL 拒绝推荐执行类工具

### REQ-4: ReAct 推理循环

**User Story:** AS 引擎，I want 实现 Reason→Act→Observe→Reflect 循环，so that Agent 能多步推理和自我修正。

#### Acceptance Criteria

1. WHEN Agent 收到任务，引擎 SHALL 初始化 ReAct 状态（steps=[], current_phase="reason"）
2. WHILE current_phase="reason"，引擎 SHALL 生成下一步推理并选择工具
3. WHEN 工具执行完成，引擎 SHALL 进入 observe 阶段，提取执行结果
4. IF 执行结果与预期不符，引擎 SHALL 进入 reflect 阶段，生成修正策略
5. WHEN reflect 生成新策略，引擎 SHALL 回到 reason 继续循环
6. IF 循环超过最大步数（默认 10）或任务完成，引擎 SHALL 退出循环

### REQ-5: 工具沙箱

**User Story:** AS 引擎，I want 每个工具调用有独立隔离，so that 恶意或异常工具不影响引擎稳定性。

#### Acceptance Criteria

1. WHEN 工具被调用，引擎 SHALL 设置执行超时（默认 30s）
2. IF 工具执行超时，引擎 SHALL 终止并返回 timeout 错误
3. WHEN 工具返回结果，引擎 SHALL 截断输出到最大长度（默认 8KB）
4. IF 工具抛出异常，引擎 SHALL 捕获并返回标准化错误，不崩溃引擎
