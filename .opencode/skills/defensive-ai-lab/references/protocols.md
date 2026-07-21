# Protocols

## Engineering Charter

Operate as Principal Software Engineer. Goal: target project actually compiles, installs, runs, tests, and audits in the current environment.

Spend ~80% effort understanding problem + gathering evidence. ~20% implementing. Fix root cause, not symptom. Investigate before modifying.

Token discipline: read targeted 200-line windows. Use Edit over Write. Prefer tasks/subagents for multi-file work.

## Agent Loop

Tools always take priority. Never solve through chat what a tool can solve.

Workflow: Search → Analyze → Design → Code → Compile → Install → Run → Logs → Test → Fix → Re-verify.

Preferred tools: git, read_file, edit_file, search, grep, find, gradlew/build, adb/logcat, SAST, dependency audit.

## AI Experiment

- Freeze: hypothesis, prompt hash, dataset hash, model aliases, parameter grid, metrics, budget, stop conditions.
- Run ID: canonical JSON hash of model, prompt hash, dataset hash, params, repetition index.
- Evaluation: parse/schema validity → deterministic assertions → task metrics → blind judging → human review.
- Never let a model judge its own output. Preserve failed runs in totals.
- Use only user-configured platform credentials.

## Authorization Regression

Fixtures: anonymous, user-a/b/c, admin-a with synthetic IDs.

Required assertions: anonymous denial, owner access, same-tenant non-owner denial, cross-tenant denial at service boundary, member cannot escalate, admin bounded to tenant, missing/expired/revoked sessions fail closed, denial responses avoid disclosing resource existence.

Use local test client, in-memory service, or loopback mock. No live targets, credential replay, or ID mutation.

## Restricted Execution

Preflight: state purpose, resolve from project tool, inspect for destructive ops, define paths/env/timeout/concurrency, reject when isolation unavailable.

Denied: file deletion, privilege escalation, secret stores, external network, fork bombs, dynamic download, third-party agents.

Default limits: wall time 30-120s, concurrency 1-2, output 1-5 MiB, network disabled.

Logging: command identity, redacted args, cwd, timestamps, exit code, output hash. No env snapshots.

Safe rewrite: parse saved report / loopback mock / static analysis / patch for human review.

## Evidence Protocol

Each finding = one falsifiable claim with affected invariant, source location, preconditions, observed/expected behavior, evidence IDs.

Two independent evidence classes for high/critical severity (source data flow + failing test).

Confidence: `high` = deterministic reproduction + source trace agree; `medium` = strong source trace or test with gap; `low` = incomplete. Model agreement never raises confidence.

Severity from demonstrated local impact, reachable preconditions, affected data, existing controls. `informational` for defense-in-depth.

Anti-hallucination: every evidence ID exists once, belongs to current case, artifact hashes match, confirmed claims have deterministic evidence, source locators resolve to workspace files, rejected/unverified excluded from totals.

## Orchestration

State machine: pending → running → checkpointed → resumed → completed. Retries with exponential backoff only for transient errors. Pause on timeout, memory pressure, provider throttling, or test instability — checkpoint and resume from next pending step.

## Reporting

Markdown + JSON (per `schemas/case-report.schema.json`). Required: scope, exclusions, environment, methods, evidence index, conflicts, limitations, findings by state, remediation, validation results, artifact hashes. Separate facts from interpretations. Generated advice carries no evidence status.
