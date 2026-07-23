# OpenSource Reference — 开源搜索层

> 当需要搜索成熟开源方案时加载本文件。替代"凭记忆编造"。

## 适用场景

- 用户要求实现某功能，需要先搜索已有方案
- 即将"融合多个开源项目"
- 需要对比 ≥3 个候选方案再选择

## 不适用场景

- 离线环境（Network 不可用）
- 只需要标准库 API 查询

## 工具调用

```
search_opensource({
  keyword: "image cache",     // 必填
  language: "kotlin",         // 可选：语言过滤
  min_stars: 500,             // 可选：默认 500
  limit: 5                    // 可选：默认 5
})
```

## 工作机制

1. 调用真实 GitHub Search API：`https://api.github.com/search/repositories`
2. 按 Star 数降序排序
3. 返回仓库名、Star、Fork、语言、许可证、最近更新、open_issues
4. 内置 `RetryPolicy`（指数退避+抖动，4xx 不重试，5xx 重试最多 3 次）
5. 内置 `ConcurrencyLimiter`（默认并发 2）

## 返回结构

```json
{
  "success": true,
  "query": "image cache",
  "total_count": 42,
  "count": 5,
  "repos": [{
    "name": "owner/repo",
    "stars": 1234,
    "forks": 56,
    "language": "Kotlin",
    "license": "MIT",
    "updated_at": "2024-01-01",
    "open_issues": 3,
    "url": "https://github.com/owner/repo",
    "description": "..."
  }],
  "note": "已返回 >=3 个候选，可进入比较-选择-融合流程"
}
```

## 失败降级

当 GitHub API 限流或网络不可用时：
- 返回 `success: false` + `fallback` 提示
- 建议改用 `visit_web` 工具搜索
- 或标注 `GUESSED` 后自行实现，但必须在输出中声明"未经验证的开源搜索结果"

## 行为约束

- `success === false` 时，**禁止**编造仓库名/Star 数
- 候选不足 3 个时，输出 `note` 提示放宽关键词或降低 min_stars
- 融合多个方案前必须先 `search_opensource` 获取真实候选

## 配置位置

- `opensource.max_attempts`：重试次数（默认 3）
- `opensource.base_delay_ms`：初始退避（默认 500）
- `opensource.max_delay_ms`：最大退避（默认 4000）
- `opensource.max_concurrency`：最大并发（默认 2）
- `opensource.default_min_stars`：默认最低 Star（500）
- `opensource.default_limit`：默认返回数（5）