# Quick Start

## 5 分钟开始

### 1. 安装

在 Operit AI 中创建新 Skill，复制 `零.skill` 内容保存即可。

### 2. 验证引擎

```bash
python3 scripts/test_engine.py
# === Results: 33 passed, 0 failed ===
```

### 3. Python 引擎（可选）

```bash
pip install pyyaml
python3 -c "from engine.zero_agent.kernel import ZeroKernel; print('OK')"
```

### 4. 导入 Skill

在 Operit AI 中：
1. 打开 Skill 管理
2. 创建新 Skill
3. 粘贴 `零.skill` 全文
4. 保存

## 核心行为

导入后 AI 会自动：
- 修改前读取相关文件
- 完成宣称附带证据
- 删除操作三重门禁
- 结论附带置信度标签
- 每次任务后复盘记录

## 环境要求

- Operit AI
- Android / Linux / macOS
- Python 3.10+（引擎可选）
- 8GB+ 内存推荐
