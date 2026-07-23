# SelfMonitor Reference — 自检层

> 当任务开始前或执行中需要评估工程元状态时加载本文件。

## 适用场景

- 任务启动前的就绪度评估
- 长任务中段状态检查
- 遇到阻塞时诊断原因

## 工具调用

```
self_monitor({
  goal: "修复登录崩溃",
  goal_clear: true,          // 可选：目标是否清晰，默认由 goal 长度推断
  files_read: false,         // 可选：是否已读相关文件
  evidence_ready: false,    // 可选：证据是否就绪
  irreversible_risk: false   // 可选：是否存在不可逆风险
})
```

## 六维元状态

| 维度 | 含义 | 计分 |
|------|------|------|
| goal_clear | 目标清晰（goal 非空且 ≥4 字符） | +30 |
| files_read | 已读相关文件 | +30 |
| evidence_ready | 证据就绪 | +30 |
| irreversible_risk | 无不可逆风险 | +10 |

就绪度评分 0-100。`state` 为 `READY`（无阻塞）或 `NOT_READY`（有阻塞）。

## 认知偏差自检

| 偏差 | 触发模式 | 警告 |
|------|----------|------|
| 乐观偏差 | "应该/大概/可能就是/估计"+ 否定词 | 对失败可能性估计不足 |
| 近因/锚定偏差 | "以前/上次/一般"+"都/就"+"是/这样" | 历史经验权重过高 |
| 过度自信偏差 | "肯定/一定"+"没问题/可以/行" | 缺乏验证的确定性判断 |

偏差检测扫描 `goal` 文本。检测到偏差时加入 `cognitive_biases` 但不阻断，仅作为预警。

## 因果链深度

统计 goal 中的因果标记词（因为/所以/导致/然后/接着/之后/再/才能）：
- `shallow`：0 个标记
- `medium`：1-2 个
- `deep`：≥3 个

深度越高，任务越复杂，需要更谨慎地分步执行。

## 返回结构

```json
{
  "dimensions": { "goal_clear": true, "files_read": false, ... },
  "readiness_score": 60,
  "causal_depth": "medium",
  "cognitive_biases": [{ "bias": "过度自信偏差", "warn": "..." }],
  "blockers": ["改动类任务但未读取相关文件"],
  "state": "NOT_READY",
  "status_card": "[自检] 就绪度 60/100 · 置信度 INFERRED · 因果链 medium · 阻塞: ..."
}
```

## 行为约束

- `state === "NOT_READY"` 时，preflight 不会放行执行
- `blockers` 中的每一条都必须先解决
- 改动类任务（goal 含"修改/重构/修复/删除"）**必须**先 `files_read: true` 才能进入 READY
- `status_card` 应在输出中展示给用户，让用户了解当前工程状态

## 配置位置

- 偏差模式：`self_monitor.bias_patterns`