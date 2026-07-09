
/* METADATA
{
    "name": "zero_apex",
    "display_name": {
        "zh": "零·首席工程引擎",
        "en": "Zero Apex Engine"
    },
    "description": {
        "zh": "首席工程师执行引擎的真实运行时。防幻觉层/自我意识层/防删代码层/证据验证层全部为可执行代码，非文本。记忆走 Operit 真实持久化记忆库，开源搜索走真实 GitHub API，文件快照走真实文件系统。",
        "en": "The real runtime of the Zero Apex chief-engineer skill. Hallucination guard / self-awareness / file-delete guard / evidence verifier are all executable code. Memory uses Operit's real persistent memory library; open-source search hits the real GitHub API; file snapshots use the real filesystem."
    },
    "category": "Engineering",
    "enabledByDefault": false,
    "tools": [
        {
            "name": "preflight",
            "description": { "zh": "执行前综合门禁：整合自我意识层、防删代码层、防幻觉层、证据验证层，返回是否允许执行以及原因。", "en": "Pre-execution gate combining self-awareness, file-delete guard, hallucination guard and evidence verifier." },
            "parameters": [
                { "name": "goal", "description": { "zh": "用户目标/任务描述", "en": "User goal/task" }, "type": "string", "required": true },
                { "name": "command", "description": { "zh": "可选：即将执行的命令", "en": "Optional: the command about to run" }, "type": "string", "required": false },
                { "name": "evidence", "description": { "zh": "可选：已有证据文本（命令输出/日志等）", "en": "Optional: existing evidence text" }, "type": "string", "required": false },
                { "name": "files_read", "description": { "zh": "可选：是否已读取相关文件 true/false", "en": "Optional: whether relevant files were read" }, "type": "boolean", "required": false }
            ]
        },
        {
            "name": "file_guard",
            "description": { "zh": "防删代码层：分析命令或脚本内容，检测删除/覆盖/截断等破坏性操作，返回风险等级与是否需要用户确认。", "en": "File-delete guard: analyze a command or script for destructive operations." },
            "parameters": [
                { "name": "command", "description": { "zh": "要分析的命令", "en": "Command to analyze" }, "type": "string", "required": false },
                { "name": "script", "description": { "zh": "要扫描的脚本内容", "en": "Script content to scan" }, "type": "string", "required": false },
                { "name": "path", "description": { "zh": "要评估风险的路径", "en": "Path to assess risk" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "hallucination_guard",
            "description": { "zh": "防幻觉层：检测文本中的确定性断言、编造引用、过度自信推测、无来源技术断言，判定置信度标签是否合法。", "en": "Hallucination guard: detect over-confident assertions, fabricated citations, and unlabeled claims." },
            "parameters": [
                { "name": "text", "description": { "zh": "要检测的输出文本", "en": "Text to check" }, "type": "string", "required": true },
                { "name": "evidence", "description": { "zh": "可选：支撑该文本的证据", "en": "Optional: supporting evidence" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "evidence_check",
            "description": { "zh": "证据验证层：判断完成声明（已编译/已修复等）是否有真实证据支撑，返回验证等级 L0-L6。", "en": "Evidence verifier: judge whether a completion claim is backed by real evidence, returning level L0-L6." },
            "parameters": [
                { "name": "claim", "description": { "zh": "完成声明文本", "en": "Completion claim text" }, "type": "string", "required": true },
                { "name": "command", "description": { "zh": "可选：相关命令", "en": "Optional: related command" }, "type": "string", "required": false },
                { "name": "exit_code", "description": { "zh": "可选：命令退出码", "en": "Optional: command exit code" }, "type": "number", "required": false },
                { "name": "stdout", "description": { "zh": "可选：标准输出", "en": "Optional: stdout" }, "type": "string", "required": false },
                { "name": "stderr", "description": { "zh": "可选：标准错误", "en": "Optional: stderr" }, "type": "string", "required": false },
                { "name": "artifact_path", "description": { "zh": "可选：产物路径（如 APK），会真实检查是否存在", "en": "Optional: artifact path (e.g. APK), checked for real existence" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "self_monitor",
            "description": { "zh": "自我意识层：评估当前工程六维状态（目标清晰/已读文件/证据就绪/不可逆风险/需确认/置信度），返回状态卡。", "en": "Self-awareness layer: assess six engineering meta-state dimensions and return a status card." },
            "parameters": [
                { "name": "goal", "description": { "zh": "当前目标", "en": "Current goal" }, "type": "string", "required": true },
                { "name": "goal_clear", "description": { "zh": "可选：目标是否清晰", "en": "Optional: whether the goal is clear" }, "type": "boolean", "required": false },
                { "name": "files_read", "description": { "zh": "可选：是否已读取相关文件", "en": "Optional: whether files were read" }, "type": "boolean", "required": false },
                { "name": "evidence_ready", "description": { "zh": "可选：证据是否就绪", "en": "Optional: whether evidence is ready" }, "type": "boolean", "required": false },
                { "name": "irreversible_risk", "description": { "zh": "可选：是否存在不可逆风险", "en": "Optional: whether there is irreversible risk" }, "type": "boolean", "required": false }
            ]
        },
        {
            "name": "output_firewall",
            "description": { "zh": "输出防火墙：检测思考过程泄漏、工具参数泄漏、废话抒情、超长代码块、乱码，返回违规清单。", "en": "Output firewall: detect thought leakage, tool-param leakage, filler, oversized code blocks and mojibake." },
            "parameters": [
                { "name": "text", "description": { "zh": "要检测的输出文本", "en": "Output text to check" }, "type": "string", "required": true }
            ]
        },
        {
            "name": "search_opensource",
            "description": { "zh": "真实开源搜索：调用 GitHub 搜索 API，按 Star 排序返回成熟仓库，用于先搜索再编码。", "en": "Real open-source search via GitHub API, sorted by stars, for search-before-code." },
            "parameters": [
                { "name": "keyword", "description": { "zh": "搜索关键词", "en": "Search keyword" }, "type": "string", "required": true },
                { "name": "language", "description": { "zh": "可选：语言过滤，如 kotlin/java/python", "en": "Optional: language filter" }, "type": "string", "required": false },
                { "name": "min_stars", "description": { "zh": "可选：最低 Star 数，默认 500", "en": "Optional: minimum stars, default 500" }, "type": "number", "required": false },
                { "name": "limit", "description": { "zh": "可选：返回条数，默认 5", "en": "Optional: result count, default 5" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "remember",
            "description": { "zh": "写入真实持久化记忆：把任务的成功/失败经验写进 Operit 记忆库，可跨会话召回。", "en": "Write to the real persistent memory library." },
            "parameters": [
                { "name": "kind", "description": { "zh": "success 或 failure", "en": "success or failure" }, "type": "string", "required": true },
                { "name": "project", "description": { "zh": "项目名", "en": "Project name" }, "type": "string", "required": true },
                { "name": "summary", "description": { "zh": "经验摘要", "en": "Experience summary" }, "type": "string", "required": true },
                { "name": "evidence", "description": { "zh": "可选：证据（日志/路径等）", "en": "Optional: evidence" }, "type": "string", "required": false },
                { "name": "tech_stack", "description": { "zh": "可选：技术栈标签，逗号分隔", "en": "Optional: tech stack tags" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "recall",
            "description": { "zh": "召回真实记忆：从 Operit 记忆库检索相关历史经验，返回匹配度排序结果。", "en": "Recall from the real persistent memory library." },
            "parameters": [
                { "name": "query", "description": { "zh": "检索关键词/问题", "en": "Query" }, "type": "string", "required": true },
                { "name": "kind", "description": { "zh": "可选：success/failure 过滤", "en": "Optional: success/failure filter" }, "type": "string", "required": false },
                { "name": "limit", "description": { "zh": "可选：返回条数，默认 5", "en": "Optional: limit, default 5" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "snapshot_file",
            "description": { "zh": "防删代码的真实备份：把源文件复制到项目 .trash 快照目录（按时间戳命名），删除前必做。", "en": "Real backup for delete-guard: copy a source file into a timestamped .trash snapshot." },
            "parameters": [
                { "name": "path", "description": { "zh": "要备份的文件路径", "en": "File path to back up" }, "type": "string", "required": true }
            ]
        },
        {
            "name": "restore_file",
            "description": { "zh": "从 .trash 快照恢复文件（检测到误删时使用）。", "en": "Restore a file from the .trash snapshot." },
            "parameters": [
                { "name": "path", "description": { "zh": "原始文件路径", "en": "Original file path" }, "type": "string", "required": true },
                { "name": "snapshot_name", "description": { "zh": "可选：快照文件名，默认取最新", "en": "Optional: snapshot filename, defaults to latest" }, "type": "string", "required": false }
            ]
        }
    ]
}*/

