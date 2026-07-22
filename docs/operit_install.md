# Operit 安装详解

> 解决 SkillMarket 报 "ZIP内未找到skill md" 的问题。

## 关键发现

翻 Operit 源码（`AAswordman/Operit` master 分支）确认了安装逻辑：

### 1. SkillMarket 入口走 `importSkillFromGitHubRepoDetailed`

文件：`app/src/main/java/com/ai/assistance/operit/data/skill/SkillRepository.kt:89`

```kotlin
suspend fun importSkillFromGitHubRepoDetailed(repoUrl: String): SkillRepoImportResult {
    val target = parseGitHubSkillTarget(repoUrl) ?: ...
    val zipUrl = "https://codeload.github.com/$owner/$repoName/zip/$encodedRef"
    // 下载 codeload zip
    val result = skillManager.importSkillFromZipDetailed(zipFile, target.subDir)
}
```

### 2. 接受的是 **GitHub 仓库 URL**，不是 release zip URL

```kotlin
when {
    host == "github.com" || ... -> {
        val owner = segments[0]
        val repo = cleanRepoName(segments[1])
        // 解析 tree/blob 决定 ref + subDir
    }
}
```

**正确的 URL 形式**：
- `https://github.com/<owner>/<repo>` ← 拉默认分支（main）
- `https://github.com/<owner>/<repo>/tree/<ref>` ← 拉指定分支
- `https://github.com/<owner>/<repo>/blob/<ref>/<path>` ← 拉指定分支+子目录

### 3. zip 内扫 `SKILL.md` 或 `skill.md`

文件：`app/src/main/java/com/ai/assistance/operit/core/tools/skill/SkillManager.kt:326-340`

```kotlin
val directSkillFile = File(searchRoot, "SKILL.md").let { primary ->
    if (primary.exists()) primary else File(searchRoot, "skill.md")
}.takeIf { it.exists() && it.isFile }
} else {
    searchRoot.walkTopDown()
        .filter { it.isFile && (it.name.equals("SKILL.md", ignoreCase = true) || it.name.equals("skill.md", ignoreCase = true)) }
        .take(10)
        .toList()
}
```

`walkTopDown` 是**深度优先**，先访问根目录下的文件，再进子目录。所以根目录的 `SKILL.md` / `skill.md` 优先被选中。

### 4. codeload zip 的结构

`https://codeload.github.com/<owner>/<repo>/zip/refs/heads/<ref>` 返回的 zip 顶层是 `<repo>-<ref>/` 一个目录。解包后：

```
tmpDir/
  zero-skill-main/
    SKILL.md         ← 根目录，必须放这里
    skill.md
    engine/...
    references/...
    manifest.json
    ...
    .opencode/skills/defensive-ai-lab/SKILL.md  ← 嵌套的，会被 walkTopDown 找到但优先级低
```

## 三个常见错误

### 错误 1：粘贴 release zip URL

```
❌ https://github.com/lyn2010526-stack/zero-skill/releases/download/v2.5.5/zero_apex-2.5.5.zip
✅ https://github.com/lyn2010526-stack/zero-skill
```

release zip 走的是 `MarketEntryInstallController.installArtifactEntry`（type=script/package），不是 skill 路径。

### 错误 2：默认分支没 `SKILL.md` / `skill.md`

如果只把 `SKILL.md` 放在一个非默认分支，codeload zip 拉的是默认分支（看仓库 Settings → Default branch），里面就没这文件。

**修法**：
- 仓库 Settings → Default branch 设为含 `SKILL.md` 的分支
- 或把 `SKILL.md` 推到当前默认分支

### 错误 3：`SKILL.md` 只放在子目录

如果 `SKILL.md` 在 `skills/xxx/SKILL.md`（子目录），`walkTopDown` 会找到，但 `selectedSkillDir = skills/xxx/`，会把整个子目录当 skill 内容复制，**会缺 engine、references 等**。

**修法**：`SKILL.md` 必须放在仓库**根目录**。

## 验证清单

```bash
# 1. 拉 codeload zip，模拟 Operit 的查找
URL='https://codeload.github.com/<owner>/<repo>/zip/refs/heads/<default-branch>'
curl -sL "$URL" -o /tmp/check.zip
python3 -c "
import zipfile
z = zipfile.ZipFile('/tmp/check.zip')
for n in z.namelist():
    if n.endswith('SKILL.md') or n.endswith('skill.md'):
        print(n)
"
```

期望输出：仓库根目录有 `SKILL.md`（或 `skill.md`）：

```
<repo>-<default-branch>/SKILL.md
```

## 引擎装入沙箱

`SKILL.md` 只是 skill 定义。`engine/zero_apex.js` 需要用 Operit 开发者命令装入 QuickJS 沙箱：

```
operit_editor:debug_install_js_package
```

参数：把 `engine/zero_apex.js` 路径传进去即可。

## 已验证

- 仓库 `lyn2010526-stack/zero-skill` 默认分支 `main`
- 根目录有 `SKILL.md` 和 `skill.md`
- codeload zip 包含 `zero-skill-main/SKILL.md`
- 嵌套的 `.opencode/skills/defensive-ai-lab/SKILL.md` 存在但不会被优先选中
