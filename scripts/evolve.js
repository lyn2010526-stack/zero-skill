#!/usr/bin/env node
/*
 * evolve.js — 全自动进化闭环（缺点 #6）
 *
 * 流程：从记忆库提取失败经验 → 聚类分析 → 生成新 reference 片段
 *       → 自动测试 → 备份 → 合并到 references/ → 更新 manifest
 *
 * 用法：
 *   node scripts/evolve.js                  # 全自动：提取+生成+测试+合并
 *   node scripts/evolve.js --dry-run        # 只生成不合并，输出预览
 *   node scripts/evolve.js --min-failures 5 # 自定义触发阈值
 *
 * 输出：
 *   .zero_apex/evolution_log.jsonl  — 每次进化的审计日志
 *   references/evolved_<topic>.md   — 生成的新规则片段
 *   manifest.json                   — 更新 references 列表
 *   .trash/references_backup/       — 合并前的备份
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REFS_DIR = path.join(ROOT, "references");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const EVOLUTION_LOG = path.join(ROOT, ".zero_apex", "evolution_log.jsonl");
const BACKUP_DIR = path.join(ROOT, ".trash", "references_backup");

// --- CLI args ---
const args = process.argv.slice(2);
const dryRun = args.indexOf("--dry-run") >= 0;
const minFailuresIdx = args.indexOf("--min-failures");
const minFailures = minFailuresIdx >= 0 ? parseInt(args[minFailuresIdx + 1], 10) || 3 : 3;

// --- Helpers ---
function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendJsonl(filePath, obj) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, JSON.stringify(obj) + "\n", "utf8");
}

function logEvolution(stage, data) {
  appendJsonl(EVOLUTION_LOG, {
    ts: new Date().toISOString(),
    stage: stage,
    dry_run: dryRun,
    ...data,
  });
}

// --- Step 1: Extract failures from audit log + memory ---
function extractFailures() {
  const failures = [];

  // From audit log
  const auditPath = path.join(ROOT, ".zero_apex", "audit_log.jsonl");
  if (fs.existsSync(auditPath)) {
    const lines = fs.readFileSync(auditPath, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.result_code && entry.result_code !== "OK" && entry.result_code !== "ALLOW") {
          failures.push({
            source: "audit_log",
            tool: entry.tool,
            task_id: entry.task_id,
            result_code: entry.result_code,
            summary: entry.result_summary || "",
            ts: entry.ts,
          });
        }
      } catch (e) { /* skip malformed */ }
    }
  }

  // From memory recall (if engine available)
  try {
    const engine = require(path.join(ROOT, "engine", "zero_apex.js"));
    // Can't use async recall in sync context; use snapshot of memory if Tools available
    // In Node test env, Tools.Memory is not available, so skip
  } catch (e) { /* engine not loadable */ }

  return failures;
}

// --- Step 2: Cluster failures by topic ---
function clusterFailures(failures) {
  const clusters = {};
  for (const f of failures) {
    // Topic = tool name + result_code prefix
    const topic = (f.tool || "unknown") + ":" + (f.result_code || "").split("_")[0];
    if (!clusters[topic]) clusters[topic] = [];
    clusters[topic].push(f);
  }
  return clusters;
}

// --- Step 3: Generate reference fragment from cluster ---
function generateReference(topic, failures) {
  const count = failures.length;
  const tools = [...new Set(failures.map((f) => f.tool).filter(Boolean))];
  const codes = [...new Set(failures.map((f) => f.result_code).filter(Boolean))];
  const summaries = failures.map((f) => f.summary).filter(Boolean).slice(0, 5);

  const safeTopic = topic.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = "evolved_" + safeTopic + ".md";

  const content = `# Evolved Rule — ${topic}

> 自动生成于 ${new Date().toISOString()}，基于 ${count} 次失败经验聚类。
> 此规则由 evolve.js 从 audit_log 提取生成，经测试后自动合并。

## 失败模式

- 涉及工具：${tools.join(", ")}
- 错误码：${codes.join(", ")}
- 失败次数：${count}

## 典型失败摘要

${summaries.map((s) => "- " + s).join("\n")}

## 建议行为约束

1. 调用上述工具时，如返回 ${codes[0] || "非 OK"} 错误码，应先检查依赖和环境权限
2. 连续失败 ${Math.ceil(count / 3)} 次后，应降级为建议模式而非重复尝试
3. 向用户报告失败原因时，引用具体错误码而非泛泛说"出错了"

## 触发条件

- tool: ${tools[0] || "any"}
- result_code: ${codes[0] || "any_error"}

## 来源

- 生成脚本: scripts/evolve.js
- 数据源: .zero_apex/audit_log.jsonl
- 聚类键: ${topic}
- 生成时间: ${nowStamp()}
`;

  return { fileName, content, topic, count, tools, codes };
}

