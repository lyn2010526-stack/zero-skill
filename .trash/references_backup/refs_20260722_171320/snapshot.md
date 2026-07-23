# Snapshot Reference — 文件快照层

> 当即将删除/覆盖/截断文件时加载本文件。删除前必须先备份。

## 适用场景

- 即将执行 `rm` / `truncate` / `>` 覆盖等破坏性文件操作
- 即将重写某个源文件
- 误删后需要恢复

## 不适用场景

- 新建文件（无旧版本可备份）
- 只读操作

## 工具调用

### 备份

```
snapshot_file({
  path: "/sdcard/project/src/main.kt"   // 必填：要备份的文件
})
```

### 恢复

```
restore_file({
  path: "/sdcard/project/src/main.kt",          // 必填：原始路径
  snapshot_name: "main.kt.20240101_120000"      // 可选：默认取最新
})
```

## 工作机制

1. 备份目录：`<源文件所在目录>/.trash/`
2. 备份文件名：`<basename>.<YYYYMMDD_HHMMSS>`
3. 备份前用 `Files.exists` 检查源文件存在性
4. 备份时在 `.trash/` 下创建 `.keep` 占位文件
5. 恢复时如未指定 `snapshot_name`，列出 `.trash/` 下匹配前缀的文件，取字典序最新
6. 同一路径的备份和恢复通过 `FileLock` 互斥，防止并发冲突

## 路径安全

- 路径含 `..` 段（如 `../../etc/passwd`）会被拒绝，返回 `PATH_TRAVERSAL`
- 所有路径经 `PathUtils.normalize` 处理，消除重复斜杠和尾部斜杠

## 返回结构

```json
// snapshot
{
  "success": true,
  "code": "OK",
  "message": "已备份到快照目录",
  "original": "/sdcard/project/src/main.kt",
  "snapshot": "/sdcard/project/src/.trash/main.kt.20240101_120000",
  "snapshot_name": "main.kt.20240101_120000"
}

// restore
{
  "success": true,
  "code": "OK",
  "message": "已从快照恢复",
  "restored_from": "/sdcard/project/src/.trash/main.kt.20240101_120000",
  "target": "/sdcard/project/src/main.kt"
}
```

## 失败情况

| 场景 | code | 处理 |
|------|------|------|
| 源文件不存在 | `FILE_NOT_FOUND` | 检查路径是否正确 |
| 路径含 `..` | `PATH_TRAVERSAL` | 拒绝执行，要求使用绝对路径 |
| 恢复时无快照 | `FILE_NOT_FOUND` | 需显式指定 `snapshot_name` |
| `Files` 依赖不可用 | `DEPENDENCY_MISSING` | 检查 Operit 权限 |
| 写入异常 | `INTERNAL_ERROR` | 检查磁盘空间和权限 |

## 行为约束

- 删除/覆盖文件**前**必须先 `snapshot_file` 备份
- `success === false` 时，**禁止**继续执行破坏性操作
- 备份失败时应向用户报告，由用户决定是否继续
- 恢复后应验证文件内容完整性