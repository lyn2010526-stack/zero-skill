# Reporting Protocol

## Case Layout

```text
.defensive-ai-lab/cases/<case_id>/
  manifest.json
  checkpoint.json
  audit.jsonl
  evidence.json
  findings.json
  report.json
  report.md
  artifacts/
```

Every artifact name is stable and every content file receives a SHA-256 digest in checkpoint or evidence metadata.

## Fact Separation

Reports separate:

- Observations: directly supported by evidence.
- Interpretations: reasoned impact and severity with assumptions.
- Recommendations: proposed defensive changes.
- Generated content: model-produced text awaiting deterministic or human review.

## Required Sections

Include case identity, scope, exclusions, environment, repository revision, methods, execution limits, findings grouped by verification state, evidence index, conflicts, remediation, validation, AI experiment results when present, limitations, and artifact hashes.

## Quality Gates

- JSON parses and satisfies structural and semantic checks.
- Markdown derives from the validated JSON report.
- Finding and evidence IDs remain stable across formats.
- Confirmed totals exclude supported, unverified, and rejected findings.
- Sensitive values are redacted before hashing exported artifacts.
- Commands and model runs include bounded provenance.
- Empty sections explicitly state `None recorded`.

## Report Consumers

JSON is the canonical automation artifact. Markdown is a deterministic human-readable projection. Patches and tests are separate artifacts referenced by hash.
