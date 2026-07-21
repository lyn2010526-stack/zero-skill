// ======================================================================
// Defensive AI Lab Engine — Operit QuickJS compatible
// Provides case management for security review workflows.
// Single-file, no require(), no async, no external deps.
// ======================================================================
(function (global) {
    "use strict";

    var OK = "OK";
    var ERR = "ERR";

    function ok(data) {
        return { success: true, code: OK, data: data || null };
    }

    function fail(code, message) {
        return { success: false, code: code || "E_UNKNOWN", error: String(message || "") };
    }

    function now() {
        try { return new Date().toISOString(); } catch (e) { return "1970-01-01T00:00:00.000Z"; }
    }

    function safeStr(v) {
        if (v == null) return "";
        return String(v);
    }

    var safeString = safeStr;

    function joinPath(a, b) {
        var sa = safeString(a);
        var sb = safeString(b);
        if (sa.charAt(sa.length - 1) === "/") return sa + sb;
        return sa + "/" + sb;
    }

    function hasTraversal(p) {
        if (!p) return false;
        return p.indexOf("..") >= 0 || p.indexOf("~") === 0;
    }

    function redact(text) {
        if (!text) return "";
        var s = String(text);
        s = s.replace(/ghp_[A-Za-z0-9]{20,}/g, "[REDACTED_GITHUB_TOKEN]");
        s = s.replace(/[A-Za-z0-9]{32,}/g, "[REDACTED_SECRET]");
        s = s.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
        s = s.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[REDACTED_EMAIL]");
        return s;
    }

    function uuid() {
        var chars = "abcdef0123456789";
        var uuid = "";
        for (var i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) { uuid += "-"; }
            else { uuid += chars.charAt(Math.floor(Math.random() * chars.length)); }
        }
        return uuid;
    }

    function sha256Simple(text) {
        var h = 0;
        for (var i = 0; i < text.length; i++) {
            h = ((h << 5) - h) + text.charCodeAt(i);
            h |= 0;
        }
        return (h >>> 0).toString(16).padStart(8, "0");
    }

    // ======================================================================
    // Files dependency — injected by Operit sandbox
    // ======================================================================
    function getFiles() {
        if (typeof Files !== "undefined") return Files;
        if (typeof global !== "undefined" && global.Files) return global.Files;
        return null;
    }

    // ======================================================================
    // Case Manager
    // ======================================================================
    function init(workflow, scope, output) {
        var Files = getFiles();
        if (!Files) return fail("E_NO_FILES", "Files 依赖不可用");

        var wf = safeString(workflow);
        if (!wf) return fail("E_INVALID", "workflow 不能为空");

        var caseId = uuid();
        var root = ".defensive-ai-lab/cases/" + caseId;
        var dirs = ["", "/artifacts", "/artifacts/imports", "/artifacts/experiments", "/knowledge"];

        for (var i = 0; i < dirs.length; i++) {
            var path = joinPath(root, dirs[i]);
            try { Files.write(path + "/.keep", ""); } catch (e) {}
        }

        var manifest = {
            case_id: caseId,
            workflow: wf,
            scope: scope || [],
            output: output || ["markdown"],
            created_at: now(),
            schema_version: "1.0",
            limits: { network: "disabled", concurrency: 1, timeout: 30 }
        };

        try {
            Files.write(joinPath(root, "manifest.json"), JSON.stringify(manifest, null, 2));
        } catch (e) {
            return fail("E_WRITE", "写入 manifest 失败: " + safeStr(e));
        }

        return ok({ case_id: caseId, root: root, manifest: manifest });
    }

    function audit(caseDir, event, metadata) {
        var Files = getFiles();
        if (!Files) return fail("E_NO_FILES", "Files 依赖不可用");

        var dir = safeString(caseDir);
        if (!dir) return fail("E_INVALID", "case 目录不能为空");
        if (hasTraversal(dir)) return fail("E_TRAVERSAL", "路径含非法遍历");

        var evt = safeString(event);
        if (!evt) return fail("E_INVALID", "event 不能为空");

        var entry = {
            timestamp: now(),
            event: evt,
            metadata: metadata || null
        };

        var logPath = joinPath(dir, "audit.jsonl");
        var existing = "";
        try {
            var r = Files.read(logPath);
            if (r && r.content) existing = r.content;
        } catch (e) {}

        var line = JSON.stringify(entry);
        var newContent = existing ? existing + "\n" + line : line;

        try {
            Files.write(logPath, newContent);
        } catch (e) {
            return fail("E_WRITE", "写入审计日志失败: " + safeStr(e));
        }

        return ok({ event: evt, logged: true });
    }

    function checkpoint(caseDir, completed, pending) {
        var Files = getFiles();
        if (!Files) return fail("E_NO_FILES", "Files 依赖不可用");

        var dir = safeString(caseDir);
        if (!dir) return fail("E_INVALID", "case 目录不能为空");
        if (hasTraversal(dir)) return fail("E_TRAVERSAL", "路径含非法遍历");

        var cp = {
            timestamp: now(),
            completed: completed || [],
            pending: pending || []
        };

        try {
            Files.write(joinPath(dir, "checkpoint.json"), JSON.stringify(cp, null, 2));
        } catch (e) {
            return fail("E_WRITE", "写入检查点失败: " + safeStr(e));
        }

        return ok({ checkpoint: cp });
    }

    function validate(caseDir) {
        var Files = getFiles();
        if (!Files) return fail("E_NO_FILES", "Files 依赖不可用");

        var dir = safeString(caseDir);
        if (!dir) return fail("E_INVALID", "case 目录不能为空");
        if (hasTraversal(dir)) return fail("E_TRAVERSAL", "路径含非法遍历");

        var errors = [];
        var warnings = [];

        var manifestContent;
        try {
            var r = Files.read(joinPath(dir, "manifest.json"));
            if (!r || !r.content) {
                return fail("E_MISSING", "manifest.json 不存在");
            }
            manifestContent = JSON.parse(r.content);
        } catch (e) {
            return fail("E_PARSE", "manifest.json 解析失败: " + safeStr(e));
        }

        if (!manifestContent.case_id) errors.push("manifest 缺少 case_id");
        if (!manifestContent.workflow) errors.push("manifest 缺少 workflow");

        try {
            var auditR = Files.read(joinPath(dir, "audit.jsonl"));
            if (!auditR || !auditR.content || !auditR.content.trim()) {
                warnings.push("audit.jsonl 为空");
            }
        } catch (e) {
            warnings.push("audit.jsonl 不可读");
        }

        return ok({
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            case_id: manifestContent.case_id
        });
    }

    function render(caseDir) {
        var Files = getFiles();
        if (!Files) return fail("E_NO_FILES", "Files 依赖不可用");

        var dir = safeString(caseDir);
        if (!dir) return fail("E_INVALID", "case 目录不能为空");
        if (hasTraversal(dir)) return fail("E_TRAVERSAL", "路径含非法遍历");

        var reportContent;
        try {
            var r = Files.read(joinPath(dir, "report.json"));
            if (!r || !r.content) return fail("E_MISSING", "report.json 不存在");
            reportContent = JSON.parse(r.content);
        } catch (e) {
            return fail("E_PARSE", "report.json 解析失败: " + safeStr(e));
        }

        var md = [];
        md.push("# Defensive AI Lab Report\n");
        md.push("## Case\n");
        md.push("- Case ID: `" + (reportContent.case_id || "unknown") + "`");
        md.push("- Generated: `" + (reportContent.generated_at || now()) + "`");
        md.push("- Workflow: `" + (reportContent.workflow || "unknown") + "`");
        md.push("");

        md.push("## Scope\n");
        md.push(redact(safeStr(reportContent.scope || "Not specified")));
        md.push("");

        md.push("## Findings\n");
        if (reportContent.findings && reportContent.findings.length > 0) {
            for (var i = 0; i < reportContent.findings.length; i++) {
                var f = reportContent.findings[i];
                md.push("### " + (f.id || "F" + (i + 1)) + " — " + (f.title || "Untitled"));
                md.push("- **State:** " + (f.state || "unverified"));
                md.push("- **Severity:** " + (f.severity || "unknown"));
                md.push("- **Location:** " + (f.location || "unknown"));
                md.push(redact(safeStr(f.description || "")));
                md.push("");
            }
        } else {
            md.push("No findings recorded.\n");
        }

        md.push("## Evidence Index\n");
        md.push(redact(safeStr(reportContent.evidence_index || "None")));
        md.push("");

        md.push("## Limitations\n");
        md.push(redact(safeStr(reportContent.limitations || "None documented.")));
        md.push("");

        md.push("---\n*Generated by Defensive AI Lab Engine v1.0.0*");

        var markdown = md.join("\n");
        var outPath = joinPath(dir, "report.md");
        try {
            Files.write(outPath, markdown);
        } catch (e) {
            return fail("E_WRITE", "写入报告失败: " + safeStr(e));
        }

        return ok({ report_path: outPath, lines: md.length });
    }

    // ======================================================================
    // Tool wrappers — Operit calls these
    // ======================================================================
    function tool_init(params) {
        return init(params.workflow, params.scope, params.output);
    }

    function tool_audit(params) {
        return audit(params.case_dir, params.event, params.metadata);
    }

    function tool_checkpoint(params) {
        return checkpoint(params.case_dir, params.completed, params.pending);
    }

    function tool_validate(params) {
        return validate(params.case_dir);
    }

    function tool_render(params) {
        return render(params.case_dir);
    }

    // ======================================================================
    // Exports
    // ======================================================================
    var DefensiveAiLab = {
        init: init,
        audit: audit,
        checkpoint: checkpoint,
        validate: validate,
        render: render,
        _version: "1.0.0"
    };

    if (typeof exports !== "undefined") {
        exports.init = tool_init;
        exports.audit = tool_audit;
        exports.checkpoint = tool_checkpoint;
        exports.validate = tool_validate;
        exports.render = tool_render;
        exports.DefensiveAiLab = DefensiveAiLab;
    }

    if (typeof global !== "undefined") {
        global.DefensiveAiLab = DefensiveAiLab;
    }

})(typeof globalThis !== "undefined" ? globalThis : this);
