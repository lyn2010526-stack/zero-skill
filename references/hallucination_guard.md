# HallucinationGuard Reference — 防幻觉层

> 当输出含技术断言、完成声明、绝对化语气时加载本文件。

## 适用场景

- 即将输出包含"已编译/已修复/完成/搞定"等完成声明
- 即将输出包含"已废弃/不再支持/最新版本移除"等技术断言
- 即将使用"一定/肯定/显然/众所周知"等语气

## 工具调用

```
hallucination_guard({
  text: "编译通过了，这个 bug 已修复",
  evidence: "BUILD SUCCESSFUL\nexit_code: 0"   // 可选
})
```

## 五类检测规则

| 规则 | 触发条件 | 修正建议 |
|------|----------|----------|
| `fact_without_evidence` | 文本含完成声明关键词 + 无 evidence | 补充工具执行证据，或改为"正在..."过程描述 |
| `fabricated_citation` | 提到"工具返回/命令输出/日志显示" + 无 evidence | 删除该引用，或附上真实工具记录 |
| `absolute_without_verified` | 使用绝对化词 + 无 `VERIFIED` 标签 | 加 `VERIFIED` 标签 + 工具结果引用，或降级 `GUESSED` |
| `overconfident` | 使用"显然/很明显/不用想/众所周知" | 需 ≥2 独立来源交叉验证，否则替换为 `INFERRED` |
| `unsourced_tech_assertion` | 声明某 API"已废弃/已移除/不再支持" | 必须引用官方文档/发行说明，否则加 `UNKNOWN` 并标"需查证" |

## 配置位置

- 完成声明关键词：`hallucination.fact_claims`（16 个）
- 绝对化词：`hallucination.absolute_words`（7 个）
- 过度自信词：`hallucination.overconfident_words`（4 个）
- 技术断言模式：`hallucination.tech_patterns`（3 个正则）
- 合法标签：`hallucination.valid_labels`（`VERIFIED` `INFERRED` `GUESSED` `UNKNOWN`）

## 返回结构

```json
{
  "allowed": false,
  "current_label": null,
  "suggested_label": "GUESSED",
  "has_evidence": false,
  "is_fact_claim": true,
  "violations": [{ "rule": "fact_without_evidence", "hit": "已修复", "fix": "..." }],
  "verdict": "BLOCK: 存在 1 处幻觉风险，需修正后输出"
}
```

## 行为约束

- `allowed === false` 时，**禁止**直接输出该文本，必须先修正
- `fact_without_evidence` 规则触发时，preflight 会阻断执行
- 结论性声明必须附带标签之一，或提供证据
- 过程描述（以"正在/准备/接下来"开头）豁免标签要求