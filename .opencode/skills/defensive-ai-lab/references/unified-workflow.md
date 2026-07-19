# Unified Security Workflow

## 0. Positioning

Defensive AI Lab is one integrated Skill that combines:

- Large model parameter experiments
- SRC vulnerability research converted into local rules and tests
- API authorization regression on loopback mocks
- Static and dynamic code audit of workspace projects
- End-to-end security pipeline for open-source projects, executed locally

It reuses architectural ideas from mature agent frameworks (PentAGI, Strix) while excluding their offensive components. See `references/provenance-registry.md` and `adr/ADR-0002-offensive-sources-research-only.md`.

It solves AI-native pain points: memory pollution, model hallucination, and damage from high-risk generated code.

## 1. Four-Layer Isolated Memory

The four layers below are logically separated. The host system implements storage; the Skill obeys the contract.

### Layer 1: Turn Sandbox

- Each penetration step or AI experiment uses independent in-memory state.
- API key names, target identifiers, and session context are strictly isolated.
- No cross-task memory contamination.
- Adopted from PentAGI-style per-case checkpoint isolation. Offensive agent execution is excluded.

### Layer 2: Short-Term Task Memory

- Stores current-task scan results, vulnerability lists, tools invoked, and experiment configuration.
- Includes normalized SARIF, SBOM, test results, and log summaries.
- Used to pass state between stages of the current task.
- Implemented as the case checkpoint and case-scoped evidence store. See `schemas/checkpoint.schema.json`.

### Layer 3: Mid-Term Project Memory

- Per project or target system, maintains a security dossier:
  - Confirmed vulnerabilities
  - Remediation paths applied
  - Unverified risks
  - Pending human-approval items
- Stored as curated knowledge chunks with project provenance. See `schemas/knowledge-chunk.schema.json`.

### Layer 4: Long-Term Security Knowledge Base

- Stores general vulnerability patterns, attack method classes, fix strategies, and SRC experience.
- Used for anti-hallucination: high-risk conclusions must align with the knowledge base or an authoritative source, otherwise they are marked `unverified`.
- Promotion requires the gate in `references/memory-protocol.md` and `references/retrieval-trust-protocol.md`.

## 2. Anti-Hallucination And Safety Constraints

- Model guesses are never treated as vulnerabilities.
- Never fabricate CWE, CVE, or project architecture.
- A high-risk conclusion requires at least one of:
  - A real local run log or stacktrace.
  - Deterministic tool output: local test result, parsed scanner report, or local PoC execution against a loopback mock.
  - An authoritative document, official statement, or upstream open-source project statement.

When model output conflicts with tool output:

- Tool output wins.
- The model only explains and adds context.

All high-risk code execution must:

- Run in a sandbox or isolated environment.
- Never touch the user production environment.
- Follow the Strix-inspired isolated execution model, adapted to local fixtures and loopback mocks. Live exploit execution against external targets is excluded.
- Apply only to workspace-owned code, synthetic fixtures, or user-authorized local targets.

## 3. Integrated Pipeline Capabilities

All five capabilities below are supported. None is omitted.

### 3.1 Large Model Parameter Experiment

- Use different models, parameters, and prompts for defensive analysis tasks.
- Record into `schemas/experiment-run.schema.json`:
  - Model alias and provider-declared model identifier
  - Parameters
  - Dataset hash
  - Metrics
  - Safety impact assessment
- Used to select the best strategy for later automated agent steps.
- Full protocol in `references/ai-experiment-protocol.md`.

### 3.2 SRC Vulnerability Research

- Extract strategies and case patterns from SRC or vulnerability platform reports supplied by the user.
- Convert them into automated local tests, static rules, and audit patterns.
- Record successful patterns and reproduction conditions in the knowledge base.
- Live replay against SRC targets is prohibited. Only offline conversion into local regression tests is allowed.

### 3.3 API Authorization Regression

