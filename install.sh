#!/bin/bash
# Zero Apex Engine — 一键安装脚本
# 用法: bash install.sh [目标目录]
# 默认安装到 Operit dev_package 目录

set -euo pipefail

ENGINE_SRC="engine/zero_apex.js"
MANIFEST_SRC="manifest.json"
SKILL_SRC="零.skill"
REFERENCES_SRC="references/"

# 检测 Operit 默认安装路径
DEFAULT_TARGET="/sdcard/Download/Operit/dev_package/zero_apex"
TARGET="${1:-$DEFAULT_TARGET}"

echo "=== Zero Apex Engine 安装 ==="
echo "目标: $TARGET"

# 创建目录
mkdir -p "$TARGET/engine"
mkdir -p "$TARGET/references"

# 复制文件
cp "$ENGINE_SRC" "$TARGET/engine/zero_apex.js"
cp "$MANIFEST_SRC" "$TARGET/manifest.json"
cp "$SKILL_SRC" "$TARGET/零.skill"

if [ -d "$REFERENCES_SRC" ]; then
    cp -r "$REFERENCES_SRC"* "$TARGET/references/" 2>/dev/null || true
fi

# 创建 tests 目录（可选，用于 CI）
mkdir -p "$TARGET/tests"
cp tests/test_zero_apex.js "$TARGET/tests/" 2>/dev/null || true
cp tests/test_skill_activation.js "$TARGET/tests/" 2>/dev/null || true

echo ""
echo "=== 安装完成 ==="
echo "引擎: $TARGET/engine/zero_apex.js"
echo "清单: $TARGET/manifest.json"
echo "Skill: $TARGET/零.skill"
echo ""
echo "安装到 Operit:"
echo "  operit_editor:debug_install_js_package"
echo ""
echo "测试:"
echo "  node $TARGET/tests/test_zero_apex.js"
echo "  node $TARGET/tests/test_skill_activation.js"
