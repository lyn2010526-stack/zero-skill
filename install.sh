#!/bin/bash
# Zero Apex Engine — 一键安装脚本
# 用法: bash install.sh [目标目录] [--version VERSION]
# 默认安装到 Operit dev_package 目录

set -euo pipefail

ENGINE_SRC="engine/zero_apex.js"
MANIFEST_SRC="manifest.json"
SKILL_SRC="零.skill"
SKILL_MD_SRC="零.md"
REFERENCES_SRC="references/"

# 检测 Operit 默认安装路径
DEFAULT_TARGET="/sdcard/Download/Operit/dev_package/zero_apex"
TARGET=""
REQUESTED_VERSION=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --version|-v)
            REQUESTED_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            echo "用法: bash install.sh [--version VERSION] [目标目录]"
            echo ""
            echo "选项:"
            echo "  --version VERSION    指定安装版本 (默认: 当前目录版本)"
            echo "  --help, -h           查看帮助"
            echo ""
            echo "示例:"
            echo "  bash install.sh                          # 安装到默认路径"
            echo "  bash install.sh --version v2.5.0         # 安装特定版本"
            echo "  bash install.sh ~/my-install-path        # 安装到自定义路径"
            exit 0
            ;;
        *)
            TARGET="$1"
            shift
            ;;
    esac
done

TARGET="${TARGET:-$DEFAULT_TARGET}"
BACKUP_DIR="${TARGET}.backup.$(date +%Y%m%d_%H%M%S)"

# 版本检测
CURRENT_VERSION="unknown"
if [ -f "$MANIFEST_SRC" ]; then
    CURRENT_VERSION=$(grep -oP '"version"\s*:\s*"\K[^"]+' "$MANIFEST_SRC" 2>/dev/null || echo "unknown")
fi

if [ -n "$REQUESTED_VERSION" ] && [ "$REQUESTED_VERSION" != "$CURRENT_VERSION" ]; then
    echo "请求版本: $REQUESTED_VERSION, 当前版本: $CURRENT_VERSION"
    echo "版本不匹配。请切换到对应分支后重试。"
    exit 1
fi

echo "=== Zero Apex Engine v${CURRENT_VERSION} 安装 ==="
echo "目标: $TARGET"

# 备份现有安装
if [ -d "$TARGET" ] && [ "$(ls -A "$TARGET" 2>/dev/null)" ]; then
    echo "备份现有安装到: $BACKUP_DIR"
    cp -r "$TARGET" "$BACKUP_DIR"
    echo "回滚命令: rm -rf '$TARGET' && cp -r '$BACKUP_DIR' '$TARGET'"
fi

# 创建目录
mkdir -p "$TARGET/engine"
mkdir -p "$TARGET/references"
mkdir -p "$TARGET/tests"

# 复制文件
cp "$ENGINE_SRC" "$TARGET/engine/zero_apex.js"
cp "$MANIFEST_SRC" "$TARGET/manifest.json"
cp "$SKILL_SRC" "$TARGET/零.skill"
if [ -f "$SKILL_MD_SRC" ]; then
    cp "$SKILL_MD_SRC" "$TARGET/零.md"
fi

if [ -d "$REFERENCES_SRC" ]; then
    cp -r "$REFERENCES_SRC"* "$TARGET/references/" 2>/dev/null || true
fi

cp tests/test_zero_apex.js "$TARGET/tests/" 2>/dev/null || true
cp tests/test_skill_activation.js "$TARGET/tests/" 2>/dev/null || true

# 写入安装元信息
cat > "$TARGET/.install_manifest" <<EOF
version: $CURRENT_VERSION
installed_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
backup: $BACKUP_DIR
EOF

echo ""
echo "=== 安装完成 ==="
echo "版本: v$CURRENT_VERSION"
echo "引擎: $TARGET/engine/zero_apex.js"
echo "清单: $TARGET/manifest.json"
echo "Skill: $TARGET/零.skill"
echo "Skill (md): $TARGET/零.md"
echo ""
echo "回滚（安装失败时）:"
if [ -d "$BACKUP_DIR" ]; then
    echo "  rm -rf '$TARGET' && cp -r '$BACKUP_DIR' '$TARGET'"
else
    echo "  rm -rf '$TARGET'"
fi
echo ""
echo "安装到 Operit:"
echo "  operit_editor:debug_install_js_package"
echo ""
echo "测试:"
echo "  node $TARGET/tests/test_zero_apex.js"
echo "  node $TARGET/tests/test_skill_activation.js"
