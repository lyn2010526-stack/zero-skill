/*
 * zero_apex engine — Node.js self-test runner.
 * Runs the built-in main() self-test plus DI integration tests.
 * Usage: node test_zero_apex.js
 * No external dependencies; pure stdlib.
 */

const path = require("path");
const m = require(path.join(__dirname, "..", "engine", "zero_apex.js"));

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

  // ResultEnvelope
  const envOk = inst._infra.ResultEnvelope.ok({ x: 1 });
  assert(envOk.success && envOk.code === "OK" && envOk.data.x === 1, "Envelope ok");
  const envFail = inst._infra.ResultEnvelope.fail(ec.NETWORK_ERROR, "timeout");
  assert(!envFail.success && envFail.code === ec.NETWORK_ERROR && envFail.error === "timeout", "Envelope fail");

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

(async () => {
  try {
    await runSelfTest();
    await runDITests();
    await runGuardTests();
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