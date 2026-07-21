# Defensive AI Lab

基于证据的防御性安全审查技能。在 opencode 和 operit 双平台运行。

## 工作流

| 类型 | 说明 |
|------|------|
| `local_security_review` | 本地代码安全审查，证据驱动 |
| `authorization_regression` | 授权回归测试，仅合成数据 |
| `ai_experiment` | AI 参数实验，确定性运行 |
| `evidence_report` | 证据报告解析 |
| `mixed` | 混合工作流 |

## 文件结构

```
defensive-ai-lab/
├── SKILL.md                    # opencode 技能定义
├── defensive-ai-lab.skill      # operit 兼容清单
├── references/                 # 按需加载的引用文档
│   ├── safety-policy.md        # 硬性边界
│   ├── unified-workflow.md     # 工作流地图
│   ├── protocols.md            # 协议合集
│   └── evidence-protocol.md    # 证据门
├── schemas/                    # JSON schema 验证
│   ├── evidence.schema.json
│   ├── finding.schema.json
│   ├── case-manifest.schema.json
│   └── case-report.schema.json
├── scripts/                    # 确定性工具
│   ├── labctl.py               # 主 CLI
│   ├── sarif_export.py         # SARIF 导出
│   ├── vector_index.py         # 向量索引
│   ├── storage_sqlite.py       # SQLite 存储
│   └── llm_provider.py         # LLM 提供者
├── adr/                        # 架构决策记录
└── tests/                      # 单元测试
```

## 使用

```bash
# 初始化案例
python3 scripts/labctl.py init --workflow local_security_review --scope src --output markdown --output json

# 记录审计事件
python3 scripts/labctl.py audit --case .defensive-ai-lab/cases/<id> --event scope_checked --metadata '{"result":"allowed"}'

# 写入检查点
python3 scripts/labctl.py checkpoint --case <dir> --completed inspect-auth --pending add-regression-test

# 验证案例完整性
python3 scripts/labctl.py validate --case <dir>

# 渲染报告
python3 scripts/labctl.py render --case <dir>
```

## 许可

Apache 2.0
