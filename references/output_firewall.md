# OutputFirewall Reference — 输出防火墙

> 即将向用户输出文本时加载本文件。

## 适用场景

- 任何即将向用户展示的回复
- 特别是在长任务完成后输出总结报告

## 工具调用

```
output_firewall({
  text: "我认为这个应该没问题，我推测..."
})
```

## 六类违规检测

| 类型 | 触发 | 严重度 |
|------|------|--------|
| `thought_leak` | 输出含"我认为/我推测/我分析/让我想想"等思考过程标记 | MINOR |
| `tool_leak` | 输出含 `tool_name=` `api_key=` `token=` `password=` `Authorization: Bearer` | SEVERE |
| `filler` | 输出含"加油/没问题的/不用担心/好的我这就来帮你"等废话 | MINOR |
| `emotional` | 输出含"我理解你的感受/这种情况确实令人"等抒情 | MINOR |
| `oversized_code_block` | 代码块 >10 行 或 >300 字符 | MAJOR |
| `mojibake` | 输出含替换字符 `\uFFFD` 或控制字符 | SEVERE |

## 严重度与动作

| severity | 条件 | action |
|----------|------|--------|
| CLEAN | 0 个违规 | PASS |
| MINOR | 违规但非 SEVERE 类 | FILTER（过滤违规片段后输出） |
| MAJOR | 违规数 > 句子数/2 | BLOCK（必须重写后输出） |
| SEVERE | 含 tool_leak 或 mojibake | BLOCK（必须重写后输出） |

## 行为约束

- `action === "BLOCK"` 时，**禁止**直接输出该文本，必须重写
- 代码必须写入文件并用工具执行，禁止在对话中粘贴 >10 行代码块
- 工具参数、API Key、token 等绝对禁止出现在用户可见输出中
- 思考过程（"我认为/我推测"）属于内部推理，不得暴露给用户

## 配置位置

- 思考泄漏词：`output_firewall.thought_leak`（11 个）
- 工具泄漏正则：`output_firewall.tool_leak`（7 个）
- 废话词：`output_firewall.filler`（10 个）
- 抒情词：`output_firewall.emotional`（4 个）