---
name: defensive-ai-lab
description: Use for defensive AI experiments, evidence-based local code security reviews, authorization regression tests, isolated execution planning, checkpointed memory, and auditable Markdown or JSON reports. Use ONLY with workspace code, local fixtures, mock services, and user-provided evidence; never perform network reconnaissance, vulnerability scanning, exploitation, credential attacks, authorization bypass, traffic proxying, or third-party agent installation.
compatibility: OpenCode
metadata:
  category: defensive-security
  safety: local-only
---

# Defensive AI Lab

Run one evidence-driven workflow that combines safe AI experiments and defensive review of code owned by the user. Treat every run as an isolated case and keep claims, evidence, and generated text separate.

## Hard Boundary

Read `references/safety-policy.md` before choosing a workflow.

Operate only on:

- Files in the current workspace.
- Local unit and integration tests.
- Mock services and synthetic fixtures bound to loopback.
- Logs, reports, and request samples supplied by the user.
- Dependency audit output produced by an existing project command.

Stop the security workflow when the request involves external targets, live service probing, port or subdomain discovery, vulnerability scanning, exploit or payload execution, credential testing, authorization bypass, CAPTCHA or WAF evasion, proxy rotation, traffic tunneling, malware analysis for offensive use, or installation of an external agent framework. Offer local remediation review, mock-based regression tests, or evidence-only report processing.

## Entry Workflow

1. Classify the request as `ai_experiment`, `local_security_review`, `authorization_regression`, `evidence_report`, or `mixed`.
2. Create a case identity from a fresh random UUID. Never derive it from a target, credential, token, or personal value.
3. Create a case directory under `.defensive-ai-lab/cases/<case_id>/` only when the user asks to persist results. Keep secrets out of this directory.
4. Record scope, allowed data sources, requested outputs, and execution limits in `manifest.json` using `schemas/case-manifest.schema.json`.
5. Ask for missing information in groups of at most three questions. Request secret names and configuration locations, never secret values in chat or persistent memory.
6. Execute the selected workflow.
7. Validate every conclusion through the evidence gate.
8. Export Markdown and JSON reports from the templates in `templates/`.

Use `python3 scripts/labctl.py --help` for deterministic case operations. Prefer the CLI over hand-written state files because it performs atomic writes, redaction, hash generation, audit-chain updates, and semantic validation.

## Capability Router

Load detailed references only when the selected workflow needs them:

| Workflow need | Required reference |
| --- | --- |
| Engineering principles, change scope, token discipline | `references/engineering-charter.md` |
| Agent closed loop and tool priority | `references/agent-loop-protocol.md` |
| Unified security workflow and pipeline | `references/unified-workflow.md` |
| State machine, retries, pause, resume | `references/orchestration-protocol.md` |
| Checkpoints, promotion, retention | `references/memory-protocol.md` |
| Claims, conflicts, confidence, severity | `references/evidence-protocol.md` |
| Model matrix and evaluation | `references/ai-experiment-protocol.md` |
| Local authorization regression | `references/authorization-test-protocol.md` |
| Artifact layout and reporting | `references/reporting-protocol.md` |
| Hard boundary and prohibited operations | `references/safety-policy.md` |
| Restricted execution and sandbox defaults | `references/sandbox-policy.md` |
| External source registry and licensing | `references/provenance-registry.md` |
| Architecture decision records | `references/adr-protocol.md` |
| Prompt injection and memory poisoning | `references/prompt-injection-defense.md` |
| Retrieval trust and provenance | `references/retrieval-trust-protocol.md` |
| Storage backend abstraction | `references/storage-backends.md` |
| External report normalization | `references/external-report-normalization.md` |
| Data retention and human approval | `references/retention-approval-protocol.md` |
| Schema validation cadence | `references/schema-validation-protocol.md` |

Keep the main context limited to this file, the safety policy, and the references needed by the active workflow.