const ZeroApex = (function () {
    "use strict";

    // ==========================================================================
    // 通用工具
    // ==========================================================================
    function nowStamp() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, "0");
        return (
            d.getFullYear() +
            p(d.getMonth() + 1) +
            p(d.getDate()) +
            "_" +
            p(d.getHours()) +
            p(d.getMinutes()) +
            p(d.getSeconds())
        );
    }

    function basename(path) {
        const clean = String(path || "").replace(/\/+$/, "");
        const idx = clean.lastIndexOf("/");
        return idx >= 0 ? clean.slice(idx + 1) : clean;
    }

    function dirname(path) {
        const clean = String(path || "").replace(/\/+$/, "");
        const idx = clean.lastIndexOf("/");
        return idx > 0 ? clean.slice(0, idx) : "";
    }

    // ==========================================================================
    // 防删代码层 (File Delete Guard)
    // 目标：任何删除/覆盖/截断操作在生成命令前就被拦截。
    // 覆盖直接删除、间接删除（脚本内 os.system(rm)）、路径高风险三类。
    // ==========================================================================
    const FileGuard = (function () {
        // 直接破坏性命令，正则精确匹配命令词边界，避免误伤 (如 "format_time")
        const DELETE_PATTERNS = [
            { re: /\brm\s+(-[rfRvi]+\s+)*/, name: "rm", desc: "删除文件/目录" },
            { re: /\brmdir\b/, name: "rmdir", desc: "删除目录" },
            { re: /\bunlink\b/, name: "unlink", desc: "删除链接/文件" },
            { re: /\bshred\b/, name: "shred", desc: "粉碎文件（不可恢复）" },
            { re: /\bmkfs\.[a-z0-9]+\b/, name: "mkfs", desc: "格式化文件系统" },
            { re: /\bdd\s+if=/, name: "dd", desc: "块级写入/擦除" },
            { re: /\btruncate\s+-s\s*0\b/, name: "truncate", desc: "清空文件内容" },
            { re: />\s*\/dev\/sd[a-z]/, name: "device-write", desc: "写入原始磁盘设备" },
            { re: /\bgit\s+clean\s+-[a-z]*f/, name: "git clean -f", desc: "删除未跟踪文件" },
            { re: /\bgit\s+reset\s+--hard/, name: "git reset --hard", desc: "丢弃工作区改动" },
            { re: /\brsync\b[^\n]*--delete/, name: "rsync --delete", desc: "同步时删除目标多余文件" },
            { re: /\bfind\b[^\n]*-delete/, name: "find -delete", desc: "查找并删除" },
            { re: /\bxargs\b[^\n]*\brm\b/, name: "xargs rm", desc: "管道批量删除" },
            { re: />\s*[^\s|&;]+/, name: "overwrite", desc: "重定向覆盖文件", soft: true },
        ];

        // 脚本内间接删除（Python / JS / shell）
        const INDIRECT_PATTERNS = [
            /os\.system\(\s*['"][^'"]*\brm\b/,
            /subprocess\.[a-zA-Z_]+\(\s*\[?\s*['"]rm['"]/,
            /shutil\.rmtree\s*\(/,
            /os\.remove\s*\(/,
            /os\.unlink\s*\(/,
            /Files\.deleteFile\s*\(/,
            /fs\.unlink(Sync)?\s*\(/,
            /fs\.rm(Sync)?\s*\(/,
            /\.delete\(\)/,
        ];

        // 高风险路径：命中即要求确认
        const RISKY_PATH_PATTERNS = [
            { re: /^\/(bin|boot|dev|etc|lib|proc|root|sbin|sys|usr|var)(\/|$)/, why: "系统目录" },
            { re: /\/sdcard\//, why: "用户存储目录" },
            { re: /\/storage\/emulated\//, why: "用户存储目录" },
            { re: /(^|\/)\.env($|\.)/, why: "环境变量/密钥文件" },
            { re: /(^|\/)(id_rsa|id_ed25519|\.pem|\.key|\.keystore|\.jks)($|\/)/, why: "私钥/签名文件" },
            { re: /(^|\/)credentials?(\.json)?($|\/)/, why: "凭据文件" },
            { re: /(^|\/)\.git($|\/)/, why: "版本库元数据" },
        ];

        function analyzeCommand(cmd) {
            const text = String(cmd || "");
            const hits = [];
            let requiresConfirmation = false;
            let isDelete = false;

            for (const p of DELETE_PATTERNS) {
                if (p.re.test(text)) {
                    // 覆盖类是软风险，写向 /dev/null 不算
                    if (p.soft && /\/dev\/null/.test(text)) continue;
                    hits.push({ pattern: p.name, desc: p.desc, soft: !!p.soft });
                    if (!p.soft) isDelete = true;
                    requiresConfirmation = true;
                }
            }

            // 路径风险
            const pathRisks = [];
            const pathMatches = text.match(/(\/[^\s"'|&;><]+)/g) || [];
            for (const m of pathMatches) {
                for (const rp of RISKY_PATH_PATTERNS) {
                    if (rp.re.test(m)) {
                        pathRisks.push({ path: m, why: rp.why });
                        requiresConfirmation = true;
                    }
                }
            }

            return buildRiskResult(isDelete, requiresConfirmation, hits, pathRisks);
        }

        function scanScript(content) {
            const text = String(content || "");
            const hits = [];
            let isDelete = false;
            for (const re of INDIRECT_PATTERNS) {
                if (re.test(text)) {
                    isDelete = true;
                    const m = text.match(re);
                    hits.push({ pattern: "indirect-delete", snippet: m ? m[0] : "" });
                }
            }
            return buildRiskResult(isDelete, isDelete, hits, []);
        }

        function pathRisk(path) {
            const p = String(path || "");
            const pathRisks = [];
            let requiresConfirmation = false;
            for (const rp of RISKY_PATH_PATTERNS) {
                if (rp.re.test(p)) {
                    pathRisks.push({ path: p, why: rp.why });
                    requiresConfirmation = true;
                }
            }
            return buildRiskResult(false, requiresConfirmation, [], pathRisks);
        }

        function buildRiskResult(isDelete, requiresConfirmation, hits, pathRisks) {
            const reasons = [];
            for (const h of hits) {
                reasons.push(
                    (h.soft ? "覆盖风险: " : "删除操作: ") +
                        (h.desc || h.pattern) +
                        (h.snippet ? " [" + h.snippet + "]" : "")
                );
            }
            for (const pr of pathRisks) {
                reasons.push("高风险路径: " + pr.path + "（" + pr.why + "）");
            }
            let level = "LOW";
            if (isDelete && pathRisks.length > 0) level = "CRITICAL";
            else if (isDelete || pathRisks.length > 0) level = "HIGH";
            else if (hits.length > 0) level = "MEDIUM";
            return {
                is_delete: isDelete,
                requires_confirmation: requiresConfirmation,
                risk_level: level,
                hits,
                path_risks: pathRisks,
                reasons: Array.from(new Set(reasons)),
            };
        }

        return { analyzeCommand, scanScript, pathRisk };
    })();

    // ==========================================================================
    // 防幻觉层 (Hallucination Guard)
    // 检测四类幻觉，输出合法置信度标签。融合 anti-hallucination 研究：
    //   1. 确定性断言无证据 -> 强制降级 GUESSED
    //   2. 编造工具引用 -> 无对应工具调用记录则标违规
    //   3. 过度自信推测 -> 需要 >=2 独立来源，否则降 INFERRED
    //   4. 无来源技术断言 -> 弃用/移除类断言需官方来源，否则 UNKNOWN
    // ==========================================================================
    const Hallucination = (function () {
        // 事实性完成声明（做了什么），无证据即幻觉
        const FACT_CLAIMS = [
            "已读取", "已修改", "已编译", "已安装", "已测试", "已修复",
            "已部署", "已删除", "已创建", "已验证", "完成", "搞定", "跑通",
            "编译通过", "测试通过", "构建成功",
        ];
        // 绝对化语气词，无 VERIFIED 支撑 -> 降级
        const ABSOLUTE_WORDS = ["一定", "肯定", "必然", "绝对", "百分之百", "毫无疑问", "毋庸置疑"];
        // 过度自信推测词
        const OVERCONFIDENT_WORDS = ["显然", "很明显", "不用想", "众所周知"];
        // 无来源技术断言模式
        const TECH_ASSERTION_PATTERNS = [
            /已(经)?(被)?(废弃|弃用|移除|删除|下线)/,
            /在(新版本|最新版|.*版本).*(移除|删除|不支持|废弃)/,
            /不再(支持|维护|推荐)/,
        ];
        // 合法置信度标签
        const VALID_LABELS = ["VERIFIED", "INFERRED", "GUESSED", "UNKNOWN"];

        function extractLabel(text) {
            for (const lb of VALID_LABELS) {
                if (text.indexOf(lb) >= 0) return lb;
            }
            return null;
        }

        function hasAny(text, words) {
            for (const w of words) if (text.indexOf(w) >= 0) return w;
            return null;
        }

        function check(rawText, evidence) {
            const text = String(rawText || "");
            const hasEvidence = !!(evidence && String(evidence).trim().length > 0);
            const violations = [];
            const currentLabel = extractLabel(text);

            const factWord = hasAny(text, FACT_CLAIMS);
            const isFactClaim = !!factWord;

            // 规则1：事实声明无证据
            if (isFactClaim && !hasEvidence) {
                violations.push({
                    rule: "fact_without_evidence",
                    hit: factWord,
                    fix: "补充工具执行证据，或改为『正在...』过程描述",
                });
            }

            // 规则2：编造工具引用（提到工具输出但无证据）
            const mentionsToolOutput =
                /(工具(返回|输出|结果)|命令(返回|输出)|日志显示|logcat)/.test(text);
            if (mentionsToolOutput && !hasEvidence) {
                violations.push({
                    rule: "fabricated_citation",
                    fix: "引用必须可追溯到真实工具执行记录，否则删除该引用",
                });
            }

            // 规则3：绝对化语气无 VERIFIED
            const absWord = hasAny(text, ABSOLUTE_WORDS);
            if (absWord && currentLabel !== "VERIFIED") {
                violations.push({
                    rule: "absolute_without_verified",
                    hit: absWord,
                    fix: "绝对化断言必须带 VERIFIED 标签和工具结果引用，否则降级 GUESSED",
                });
            }

            // 规则4：过度自信推测
            const ocWord = hasAny(text, OVERCONFIDENT_WORDS);
            if (ocWord) {
                violations.push({
                    rule: "overconfident",
                    hit: ocWord,
                    fix: "需 >=2 独立来源交叉验证，否则替换为 INFERRED",
                });
            }

            // 规则5：无来源技术断言
            for (const re of TECH_ASSERTION_PATTERNS) {
                if (re.test(text)) {
                    const m = text.match(re);
                    violations.push({
                        rule: "unsourced_tech_assertion",
                        hit: m ? m[0] : "",
                        fix: "必须引用官方文档/版本发行说明，否则加 UNKNOWN 标签并标『需查证』",
                    });
                    break;
                }
            }

            // 结论性声明必须带标签（过程描述豁免；有证据视为已验证，豁免缺标签）
            const isConclusive =
                isFactClaim || absWord || /结论|判定|确认为|证实/.test(text);
            const isProcess = /^(正在|准备|接下来|开始)/.test(text.trim());
            if (isConclusive && !currentLabel && !isProcess && !hasEvidence) {
                violations.push({
                    rule: "missing_confidence_label",
                    fix: "结论性声明必须附 VERIFIED/INFERRED/GUESSED/UNKNOWN 之一，或提供证据",
                });
            }

            // 决策：允许 + 建议标签
            let suggestedLabel;
            if (hasEvidence) suggestedLabel = "VERIFIED";
            else if (isFactClaim || absWord) suggestedLabel = "GUESSED";
            else if (ocWord) suggestedLabel = "INFERRED";
            else suggestedLabel = "UNKNOWN";

            const allowed = violations.length === 0;
            return {
                allowed,
                current_label: currentLabel,
                suggested_label: suggestedLabel,
                has_evidence: hasEvidence,
                is_fact_claim: isFactClaim,
                violations,
                verdict: allowed
                    ? "PASS"
                    : "BLOCK: 存在 " + violations.length + " 处幻觉风险，需修正后输出",
            };
        }

        return { check };
    })();

    // ==========================================================================
    // 证据验证层 (Evidence Verifier)
    // 把完成声明映射到 L0-L6 验证等级，并对产物做真实存在性检查。
    //   L0 无证据 / L1 读过文件 / L2 交叉验证 / L3 编译通过日志
    //   L4 安装启动成功 / L5 功能测试通过 / L6 回归通过
    // ==========================================================================
    const Evidence = (function () {
        const BUILD_OK = /BUILD SUCCESSFUL|build success|compiled successfully|构建成功|编译通过/i;
        const BUILD_FAIL = /BUILD FAILED|error:|FAILURE|Exception|编译失败|构建失败/i;
        const TEST_OK = /(\d+)\s+passed|tests? passed|OK \(\d+ tests?\)|全部通过|测试通过/i;
        const INSTALL_OK = /Success\b|installed|安装成功|Performing Streamed Install/i;

        async function fileExists(path) {
            if (!path) return false;
            try {
                const r = await Files.exists(path);
                return !!(r && r.exists);
            } catch (e) {
                return false;
            }
        }

        async function classify(claim, ctx) {
            ctx = ctx || {};
            const claimText = String(claim || "");
            const hasExit = typeof ctx.exit_code === "number";
            const stdout = String(ctx.stdout || "");
            const stderr = String(ctx.stderr || "");
            const combined = stdout + "\n" + stderr;

            let level = "L0";
            let label = "UNKNOWN";
            let supports = false;
            const reasons = [];

            // 产物存在性 = L4（真实检查文件系统）
            if (ctx.artifact_path) {
                const exists = await fileExists(ctx.artifact_path);
                if (exists) {
                    level = "L4";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("产物真实存在: " + ctx.artifact_path);
                } else {
                    reasons.push("声称的产物不存在: " + ctx.artifact_path);
                    return result(level, label, false, reasons, ctx);
                }
            }

            // 命令退出码 + 输出
            if (hasExit) {
                if (ctx.exit_code !== 0 || BUILD_FAIL.test(combined)) {
                    reasons.push("退出码非0或输出含失败标记，声明被否证");
                    return result("L0", "NEGATIVE", false, reasons, ctx);
                }
                if (BUILD_OK.test(combined)) {
                    if (level === "L0") level = "L3";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("编译成功日志已验证");
                }
                if (INSTALL_OK.test(combined)) {
                    level = level === "L4" ? "L4" : "L4";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("安装/启动成功日志已验证");
                }
                if (TEST_OK.test(combined)) {
                    if (["L0", "L1", "L2"].indexOf(level) >= 0) level = "L5";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("测试通过日志已验证");
                }
            }

            // 纯文本证据
            if (level === "L0" && !hasExit) {
                if (TEST_OK.test(stdout)) {
                    level = "L2";
                    label = "INFERRED";
                    supports = true;
                    reasons.push("文本级测试通过描述");
                } else if (stdout.trim().length > 0) {
                    level = "L1";
                    label = "INFERRED";
                    reasons.push("有文本证据但未达编译级");
                } else {
                    reasons.push("无任何证据");
                }
            }

            // 声明与等级匹配检查
            const needsBuild = /编译|构建|compile|build/i.test(claimText);
            const needsL3 = /完成|搞定|交付|通过/.test(claimText);
            if (needsBuild && level < "L3" && !supports) {
                reasons.push("编译类声明但未达 L3，禁止使用『完成』字眼");
            }

            return result(level, label, supports, reasons, ctx);
        }

        function result(level, label, supports, reasons, ctx) {
            const levelNum = parseInt(level.replace("L", ""), 10);
            return {
                level,
                level_num: levelNum,
                label,
                supports_claim: supports,
                can_claim_done: levelNum >= 3 && supports,
                can_claim_delivered: levelNum >= 6 && supports,
                reasons,
                gate: levelNum >= 3 && supports
                    ? "ALLOW"
                    : "BLOCK: 验证等级 " + level + " 低于 L3，禁止宣称完成",
            };
        }

        return { classify, fileExists };
    })();

    // ==========================================================================
    // 自我意识层 (Self-Awareness / Meta-State Monitor)
    // 不是拟人化意识，而是工程元状态六维监控 + 认知偏差自检。
    // 六维：目标清晰 / 已读文件 / 证据就绪 / 不可逆风险 / 需确认 / 置信度
    // 融合 depth-skills 认知架构：附加因果链深度、假设显性化、偏差检查。
    // ==========================================================================
    const SelfMonitor = (function () {
        // 认知偏差检测词
        const BIAS_PATTERNS = [
            { re: /(应该|大概|可能就是|估计)(没|不会|不用)/, bias: "乐观偏差", warn: "对失败可能性估计不足，建议验证" },
            { re: /(以前|上次|一般)(都|就)(是|这样)/, bias: "近因/锚定偏差", warn: "历史经验权重过高，需结合当前证据" },
            { re: /(肯定|一定)(没问题|可以|行)/, bias: "过度自信偏差", warn: "缺乏验证的确定性判断" },
        ];

        function assess(opts) {
            opts = opts || {};
            const goal = String(opts.goal || "");
            const goalClear = opts.goal_clear !== false && goal.trim().length >= 4;
            const filesRead = !!opts.files_read;
            const evidenceReady = !!opts.evidence_ready;
            const irreversibleRisk = !!opts.irreversible_risk;

            // 置信度推导
            let confidence;
            if (evidenceReady) confidence = "VERIFIED";
            else if (filesRead) confidence = "INFERRED";
            else confidence = "UNKNOWN";

            // 偏差自检
            const biases = [];
            for (const b of BIAS_PATTERNS) {
                if (b.re.test(goal)) biases.push({ bias: b.bias, warn: b.warn });
            }

            // 因果链深度（衡量任务复杂度）
            const causalMarkers = (goal.match(/因为|所以|导致|然后|接着|之后|再|才能/g) || []).length;
            const causalDepth = causalMarkers >= 3 ? "deep" : causalMarkers >= 1 ? "medium" : "shallow";

            // 就绪度评分
            let readiness = 0;
            if (goalClear) readiness += 30;
            if (filesRead) readiness += 30;
            if (evidenceReady) readiness += 30;
            if (!irreversibleRisk) readiness += 10;

            const needsConfirmation = irreversibleRisk;
            const blockers = [];
            if (!goalClear) blockers.push("目标不清晰，需澄清");
            if (irreversibleRisk) blockers.push("存在不可逆风险，需用户确认");
            if (!filesRead && /修改|重构|修复|删除/.test(goal)) blockers.push("改动类任务但未读取相关文件");

            return {
                dimensions: {
                    goal_clear: goalClear,
                    files_read: filesRead,
                    evidence_ready: evidenceReady,
                    irreversible_risk: irreversibleRisk,
                    needs_confirmation: needsConfirmation,
                    confidence: confidence,
                },
                readiness_score: readiness,
                causal_depth: causalDepth,
                cognitive_biases: biases,
                blockers,
                state: blockers.length === 0 ? "READY" : "NOT_READY",
                status_card:
                    "[自我意识] 就绪度 " + readiness + "/100 · 置信度 " + confidence +
                    " · 因果链 " + causalDepth +
                    (blockers.length ? " · 阻塞: " + blockers.join("; ") : " · 无阻塞"),
            };
        }

        return { assess };
    })();

    // ==========================================================================
    // 输出防火墙 (Output Firewall)
    // 六类违规：思考泄漏 / 工具参数泄漏 / 废话 / 抒情 / 超长代码块 / 乱码
    // ==========================================================================
    const OutputFirewall = (function () {
        const THOUGHT_LEAK = [
            "我认为", "我推测", "我分析", "我想到", "我正在思考", "我准备",
            "我打算", "让我想想", "在我看来", "我个人觉得", "我的理解是",
        ];
        const TOOL_LEAK = [
            /tool_name\s*[:=]/i, /tool_args/i, /api_key/i, /token\s*=/i,
            /secret\s*[:=]/i, /password\s*[:=]/i, /Authorization:\s*Bearer/i,
        ];
        const FILLER = [
            "加油", "没问题的", "不用担心", "好的我这就来帮你", "我这就",
            "不好意思", "很抱歉", "你说得对", "完全理解", "没关系的",
        ];
        const EMOTIONAL = [
            "我理解你的感受", "这种情况确实令人", "我感同身受", "我能体会",
        ];

        function check(rawText) {
            const text = String(rawText || "");
            const violations = [];

            for (const w of THOUGHT_LEAK) {
                if (text.indexOf(w) >= 0) violations.push({ type: "thought_leak", hit: w });
            }
            for (const re of TOOL_LEAK) {
                if (re.test(text)) {
                    const m = text.match(re);
                    violations.push({ type: "tool_leak", hit: m ? m[0] : "" });
                }
            }
            for (const w of FILLER) {
                if (text.indexOf(w) >= 0) violations.push({ type: "filler", hit: w });
            }
            for (const w of EMOTIONAL) {
                if (text.indexOf(w) >= 0) violations.push({ type: "emotional", hit: w });
            }

            // 超长代码块：三反引号 fenced，>10 行或 >300 字符
            const fences = text.match(/```[\s\S]*?```/g) || [];
            for (const block of fences) {
                const lines = block.split("\n").length - 2;
                if (lines > 10 || block.length > 300) {
                    violations.push({
                        type: "oversized_code_block",
                        hit: lines + " 行代码块",
                        fix: "代码必须写入文件，用工具而非对话框输出",
                    });
                }
            }

            // 乱码：不可见控制字符 / 替换字符
            if (/[\uFFFD]/.test(text) || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
                violations.push({ type: "mojibake", hit: "非可见控制字符/替换字符" });
            }

            // 违规比例判定
            const sentences = text.split(/[。！？.!?\n]+/).filter(Boolean);
            const severity = violations.some(
                (v) => v.type === "tool_leak" || v.type === "mojibake"
            )
                ? "SEVERE"
                : violations.length > Math.max(1, sentences.length / 2)
                ? "MAJOR"
                : violations.length > 0
                ? "MINOR"
                : "CLEAN";

            const action =
                severity === "SEVERE" || severity === "MAJOR"
                    ? "BLOCK: 必须重写后输出"
                    : severity === "MINOR"
                    ? "FILTER: 过滤违规片段后输出"
                    : "PASS";

            return {
                clean: violations.length === 0,
                severity,
                action,
                violation_count: violations.length,
                violations,
            };
        }

        return { check };
    })();

    // ==========================================================================
    // 开源搜索层 (Open-Source Search) —— 真实 GitHub API
    // 替换原项目"50个假融合"，用真实网络请求按 Star 排序返回成熟仓库。
    // ==========================================================================
    const OpenSource = (function () {
        async function search(keyword, language, minStars, limit) {
            minStars = minStars || 500;
            limit = limit || 5;
            let q = encodeURIComponent(
                String(keyword || "") +
                    (language ? " language:" + language : "") +
                    " stars:>=" + minStars
            );
            const url =
                "https://api.github.com/search/repositories?q=" +
                q +
                "&sort=stars&order=desc&per_page=" +
                limit;
            try {
                const resp = await Network.httpGet(url);
                let body = resp && resp.content ? resp.content : resp;
                let json;
                if (typeof body === "string") {
                    json = JSON.parse(body);
                } else {
                    json = body;
                }
                const items = (json && json.items) || [];
                const repos = items.slice(0, limit).map((r) => ({
                    name: r.full_name,
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    language: r.language,
                    license: r.license ? r.license.spdx_id : "unknown",
                    updated_at: r.pushed_at,
                    open_issues: r.open_issues_count,
                    url: r.html_url,
                    description: r.description,
                }));
                return {
                    success: true,
                    query: keyword,
                    total_count: json.total_count || repos.length,
                    count: repos.length,
                    repos,
                    note:
                        repos.length >= 3
                            ? "已返回 >=3 个候选，可进入比较-选择-融合流程"
                            : "候选不足3个，建议放宽关键词或降低 min_stars",
                };
            } catch (e) {
                return {
                    success: false,
                    query: keyword,
                    error: String(e && e.message ? e.message : e),
                    fallback:
                        "GitHub API 请求失败（可能限流/无网络）。可改用 visit_web 搜索，或标注 GUESSED 后自行实现。",
                };
            }
        }
        return { search };
    })();

    // ==========================================================================
    // 记忆层 (Memory) —— 真实 Operit 持久化记忆库
    // 替换原项目内存 list + 假向量库。成功/失败分区，跨会话可召回。
    // ==========================================================================
    const Memory = (function () {
        const ROOT = "zero_apex";

        async function remember(kind, project, summary, evidence, techStack) {
            const isFailure = String(kind) === "failure";
            const folder = ROOT + "/" + (isFailure ? "failure" : "success");
            const stamp = nowStamp();
            const title =
                "[" + (isFailure ? "失败" : "成功") + "] " + project + " · " + stamp;
            const content =
                "项目: " + project + "\n" +
                "类型: " + (isFailure ? "失败经验" : "成功方案") + "\n" +
                "摘要: " + String(summary || "") + "\n" +
                "证据: " + String(evidence || "无") + "\n" +
                "技术栈: " + String(techStack || "未标注") + "\n" +
                "记录时间: " + new Date().toISOString();
            const tags =
                (isFailure ? "failure" : "success") +
                "," + project +
                (techStack ? "," + techStack.split(/[,，]/).join(",") : "");
            try {
                const id = await Tools.Memory.create({
                    title,
                    content,
                    source: "zero_apex_engine",
                    folderPath: folder,
                    tags,
                });
                return {
                    success: !!id,
                    message: "经验已写入真实记忆库",
                    memory_id: id,
                    title,
                    folder,
                };
            } catch (e) {
                return { success: false, error: String(e && e.message ? e.message : e) };
            }
        }

        async function recall(query, kind, limit) {
            limit = limit || 5;
            let folder = ROOT;
            if (kind === "success") folder = ROOT + "/success";
            else if (kind === "failure") folder = ROOT + "/failure";
            try {
                const res = await Tools.Memory.query({
                    query: query,
                    folderPath: folder,
                    limit: limit,
                });
                let entries = [];
                if (res && res.memories) entries = res.memories;
                else if (Array.isArray(res)) entries = res;
                else if (res && res.results) entries = res.results;
                return {
                    success: true,
                    query,
                    kind: kind || "all",
                    count: entries.length,
                    memories: entries,
                    raw: res && res.toString ? res.toString() : undefined,
                };
            } catch (e) {
                return { success: false, error: String(e && e.message ? e.message : e) };
            }
        }

        return { remember, recall };
    })();

    // ==========================================================================
    // 文件快照层 (Snapshot) —— 真实 .trash 备份/恢复
    // 防删代码的落地：删除前把源文件复制到 <dir>/.trash/<name>.<stamp>
    // ==========================================================================
    const Snapshot = (function () {
        function trashDir(path) {
            const dir = dirname(path) || ".";
            return dir + "/.trash";
        }

        async function snapshot(path) {
            try {
                const ex = await Files.exists(path);
                if (!ex || !ex.exists) {
                    return { success: false, error: "源文件不存在: " + path };
                }
                const td = trashDir(path);
                try {
                    await Files.write(td + "/.keep", "");
                } catch (e) {}
                const content = await Files.read(path);
                const snapName = basename(path) + "." + nowStamp();
                const dest = td + "/" + snapName;
                const w = await Files.write(dest, content.content || "");
                return {
                    success: !!(w && (w.successful === undefined || w.successful)),
                    message: "已备份到快照目录",
                    original: path,
                    snapshot: dest,
                    snapshot_name: snapName,
                };
            } catch (e) {
                return { success: false, error: String(e && e.message ? e.message : e) };
            }
        }

        async function restore(path, snapshotName) {
            try {
                const td = trashDir(path);
                let src;
                if (snapshotName) {
                    src = td + "/" + snapshotName;
                } else {
                    let entries = [];
                    try {
                        const listing = Files.listFiles
                            ? await Files.listFiles(td)
                            : null;
                        if (listing && listing.entries) entries = listing.entries;
                    } catch (e) {}
                    const prefix = basename(path) + ".";
                    const cands = entries
                        .map((e) => (typeof e === "string" ? e : e.name))
                        .filter((n) => n && n.indexOf(prefix) === 0)
                        .sort();
                    if (cands.length === 0) {
                        return {
                            success: false,
                            error: "未找到 " + path + " 的快照，请显式指定 snapshot_name",
                        };
                    }
                    src = td + "/" + cands[cands.length - 1];
                }
                const content = await Files.read(src);
                const w = await Files.write(path, content.content || "");
                return {
                    success: !!(w && (w.successful === undefined || w.successful)),
                    message: "已从快照恢复",
                    restored_from: src,
                    target: path,
                };
            } catch (e) {
                return { success: false, error: String(e && e.message ? e.message : e) };
            }
        }

        return { snapshot, restore };
    })();

    // ==========================================================================
    // Kernel: 综合门禁编排
    // preflight 把自我意识层、防删代码层、防幻觉层串成一次执行前决策。
    // ==========================================================================
    async function preflightGate(goal, command, evidence, filesRead) {
        const gates = [];
        const reasons = [];
        let allowed = true;
        let requiresConfirmation = false;

        // 自我意识层
        const self = SelfMonitor.assess({
            goal: goal,
            files_read: filesRead,
            evidence_ready: !!(evidence && String(evidence).trim()),
        });
        if (self.cognitive_biases.length > 0) {
            gates.push("self_awareness");
            for (const b of self.cognitive_biases) reasons.push("偏差[" + b.bias + "]: " + b.warn);
        }

        // 防删代码层
        if (command) {
            const risk = FileGuard.analyzeCommand(command);
            if (risk.requires_confirmation) {
                gates.push("file_guard");
                allowed = false;
                requiresConfirmation = true;
                for (const r of risk.reasons) reasons.push(r);
            }
        }

        // 防幻觉层（对目标里的既成声明检查）
        const hallu = Hallucination.check(goal, evidence);
        if (!hallu.allowed) {
            gates.push("hallucination");
            for (const v of hallu.violations) reasons.push("幻觉[" + v.rule + "]: " + v.fix);
            // 幻觉只警告不必然阻断，除非是事实声明无证据
            if (hallu.violations.some((v) => v.rule === "fact_without_evidence")) {
                allowed = false;
            }
        }

        let state;
        if (requiresConfirmation) state = "WAIT_CONFIRMATION";
        else if (!allowed) state = "NEED_EVIDENCE";
        else if (self.state === "NOT_READY") state = "NOT_READY";
        else state = "READY";

        return {
            allowed: allowed && self.state === "READY",
            state,
            requires_confirmation: requiresConfirmation,
            confidence: self.dimensions.confidence,
            readiness_score: self.readiness_score,
            gates_triggered: gates,
            reasons: Array.from(new Set(reasons)),
            self_awareness: self,
            hallucination: hallu,
            status_card: self.status_card,
        };
    }

    return {
        FileGuard,
        Hallucination,
        Evidence,
        SelfMonitor,
        OutputFirewall,
        OpenSource,
        Memory,
        Snapshot,
        preflightGate,
    };
})();

// ==========================================================================
// 工具导出层：把内部引擎映射为 Operit 工具
// ==========================================================================
async function preflight(params) {
    return await ZeroApex.preflightGate(
        params.goal,
        params.command,
        params.evidence,
        params.files_read
    );
}

async function file_guard(params) {
    if (params.script) return ZeroApex.FileGuard.scanScript(params.script);
    if (params.path && !params.command) return ZeroApex.FileGuard.pathRisk(params.path);
    return ZeroApex.FileGuard.analyzeCommand(params.command || "");
}

async function hallucination_guard(params) {
    return ZeroApex.Hallucination.check(params.text, params.evidence);
}

async function evidence_check(params) {
    return await ZeroApex.Evidence.classify(params.claim, {
        exit_code: params.exit_code,
        stdout: params.stdout,
        stderr: params.stderr,
        artifact_path: params.artifact_path,
    });
}

async function self_monitor(params) {
    return ZeroApex.SelfMonitor.assess({
        goal: params.goal,
        goal_clear: params.goal_clear,
        files_read: params.files_read,
        evidence_ready: params.evidence_ready,
        irreversible_risk: params.irreversible_risk,
    });
}

async function output_firewall(params) {
    return ZeroApex.OutputFirewall.check(params.text);
}

async function search_opensource(params) {
    return await ZeroApex.OpenSource.search(
        params.keyword,
        params.language,
        params.min_stars,
        params.limit
    );
}

async function remember(params) {
    return await ZeroApex.Memory.remember(
        params.kind,
        params.project,
        params.summary,
        params.evidence,
        params.tech_stack
    );
}

async function recall(params) {
    return await ZeroApex.Memory.recall(params.query, params.kind, params.limit);
}

async function snapshot_file(params) {
    return await ZeroApex.Snapshot.snapshot(params.path);
}

async function restore_file(params) {
    return await ZeroApex.Snapshot.restore(params.path, params.snapshot_name);
}

// 统一包装：捕获异常并 complete
async function wrapToolExecution(func, params) {
    try {
        const result = await func(params);
        complete(result);
    } catch (error) {
        complete({
            success: false,
            message: "工具执行异常: " + (error && error.message ? error.message : String(error)),
        });
    }
}

// 自测入口：不写用户数据，只跑纯逻辑层，验证引擎可运行
async function main() {
    const report = [];
    // 防删代码层
    const r1 = ZeroApex.FileGuard.analyzeCommand("rm -rf /home/user/project");
    report.push({ test: "rm -rf 检测", pass: r1.is_delete && r1.requires_confirmation });
    const r2 = ZeroApex.FileGuard.analyzeCommand("ls -la /sdcard");
    report.push({ test: "ls 不误判删除", pass: !r2.is_delete });
    const r3 = ZeroApex.FileGuard.scanScript('os.system("rm -rf /tmp")');
    report.push({ test: "脚本间接删除检测", pass: r3.is_delete });
    // 防幻觉层
    const h1 = ZeroApex.Hallucination.check("编译通过了", null);
    report.push({ test: "无证据完成声明拦截", pass: !h1.allowed });
    const h2 = ZeroApex.Hallucination.check("编译通过了", "BUILD SUCCESSFUL");
    report.push({ test: "有证据完成声明放行", pass: h2.allowed });
    // 证据验证层
    const e1 = await ZeroApex.Evidence.classify("编译通过", {
        exit_code: 0,
        stdout: "BUILD SUCCESSFUL",
    });
    report.push({ test: "编译成功=L3且可宣称完成", pass: e1.level === "L3" && e1.can_claim_done });
    const e2 = await ZeroApex.Evidence.classify("编译通过", {
        exit_code: 1,
        stderr: "BUILD FAILED",
    });
    report.push({ test: "编译失败被否证", pass: !e2.supports_claim });
    // 自我意识层
    const s1 = ZeroApex.SelfMonitor.assess({ goal: "修复登录崩溃", files_read: false });
    report.push({ test: "改动类未读文件生成阻塞", pass: s1.blockers.length > 0 });
    // 输出防火墙
    const o1 = ZeroApex.OutputFirewall.check("我认为这个应该没问题");
    report.push({ test: "思考泄漏检测", pass: !o1.clean });

    const passed = report.filter((x) => x.pass).length;
    return {
        engine: "zero_apex",
        runtime: "Operit Sandbox (QuickJS)",
        total: report.length,
        passed,
        failed: report.length - passed,
        all_pass: passed === report.length,
        detail: report,
    };
}

exports.preflight = (params) => wrapToolExecution(preflight, params);
exports.file_guard = (params) => wrapToolExecution(file_guard, params);
exports.hallucination_guard = (params) => wrapToolExecution(hallucination_guard, params);
exports.evidence_check = (params) => wrapToolExecution(evidence_check, params);
exports.self_monitor = (params) => wrapToolExecution(self_monitor, params);
exports.output_firewall = (params) => wrapToolExecution(output_firewall, params);
exports.search_opensource = (params) => wrapToolExecution(search_opensource, params);
exports.remember = (params) => wrapToolExecution(remember, params);
exports.recall = (params) => wrapToolExecution(recall, params);
exports.snapshot_file = (params) => wrapToolExecution(snapshot_file, params);
exports.restore_file = (params) => wrapToolExecution(restore_file, params);
exports.main = main;
