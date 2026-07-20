# FileGuard Reference — 防删代码层

> 当触发信号为 `command_risk: destructive` 或即将执行命令/脚本/文件操作时加载本文件。

## 适用场景

- 即将在终端执行任意 shell 命令
- 即将运行用户提供的脚本内容
- 即将对文件路径执行写入/删除/覆盖

## 不适用场景

- 纯文本对话，不涉及命令执行
- 只读浏览文件列表

## 工具调用

```
file_guard({
  command: "rm -rf /home/user/project",   // 分析命令
  script: "os.system('rm -rf /tmp')",      // 扫描脚本内容
  path: "/sdcard/secrets.env"              // 评估路径风险
})
```

三个参数互斥，按存在性优先级：`script` > `path` > `command`。

## 检测范围

### 直接破坏命令（14 种）
`rm` / `rmdir` / `unlink` / `shred` / `mkfs.*` / `dd if=` / `truncate -s 0` / 写入 `/dev/sd*` / `git clean -f` / `git reset --hard` / `rsync --delete` / `find -delete` / `xargs rm` / 重定向覆盖（软风险，`> /dev/null` 豁免）

### 间接删除（9 种脚本模式）
`os.system('rm...')` / `subprocess(['rm'...])` / `shutil.rmtree()` / `os.remove()` / `os.unlink()` / `Files.deleteFile()` / `fs.unlink(Sync)?()` / `fs.rm(Sync)?()` / `.delete()`

### 高风险路径（7 类）
系统目录（`/bin` `/boot` `/dev` `/etc` `/lib` `/proc` `/root` `/sbin` `/sys` `/usr` `/var`）/ `sdcard` / `/storage/emulated/` / `.env` / 私钥文件（`id_rsa` `id_ed25519` `.pem` `.key` `.keystore` `.jks`）/ `credentials.json` / `.git`

### 路径遍历防护
路径含 `..` 段（如 `../../etc/passwd`）会被标记为 `PATH_TRAVERSAL`，要求确认。

## 返回结构

```json
{
  "is_delete": true,
  "requires_confirmation": true,
  "risk_level": "CRITICAL | HIGH | MEDIUM | LOW",
  "hits": [{ "pattern": "rm", "desc": "删除文件/目录", "soft": false }],
  "path_risks": [{ "path": "/sdcard/x", "why": "用户存储目录" }],
  "reasons": ["删除操作: rm..."]
}
```

风险等级判定：
- `CRITICAL`：删除操作 + 高风险路径同时命中
- `HIGH`：删除操作 或 高风险路径命中
- `MEDIUM`：仅软风险（如重定向覆盖）
- `LOW`：无命中

## 行为约束

- `requires_confirmation === true` 时，**必须**先向用户确认再执行
- `risk_level === "CRITICAL"` 时，**禁止**执行，即使用户已确认也应建议替代方案
- 先 `snapshot_file` 备份再删除

## 配置位置

所有正则和路径模式在 `engine/zero_apex.js` 的 `ConfigRegistry` 中注册，键名前缀 `file_guard.*`。修改模式不需改 skill 文件，改引擎配置即可。