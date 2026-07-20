# EvidenceVerifier Reference — 证据验证层

> 当即将宣称"完成/搞定/编译通过/已修复"等完成声明时加载本文件。

## 适用场景

- 即将使用"完成/搞定/跑通/编译通过/测试通过/构建成功"等字眼
- 任务进入交付阶段
- 需要判断产物是否真实存在

## 工具调用

```
evidence_check({
  claim: "编译通过，APK 已生成",
  exit_code: 0,                    // 可选：命令退出码
  stdout: "BUILD SUCCESSFUL",      // 可选
  stderr: "",                       // 可选
  artifact_path: "/sdcard/app.apk"  // 可选：会真实检查文件存在性
})
```

## 验证等级 L0-L6

| 等级 | 含义 | 触发条件 |
|------|------|----------|
| L0 | 无证据 | 无任何证据输入 |
| L1 | 有文本证据 | stdout 非空但未达编译级 |
| L2 | 交叉验证 | 文本中含测试通过描述（无 exit_code） |
| L3 | 编译通过 | exit_code=0 + stdout 含 BUILD SUCCESSFUL |
| L4 | 产物存在 | `artifact_path` 真实存在（Files.exists 检查） |
| L5 | 测试通过 | exit_code=0 + stdout 含 tests passed |
| L6 | 回归通过 | 多轮 L5 + 无新失败 |

## 判定逻辑

```
exit_code !== 0 或 输出含 BUILD FAILED → 直接返回 L0 NEGATIVE，否证声明
artifact_path 存在 → 至少 L4 VERIFIED
artifact_path 不存在 → 直接返回 L0，否证声明
BUILD SUCCESSFUL → L3
INSTALL_OK → L4
TEST_OK → L5（覆盖较低等级）
```

## 返回结构

```json
{
  "level": "L3",
  "level_num": 3,
  "label": "VERIFIED",
  "supports_claim": true,
  "can_claim_done": true,      // level >= 3 && supports
  "can_claim_delivered": false, // level >= 6 && supports
  "reasons": ["编译成功日志已验证"],
  "gate": "ALLOW"
}
```

## 行为约束

- `can_claim_done === false` 时，**禁止**使用"完成/搞定/交付"字眼，改为"正在编译中"等过程描述
- `gate` 为 `BLOCK` 时，必须补充证据后重新验证
- 编译类声明必须达 L3 才允许宣称完成
- 交付类声明必须达 L6 才允许宣称已交付

## 配置位置

- `evidence.build_ok`：编译成功正则
- `evidence.build_fail`：编译失败正则
- `evidence.test_ok`：测试通过正则
- `evidence.install_ok`：安装成功正则