Load `references/engineering-charter.md`, `references/agent-loop-protocol.md`, and `references/unified-workflow.md` for any non-trivial task. They define the engineering principles, the agent closed loop, and the integrated security pipeline that all other protocols extend.

## Deterministic Tooling

Initialize a persistent case:

```bash
python3 scripts/labctl.py init --workflow local_security_review --scope src --output markdown --output json
```

Append a hash-chained audit event:

```bash
python3 scripts/labctl.py audit --case .defensive-ai-lab/cases/<case_id> --event scope_checked --metadata '{"result":"allowed"}'
```

Write an atomic checkpoint:

```bash
python3 scripts/labctl.py checkpoint --case .defensive-ai-lab/cases/<case_id> --completed inspect-auth --pending add-regression-test
```

Validate schemas, evidence references, case isolation, artifact hashes, and audit-chain integrity:

```bash
python3 scripts/labctl.py validate --case .defensive-ai-lab/cases/<case_id>
```

Render a deterministic Markdown report from `report.json`:

```bash
python3 scripts/labctl.py sync-report --case .defensive-ai-lab/cases/<case_id>
python3 scripts/labctl.py render --case .defensive-ai-lab/cases/<case_id>
```

## Four-Layer Memory

Keep these layers physically and logically separate:

### 1. Turn State

Hold temporary reasoning inputs for the current action. Discard raw secrets and authentication material immediately after the action. Never persist chain-of-thought.

### 2. Case Checkpoint

Persist only structured progress:

- Completed step IDs.
- Pending step IDs.
- Artifact paths and SHA-256 hashes.
- Tool command names with secret values redacted.
- Exit codes, timestamps, and concise errors.
- Evidence IDs and claim IDs.

Write checkpoints atomically after each material step. Resume only when the workspace identity and manifest hash match.

### 3. Curated Knowledge

Promote reusable knowledge only after evidence validation. Store defensive rules, confirmed remediation patterns, test strategies, prompt variants, and environment-independent error resolutions. Attach provenance, confidence, review status, and expiration metadata.

Never promote credentials, target identifiers, cookies, tokens, personal data, raw model claims, unverified findings, exploit code, payloads, or live endpoint details.

### 4. Audit Ledger

Append decisions to an immutable-style JSONL ledger:

- `case_created`
- `scope_checked`
- `tool_started`
- `tool_finished`
- `claim_accepted`
- `claim_rejected`
- `artifact_redacted`
- `checkpoint_written`
- `report_exported`

Each record includes timestamp, case ID, event type, artifact hashes, and redacted metadata. Never include hidden reasoning or secret values.

## Evidence Gate

Use `schemas/evidence.schema.json` and `schemas/finding.schema.json`.

A security finding reaches `confirmed` only when all conditions hold:

1. At least one evidence item comes from a deterministic local tool, local test, source location, or user-supplied artifact.
2. Evidence includes a stable locator such as file and line, test name, artifact hash, or report finding ID.
3. A reproduction test runs against local code, a loopback mock, or a synthetic fixture.
4. The observed result matches the expected security invariant.
5. Conflicting evidence is resolved or explicitly recorded.

Use these states:

- `confirmed`: all gate conditions pass.
- `supported`: strong static evidence exists and local reproduction is unavailable for a documented reason.
- `unverified`: model inference or incomplete evidence; exclude from definitive totals.
- `rejected`: deterministic evidence contradicts the claim.

Generated text is never evidence. Historical knowledge can guide investigation and can never independently confirm a finding.

## Local Security Review

1. Read repository guidance and identify project-native lint, test, type-check, dependency-audit, and static-analysis commands.
2. Inspect authentication and authorization boundaries, input validation, output encoding, secret handling, file access, subprocess execution, logging, and dependency configuration.
3. Search narrowly for relevant route definitions, middleware, policy checks, data-access filters, and dangerous sinks.
4. Run bounded project-native checks with explicit timeouts. Avoid installing scanners or agents.
5. Create the smallest local regression test that demonstrates the expected secure behavior.
6. Propose or apply a minimal remediation when the user requested implementation.
7. Re-run focused tests, then the project-standard validation suite when feasible.
8. Emit findings only through the evidence gate.

