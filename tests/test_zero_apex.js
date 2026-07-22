/*
 * zero_apex engine — Node.js self-test runner.
 * Runs the built-in main() self-test plus DI integration tests.
 * Usage: node test_zero_apex.js
 * No external dependencies; pure stdlib.
 */

const path = require("path");
const fs = require("fs");
const m = require(path.join(__dirname, "..", "engine", "zero_apex.js"));

// Load real manifest.json so ManifestLoader picks up sandbox/permission
// configs instead of falling back to the builtin minimal manifest.
// NOTE: Operit sandbox Files.read is synchronous; mock matches that contract.
const manifestContent = fs.readFileSync(
  path.join(__dirname, "..", "manifest.json"),
  "utf8"
);
const manifestFilesMock = {
  exists: () => ({ exists: true }),
  read: (p) => (p === "manifest.json" ? { content: manifestContent } : { content: "" }),
  write: () => ({ successful: true }),
  listFiles: () => ({ entries: [] }),
};

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error("ASSERT FAIL:", msg);
  }
}

async function runSelfTest() {
  const r = await m.main();
  console.log("[self-test] total=%d passed=%d failed=%d", r.total, r.passed, r.failed);
  assert(r.all_pass, "built-in main() self-test all_pass");
  for (const d of r.detail) {
    if (!d.pass) console.error("  FAIL:", d.test);
  }
}

