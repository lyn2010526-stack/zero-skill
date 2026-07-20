/*
 * Skill activation behavior tests.
 * Verifies the 零.skill routing rules and behavior constraints documented
 * in references/*.md are honored by the engine layer.
 *
 * These tests assert that:
 *   - Low-permission scenarios refuse high-permission operation planning
 *   - Destructive commands require confirmation (file_guard gate)
 *   - Fact claims without evidence are blocked (hallucination gate)
 *   - Path traversal is rejected (snapshot gate)
 *   - Dependency-missing returns structured error, not silent failure
 *   - LRU cache actually evicts (no unbounded growth)
 *   - RetryPolicy distinguishes 4xx (no retry) vs 5xx (retry)
 *   - ConcurrencyLimiter serializes beyond capacity
 *   - TaskLedger respects priority ordering
 *
 * Usage: node tests/test_skill_activation.js
 */

const path = require("path");
const m = require(path.join(__dirname, "..", "engine", "zero_apex.js"));

let failures = 0;
let passed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failures++; console.error("  FAIL:", msg); }
}

// ---------------------------------------------------------------------------
// Scenario 1: Low-permission device (L0-L2, no Files/Network/Tools)
// Must refuse to plan file/network/memory operations, return DEPENDENCY_MISSING
// ---------------------------------------------------------------------------
async function testLowPermissionRefusal() {
  console.log("[scenario 1] low-permission device refuses high-permission ops");
  const inst = m.create({}); // no deps injected

  const snap = await inst.Snapshot.snapshot("/tmp/x.txt");
  assert(!snap.success, "snapshot refuses without Files");
  assert(snap.code === "E5002_DEPENDENCY_MISSING", "snapshot returns DEPENDENCY_MISSING");

  const restore = await inst.Snapshot.restore("/tmp/x.txt");
  assert(!restore.success, "restore refuses without Files");

  const mem = await inst.Memory.remember("success", "p", "s");
  assert(!mem.success, "remember refuses without Tools.Memory");
  assert(mem.code === "E5002_DEPENDENCY_MISSING", "remember returns DEPENDENCY_MISSING");

  const rec = await inst.Memory.recall("q");
  assert(!rec.success, "recall refuses without Tools.Memory");

  const osr = await inst.OpenSource.search("test", "js", 100, 1);
  assert(!osr.success, "search refuses without Network");
  assert(osr.code === "E5002_DEPENDENCY_MISSING", "search returns DEPENDENCY_MISSING");

  // Evidence module: fileExists returns false (no Files), but classify still works
  // on exit_code/stdout — it should not crash, just not reach L4
  const ev = await inst.Evidence.classify("编译通过", { exit_code: 0, stdout: "BUILD SUCCESSFUL" });
  assert(ev.level === "L3", "evidence classifies from stdout even without Files (got " + ev.level + ")");
}

// ---------------------------------------------------------------------------
// Scenario 2: Destructive command requires confirmation (file_guard gate)
// ---------------------------------------------------------------------------
async function testDestructiveCommandGate() {
  console.log("[scenario 2] destructive command requires confirmation");
  const fg = m.ZeroApex.FileGuard;

  const r1 = fg.analyzeCommand("rm -rf /home/user/project");
  assert(r1.is_delete, "rm -rf detected as delete");
  assert(r1.requires_confirmation, "rm -rf requires confirmation");
  assert(r1.risk_level === "HIGH" || r1.risk_level === "CRITICAL", "rm -rf HIGH/CRITICAL");

  const r2 = fg.analyzeCommand("git reset --hard");
  assert(r2.is_delete, "git reset --hard detected");
  assert(r2.requires_confirmation, "git reset --hard requires confirmation");

  const r3 = fg.analyzeCommand("ls -la /sdcard");
  assert(!r3.is_delete, "ls not flagged as delete");
  assert(r3.requires_confirmation, "ls /sdcard flagged for risky path");

  // Redirect to a normal file triggers overwrite soft risk
  const r4 = fg.analyzeCommand("echo x > /tmp/out.txt");
  assert(r4.requires_confirmation, "redirect overwrite flagged");
  // Redirect to /dev/null is exempt from overwrite soft risk,
  // but /dev/null itself is a system path — so it's still flagged
  // for risky path. This is correct behavior: /dev is a system dir.
  const r4b = fg.analyzeCommand("echo x > /dev/null");
  assert(r4b.path_risks.length > 0, "/dev/null flagged as system path (correct)");

  // Indirect delete in script
  const r5 = fg.scanScript("os.system('rm -rf /tmp')");
  assert(r5.is_delete, "indirect os.system rm detected");
}