- Cover REST, GraphQL, gRPC, WebSocket, and RPC style APIs through their local test clients or loopback mocks.
- Use existing project test clients, schema-driven fuzzing on synthetic inputs, and the authorization matrix in `templates/authorization-matrix.json`.
- Execute fuzz, permission boundary, and logic tests in the sandbox against synthetic principals.
- Live permission bypass against deployed APIs is prohibited.
- Full protocol in `references/authorization-test-protocol.md`.

### 3.4 Code Audit (Static Plus Dynamic)

- Static: syntax, data flow, authorization, secret handling, input validation, resource management, dependency configuration.
- Dynamic: run the application locally, observe logs, capture exceptions, and detect behavior changes.
- Integrate structured outputs from project-native analyzers and user-supplied scanner reports, normalized into SARIF. See `references/external-report-normalization.md`.
- Live exploitation is excluded. Local PoC regression tests that assert the protected behavior are the equivalent.

### 3.5 Open-Source Project Security Pipeline

For an open-source repository in the workspace:

1. Clone or checkout at a pinned commit.
2. Install dependencies using project-native commands.
3. Compile and build with bounded execution.
4. Run the project test suite.
5. Audit: static review, dependency audit, normalized report parsing.
6. Verify findings through local regression tests.
7. Generate a security report in SARIF and Markdown.

The overall flow aligns conceptually with PentAGI and Strix multi-step verification, while excluding live scanning, exploitation, and external agent execution.

## 4. Schema And Record Layer

All security knowledge, experiments, and audit results must be written into the schemas in `schemas/`. Do not invent new structures. All writes must pass schema validation.

| Record | Schema | Purpose |
| --- | --- | --- |
| Knowledge chunk | `knowledge-chunk.schema.json` | Single security knowledge fragment: vulnerability case, attack method class, fix strategy |
| Provenance entry | `provenance-entry.schema.json` | Source of each conclusion: tool, version, command, git commit, environment |
| SARIF import | `sarif-import.schema.json` | Normalize SARIF reports from analyzers |
| Test result import | `test-result-import.schema.json` | Functional and security test results: pass, fail, skip, error |
| SBOM import | `sbom-import.schema.json` | Dependency graph linked to vulnerabilities and advisories |
| External report normalization | `references/external-report-normalization.md` | Convert external reports into Skill structures |
| Retention and approval | `references/retention-approval-protocol.md` | Data retention policy and human approval requirements |
| Approval record | `approval-record.schema.json` | Approval information for high-risk operations |
| Classification | `classification.schema.json` | Classify events and vulnerabilities: type, environment, severity, verification state |
| SLSA provenance | `slsa-provenance.schema.json` | Supply-chain and build trust information |
| Experiment run | `experiment-run.schema.json` | AI experiment records with safety assessment |
| Schema validation | `references/schema-validation-protocol.md` | Instance validation flow for all schemas |
| Checkpoint | `checkpoint.schema.json` | Case-scoped resumable state |
| Audit event | `audit-event.schema.json` | Hash-chained audit ledger entry |
| Evidence | `evidence.schema.json` | Deterministic evidence item |
| Finding | `finding.schema.json` | Defensive finding with verification state |
| Case manifest | `case-manifest.schema.json` | Case scope and limits |
| Case report | `case-report.schema.json` | Canonical report |
| Experiment definition | `experiment.schema.json` | Experiment plan |

## 5. Output And Chat Discipline

Chat is used only for:

- Reporting the current stage.
- Listing modified files and the reason, without dumping entire file contents.
- Listing open-source solutions compared and the selection rationale.
- Reporting real results of compilation, testing, running, audit, and regression.
- Stating unverified parts and blocking conditions.
- Flagging actions that need human approval.

Prohibited in chat:

- Long code dumps.
- Fabricating tool output, audit results, or open-source project behavior.
- Infinite analysis and unrelated explanation.

Every task ends with:

1. Current status: success, partial, failed, or blocked.
2. Tool and step categories executed.
3. Schema record IDs or counts written or updated.
4. Impact on project stability, security, and maintainability.
5. Follow-up actions required from the user or a human reviewer.