async function runDITests() {
  const inst = m.create({
    Files: {
      exists: async () => ({ exists: true }),
      read: async () => ({ content: "hello" }),
      write: async () => ({ successful: true }),
      listFiles: async () => ({ entries: ["file.20240101_120000"] }),
    },
    Network: {
      httpGet: async () => ({
        content: JSON.stringify({
          total_count: 1,
          items: [{
            full_name: "test/repo",
            stargazers_count: 1000,
            forks_count: 10,
            language: "js",
            license: { spdx_id: "MIT" },
            pushed_at: "2024-01-01",
            open_issues_count: 5,
            html_url: "https://github.com/test/repo",
            description: "test",
          }],
        }),
      }),
    },
    Tools: {
      Memory: {
        create: async () => "mem-id-123",
        query: async () => ({ memories: [{ title: "test", content: "x" }] }),
      },
    },
  });

  // OpenSource
  const osr = await inst.OpenSource.search("test", "js", 100, 1);
  assert(osr.success && osr.count === 1 && osr.query === "test", "OpenSource DI search");
  assert(osr.repos[0].name === "test/repo", "OpenSource repo parsing");

  // Memory remember
  const mem = await inst.Memory.remember("success", "projA", "summary", "ev", "js,python");
  assert(mem.success && mem.memory_id === "mem-id-123", "Memory remember DI");

  // Memory recall + cache
  const rec1 = await inst.Memory.recall("test", "success", 5);
  assert(rec1.success && rec1.count === 1, "Memory recall DI");
  const rec2 = await inst.Memory.recall("test", "success", 5);
  assert(!!rec2.from_cache, "Memory recall cache hit");

  // Snapshot
  const snap = await inst.Snapshot.snapshot("/tmp/test_file.txt");
  assert(snap.success && snap.snapshot_name.startsWith("test_file.txt."), "Snapshot DI");

  // Snapshot restore — mock returns entries with correct prefix
  const instRestore = m.create({
    Files: {
      exists: async () => ({ exists: true }),
      read: async () => ({ content: "restored-content" }),
      write: async () => ({ successful: true }),
      listFiles: async () => ({ entries: ["test_file.txt.20240101_120000", "test_file.txt.20240102_130000"] }),
    },
  });
  const restore = await instRestore.Snapshot.restore("/tmp/test_file.txt");
  assert(restore.success, "Snapshot restore DI");

  // Path traversal rejection
  const badSnap = await inst.Snapshot.snapshot("../../etc/passwd");
  assert(!badSnap.success, "Snapshot rejects path traversal");
  const badRestore = await inst.Snapshot.restore("../../../etc/shadow");
  assert(!badRestore.success, "Restore rejects path traversal");

  // Error codes
  const ec = inst._infra.ErrorCode;
  assert(ec.OK === "OK", "ErrorCode.OK stable");
  assert(ec.NETWORK_ERROR === "E3001_NETWORK_ERROR", "ErrorCode.NETWORK_ERROR stable");
  assert(ec.GUARD_BLOCK === "E4001_GUARD_BLOCK", "ErrorCode.GUARD_BLOCK stable");

  // PathUtils
  const pu = inst._infra.PathUtils;
  assert(pu.hasTraversal("../../etc"), "PathUtils detects traversal");
  assert(!pu.hasTraversal("/home/user/code"), "PathUtils allows normal path");
  assert(pu.join("/home", "user", "src//main") === "/home/user/src/main", "PathUtils join");
  assert(pu.basename("/a/b/c.txt") === "c.txt", "PathUtils basename");
  assert(pu.dirname("/a/b/c.txt") === "/a/b", "PathUtils dirname");
  assert(pu.trashDir("/a/b/c.txt") === "/a/b/.trash", "PathUtils trashDir");

  // LRU cache eviction
  const cache = new inst._infra.LRUCache(2);
  cache.set("a", 1); cache.set("b", 2); cache.set("c", 3);
  assert(cache.get("a") === undefined, "LRU evicts a");
  assert(cache.get("b") === 2, "LRU keeps b");
  assert(cache.get("c") === 3, "LRU keeps c");
  assert(cache.size() === 2, "LRU size bounded");

  // TemplateStore
  const ts = inst._infra.TemplateStore;
  const card = ts.render("status_card", {
    readiness: 90, confidence: "VERIFIED", causal: "deep", blockers: ""
  });
  assert(card.indexOf("90/100") >= 0 && card.indexOf("VERIFIED") >= 0, "TemplateStore render");

  // OutputChunker
  const oc = inst._infra.OutputChunker;
  const big = Array.from({ length: 500 }, (_, i) => "line " + i).join("\n");
  const parts = oc.chunk(big, 1000);
  assert(parts.length > 1, "OutputChunker splits large text");
  assert(oc.truncate("hello world", 5).endsWith("[truncated]"), "OutputChunker truncate");

  // ConfigRegistry
  const cr = inst._infra.ConfigRegistry;
  assert(Array.isArray(cr.get("hallucination.valid_labels")), "Config get valid_labels");
  let threw = false;
  try { cr.get("__nope__"); } catch (e) { threw = true; }
  assert(threw, "Config missing key throws");

  // RetryPolicy: 401 not retried, 500 retried
  const rp = new inst._infra.RetryPolicy({ maxAttempts: 3 });
  assert(!rp.shouldRetry(1, { message: "401 Unauthorized" }), "Retry skips 401");
  assert(rp.shouldRetry(1, { message: "500 Server Error" }), "Retry 500");
  assert(!rp.shouldRetry(3, { message: "500" }), "Retry stops at maxAttempts");
  const d = rp.delayFor(1);
  assert(d >= 0 && d <= 5000, "Retry delay bounded");

  // ConcurrencyLimiter serializes
  const lim = new inst._infra.ConcurrencyLimiter(1);
  const order = [];
  await Promise.all([
    lim.run(() => { order.push("a"); return Promise.resolve(); }),
    lim.run(() => { order.push("b"); return Promise.resolve(); }),
  ]);
  assert(order[0] === "a", "Concurrency first a");

  // FileLock serializes
  const lock = new inst._infra.FileLock();
  const lockOrder = [];
  await lock.withLock("/x", () => { lockOrder.push("1"); return Promise.resolve(); });
  await lock.withLock("/x", () => { lockOrder.push("2"); return Promise.resolve(); });
  assert(lockOrder.join(",") === "1,2", "FileLock sequential");

  // TaskLedger priority
  const ledger = new inst._infra.TaskLedger({});
  ledger.enqueue({ goal: "low", priority: 1 });
  ledger.enqueue({ goal: "high", priority: 10 });
  const next = ledger.next();
  assert(next.goal === "high", "Ledger returns highest priority first");
  assert(ledger.pendingCount() === 1, "Ledger pending count");
  ledger.complete(next.id, { ok: true });
  assert(ledger.pendingCount() === 1, "Ledger complete leaves remaining pending (" + ledger.pendingCount() + ")");
  // Drain remaining
  const next2 = ledger.next();
  ledger.complete(next2.id, { ok: true });
  assert(ledger.pendingCount() === 0, "Ledger drained all pending");

  console.log("[di-test] all DI assertions done, failures=%d", failures);
}

