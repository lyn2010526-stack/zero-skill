// test_zero_apex_lean.js — 精简版引擎测试
const path = require('path');
const ZA = require(path.join(__dirname, '..', 'engine', 'zero_apex.js'));

var failures = 0;
function assert(name, cond) {
    if (!cond) { failures++; console.error("  FAIL:", name); }
    else console.log("  PASS:", name);
}

async function runTests() {
    console.log("=== ZeroApex Lean Edition Tests ===\n");

    // §2 PathUtils
    console.log("--- PathUtils ---");
    assert("路径归一化", ZA.PathUtils.normalize("/a/b/../c") === "/a/c");
    assert("路径遍历检测", ZA.PathUtils.hasTraversal("../../etc/passwd") === true);
    assert("正常路径不误判", ZA.PathUtils.hasTraversal("/home/user/code") === false);
    assert("路径拼接", ZA.PathUtils.join("/home", "user", "src//main") === "/home/user/src/main");

    // §3 SnapshotModule
    console.log("\n--- SnapshotModule ---");
    var mockFiles = {};
    var deps = {
        Files: {
            cwd: "/test",
            read: async function (p) { return mockFiles[p] || null; },
            write: async function (p, c) { mockFiles[p] = c; return {}; },
            listFiles: async function () { return { entries: Object.keys(mockFiles).map(function (k) { return { name: k }; }) }; },
        },
    };
    mockFiles["/test/important.txt"] = "important data";
    var snapResult = await ZA.SnapshotModule.backup(deps, "/test/important.txt");
    assert("备份成功", snapResult.success === true);
    assert("备份文件存在", mockFiles[snapResult.backup_path] === "important data");

    // 删除后恢复
    mockFiles["/test/important.txt"] = null;
    var restoreResult = await ZA.SnapshotModule.restore(deps, "/test/important.txt");
    assert("恢复成功", restoreResult.success === true);
    assert("恢复内容正确", mockFiles["/test/important.txt"] === "important data");

    // §4 FileGuard
    console.log("\n--- FileGuard ---");
    var fg1 = ZA.FileGuard.analyzeCommand("rm -rf /home/user/project");
    assert("rm -rf 检测为删除", fg1.is_delete === true);
    assert("rm -rf 需要确认", fg1.requires_confirmation === true);

    var fg2 = ZA.FileGuard.analyzeCommand("ls -la /sdcard");
    assert("ls 不误判为删除", fg2.is_delete === false);

    var fg3 = ZA.FileGuard.analyzeCommand("chmod 777 /etc/passwd");
    assert("chmod 777 检测为覆盖", fg3.is_overwrite === true);
    assert("危险路径检测", fg3.risky_paths.indexOf("/etc") >= 0);

    var fg4 = ZA.FileGuard.analyzeCommand("DROP TABLE users");
    assert("SQL DROP 检测为删除", fg4.is_delete === true);

    assert("受保护路径检测", ZA.FileGuard.isProtectedPath("/etc/passwd") === true);
    assert("正常路径不保护", ZA.FileGuard.isProtectedPath("/home/user/code") === false);

    // §5 CommandNormalizer
    console.log("\n--- CommandNormalizer ---");
    var norm1 = ZA.CommandNormalizer.normalize("\\x72\\x6d -rf /tmp");
    assert("Hex 解码 rm", norm1.indexOf("rm") >= 0);

    var norm2 = ZA.CommandNormalizer.normalize("\\u0072\\u006d");
    assert("Unicode 解码 rm", norm2.indexOf("rm") >= 0);

    var norm3 = ZA.CommandNormalizer.normalize("rm\\055rf");  // octal
    assert("Octal 解码", norm3.indexOf("rm") >= 0);

    // §6 ShellGuard
    console.log("\n--- ShellGuard ---");
    var sg1 = ZA.ShellGuard.analyze("rm -rf /home/user/project");
    assert("ShellGuard BLOCK rm -rf", sg1.verdict === "BLOCK");
    assert("ShellGuard 分段", sg1.segments.length > 0);

    var sg2 = ZA.ShellGuard.analyze("ls -la && cat file.txt");
    assert("ShellGuard ALLOW 只读", sg2.verdict === "ALLOW");

    var sg3 = ZA.ShellGuard.analyze("echo hello && rm -rf /tmp");
    assert("ShellGuard 混合命令检测", sg3.has_delete === true);

    var sg4 = ZA.ShellGuard.analyze("git push --force origin main");
    assert("ShellGuard git push 不误杀", sg4.verdict !== "BLOCK");

    // §7 AuditLogger
    console.log("\n--- AuditLogger ---");
    ZA.AuditLogger.append({ tool: "test", trigger: "manual" });
    var recent = ZA.AuditLogger.recent(5);
    assert("审计日志记录", recent.length > 0 && recent[recent.length - 1].tool === "test");

    // §9 wrapToolExecution
    console.log("\n--- wrapToolExecution ---");
    var inst = ZA.create(deps);

    var wrap1 = await inst.wrapToolExecution(
        async function (p) { return { success: true, data: "ok" }; },
        { command: "ls -la" },
        "test_tool"
    );
    assert("正常工具执行", wrap1.success === true);

    var wrap2 = await inst.wrapToolExecution(
        async function (p) { return { success: true }; },
        { command: "rm -rf /home", confirmed: false },
        "delete_tool"
    );
    assert("高风险命令拦截", wrap2.code === "CONFIRMATION_REQUIRED" || wrap2.code === "E4001_GUARD_BLOCK");

    var wrap3 = await inst.wrapToolExecution(
        async function (p) { throw new Error("crash"); },
        {},
        "crash_tool"
    );
    assert("工具异常捕获", wrap3.success === false && wrap3.code === "E5001_INTERNAL_ERROR");

    var wrap4 = await inst.wrapToolExecution(
        async function (p) { return { success: true }; },
        { path: "../../etc/passwd" },
        "traversal_tool"
    );
    assert("路径遍历拦截", wrap4.code === "E4001_GUARD_BLOCK");

    // §10 create() 工厂
    console.log("\n--- create() ---");
    var inst2 = ZA.create({ Files: deps.Files });
    assert("create 返回实例", typeof inst2 === "object");
    assert("实例有 file_guard", typeof inst2.file_guard === "function");
    assert("实例有 shell_guard", typeof inst2.shell_guard === "function");
    assert("实例有 snapshot_backup", typeof inst2.snapshot_backup === "function");

    // 实例方法测试
    var instFg = inst2.file_guard("rm -rf /test");
    assert("实例 file_guard 工作", instFg.is_delete === true);

    var instSg = inst2.shell_guard("ls -la");
    assert("实例 shell_guard 工作", instSg.verdict === "ALLOW");

    var instNorm = inst2.normalize_command("\\x72\\x6d");
    assert("实例 normalize_command 工作", instNorm.indexOf("rm") >= 0);

    // 总结
    console.log("\n=== Summary ===");
    if (failures === 0) {
        console.log("ALL TESTS PASSED");
    } else {
        console.log("FAILURES: " + failures);
        process.exit(1);
    }
}

runTests().catch(function (e) {
    console.error("TEST ERROR:", e.message);
    process.exit(1);
});
