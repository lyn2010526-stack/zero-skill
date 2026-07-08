# Contributing to Zero Apex Skill

感谢你对 Zero Apex 的关注。

## 如何贡献

### 报告问题

1. 在 GitHub Issues 中搜索是否已有相同问题
2. 如果没有，创建新 Issue
3. 包含：操作步骤、期望结果、实际结果、环境信息

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: 描述你的更改"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### Commit 规范

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `test:` 测试
- `refactor:` 重构
- `chore:` 构建/工具

### 提交前检查

```bash
python3 scripts/test_engine.py
```

所有 33 个测试必须通过。

## 代码规范

### Python

- Python 3.10+
- 类型注解
- docstring
- 无外部依赖（除 pyyaml）

### Skill 文件

- Markdown 格式
- 每条规则只出现一次
- 不使用虚构的项目名称
- 引用开源项目必须附带真实 GitHub 链接

### 测试

- 每个新模块必须有对应测试
- 测试通过率 100%

## 架构原则

1. **零重复**：同一规则只在文件中出现一次
2. **可验证**：每个声明必须有工具执行结果支撑
3. **可回滚**：任何操作必须有回滚方案
4. **诚实标注**：真实项目 vs 概念设计必须明确区分