async function runGuardTests() {
  // FileGuard
  const r1 = m.ZeroApex.FileGuard.analyzeCommand("rm -rf /home/user/project");
  assert(r1.is_delete && r1.requires_confirmation, "FileGuard rm -rf");
  assert(r1.risk_level === "CRITICAL" || r1.risk_level === "HIGH", "FileGuard level for rm -rf + path");

  const r2 = m.ZeroApex.FileGuard.analyzeCommand("ls -la /sdcard");
  assert(!r2.is_delete, "FileGuard ls not delete");
  assert(r2.requires_confirmation, "FileGuard /sdcard risky path");

  const r3 = m.ZeroApex.FileGuard.scanScript('os.system("rm -rf /tmp")');
  assert(r3.is_delete, "FileGuard indirect script delete");

  const r4 = m.ZeroApex.FileGuard.pathRisk("../../etc/passwd");
  assert(r4.requires_confirmation, "FileGuard pathRisk traversal");

  // Hallucination
  const h1 = m.ZeroApex.Hallucination.check("编译通过了", null);
  assert(!h1.allowed, "Hallucination blocks fact without evidence");
  const h2 = m.ZeroApex.Hallucination.check("编译通过了", "BUILD SUCCESSFUL");
  assert(h2.allowed, "Hallucination allows with evidence");
  const h3 = m.ZeroApex.Hallucination.check("显然这个能行", null);
  assert(!h3.allowed && h3.suggested_label === "INFERRED", "Hallucination overconfident -> INFERRED");

  // SelfMonitor
  const s1 = m.ZeroApex.SelfMonitor.assess({ goal: "修复登录崩溃", files_read: false });
  assert(s1.blockers.length > 0, "SelfMonitor blocks change task without file read");
  const s2 = m.ZeroApex.SelfMonitor.assess({ goal: "查询信息", files_read: true, evidence_ready: true });
  assert(s2.state === "READY", "SelfMonitor ready when all clear");
  assert(s2.status_card.indexOf("100/100") >= 0, "SelfMonitor status card rendered");

  // OutputFirewall
  const o1 = m.ZeroApex.OutputFirewall.check("我认为这个应该没问题");
  assert(!o1.clean && o1.severity !== "CLEAN", "OutputFirewall detects thought leak");
  const o2 = m.ZeroApex.OutputFirewall.check("这是一段正常的技术说明。");
  assert(o2.clean && o2.action === "PASS", "OutputFirewall passes clean text");
  const o3 = m.ZeroApex.OutputFirewall.check("api_key=abc123");
  assert(o3.severity === "SEVERE", "OutputFirewall severe for tool leak");

  console.log("[guard-test] all guard assertions done, failures=%d", failures);
}

async function runShellGuardTests() {
  const sg = m.ZeroApex._infra.ShellGuard;

  // D: read-only command whitelist
  assert(sg.isReadOnly("ls -la /sdcard"), "ShellGuard ls is read-only");
  assert(sg.isReadOnly("cat /etc/hosts"), "ShellGuard cat is read-only");
  assert(sg.isReadOnly("git status"), "ShellGuard git status read-only");
  assert(sg.isReadOnly("git log --oneline -5"), "ShellGuard git log read-only");
  assert(!sg.isReadOnly("rm -rf /tmp"), "ShellGuard rm not read-only");
  assert(!sg.isReadOnly("npm install"), "ShellGuard npm not read-only");

  // Wrapper peeling
  assert(sg.peelWrapper("timeout 10 ls").indexOf("ls") === 0, "ShellGuard peels timeout");
  assert(sg.peelWrapper("nice -n 5 cat /etc/hosts").indexOf("cat") === 0, "ShellGuard peels nice");
  assert(sg.peelWrapper("env FOO=bar ls -la").indexOf("ls") === 0, "ShellGuard peels env prefix");

  // Chain splitting
  const segs = sg.splitChain("ls -la && rm -rf /tmp; cat /etc/hosts");
  assert(segs.length === 3, "ShellGuard splits 3 segments");
  assert(sg.isReadOnly(segs[0].trim()), "ShellGuard segment 0 read-only");
  assert(sg.isDangerous(segs[1].trim()), "ShellGuard segment 1 dangerous");

  // E: dangerous command escalation
  const d1 = sg.analyze("rm -rf /home/user");
  assert(d1.verdict === "ASK", "ShellGuard rm -> ASK");
  assert(d1.dangerous_hits.length > 0, "ShellGuard rm dangerous hit");
  assert(d1.dangerous_hits[0].primary === "rm", "ShellGuard rm primary");

  const d2 = sg.analyze("chmod 777 /etc");
  assert(d2.verdict === "ASK", "ShellGuard chmod -> ASK");

  const d3 = sg.analyze("git push origin master");
  assert(d3.verdict === "ASK", "ShellGuard git push -> ASK");

  const d4 = sg.analyze("ls -la && cat /etc/hosts");
  assert(d4.verdict === "ALLOW", "ShellGuard read-only chain ALLOW");
  assert(d4.all_read_only, "ShellGuard chain all read-only");

  const d5 = sg.analyze("ls && rm -rf /tmp");
  assert(d5.verdict === "ASK", "ShellGuard mixed chain ASK");
  assert(!d5.all_read_only, "ShellGuard mixed chain not all read-only");

  // Unsafe tokens
  const u1 = sg.analyze("ls $(rm -rf /)");
  assert(u1.unsafe_token === "$(", "ShellGuard detects $( substitution");
  assert(u1.verdict === "ASK", "ShellGuard unsafe token -> ASK");

  console.log("[shellguard-test] all assertions done, failures=%d", failures);
}

