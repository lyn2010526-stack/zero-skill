# Memory Reference — 记忆层

> 当任务完成/失败后记录经验，或遇到类似任务时召回历史经验。

## 适用场景

- 任务完成（成功经验）
- 任务失败（失败教训）
- 遇到类似任务，想查询历史经验
- 跨会话保留项目知识

## 不适用场景

- 一次性问答，无需跨会话
- 敏感数据（密钥、凭据）禁止写入记忆

## 工具调用

### 写入记忆

```
remember({
  kind: "success",           // success 或 failure
  project: "login-fix",      // 项目名
  summary: "登录崩溃修复...",  // 经验摘要
  evidence: "logcat: ...",    // 可选：证据
  tech_stack: "kotlin,gradle" // 可选：技术栈标签
})
```

### 召回记忆

```
recall({
  query: "登录崩溃怎么修",   // 检索关键词
  kind: "failure",          // 可选：success/failure 过滤
  limit: 5                  // 可选：默认 5
})
```

## 工作机制

1. 调用 Operit 真实 `Tools.Memory.create` / `Tools.Memory.query`
2. 成功/失败分区存储：`zero_apex/success/<shard>` 和 `zero_apex/failure/<shard>`
3. 按项目名分片（`shard` = 项目名归一化后的前 24 字符），避免单目录过大
4. 写入后清空 recall 缓存，保证后续召回拿到最新数据
5. recall 结果经 `LRUCache` 缓存（容量 64），相同 query 第二次命中走缓存

## 返回结构

```json
// remember
{
  "success": true,
  "code": "OK",
  "message": "经验已写入真实记忆库",
  "memory_id": "mem-xxx",
  "title": "[成功] login-fix · 20240101_120000",
  "folder": "zero_apex/success/login-fix"
}

// recall
{
  "success": true,
  "query": "...",
  "kind": "failure",
  "count": 2,
  "memories": [{ "title": "...", "content": "..." }],
  "from_cache": false
}
```

## 行为约束

- `Tools.Memory` 不可用时，返回 `DEPENDENCY_MISSING`，不得伪造记忆 ID
- 写入失败时返回 `INTERNAL_ERROR`，不得假装成功
- 敏感信息（API Key、token、密码）**禁止**写入 `summary` 或 `evidence`
- recall 缓存命中时返回 `from_cache: true`，便于调试

## 配置位置

- `memory.root`：记忆根目录（默认 `zero_apex`）
- `memory.cache_size`：recall 缓存容量（默认 64）