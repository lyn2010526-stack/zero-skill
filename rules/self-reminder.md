# self-reminder 自我提醒规则

## 触发条件
每个新任务开始时

## 前置条件
无

## 执行步骤
1. 输出核心规则自检清单
2. 检查anti-rm：不删文件
3. 检查rate-limit：不重复调用
4. 检查output-firewall：不输出思考内容
5. 检查execution-verifier：不假思考
6. 检查anti-hallucination：不幻觉
7. 检查output-contract：不废话
8. 检查no-code-in-chat：不写代码到对话框
9. 检查self-reminder：遵守以上规则
10. 检测到违规时自动纠正并记录
11. 同一规则违规3次则锁定升级
12. 任务完成后输出违规统计

## 输出格式
自检: ⚠️ 核心规则自检
违规: [违规] 规则名 | 详情 | 已纠正
统计: [违规统计] 总计X次 | 各规则详情
