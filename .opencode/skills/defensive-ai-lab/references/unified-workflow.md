# Unified Security Workflow

## Positioning

Defensive AI Lab combines: AI parameter experiments, local security review, authorization regression on loopback mocks, and static/dynamic code audit. Reuses architectural ideas from PentAGI/Strix, excluding offensive components.

## Four-Layer Memory

| Layer | Purpose | Storage |
|-------|---------|---------|
| 1. Turn Sandbox | Per-step isolated state; no cross-task contamination | In-memory only |
| 2. Case Checkpoint | Current-task results, evidence, tool calls, config | `schemas/checkpoint.schema.json` |
| 3. Curated Knowledge | Confirmed findings, remediation patterns, test strategies | `schemas/knowledge-chunk.schema.json` |
| 4. Audit Ledger | Immutable JSONL: case_created, scope_checked, tool_started/finished, claim_accepted/rejected, artifact_redacted, checkpoint_written, report_exported | Append-only |

Promotion to curated knowledge requires evidence gate + provenance + confidence + review status + expiration.

## Anti-Hallucination

- Model guesses are never vulnerabilities. Never fabricate CWE/CVE/architecture.
- High-risk conclusion requires: real local run log/stacktrace, deterministic tool output (test result, parsed report, local PoC against loopback), or authoritative document.
- Tool output wins over model output. Model only explains and adds context.

## Pipeline Capabilities

1. **AI Experiment** — model/prompt/parameter comparison with deterministic run IDs, bounded concurrency/token/cost limits. Schema: `schemas/experiment-run.schema.json`.
2. **Local Security Review** — auth boundaries, input validation, output encoding, secret handling, subprocess, logging, dependency config. Bounded project-native checks with timeouts.
3. **Authorization Regression** — synthetic principals/resources, loopback mocks only. Assert owner access, cross-owner denial, role/tenant boundaries, missing-session denial.
4. **Evidence Processing** — parse user-supplied reports (SARIF, SBOM, logs) without replaying.
5. **Report Generation** — Markdown + JSON with scope, evidence index, findings by state, remediation, hashes.

## Execution Defaults

- Workspace read access only. Writes limited to case output directory + user-requested project files.
- Network disabled; loopback permitted only for local test server.
- Fixed command allowlist from existing project scripts. Explicit timeout per command.
- Low concurrency, bounded input sizes. Environment passed by allowlist with secrets redacted.
