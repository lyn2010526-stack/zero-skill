// zero_apex_engine.js — Lean Edition
// 只做三件事：命令安全解析 + 文件保护 + 执行审计
// 单文件，QuickJS 兼容，无 require()
// ~1800 行，不造轮子，不假装能防 AI 闯祸

const ZeroApex = (function () {
    'use strict';

    // ======================================================================
    // §0 ErrorCodes — 稳定错误码
    // ======================================================================
    var ErrorCode = Object.freeze({
        OK: "OK",
        INVALID_ARGUMENT: "E1001_INVALID_ARGUMENT",
        GUARD_BLOCK: "E4001_GUARD_BLOCK",
        FILE_BACKUP_FAILED: "E4021_FILE_BACKUP_FAILED",
        SNAPSHOT_RESTORE_FAILED: "E4022_SNAPSHOT_RESTORE_FAILED",
        INTERNAL_ERROR: "E5001_INTERNAL_ERROR",
        DEPENDENCY_MISSING: "E5002_DEPENDENCY_MISSING",
    });

    function errorMessage(code) {
        var msgs = {
            OK: "成功",
            E4001_GUARD_BLOCK: "安全门禁拦截",
            E4021_FILE_BACKUP_FAILED: "文件备份失败",
            E4022_SNAPSHOT_RESTORE_FAILED: "快照恢复失败",
            E5001_INTERNAL_ERROR: "引擎内部错误",
            E5002_DEPENDENCY_MISSING: "缺少运行依赖",
        };
        return msgs[code] || code;
    }

    // ======================================================================
    // §1 工具函数
    // ======================================================================
    function safeString(v) {
        if (v == null) return "";
        if (typeof v === "string") return v;
        if (v instanceof Error) return v.message || "error";
        try { return JSON.stringify(v); } catch (e) { return String(v); }
    }

    function ambient(name) {
        try { return (typeof globalThis !== "undefined" && globalThis[name]) || undefined; }
        catch (e) { return undefined; }
    }

    // ======================================================================
    // §2 PathUtils — 路径安全
    // ======================================================================
    var PathUtils = (function () {
        function normalize(p) {
            if (!p) return "";
            p = String(p).replace(/\\/g, "/");
            var parts = p.split("/");
            var stack = [];
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === "" || parts[i] === ".") continue;
                if (parts[i] === "..") { stack.pop(); continue; }
                stack.push(parts[i]);
            }
            var resolved = stack.join("/");
            if (p.startsWith("/")) resolved = "/" + resolved;
            return resolved;
        }

        function hasTraversal(p) {
            if (!p) return false;
            // 检测路径中是否包含 .. 组件
            var parts = String(p).split("/");
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === "..") return true;
            }
            return false;
        }

        function join(base) {
            var parts = [normalize(base)];
            for (var i = 1; i < arguments.length; i++) {
                parts.push(normalize(arguments[i]));
            }
            return parts.join("/").replace(/\/+/g, "/");
        }

        function extname(p) {
            if (!p) return "";
            var dot = p.lastIndexOf(".");
            if (dot < 0) return "";
            return p.slice(dot).toLowerCase();
        }

        return { normalize: normalize, hasTraversal: hasTraversal, join: join, extname: extname };
    })();

    // ======================================================================
    // §3 SnapshotModule — 文件保护（删前备份，支持恢复）
    // ======================================================================
    var SnapshotModule = (function () {
        var TRASH_DIR = ".trash";
        var tombstones = {};

        function trashPath(deps) {
            return deps && deps.Files ? PathUtils.join(deps.Files.cwd || ".", TRASH_DIR) : TRASH_DIR;
        }

        async function backup(deps, filePath) {
            if (!deps || !deps.Files) return { skipped: true, reason: "no Files dep" };
            try {
                var content = await deps.Files.read(filePath);
                if (content == null) return { skipped: true, reason: "file not found" };
                var ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
                var backupName = filePath.replace(/\//g, "__") + "." + ts + ".bak";
                var trashDir = trashPath(deps);
                await deps.Files.write(PathUtils.join(trashDir, backupName), content);
                // 写墓碑
                var tombstone = {
                    original_path: filePath,
                    backup_path: PathUtils.join(trashDir, backupName),
                    timestamp: new Date().toISOString(),
                    size: content.length || 0,
                };
                await deps.Files.write(PathUtils.join(trashDir, backupName + ".tomb"), JSON.stringify(tombstone));
                tombstones[filePath] = tombstone;
                return { success: true, backup_path: tombstone.backup_path };
            } catch (e) {
                return { success: false, code: ErrorCode.FILE_BACKUP_FAILED, error: safeString(e) };
            }
        }

        async function restore(deps, filePath) {
            if (!deps || !deps.Files) return { skipped: true, reason: "no Files dep" };
            try {
                var tomb = tombstones[filePath];
                if (!tomb) {
                    // 从磁盘扫描墓碑
                    var trashDir = trashPath(deps);
                    var list = await deps.Files.listFiles(trashDir);
                    if (list && list.entries) {
                        for (var i = 0; i < list.entries.length; i++) {
                            var name = list.entries[i].name || list.entries[i];
                            if (name.indexOf(filePath.replace(/\//g, "__")) >= 0 && name.endsWith(".tomb")) {
                                var tombContent = await deps.Files.read(PathUtils.join(trashDir, name));
                                tomb = JSON.parse(tombContent);
                                break;
                            }
                        }
                    }
                }
                if (!tomb) return { success: false, reason: "no backup found for " + filePath };
                var content = await deps.Files.read(tomb.backup_path);
                if (content == null) return { success: false, reason: "backup file missing" };
                await deps.Files.write(filePath, content);
                return { success: true, restored_from: tomb.backup_path };
            } catch (e) {
                return { success: false, code: ErrorCode.SNAPSHOT_RESTORE_FAILED, error: safeString(e) };
            }
        }

        return { backup: backup, restore: restore };
    })();

    // ======================================================================
    // §4 FileGuard — 删除/覆盖检测 + 自动备份
    // ======================================================================
    var FileGuard = (function () {
        var DANGEROUS_PATHS = ["/etc", "/usr", "/bin", "/sbin", "/boot", "/sys", "/proc", "/dev", "C:\\Windows"];
        var DELETE_PATTERNS = [
            /\brm\s+(-[rfRF]+\s+)?[\/\.]/i,
            /\bunlink\b/i,
            /\bshred\b/i,
            /\bremove\s+-rf/i,
            /\bdelete\s+from\b/i,
            /\bdrop\s+(table|database)\b/i,
            /\btruncate\b/i,
        ];
        var OVERWRITE_PATTERNS = [
            /\bchmod\s+(777|666)\b/i,
            /\bmkfs\b/i,
            /\bfdisk\b/i,
            /\bdd\s+if=.*of=\/dev\//i,
        ];

        function analyzeCommand(cmd) {
            if (!cmd) return { is_delete: false, is_overwrite: false, risky_paths: [], severity: "none" };
            var text = safeString(cmd);
            var is_delete = false;
            var is_overwrite = false;
            var risky_paths = [];

            for (var i = 0; i < DELETE_PATTERNS.length; i++) {
                if (DELETE_PATTERNS[i].test(text)) { is_delete = true; break; }
            }
            for (var j = 0; j < OVERWRITE_PATTERNS.length; j++) {
                if (OVERWRITE_PATTERNS[j].test(text)) { is_overwrite = true; break; }
            }

            // 检测危险路径
            for (var k = 0; k < DANGEROUS_PATHS.length; k++) {
                if (text.indexOf(DANGEROUS_PATHS[k]) >= 0) risky_paths.push(DANGEROUS_PATHS[k]);
            }

            var severity = "none";
            if (is_delete && risky_paths.length > 0) severity = "critical";
            else if (is_delete || is_overwrite) severity = "high";
            else if (risky_paths.length > 0) severity = "medium";

            return {
                is_delete: is_delete,
                is_overwrite: is_overwrite,
                risky_paths: risky_paths,
                severity: severity,
                requires_confirmation: severity === "critical" || severity === "high",
            };
        }

        function isProtectedPath(path) {
            if (!path) return false;
            var p = PathUtils.normalize(path);
            for (var i = 0; i < DANGEROUS_PATHS.length; i++) {
                if (p === DANGEROUS_PATHS[i] || p.startsWith(DANGEROUS_PATHS[i] + "/")) return true;
            }
            return false;
        }

        return { analyzeCommand: analyzeCommand, isProtectedPath: isProtectedPath };
    })();

    // ======================================================================
    // §5 CommandNormalizer — 命令混淆解码（真正有价值的层）
    // ======================================================================
    var CommandNormalizer = (function () {
        function decodeUnicodeEscapes(s) {
            return s.replace(/\\u([0-9a-fA-F]{4})/g, function (_, hex) {
                try { return String.fromCharCode(parseInt(hex, 16)); } catch (e) { return _; }
            });
        }

        function decodeHexEscapes(s) {
            return s.replace(/\\x([0-9a-fA-F]{2})/g, function (_, hex) {
                try { return String.fromCharCode(parseInt(hex, 16)); } catch (e) { return _; }
            });
        }

        function decodeOctalEscapes(s) {
            return s.replace(/\\([0-7]{3})/g, function (_, oct) {
                try { return String.fromCharCode(parseInt(oct, 8)); } catch (e) { return _; }
            });
        }

        function normalize(cmd) {
            if (!cmd) return "";
            var cur = safeString(cmd);
            // 迭代解码（最多3层嵌套混淆）
            for (var i = 0; i < 3; i++) {
                var before = cur;
                cur = decodeUnicodeEscapes(cur);
                cur = decodeHexEscapes(cur);
                cur = decodeOctalEscapes(cur);
                if (cur === before) break;
            }
            // 去多余空白
            cur = cur.replace(/\s+/g, " ").trim();
            return cur;
        }

        return { normalize: normalize };
    })();

    // ======================================================================
    // §6 ShellGuard — 命令分段解析 + 读写白名单
    // ======================================================================
    var ShellGuard = (function () {
        var READONLY_COMMANDS = ["ls", "cat", "head", "tail", "grep", "find", "wc", "file", "stat", "which", "echo", "pwd", "whoami", "date", "env", "printenv"];
        var WRAP_PREFIXES = ["timeout", "nice", "env", "time"];

        function splitSegments(cmd) {
            if (!cmd) return [];
            var text = safeString(cmd);
            // 按 && ; | 分割，保留分隔符
            var raw = text.split(/(?=[;&|])|(?<=[;&|])/);
            var segments = [];
            for (var i = 0; i < raw.length; i++) {
                var s = raw[i].trim();
                if (!s) continue;
                if (s === "&&" || s === ";" || s === "|" || s === "||") continue;
                segments.push(parseSegment(s));
            }
            return segments;
        }

        function parseSegment(seg) {
            // 剥掉包装前缀
            var s = seg.trim();
            for (var i = 0; i < WRAP_PREFIXES.length; i++) {
                var re = new RegExp("^" + WRAP_PREFIXES[i] + "\\s+");
                s = s.replace(re, "");
            }
            var parts = s.split(/\s+/);
            var base_cmd = parts[0] || "";
            var is_readonly = READONLY_COMMANDS.indexOf(base_cmd) >= 0;
            return {
                raw: seg,
                command: base_cmd,
                args: parts.slice(1),
                is_readonly: is_readonly,
            };
        }

        function analyze(cmd) {
            var segments = splitSegments(cmd);
            var has_write = false;
            var has_delete = false;
            var analysis_segments = [];
            for (var i = 0; i < segments.length; i++) {
                var seg = segments[i];
                var fg = FileGuard.analyzeCommand(seg.raw);
                if (fg.is_delete) has_delete = true;
                if (!seg.is_readonly) has_write = true;
                analysis_segments.push({
                    command: seg.command,
                    is_readonly: seg.is_readonly,
                    severity: fg.severity,
                });
            }
            var verdict = "ALLOW";
            if (has_delete) verdict = "ASK";
            if (has_delete && segments.some(function (s) { return s.args && s.args.indexOf("-rf") >= 0; })) verdict = "BLOCK";
            return {
                verdict: verdict,
                segments: analysis_segments,
                has_write: has_write,
                has_delete: has_delete,
            };
        }

        return { analyze: analyze, splitSegments: splitSegments };
    })();

    // ======================================================================
    // §7 AuditLogger — 执行审计日志
    // ======================================================================
    var AuditLogger = (function () {
        var logs = [];
        var flushSize = 1;

        function append(entry) {
            entry.timestamp = new Date().toISOString();
            logs.push(entry);
            if (logs.length >= flushSize) flush();
        }

        function flush() {
            var deps = getDefaultDeps();
            if (deps && deps.Files && logs.length > 0) {
                var lines = logs.map(function (e) { return JSON.stringify(e); }).join("\n") + "\n";
                try { deps.Files.write("audit.log", { append: true, content: lines }); } catch (e) { /* ignore */ }
                logs = [];
            }
        }

        function recent(n) {
            return logs.slice(-(n || 10));
        }

        return { append: append, flush: flush, recent: recent };
    })();

    // ======================================================================
    // §8 ManifestLoader — 读取 manifest.json
    // ======================================================================
    var ManifestLoader = (function () {
        var manifest = null;

        async function loadAsync() {
            if (manifest) return manifest;
            var deps = getDefaultDeps();
            try {
                if (deps && deps.Files) {
                    var content = await deps.Files.read("manifest.json");
                    if (content) manifest = JSON.parse(content);
                }
            } catch (e) { /* ignore */ }
            if (!manifest) {
                // 内置最小 manifest
                manifest = {
                    name: "zero_apex",
                    version: "2.6.0",
                    tools: {},
                };
            }
            return manifest;
        }

        function isToolAllowed(toolName) {
            if (!manifest) return true;
            var tools = manifest.tools || {};
            if (tools[toolName] && tools[toolName].blocked) return false;
            return true;
        }

        return { loadAsync: loadAsync, isToolAllowed: isToolAllowed, get: function () { return manifest; } };
    })();

    // ======================================================================
    // §9 工具执行包装
    // ======================================================================
    var defaultDeps = null;

    function getDefaultDeps() { return defaultDeps; }

    function setDefaultDeps(deps) { defaultDeps = deps; }

    async function wrapToolExecution(func, params, toolName) {
        var p = params || {};
        var startTs = Date.now();
        var result;
        try {
            // manifest 检查
            await ManifestLoader.loadAsync();
            if (toolName && !ManifestLoader.isToolAllowed(toolName)) {
                result = { success: false, code: ErrorCode.GUARD_BLOCK, error: "工具 " + toolName + " 被 manifest 禁用" };
                AuditLogger.append({ tool: toolName, trigger: "manifest_blocked", duration_ms: Date.now() - startTs, result_code: ErrorCode.GUARD_BLOCK });
                return result;
            }
            // 命令安全检查
            if (p.command) {
                var normalized = CommandNormalizer.normalize(p.command);
                var sg = ShellGuard.analyze(normalized);
                if (sg.verdict === "BLOCK") {
                    result = { success: false, code: ErrorCode.GUARD_BLOCK, error: "命令被安全门禁拦截: " + sg.segments.map(function (s) { return s.command; }).join(", ") };
                    AuditLogger.append({ tool: toolName, trigger: "shellguard_block", command: p.command, duration_ms: Date.now() - startTs, result_code: ErrorCode.GUARD_BLOCK });
                    return result;
                }
                if (sg.verdict === "ASK" && !p.confirmed) {
                    result = { success: false, code: "CONFIRMATION_REQUIRED", error: "需要用户确认（高风险命令）", segments: sg.segments };
                    AuditLogger.append({ tool: toolName, trigger: "needs_confirmation", command: p.command, duration_ms: Date.now() - startTs, result_code: "CONFIRMATION_REQUIRED" });
                    return result;
                }
            }
            // 路径安全检查
            var targetPath = p.path || p.file_path || "";
            if (targetPath && PathUtils.hasTraversal(targetPath)) {
                result = { success: false, code: ErrorCode.GUARD_BLOCK, error: "路径遍历攻击检测: " + targetPath };
                AuditLogger.append({ tool: toolName, trigger: "path_traversal", path: targetPath, duration_ms: Date.now() - startTs, result_code: ErrorCode.GUARD_BLOCK });
                return result;
            }
            // 文件操作前自动备份
            if (p.action === "delete" || p.action === "write") {
                if (targetPath && defaultDeps) {
                    var backupResult = await SnapshotModule.backup(defaultDeps, targetPath);
                    p._backup = backupResult;
                }
            }
            // 执行工具
            result = await func(p);
            AuditLogger.append({ tool: toolName, trigger: p.trigger || "execute", duration_ms: Date.now() - startTs, result_code: result && result.code || (result && result.success ? "OK" : "UNKNOWN") });
            return result;
        } catch (error) {
            var errResult = { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(error) };
            AuditLogger.append({ tool: toolName, trigger: "exception", duration_ms: Date.now() - startTs, result_code: ErrorCode.INTERNAL_ERROR, error: safeString(error) });
            return errResult;
        }
    }

    // ======================================================================
    // §10 create() — 工厂函数
    // ======================================================================
    function create(deps) {
        deps = deps || {};
        if (!defaultDeps) defaultDeps = deps;
        var inst = {
            deps: deps,
            // 文件保护
            async snapshot_backup(filePath) { return SnapshotModule.backup(deps, filePath); },
            async snapshot_restore(filePath) { return SnapshotModule.restore(deps, filePath); },
            // 命令安全
            file_guard(command) { return FileGuard.analyzeCommand(command); },
            shell_guard(command) { return ShellGuard.analyze(command); },
            normalize_command(command) { return CommandNormalizer.normalize(command); },
            // 审计
            audit_log(n) { return AuditLogger.recent(n); },
            // 工具执行包装
            wrapToolExecution: wrapToolExecution,
            // 路径工具
            path_utils: PathUtils,
        };
        return inst;
    }

    // ======================================================================
    // 导出
    // ======================================================================
    return {
        create: create,
        ErrorCode: ErrorCode,
        errorMessage: errorMessage,
        FileGuard: FileGuard,
        ShellGuard: ShellGuard,
        CommandNormalizer: CommandNormalizer,
        SnapshotModule: SnapshotModule,
        AuditLogger: AuditLogger,
        ManifestLoader: ManifestLoader,
        PathUtils: PathUtils,
    };
})();

// 兼容 CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        create: ZeroApex.create,
        ErrorCode: ZeroApex.ErrorCode,
        errorMessage: ZeroApex.errorMessage,
        FileGuard: ZeroApex.FileGuard,
        ShellGuard: ZeroApex.ShellGuard,
        CommandNormalizer: ZeroApex.CommandNormalizer,
        SnapshotModule: ZeroApex.SnapshotModule,
        AuditLogger: ZeroApex.AuditLogger,
        ManifestLoader: ZeroApex.ManifestLoader,
        PathUtils: ZeroApex.PathUtils,
    };
}

// 兼容 ES module / Operit
if (typeof exports !== "undefined") {
    exports.create = ZeroApex.create;
    exports.ErrorCode = ZeroApex.ErrorCode;
    exports.errorMessage = ZeroApex.errorMessage;
    exports.FileGuard = ZeroApex.FileGuard;
    exports.ShellGuard = ZeroApex.ShellGuard;
    exports.CommandNormalizer = ZeroApex.CommandNormalizer;
    exports.SnapshotModule = ZeroApex.SnapshotModule;
    exports.AuditLogger = ZeroApex.AuditLogger;
    exports.ManifestLoader = ZeroApex.ManifestLoader;
    exports.PathUtils = ZeroApex.PathUtils;
}
