# Changelog

## 1.0.0 — 2026-07-21

### 新增

- **双平台兼容**：新增 `defensive-ai-lab.skill` 清单，同一技能在 opencode 和 operit 均可加载
- **README.md**：项目说明文档
- **CHANGELOG.md**：本文件

### 变更

- **SKILL.md 精简**：264 行 → 56 行（-79%），保留核心工作流路由
- **References 合并**：19 个文件 1343 行 → 4 文件 188 行（-86%）
  - 新增 `protocols.md`：合并 agent-loop、engineering-charter、ai-experiment、authorization-test、reporting、sandbox-policy 等 17 个协议
  - 保留 `safety-policy.md`：硬性边界规则
  - 保留 `unified-workflow.md`：工作流地图（171 行 → 37 行）
  - 保留 `evidence-protocol.md`：证据门核心
- **Schemas 精简**：14 个文件 822 行 → 4 个文件 153 行（-81%）
  - 保留 evidence、finding、case-manifest、case-report
  - 移除 experiment、experiment-run、checkpoint 等次要 schema
- **labctl.py 修复**：添加 `sys.path` 处理，解决从任意目录运行时的模块导入问题
- **清理 dead code**：移除未使用的 `templates/` 目录

### 移除

- 17 个 protocol 文件（合并为 protocols.md）
- 10 个 JSON schema（次要验证）
- `templates/` 目录（render 命令直接生成 Markdown，不使用模板）
- `__pycache__` / `*.pyc` 缓存

### 测试

- 22 个单元测试全部通过
- 零技能引擎 121 + 113 断言全部通过

## 1.0.1 — 2026-07-21

### 修复

- **labctl.py 导入路径**：添加 `sys.path.insert` 解决从任意目录运行时的 `ModuleNotFoundError`
- **evidence-protocol.md 未加入路由表**：SKILL.md 和 .skill 清单都只列了 3 个 references，实际有 4 个 → 补全
- **templates/ dead code**：render 命令直接生成 Markdown，从不使用模板文件 → 删除
- **.gitignore 缺失**：测试产物 `.defensive-ai-lab/` 未忽略 → 添加
- **零技能 skill YAML 缩进错误**：`零.skill` 中 `operit_capabilities.md` 和 `evolution.md` 缩进多一空格 → 修复
- **残留死文件**：`references/permissions.md` 和 `references/sandbox.md` 在 manifest 中已删除但文件仍存在 → 删除
- **空目录 hooks/**：误建的空目录 → 删除
- **defensive-ai-lab.skill 添加 Python 依赖说明**：明确 Operit 仅加载引用文档，不执行 Python

### 测试

- defensive-ai-lab 22 测试通过
- zero-skill 234 断言通过