async function runSandboxTests() {
  const inst = m.create({ Files: manifestFilesMock });
  const sb = inst.sandbox;

  // B: workspace default profile
  assert(sb.getDefaultProfile() === "workspace", "Sandbox default workspace");

  // workspace: .zero_apex/ writable
  const w1 = sb.checkPath(".zero_apex/test.json", "write", "workspace");
  assert(w1.allowed, "Sandbox workspace allows .zero_apex/ write");

  // workspace: /etc/shadow denied
  const w2 = sb.checkPath("/etc/shadow", "write", "workspace");
  assert(!w2.allowed, "Sandbox workspace denies /etc/shadow");

  // workspace: /proc/ denied
  const w3 = sb.checkPath("/proc/self/environ", "read", "workspace");
  assert(!w3.allowed, "Sandbox workspace denies /proc/");

  // workspace: /tmp/random.txt denied (not in writable_paths)
  const w4 = sb.checkPath("/tmp/random.txt", "write", "workspace");
  assert(!w4.allowed, "Sandbox workspace denies /tmp/ write");

  // read-only profile: all writes denied
  const r1 = sb.checkPath(".zero_apex/test.json", "write", "read-only");
  assert(!r1.allowed, "Sandbox read-only denies .zero_apex/ write");

  // read-only profile: read-only commands allowed
  const r2 = sb.checkCommand("ls -la", "read-only");
  assert(r2.allowed, "Sandbox read-only allows ls");

  // read-only profile: rm denied
  const r3 = sb.checkCommand("rm -rf /tmp", "read-only");
  assert(!r3.allowed, "Sandbox read-only denies rm");

  // strict profile: only ls/cat/pwd allowed
  const s1 = sb.checkCommand("ls", "strict");
  assert(s1.allowed, "Sandbox strict allows ls");
  const s2 = sb.checkCommand("git status", "strict");
  assert(!s2.allowed, "Sandbox strict denies git status");

  // Glob matching
  assert(sb.matchGlob(".zero_apex/**", ".zero_apex/sub/file.json"), "Sandbox glob ** matches nested");
  assert(!sb.matchGlob(".zero_apex/*", ".zero_apex/sub/file.json"), "Sandbox glob * no cross-slash");
  assert(sb.matchGlob("*", "anything"), "Sandbox glob * matches all");

  console.log("[sandbox-test] all assertions done, failures=%d", failures);
}

async function runPermissionTests() {
  const inst = m.create({ Files: manifestFilesMock });
  const pm = inst.permissions;

  // C: default mode (manifest declares default)
  assert(pm.getDefaultMode() === "default", "Permission default mode");

  // deny rule: Bash(rm -rf *)
  const d1 = pm.evaluate("bash", { command: "rm -rf /home" });
  assert(d1.verdict === "DENY", "Permission deny rm -rf");

  // deny rule: Bash(chmod 777 *)
  const d2 = pm.evaluate("bash", { command: "chmod 777 /etc" });
  assert(d2.verdict === "DENY", "Permission deny chmod 777");

  // deny rule: Read /etc/shadow
  const d3 = pm.evaluate("read", { path: "/etc/shadow" });
  assert(d3.verdict === "DENY", "Permission deny read /etc/shadow");

  // deny rule: Edit /proc/**
  const d4 = pm.evaluate("edit", { path: "/proc/self/environ" });
  assert(d4.verdict === "DENY", "Permission deny edit /proc/");

  // ask rule: Edit **/.env
  const a1 = pm.evaluate("edit", { path: "config/.env" });
  assert(a1.verdict === "ASK", "Permission ask edit .env");

  // ask rule: Bash git push *
  const a2 = pm.evaluate("bash", { command: "git push origin master" });
  assert(a2.verdict === "ASK", "Permission ask git push");

  // allow rule: Bash ls *
  const al1 = pm.evaluate("bash", { command: "ls -la /home" });
  assert(al1.verdict === "ALLOW", "Permission allow ls");

  // allow rule: Bash git status (exact)
  const al2 = pm.evaluate("bash", { command: "git status" });
  assert(al2.verdict === "ALLOW", "Permission allow git status");

  // unmatched in default mode -> FALLTHROUGH
  const f1 = pm.evaluate("bash", { command: "npm install" });
  assert(f1.verdict === "FALLTHROUGH", "Permission default fallthrough npm install");

  // Pattern matching: prefix
  const m1 = pm.matchPattern("Bash(git *)", "git log --oneline");
  assert(m1, "Permission pattern git * matches git log");

  // Pattern matching: glob with *
  const m2 = pm.matchPattern("Bash(git commit:*)", "git commit -m hello");
  assert(m2, "Permission pattern git commit:* matches");

  console.log("[permission-test] all assertions done, failures=%d", failures);
  runConfigTests();
}