// ---------------------------------------------------------------------------
// Scenario 3: Path traversal rejection (snapshot gate)
// ---------------------------------------------------------------------------
async function testPathTraversalRejection() {
  console.log("[scenario 3] path traversal rejection");
  const inst = m.create({
    Files: { exists: async () => ({ exists: true }), read: async () => ({ content: "x" }), write: async () => ({ successful: true }) },
  });

  const s1 = await inst.Snapshot.snapshot("../../etc/passwd");
  assert(!s1.success, "snapshot rejects ../../etc/passwd");

  const s2 = await inst.Snapshot.snapshot("../../../root/.ssh/id_rsa");
  assert(!s2.success, "snapshot rejects ../../../root traversal");

  const s3 = await inst.Snapshot.restore("../../etc/shadow");
  assert(!s3.success, "restore rejects path traversal");

  // Normal path should work
  const s4 = await inst.Snapshot.snapshot("/home/user/project/file.txt");
  assert(s4.success, "normal path snapshot works");
}

// ---------------------------------------------------------------------------
// Scenario 4: Fact claim without evidence is blocked (hallucination gate)
// ---------------------------------------------------------------------------
async function testHallucinationGate() {
  console.log("[scenario 4] fact claim without evidence blocked");
  const h = m.ZeroApex.Hallucination;

  const r1 = h.check("编译通过了", null);
  assert(!r1.allowed, "fact claim without evidence blocked");
  assert(r1.suggested_label === "GUESSED", "suggested label GUESSED");

  const r2 = h.check("编译通过了", "BUILD SUCCESSFUL");
  assert(r2.allowed, "fact claim with evidence allowed");

  const r3 = h.check("显然这个能行", null);
  assert(!r3.allowed, "overconfident blocked");
  assert(r3.suggested_label === "INFERRED", "overconfident -> INFERRED");

  const r4 = h.check("这个 API 已经废弃了", null);
  assert(!r4.allowed, "unsourced tech assertion blocked");

  const r5 = h.check("正在编译中", null);
  assert(r5.allowed, "process description allowed without evidence");
}

// ---------------------------------------------------------------------------
// Scenario 5: Evidence check enforces L3 minimum for "done" claims
// ---------------------------------------------------------------------------
async function testEvidenceGate() {
  console.log("[scenario 5] evidence check enforces L3 minimum");
  const inst = m.create({});

  const e1 = await inst.Evidence.classify("编译通过", { exit_code: 0, stdout: "BUILD SUCCESSFUL" });
  assert(e1.level === "L3", "BUILD SUCCESSFUL -> L3");
  assert(e1.can_claim_done, "L3 can claim done");

  const e2 = await inst.Evidence.classify("编译通过", { exit_code: 1, stderr: "BUILD FAILED" });
  assert(!e2.supports_claim, "BUILD FAILED -> not supported");
  assert(e2.level === "L0", "failed build -> L0");

  const e3 = await inst.Evidence.classify("编译通过", { stdout: "some text" });
  assert(e3.level === "L1", "text only -> L1");
  assert(!e3.can_claim_done, "L1 cannot claim done");

  const e4 = await inst.Evidence.classify("测试通过", { exit_code: 0, stdout: "5 passed" });
  assert(e4.level === "L5", "tests passed -> L5");
  assert(e4.can_claim_done, "L5 can claim done");
}

// ---------------------------------------------------------------------------
// Scenario 6: Output firewall blocks tool leak and thought leak
// ---------------------------------------------------------------------------
async function testOutputFirewall() {
  console.log("[scenario 6] output firewall blocks leaks");
  const of = m.ZeroApex.OutputFirewall;

  const r1 = of.check("api_key=sk-1234567890");
  assert(r1.severity === "SEVERE", "api_key leak SEVERE");
  assert(r1.action.startsWith("BLOCK"), "api_key leak blocked");

  const r2 = of.check("我认为这个应该没问题");
  assert(!r2.clean, "thought leak detected");

  const r3 = of.check("加油，没问题的，不用担心！");
  assert(!r3.clean, "filler detected");

  const r4 = of.check("这是一段正常的技术说明。");
  assert(r4.clean && r4.action === "PASS", "clean text passes");
}