// --- Step 4: Run tests before merge ---
function runTests() {
  try {
    const { execSync } = require("child_process");
    const out = execSync("node tests/test_zero_apex.js 2>&1 && node tests/test_skill_activation.js 2>&1", {
      cwd: ROOT,
      timeout: 30000,
      encoding: "utf8",
    });
    const allPass = out.indexOf("ALL TESTS PASSED") >= 0 && out.indexOf("ALL SCENARIOS PASSED") >= 0;
    return { pass: allPass, output: out.slice(-500) };
  } catch (e) {
    return { pass: false, output: String(e.message || e).slice(-500) };
  }
}

// --- Step 5: Backup references before merge ---
function backupReferences() {
  ensureDir(BACKUP_DIR);
  const stamp = nowStamp();
  const backupPath = path.join(BACKUP_DIR, "refs_" + stamp);
  ensureDir(backupPath);
  if (fs.existsSync(REFS_DIR)) {
    const files = fs.readdirSync(REFS_DIR);
    for (const f of files) {
      fs.copyFileSync(path.join(REFS_DIR, f), path.join(backupPath, f));
    }
  }
  return backupPath;
}

// --- Step 6: Merge new reference + update manifest ---
function mergeReference(gen) {
  const refPath = path.join(REFS_DIR, gen.fileName);
  fs.writeFileSync(refPath, gen.content, "utf8");

  // Update manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const entry = {
      name: gen.topic.replace(/[^a-zA-Z0-9_-]/g, "_"),
      path: "references/" + gen.fileName,
      layer: "进化",
      priority: "normal",
      min_permission: "none",
      triggers: ["tool_error:" + (gen.tools[0] || "any")],
      conflicts_with: [],
      evolved: true,
      evolved_at: new Date().toISOString(),
      evolved_from_failures: gen.count,
    };
    // Avoid duplicate
    const existing = manifest.references.findIndex((r) => r.name === entry.name);
    if (existing >= 0) manifest.references[existing] = entry;
    else manifest.references.push(entry);
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
  return refPath;
}

// --- Main ---
function main() {
  console.log("=== evolve.js: 自动进化闭环 ===");
  console.log("dry_run:", dryRun, "| min_failures:", minFailures);
  console.log();

  // Step 1: Extract
  const failures = extractFailures();
  console.log("[1/6] 提取失败经验:", failures.length, "条");
  logEvolution("extract", { failure_count: failures.length });

  if (failures.length < minFailures) {
    console.log("      失败数不足", minFailures, "，跳过进化");
    logEvolution("skip", { reason: "insufficient_failures", count: failures.length, threshold: minFailures });
    return;
  }

  // Step 2: Cluster
  const clusters = clusterFailures(failures);
  const topics = Object.keys(clusters);
  console.log("[2/6] 聚类:", topics.length, "个主题");
  logEvolution("cluster", { topics: topics, counts: topics.map((t) => clusters[t].length) });

  // Step 3: Generate
  const generated = [];
  for (const topic of topics) {
    const gen = generateReference(topic, clusters[topic]);
    generated.push(gen);
    console.log("[3/6] 生成:", gen.fileName, "(" + gen.count + " failures)");
  }
  logEvolution("generate", { files: generated.map((g) => g.fileName) });

  if (dryRun) {
    console.log("\n[dry-run] 预览生成的 reference 片段：");
    for (const gen of generated) {
      console.log("\n--- " + gen.fileName + " ---");
      console.log(gen.content.slice(0, 500));
    }
    console.log("\n[dry-run] 未合并，未更新 manifest");
    return;
  }

  // Step 4: Test
  console.log("[4/6] 运行测试...");
  const testResult = runTests();
  console.log("      测试结果:", testResult.pass ? "PASS" : "FAIL");
  logEvolution("test", { pass: testResult.pass, output: testResult.output });
  if (!testResult.pass) {
    console.log("      测试失败，中止合并");
    console.log(testResult.output);
    return;
  }

  // Step 5: Backup
  console.log("[5/6] 备份 references/...");
  const backupPath = backupReferences();
  console.log("      备份到:", backupPath);
  logEvolution("backup", { path: backupPath });

  // Step 6: Merge
  console.log("[6/6] 合并新 reference + 更新 manifest...");
  const merged = [];
  for (const gen of generated) {
    const refPath = mergeReference(gen);
    merged.push(refPath);
    console.log("      合并:", refPath);
  }
  logEvolution("merge", { merged: merged });

  console.log("\n=== 进化完成 ===");
  console.log("生成", generated.length, "条新规则，已合并到 references/");
  console.log("manifest.json 已更新");
  console.log("审计日志:", EVOLUTION_LOG);
}

main();