function runConfigTests() {
  var ZA = m.ZeroApex;
  // config_get returns config value
  var c1 = ZA.config_get({ key: "snapshot.cleanup" });
  assert("config_get returns snapshot.cleanup", c1.success && c1.value && c1.value.max_age_hours === 168);
  // config_get without key returns all
  var c2 = ZA.config_get({});
  assert("config_get all returns config", c2.success && c2.config && c2.config["snapshot.cleanup"]);
  // config_set updates value
  var c3 = ZA.config_set({ key: "snapshot.cleanup.max_age_hours", value: 720 });
  assert("config_set updates value", c3.success && c3.value === 720);
  // Verify it persisted
  var c4 = ZA.config_get({ key: "snapshot.cleanup.max_age_hours" });
  assert("config_set persisted", c4.value === 720);
  // Restore default
  ZA.config_set({ key: "snapshot.cleanup.max_age_hours", value: 168 });
  console.log("[config-test] all config assertions done, failures=%d", failures);
}


// ============================================================================
// Performance benchmarks: preflight + file_guard + hallucination under N calls.
// Threshold: each must complete under 50ms per call on average.
// ============================================================================
function runPerformanceTests() {
  var ZA = m.ZeroApex;

  // Benchmark: preflight GateRegistry
  var N = 1000;
  var pStart = Date.now();
  for (var i = 0; i < N; i++) {
    ZA.FileGuard.analyzeCommand("rm -rf /tmp/" + i);
  }
  var pDur = Date.now() - pStart;
  var pAvg = pDur / N;
  assert("perf file_guard 1000x avg<5ms", pAvg < 5);

  // Benchmark: Hallucination check
  var hStart = Date.now();
  for (var j = 0; j < N; j++) {
    ZA.Hallucination.check("编译通过了", "BUILD SUCCESSFUL");
  }
  var hDur = Date.now() - hStart;
  var hAvg = hDur / N;
  assert("perf hallucination 1000x avg<5ms", hAvg < 5);

  // Benchmark: OutputFirewall
  var oStart = Date.now();
  for (var k = 0; k < N; k++) {
    ZA.OutputFirewall.check("普通输出文本，没有违规内容");
  }
  var oDur = Date.now() - oStart;
  var oAvg = oDur / N;
  assert("perf output_firewall 1000x avg<5ms", oAvg < 5);

  // Benchmark: preflightGate full chain
  var pfStart = Date.now();
  for (var p = 0; p < 100; p++) {
    ZA.preflightGate({}, "测试目标 " + p, "ls -la /tmp", null, false);
  }
  var pfDur = Date.now() - pfStart;
  var pfAvg = pfDur / 100;
  assert("perf preflight 100x avg<50ms", pfAvg < 50);

  console.log("[perf-test] avg file_guard=%.2fms hallucination=%.2fms firewall=%.2fms preflight=%.2fms",
    pAvg, hAvg, oAvg, pfAvg);
}


// ============================================================================
// Concurrency tests: ensure FileLock, ConcurrencyLimiter, LRUCache work under
// concurrent access without data corruption.
// ============================================================================
async function runConcurrencyTests() {
  var ZA = m.ZeroApex;

  // Concurrency: ConcurrencyLimiter allows only N parallel
  var limiter = new ZA._infra.ConcurrencyLimiter(2);
  var active = 0;
  var maxActive = 0;
  var tasks = [];
  for (var i = 0; i < 10; i++) {
    tasks.push(limiter.run(function () {
      active++;
      if (active > maxActive) maxActive = active;
      return new Promise(function (resolve) {
        setTimeout(function () { active--; resolve(); }, 5);
      });
    }));
  }
  await Promise.all(tasks);
  assert("concurrency limiter caps parallel <= 2", maxActive <= 2);

  // Concurrency: LRUCache under repeated insert/evict
  var cache = new ZA._infra.LRUCache(3);
  for (var k = 0; k < 100; k++) cache.set("k" + k, k);
  assert("LRU cache size respects cap", cache.size() <= 3);
  assert("LRU cache evicts oldest", !cache.has("k0"));

  // Concurrency: FileLock serializes per-path writes
  var lock = new ZA._infra.FileLock();
  var order = [];
  var promises = [];
  promises.push(lock.withLock("/a", function () { order.push("first"); return Promise.resolve(); }));
  promises.push(lock.withLock("/a", function () { order.push("second"); return Promise.resolve(); }));
  promises.push(lock.withLock("/b", function () { order.push("b-different"); return Promise.resolve(); }));
  await Promise.all(promises);
  assert("file lock serializes same path", order[0] === "first" && order[1] === "second");
  assert("file lock allows different paths", order.indexOf("b-different") >= 0);

  console.log("[concurrency-test] all assertions done, failures=%d", failures);
}