// ---------------------------------------------------------------------------
// Scenario 7: Self-monitor blocks change task without file read
// ---------------------------------------------------------------------------
async function testSelfMonitorGate() {
  console.log("[scenario 7] self-monitor blocks change task without file read");
  const sm = m.ZeroApex.SelfMonitor;

  const r1 = sm.assess({ goal: "修复登录崩溃", files_read: false });
  assert(r1.state === "NOT_READY", "change task without file read NOT_READY");
  assert(r1.blockers.length > 0, "has blockers");

  const r2 = sm.assess({ goal: "修复登录崩溃", files_read: true, evidence_ready: true });
  assert(r2.state === "READY", "change task ready when files read + evidence");
  assert(r2.readiness_score === 100, "ready score 100");

  const r3 = sm.assess({ goal: "肯定没问题", files_read: true });
  assert(r3.cognitive_biases.length > 0, "overconfidence bias detected");
}

// ---------------------------------------------------------------------------
// Scenario 8: Preflight integrates all gates
// ---------------------------------------------------------------------------
async function testPreflightIntegration() {
  console.log("[scenario 8] preflight integrates all gates");
  const inst = m.create({});

  // Destructive command + fact claim without evidence + no file read
  const r1 = inst.preflight(
    "修复 bug 并编译通过",
    "rm -rf build/",
    null,
    false
  );
  assert(!r1.allowed, "preflight blocks destructive + no evidence + no file read");
  assert(r1.gates_triggered.length >= 2, "multiple gates triggered");
  assert(r1.task_id, "preflight assigns task_id");

  // Clean task: read files, no destructive command, process description
  const r2 = inst.preflight(
    "正在查询 API 用法",
    null,
    null,
    true
  );
  assert(r2.allowed, "preflight allows clean process task");
  assert(r2.state === "READY", "clean task READY");
}

// ---------------------------------------------------------------------------
// Scenario 9: LRU cache actually evicts (no unbounded memory growth)
// ---------------------------------------------------------------------------
function testLRUEviction() {
  console.log("[scenario 9] LRU cache evicts");
  const LRUCache = m._infra.LRUCache;
  const cache = new LRUCache(3);
  cache.set("a", 1); cache.set("b", 2); cache.set("c", 3);
  assert(cache.size() === 3, "size 3 at capacity");
  cache.set("d", 4); // should evict "a"
  assert(cache.get("a") === undefined, "a evicted");
  assert(cache.get("b") === 2 && cache.get("c") === 3 && cache.get("d") === 4, "b,c,d kept");
  assert(cache.size() === 3, "size still 3 after eviction");
}

// ---------------------------------------------------------------------------
// Scenario 10: RetryPolicy distinguishes 4xx vs 5xx
// ---------------------------------------------------------------------------
function testRetryPolicy() {
  console.log("[scenario 10] retry policy 4xx vs 5xx");
  const RetryPolicy = m._infra.RetryPolicy;
  const rp = new RetryPolicy({ maxAttempts: 3 });

  assert(!rp.shouldRetry(1, { message: "401 Unauthorized" }), "401 not retried");
  assert(!rp.shouldRetry(1, { message: "403 Forbidden" }), "403 not retried");
  assert(rp.shouldRetry(1, { message: "500 Internal Server Error" }), "500 retried");
  assert(rp.shouldRetry(2, { message: "502 Bad Gateway" }), "502 retried");
  assert(!rp.shouldRetry(3, { message: "500" }), "max attempts not retried");

  const d1 = rp.delayFor(1);
  assert(d1 >= 0 && d1 <= 5000, "delay bounded (got " + d1 + ")");
  const d2 = rp.delayFor(10);
  assert(d2 <= 5000, "delay capped at maxDelayMs");
}

// ---------------------------------------------------------------------------
// Scenario 11: ConcurrencyLimiter serializes beyond capacity
// ---------------------------------------------------------------------------
async function testConcurrencyLimiter() {
  console.log("[scenario 11] concurrency limiter serializes");
  const ConcurrencyLimiter = m._infra.ConcurrencyLimiter;
  const lim = new ConcurrencyLimiter(1);
  const order = [];
  const tasks = [
    lim.run(() => { order.push("a"); return new Promise(res => setTimeout(() => res("a"), 10)); }),
    lim.run(() => { order.push("b"); return Promise.resolve("b"); }),
    lim.run(() => { order.push("c"); return Promise.resolve("c"); }),
  ];
  await Promise.all(tasks);
  assert(order[0] === "a", "first task runs first");
  assert(order[1] === "b", "second task waits");
  assert(order[2] === "c", "third task waits");
}

