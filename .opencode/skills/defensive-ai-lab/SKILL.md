---
name: defensive-ai-lab
description: Defensive AI experiments, evidence-based local code security reviews, authorization regression tests, isolated execution planning, and auditable reports. Local-only; no scanning/exploitation/credential attacks.
compatibility: OpenCode, Operit AI
metadata:
  category: defensive-security
  safety: local-only
---

# Defensive AI Lab

Run one evidence-driven workflow combining safe AI experiments and defensive review of user-owned code. Treat every run as an isolated case.

## Hard Boundary

- Workspace files only. No live service probing, scanning, exploitation, credential attacks, or bypass attempts.
- Synthetic/mock data only for auth regression. No real credentials or live identifiers.

## Workflow Router

| Need | Reference |
|------|-----------|
| Safety rules | `references/safety-policy.md` |
| Core workflow pipeline | `references/unified-workflow.md` |
| Protocols & evidence gate | `references/protocols.md` |
| Evidence trust & corroboration | `references/evidence-protocol.md` |

Determine workflow type (`ai_experiment`, `local_security_review`, `authorization_regression`, `evidence_report`, `mixed`), create case UUID under `.defensive-ai-lab/cases/<id>/` only when persisting, execute with evidence gate.

## Tooling

```bash
python3 scripts/labctl.py init --workflow <type> --scope <path> --output markdown --output json
python3 scripts/labctl.py audit --case <dir> --event <name> --metadata '<json>'
python3 scripts/labctl.py checkpoint --case <dir> --completed <step> --pending <step>
python3 scripts/labctl.py validate --case <dir>
python3 scripts/labctl.py render --case <dir>
```

## Evidence Gate (required)

Five conditions for `confirmed` findings:
1. Evidence from local tool/test/source/user artifact.
2. Stable locator (file:line, test name, hash, finding ID).
3. Reproduction against local code or loopback mock.
4. Result matches security invariant.
5. Conflicts resolved or recorded.

States: `confirmed`, `supported`, `unverified`, `rejected`. Model text is never evidence.

## Redaction

Redact tokens, cookies, passwords, personal identifiers before persistence. Use stable placeholders like `[REDACTED_TOKEN_1]`.

## Reports

Markdown + JSON (per `schemas/case-report.schema.json`). Required sections: scope, exclusions, environment, methods, evidence index, conflicts, limitations, findings by state, remediation, validation results, artifact hashes. Separate facts from interpretations.