Treat static pattern matches as leads. Confirm data flow and reachable behavior before assigning severity.

## Authorization Regression

Use synthetic identities and local fixtures only.

1. Define principal A, principal B, and an administrator with synthetic IDs.
2. Create resources owned by each principal in the test fixture.
3. Exercise the application through its local test client or loopback mock.
4. Assert owner access, cross-owner denial, role boundaries, tenant boundaries, missing-session denial, and non-disclosing error behavior.
5. Verify authorization at the service or data-access boundary in addition to route middleware when architecture requires it.
6. Record test names, source locations, expected status, actual status, and response-body hash.

Never replay captured credentials, mutate live identifiers, or send these tests to a deployed service.

## Restricted Execution

Apply `references/sandbox-policy.md` before running generated code.

Default profile:

- Workspace read access only.
- Writes limited to an explicit case output directory and project files requested by the user.
- Network disabled; loopback permitted only for a local test server required by project tests.
- Fixed command allowlist derived from existing project scripts.
- Explicit timeout for every command.
- Low concurrency and bounded input sizes.
- Environment passed by allowlist with secret values redacted from logs.

Generated shell or Python code requires a static risk review before execution. High-risk or ambiguous code remains an artifact for human review and is never executed automatically.

## AI Experiment

Use only user-configured project credentials. Never discover or copy platform credentials.

1. Define hypothesis, model aliases, prompt template hash, dataset hash, parameter grid, metrics, budget, and stop conditions.
2. Remove secrets and personal data from prompts and fixtures.
3. Use a deterministic run ID for each combination of model alias, prompt hash, dataset hash, and parameters.
4. Execute bounded runs with declared concurrency, token, cost, and retry limits.
5. Retry only transient provider errors with exponential backoff and jitter. Keep provider changes explicit; never switch proxies or hidden endpoints.
6. Store raw outputs as model-generated artifacts with provenance. Keep them outside curated knowledge until reviewed.
7. Evaluate with deterministic assertions first, then labeled human or model judging when required. Record the judge identity and rubric version.
8. Compare runs without claiming statistical significance unless sample size and method support it.
9. Export results using `templates/ai-experiment-report.md` and the case report JSON schema.

## Load Control

Select a resource profile from observed device or CI constraints:

- `low`: concurrency 1, short context, sequential checks.
- `standard`: concurrency 2, bounded batches.
- `custom`: user-approved explicit limits.

On timeout, memory pressure, provider throttling, or repeated test instability, checkpoint progress and reduce concurrency or batch size. Preserve completed artifacts by hash and resume from the next pending step.

## Redaction

Before persisting or displaying artifacts, redact:

- API keys, bearer tokens, cookies, session IDs, passwords, private keys.
- Email addresses, phone numbers, and user-provided personal identifiers.
- Authorization headers and sensitive query parameters.

Use stable placeholders such as `[REDACTED_TOKEN_1]` so evidence can still be correlated. Store neither the original value nor a reversible mapping.

## Reports

Produce both formats when requested:

- Markdown for human review.
- JSON conforming to `schemas/case-report.schema.json` for automation.

Every report must include scope, exclusions, environment, methods, evidence index, conflicts, limitations, findings by verification state, remediation, validation results, and artifact hashes. Separate observed facts from interpretations and generated suggestions.

## Completion Check

Before finishing, verify:

- Scope remained local and defensive.
- No secret entered persisted state or output.
- Every confirmed claim references valid evidence IDs.
- Every artifact has a provenance label and hash.
- Unverified model output is clearly isolated.
- Commands were bounded and logged with redaction.
- Reports validate against their schemas.
- Temporary case data is retained or reset according to the user's explicit choice.
