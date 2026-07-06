# rate-limit 限流防重复调用规则

## 触发条件
检测到工具调用操作

## 前置条件
任务计数器未达到上限

## 执行步骤
1. 初始化计数器：totalCalls=0, perToolCalls={}, consecutiveErrors={}, startTime=now()
2. 每次工具调用前：totalCalls+=1, perToolCalls[tool]+=1
3. totalCalls>30时输出接近上限警告
4. perToolCalls[tool]>3时触发暂停分析
5. concurrentErrors[tool]>=2时触发切换方案
6. totalCalls>=50时触发强制停止
7. now()-startTime>10分钟时触发超时停止

## 输出格式
正常: [调用许可]
暂停: [暂停分析] 工具 | 最近3次结果 | 建议
停止: [强制停止] 达上限 | 总耗时
超时: [超时终止] 已用时 | 进度

## 超时参数
单次调用超时: 30秒
总任务超时: 10分钟
超时预警: 8分钟
重试间隔: 1秒
重试次数: 3次

## 异常处理
- 暂停分析超10秒无结果：强制继续
- 工具连续失败4次：禁用该工具
- 计数器溢出：归零重启记录日志
