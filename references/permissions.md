# Permissions Reference — 权限规则

> 借鉴 Grok grok-build permission system，按 deny > ask > allow 三级规则评估工具调用。
> 当 before_tool_exec 触发时加载本文件。

## 设计目标

将"哪些工具调用通过直放行、哪些需要确认、哪些必拒"从 preflight 软提示升级为可配置的硬规则。engine 内置 `PermissionRules`，manifest.json 的 `permission` 字段声明规则与默认模式。

## 三种模式（default_mode）

| mode | 行为 | 典型场景 |
|------|------|---------|
| `default`（默认） | 未匹配规则的调用走 preflight 现有逻辑 | 日常使用 |
| `dontAsk` | 未匹配 `allow` 的调用一律 `DENY` | CI、无交互、高安全 |
| `bypassPermissions` | 自动批准（`deny` 规则与 hook 仍生效） | 受信任环境 |

## 规则评估顺序

`PermissionRules.evaluate(tool, params)` 按以下顺序：

1. 遍历所有规则，按**严重性**而非声明顺序匹配：`deny` 优先于 `ask` 优先于 `allow`
2. 命中 `deny` → 返回 `DENY`
3. 命中 `ask` → 返回 `ASK`（无交互 UI 时升级为 DENY）
4. 命中 `allow` → 返回 `ALLOW`
5. 全部未命中：`default` → `FALLTHROUGH`；`dontAsk` → `DENY`；`bypassPermissions` → `ALLOW`

## 规则结构

```json
{
  "action": "deny|ask|allow",
  "tool": "bash|read|edit|grep|*",
  "pattern": "Bash(rm -rf *) | /etc/shadow | .zero_apex/**"
}
```

## Pattern 语法（借鉴 Grok）

### Bash 规则

- `Bash(git *)` — 前缀匹配 `git ` 开头的命令
- `Bash(git commit:*)` — `:*` 后缀等同前缀匹配
- `Bash(git * main)` — glob 匹配，`*` 跨 `/`
- `Bash(ls)` — 精确匹配 `ls`（也匹配 `ls -la`，因为是前缀）

### 路径规则（Read/Edit/Grep）

- `Read(src/**)` — 匹配 `src/` 下任意层级
- `Read(src/*)` — 匹配 `src/` 下单层
- `Edit(**/.env)` — 匹配任意深度的 `.env`
- `/etc/shadow` — 精确路径
- `*` — 匹配所有

### WebFetch 规则

- `WebFetch(domain:example.com)` — 匹配该域名及所有子域名
- `WebFetch(https://api.example.com/*)` — glob 匹配 URL

## 工具名归一化

engine 调用 `evaluate` 时，`tool` 参数经过归一化：

| 原始工具名 | 归一化后 |
|-----------|---------|
| `file_guard`, `fileguard` | `bash`（命令风险检查工具） |
| `snapshot_file`, `restore_file` | `edit`（写操作） |
| `read`, `read_file`, `list_dir`, `grep` | `read` |
| `edit`, `write`, `search_replace` | `edit` |
| `bash`, `shell` | `bash` |
| 其他 | `bash`（默认） |

## 只读命令白名单（ShellGuard）

engine 内置只读命令清单，`ShellGuard.isReadOnly()` 用于识别：

```
ls cat pwd date whoami hostname uptime ps
head tail wc sort uniq tr cut
grep rg
git status git branch git log git diff git ls-files git show git rev-parse
kubectl get kubectl logs kubectl describe
cargo check
```

## 危险命令清单（manifest.sandbox.dangerous_commands）

```
rm rmdir unlink shred
chmod chown chgrp chattr
pkill kill killall
git push
shutdown reboot poweroff init
mkfs fdisk parted
mount umount
iptables ip6tables nft ufw firewall-cmd
useradd userdel usermod passwd visudo chroot
sudo su
```

命中危险命令时，ShellGuard.analyze 返回 `verdict: "ASK"`；HookRegistry 的 `dangerous_cmd_guard` 钩子会拦截升级为 `deny`。

## 链式命令分段

`ShellGuard.splitChain()` 按以下分隔符拆分：

- `&&` `||` — 逻辑与/或
- `;` — 顺序执行
- `|` — 管道
- 换行

每段独立评估：任一段命中危险命令，整条命令 `ASK`。剥除 wrapper（timeout/nice/ionice/chrt/stdbuf/env）和环境变量前缀后再匹配。

## 当前 manifest 默认规则

```json
deny: Bash(rm -rf *), Bash(chmod 777 *), Bash(fork bomb), Read(/etc/shadow), Read(/etc/passwd), Edit(/proc/**), Edit(/sys/**), Edit(/dev/**)
ask:  Edit(**/.env), Edit(**/*.key), Bash(git push *), Bash(npm publish *)
allow: Read(.zero_apex/**), Edit(.zero_apex/**), Bash(ls *), Bash(cat *), Bash(git status), Bash(git log *), Bash(git diff *)
```

## 手动评估

通过 `evaluate_permission` 工具手动评估：

```js
await evaluate_permission({
  tool: "bash",
  command: "rm -rf /home",
});
// => { verdict: "DENY", reason: "deny rule: Bash(rm -rf *)", matched_rule: {...} }
```

## 注意事项

- `ask` 在无交互 UI 环境下（如 Operit 沙箱）升级为 `DENY`，而非真的弹窗
- `bypassPermissions` 模式下 `deny` 规则与 PreToolUse hook 仍生效，只有 `ask` 被跳过
- 修改 manifest 的 `permission.rules` 后无需重新加载 engine（ManifestLoader 每次读 manifest 缓存）
- 权限规则在 `wrapToolExecution` 链路中位于 BlockEnforcer + 环境裁剪之后、SandboxProfile 之前