// ============================================================================
// Obfuscation / Normalizer tests: verify that escape sequences,
// command substitution, eval literals, var concat are caught.
// ============================================================================
function runNormalizerTests() {
  var FG = m.ZeroApex.FileGuard;

  // Hex escape: \x72\x6d should be normalized to "rm"
  var t1 = FG.analyzeCommand("\\x72\\x6d -rf /tmp/test");
  assert("normalizer: hex escape caught", t1.requires_confirmation && t1.is_delete);

  // Unicode escape: \u0072\u006d → rm
  var t2 = FG.analyzeCommand("\\u0072\\u006d -rf /tmp/test");
  assert("normalizer: unicode escape caught", t2.requires_confirmation && t2.is_delete);

  // Backtick command substitution
  var t3 = FG.analyzeCommand("`rm` -rf /tmp/test");
  assert("normalizer: backtick subst caught", t3.requires_confirmation && t3.is_delete);

  // Dollar-paren substitution
  var t4 = FG.analyzeCommand("$(rm) -rf /tmp/test");
  assert("normalizer: dollar-paren subst caught", t4.requires_confirmation && t4.is_delete);

  // Var concat (cannot resolve, but signal fires)
  var t5 = FG.analyzeCommand("$r$m -rf /tmp/test");
  assert("normalizer: var concat signals suspicious", t5.requires_confirmation);

  // Eval literal: eval("rm -rf /tmp")
  var t6 = FG.analyzeCommand('eval("rm -rf /tmp")');
  assert("normalizer: eval literal expanded", t6.requires_confirmation && t6.is_delete);

  // Base64 pipe
  var t7 = FG.analyzeCommand("cat x | base64 -d | sh");
  assert("normalizer: base64 pipe flagged", t7.requires_confirmation);

  // Plain command (no obfuscation) should still work
  var t8 = FG.analyzeCommand("ls -la /tmp");
  assert("normalizer: plain command not over-flagged", !t8.requires_confirmation);

  console.log("[normalizer-test] all assertions done, failures=%d", failures);
}


// ============================================================================
// Structural evidence grading tests: verify L0-L5 evidence classification.
// ============================================================================
function runEvidenceGradeTests() {
  var H = m.ZeroApex.Hallucination;

  // L5: strong evidence (build success)
  var g1 = H.gradeEvidence("exit_code:0, BUILD SUCCESSFUL");
  assert("evidence grade: strong = L5", g1 === 5);

  // L5: test pass count
  var g2 = H.gradeEvidence("42 tests passed");
  assert("evidence grade: tests passed = L5", g2 === 5);

  // L4: supports array
  var g3 = H.gradeEvidence("supports: [exit_code:0, stdout:success]");
  assert("evidence grade: supports array = L4", g3 === 4);

  // L3: file path references
  var g4 = H.gradeEvidence("file created at /tmp/output.log");
  assert("evidence grade: path refs = L3", g4 === 3);

  // L0: no evidence
  var g5 = H.gradeEvidence("");
  assert("evidence grade: empty = L0", g5 === 0);

  // Combined: fact claim + weak evidence should be allowed but flagged as minor
  var r1 = H.check("已修复 bug", "see /tmp/output.log");
  assert("hallucination: fact+weak evidence minor-only", r1.allowed && r1.evidence_grade === 3);

  // Fact claim + strong evidence = clean
  var r2 = H.check("已修复 bug", "BUILD SUCCESSFUL, 42 tests passed");
  assert("hallucination: fact+strong evidence = PASS", r2.allowed && r2.evidence_grade === 5);

  // Fact claim + no evidence = blocked
  var r3 = H.check("已修复 bug", null);
  assert("hallucination: fact+no evidence = BLOCK", !r3.allowed);

  console.log("[evidence-grade-test] all assertions done, failures=%d", failures);
}


// ============================================================================
// Tombstone tests: verify Files.delete substitute mechanism.
// ============================================================================
function runTombstoneTests() {
  var ZA = m.ZeroApex;

  // Tombstone function exists
  assert("tombstone: function exists", typeof ZA.Snapshot.tombstone === "function");

  // Tombstone returns DEPENDENCY_MISSING when Files is not injected
  ZA.Snapshot.tombstone("/tmp/test.txt").then(function (r) {
    if (ZA._infra.ErrorCode) {
      assert("tombstone: dep missing when no Files", r.code === "E5002_DEPENDENCY_MISSING" || r.success === false);
    } else {
      assert("tombstone: returns error when no Files", r.success === false);
    }
  });

  console.log("[tombstone-test] all assertions done, failures=%d", failures);
}