// ---------------------------------------------------------------------------
// Scenario 12: TaskLedger priority ordering
// ---------------------------------------------------------------------------
function testTaskLedgerPriority() {
  console.log("[scenario 12] task ledger priority");
  const TaskLedger = m._infra.TaskLedger;
  const ledger = new TaskLedger({});

  ledger.enqueue({ goal: "low", priority: 1 });
  ledger.enqueue({ goal: "critical", priority: 100 });
  ledger.enqueue({ goal: "medium", priority: 50 });
  ledger.enqueue({ goal: "high", priority: 75 });

  const first = ledger.next();
  assert(first.goal === "critical", "highest priority first (got " + first.goal + ")");
  assert(first.status === "running", "first marked running");

  const second = ledger.next();
  assert(second.goal === "high", "second highest next (got " + second.goal + ")");

  assert(ledger.pendingCount() === 2, "2 pending after 2 started");

  ledger.complete(first.id, { ok: true });
  const snap = ledger.snapshot();
  const done = snap.find(t => t.id === first.id);
  assert(done.status === "done", "completed task marked done");
}

// ---------------------------------------------------------------------------
// Scenario 13: Missing required parameter returns structured error
// ---------------------------------------------------------------------------
async function testMissingRequired() {
  console.log("[scenario 13] missing required parameter");
  const inst = m.create({ Network: { httpGet: async () => ({ content: "{}" }) } });

  const r1 = await inst.OpenSource.search("", "js", 100, 1);
  assert(!r1.success, "empty keyword rejected");
  assert(r1.code === "E1002_MISSING_REQUIRED", "returns MISSING_REQUIRED");

  const r2 = await inst.OpenSource.search(null, "js", 100, 1);
  assert(!r2.success, "null keyword rejected");
}

// ---------------------------------------------------------------------------
// Scenario 14: ConfigRegistry centralizes all patterns
// ---------------------------------------------------------------------------
function testConfigRegistry() {
  console.log("[scenario 14] config registry centralizes patterns");
  const cr = m._infra.ConfigRegistry;

  // All guard patterns should be in registry, not hardcoded in modules
  assert(Array.isArray(cr.get("file_guard.delete_patterns")), "delete_patterns in registry");
  assert(cr.get("file_guard.delete_patterns").length >= 14, "14+ delete patterns");
  assert(Array.isArray(cr.get("file_guard.indirect_patterns")), "indirect_patterns in registry");
  assert(Array.isArray(cr.get("file_guard.risky_paths")), "risky_paths in registry");
  assert(Array.isArray(cr.get("hallucination.fact_claims")), "fact_claims in registry");
  assert(Array.isArray(cr.get("hallucination.valid_labels")), "valid_labels in registry");
  assert(cr.get("evidence.build_ok") instanceof RegExp, "evidence regexes in registry");
  assert(cr.get("memory.cache_size") === 64, "memory config in registry");
  assert(cr.get("opensource.max_attempts") === 3, "opensource config in registry");

  // Missing key throws (fail-fast, no silent default)
  let threw = false;
  try { cr.get("__nonexistent__"); } catch (e) { threw = true; }
  assert(threw, "missing config key throws");

  // Snapshot for debugging
  const snap = cr.snapshot();
  assert(Object.keys(snap).length >= 15, "config has 15+ keys (got " + Object.keys(snap).length + ")");
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
(async () => {
  try {
    await testLowPermissionRefusal();
    await testDestructiveCommandGate();
    await testPathTraversalRejection();
    await testHallucinationGate();
    await testEvidenceGate();
    await testOutputFirewall();
    await testSelfMonitorGate();
    await testPreflightIntegration();
    testLRUEviction();
    testRetryPolicy();
    await testConcurrencyLimiter();
    testTaskLedgerPriority();
    await testMissingRequired();
    testConfigRegistry();

    console.log("\n========================================");
    console.log("Skill activation tests: %d passed, %d failed", passed, failures);
    console.log("========================================");
    if (failures === 0) {
      console.log("ALL SCENARIOS PASSED");
      process.exit(0);
    } else {
      console.error("%d ASSERTION(S) FAILED", failures);
      process.exit(1);
    }
  } catch (e) {
    console.error("TEST ERROR:", e.message, e.stack);
    process.exit(1);
  }
})();