# Evolution Reference — 自动进化闭环

> 当批量任务完成后或手动触发时加载本文件。

## 适用场景

- 累积失败经验超过阈值（默认 3 次）
- 需要从历史失败中提炼新规则
- 手动执行 `node scripts/evolve.js`

## 不适用场景

- 单次任务完成（用 `remember` 记录即可）
- 失败数不足阈值

## 闭环流程

```
1. 提取     从 .zero_apex/audit_log.jsonl 提取所有非 OK 结果
2. 聚类     按 tool + error_code 前缀分组
3. 生成     每个聚类生成一个 evolved_<topic>.md reference 片段
4. 测试     运行 test_zero_apex.js + test_skill_activation.js
5. 备份     references/ 备份到 .trash/references_backup/<stamp>/
6. 合并     新 reference 写入 references/，manifest.json 更新
```

## 用法

```
# 全自动：提取+生成+测试+备份+合并
node scripts/evolve.js

# 预览模式：只生成不合并
node scripts/evolve.js --dry-run

# 自定义阈值
node scripts/evolve.js --min-failures 5
```

## 输出

| 文件 | 说明 |
|------|------|
| `.zero_apex/evolution_log.jsonl` | 每次进化的审计日志（extract/cluster/generate/test/backup/merge） |
| `references/evolved_<topic>.md` | 生成的新规则片段 |
| `manifest.json` | references 列表更新 |
| `.trash/references_backup/` | 合并前的备份 |

## 安全约束

- 测试失败时**中止合并**，不引入未验证的规则
- 每次合并前**强制备份** references/
- manifest.json 更新是**幂等**的（同名 entry 替换不新增）
- 生成的 reference 标记 `evolved: true`，便于回溯和清理
- dry-run 模式不写任何文件，仅输出预览

## 配置位置

manifest.json 中的 `evolution` 字段：

```json
{
  "evolution": {
    "enabled": true,
    "script": "scripts/evolve.js",
    "log_path": ".zero_apex/evolution_log.jsonl",
    "min_failures_to_trigger": 3,
    "auto_merge": true,
    "auto_test": true,
    "backup_before_merge": true
  }
}
```