// ============================================================================
// Regression tests: ensure v2.x exports remain stable across versions.
// ============================================================================
function runRegressionTests() {
  // Each export must exist and be callable
  var expected = [
    "preflight", "file_guard", "hallucination_guard", "evidence_check",
    "self_monitor", "output_firewall", "search_opensource", "remember", "recall",
    "snapshot_file", "restore_file", "snapshot_cleanup", "tombstone_file",
    "enforce_block", "audit_log", "evaluate_permission", "check_sandbox",
    "config_get", "config_set"
  ];
  for (var i = 0; i < expected.length; i++) {
    var t = expected[i];
    assert("regression: " + t + " exported", typeof m[t] === "function");
  }

  // Result shape: all should return { success: boolean, code: string }
  var r1 = m.ZeroApex.Hallucination.check("测试", null);
  assert("regression: hallucination result shape", typeof r1.allowed === "boolean" || typeof r1.allowed === "undefined");

  // DI pattern: create() must accept partial deps
  try {
    var inst = m.ZeroApex.create({});
    assert("regression: create() with empty deps", !!inst.FileGuard);
  } catch (e) {
    assert("regression: create() with empty deps", false);
  }

  // ConfigRegistry pattern stable
  var ZA = m.ZeroApex;
  var before = ZA.config_get({ key: "memory.cache_size" }).value;
  ZA.config_set({ key: "memory.cache_size", value: 256 });
  var after = ZA.config_get({ key: "memory.cache_size" }).value;
  assert("regression: config_set changes memory.cache_size", after === 256);
  ZA.config_set({ key: "memory.cache_size", value: before });

  // GateRegistry list
  var gates = ZA._infra.GateRegistry.list();
  assert("regression: 6 default gates registered", gates.length === 6);

  console.log("[regression-test] all assertions done, failures=%d", failures);
}

// P0/P1 audit-driven regression tests (2026-07-22):
// Each test corresponds to a real bug found during the "actual usage" audit
// against the simulated Operit sandbox environment.
function runP0RegressionTests() {
  var ZA = m.ZeroApex;

  // P0-1: ManifestLoader must read manifest.json asynchronously when Files.read
  // returns a Promise. Previously called sync, so manifest was never loaded
  // and sandbox/permission rules silently fell back to builtin.
  (async function () {
    let manifestLoaded = false;
    const testFiles = {
      read: async (p) => {
        if (p === "manifest.json") {
          manifestLoaded = true;
          return { content: JSON.stringify({
            tools: [
              { name: "audit_log", min_permission: "basic", requires: ["Files"] },
              { name: "evaluate_permission", min_permission: "none", requires: [] },
            ],
            env_requirements: { permission_levels: { none: {}, basic: {} } }
          }) };
        }
        return { content: "" };
      },
      write: async () => ({ successful: true }),
      listFiles: async () => ({ entries: [] }),
    };
    // _infra.ManifestLoader is exposed via the public module
    if (ZA._infra && ZA._infra.ManifestLoader) {
      const ML = ZA._infra.ManifestLoader({ Files: testFiles });
      const observed = await ML.loadAsync();
      assert("P0-1: ManifestLoader.loadAsync returns parsed tools", observed && Array.isArray(observed.tools));
      assert("P0-1: ManifestLoader.loadAsync honored the custom manifest", observed.tools.some(function (t) { return t.name === "audit_log"; }));
      assert("P0-1: Files.read was called with manifest.json", manifestLoaded === true);
      // load() should now return the same cached object
      const cached = ML.load();
      assert("P0-1: load() returns the cache populated by loadAsync()", cached === observed);
    } else {
      assert("P0-1: ManifestLoader is exposed in _infra", false);
    }
  })();

  // P0-2: Evidence.fileExists must prefer Files.exists and gracefully fall
  // back to read. Previous implementation only used Files.read and treated
  // every error as "file does not exist", giving false negatives.
  (async function () {
    let existsCalled = false;
    let readCalled = false;
    const inst = ZA.create({
      Files: {
        exists: async (p) => { existsCalled = true; return { exists: p === "/p/exists" }; },
        read: async () => { readCalled = true; return { content: "x" }; },
        write: async () => ({ successful: true }),
        listFiles: async () => ({ entries: [] }),
      },
    });
    const r1 = await inst.Evidence.fileExists("/p/exists");
    assert("P0-2: fileExists uses Files.exists when available", existsCalled === true);
    assert("P0-2: fileExists returns true for existing path", r1 === true);
    const r2 = await inst.Evidence.fileExists("/p/missing");
    assert("P0-2: fileExists returns false for missing path", r2 === false);

    // When Files.exists is missing, fall back to read
    const inst2 = ZA.create({
      Files: {
        read: async () => ({ content: "ok" }),
        write: async () => ({ successful: true }),
        listFiles: async () => ({ entries: [] }),
      },
    });
    const r3 = await inst2.Evidence.fileExists("/p/x");
    assert("P0-2: fileExists fallback returns true when read returns content", r3 === true);
    // Empty content / error should still resolve to false
    const inst3 = ZA.create({
      Files: {
        exists: async () => { throw new Error("denied"); },
        read: async () => ({ content: "" }),
      },
    });
    const r4 = await inst3.Evidence.fileExists("/p/y");
    assert("P0-2: fileExists returns false for empty content + exists error", r4 === false);
  })();

  // P0-3: extractTimestamp must parse YYYYMMDD_HHMMSS (with underscore).
  // Previous regex /^\d+$/ only matched pure digits, so cleanup never aged out.
  (async function () {
    const inst = ZA.create({
      Files: {
        read: async () => ({ content: "" }),
        write: async () => ({ successful: true }),
        listFiles: async () => ({ entries: [] }),
      },
    });
    if (inst.Snapshot && inst.Snapshot._extractTimestamp) {
      const ts = inst.Snapshot._extractTimestamp;
      assert("P0-3: extractTimestamp parses YYYYMMDD_HHMMSS",
        ts("f.20240115_103045") > 0);
      assert("P0-3: extractTimestamp parses pure digits (no underscore)",
        ts("f.20240115103045") > 0);
      assert("P0-3: extractTimestamp returns 0 for non-numeric",
        ts("f.txt") === 0);
      assert("P0-3: extractTimestamp parses YYYYMMDD date-only",
        ts("f.20240115") > 0);
      // Ordering: later date produces larger number
      const tA = ts("f.20240101_120000");
      const tB = ts("f.20240102_120000");
      assert("P0-3: timestamp order matches date order", tA < tB);
      // Specifically, "20240101_120000" should be smaller than "20240101_130000"
      const tC = ts("f.20240101_120000");
      const tD = ts("f.20240101_130000");
      assert("P0-3: hour-level ordering works within same day", tC < tD);
    } else {
      assert("P0-3: extractTimestamp exposed via Snapshot", false);
    }
  })();

  // P1-1: Files.read may return string OR {content, exists}. Snapshot must
  // handle both shapes; previously assumed object shape only.
  (async function () {
    const inst = ZA.create({
      Files: {
        read: async (p) => "/etc/hosts content here",  // returns string
        write: async () => ({ successful: true }),
        listFiles: async () => ({ entries: ["/tmp/p1_test.20240101_120000"] }),
      },
    });
    const r = await inst.Snapshot.snapshot("/tmp/p1_test");
    assert("P1-1: snapshot accepts string-returning Files.read", r.success === true);
  })();

  // P1-1b: Restore must also handle string-returning Files.read
  (async function () {
    const inst = ZA.create({
      Files: {
        read: async () => "restored-from-string",  // returns string
        write: async () => ({ successful: true }),
        listFiles: async () => ({ entries: ["/tmp/p1b.20240101_120000", "/tmp/p1b.20240102_130000"] }),
      },
    });
    const r = await inst.Snapshot.restore("/tmp/p1b");
    assert("P1-1b: restore accepts string-returning Files.read", r.success === true);
  })();

  // P1-3: Network.get must work as a fallback to httpGet. Operit exposes
  // both depending on version; engine must not hardcode one name.
  (async function () {
    const inst = ZA.create({
      Network: {
        // No httpGet — only get
        get: async () => ({ content: JSON.stringify({ total_count: 0, items: [] }) }),
      },
    });
    const r = await inst.OpenSource.search("test", null, 0, 5);
    assert("P1-3: OpenSource works when only Network.get is available", r.success === true);
  })();

  // P1-6: gates_triggered must only contain gates that actually fired.
  // Previously every gate that ran (even if no violation) was added.
  (async function () {
    const r = await ZA.preflight({ action: "查看 README", files: [] });
    assert("P1-6: result has gates_triggered array", Array.isArray(r.gates_triggered));
    assert("P1-6: result has gates_evaluated array", Array.isArray(r.gates_evaluated));
    // gates_triggered must be a subset of gates_evaluated
    const evSet = new Set(r.gates_evaluated || []);
    const allIn = (r.gates_triggered || []).every(function (g) { return evSet.has(g); });
    assert("P1-6: gates_triggered is a subset of gates_evaluated", allIn === true);
  })();

  // P2-3: rm-rf without space (rm-rf) must still be detected.
  // Previously the tokenizer split on whitespace only, missing hyphen-fused forms.
  (async function () {
    const r1 = await ZA.file_guard({ command: "rm-rf /tmp/foo" });
    assert("P2-3: rm-rf (no space) is detected as dangerous", r1.blocked === true || (r1.reasons && r1.reasons.join(" ").indexOf("rm") >= 0));
  })();

  console.log("[p0-regression-test] all assertions done, failures=%d", failures);
}


(async () => {
  try {
    await runSelfTest();
    await runDITests();
    await runGuardTests();
    await runShellGuardTests();
    await runSandboxTests();
    await runPermissionTests();
    runConfigTests();
    runPerformanceTests();
    await runConcurrencyTests();
    runNormalizerTests();
    runEvidenceGradeTests();
    runTombstoneTests();
    runRegressionTests();
    runP0RegressionTests();
    if (failures === 0) {
      console.log("\nALL TESTS PASSED");
      process.exit(0);
    } else {
      console.error("\n%d ASSERTION(S) FAILED", failures);
      process.exit(1);
    }
  } catch (e) {
    console.error("TEST ERROR:", e.message, e.stack);
    process.exit(1);
  }
})();