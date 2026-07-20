# Schema Validation Protocol

## Validation Levels

1. **Syntax**: well-formed JSON.
2. **Structure**: matches the JSON Schema draft 2020-12.
3. **Semantic**: cross-field and cross-file integrity.
4. **Boundary**: safety policy conformance.
5. **Reproducibility**: artifact hashes match local files.

## Required Validations

| Artifact | Schema | Semantic checks |
| --- | --- | --- |
| manifest.json | case-manifest | network disabled or loopback; concurrency in range; scope local |
| checkpoint.json | checkpoint | manifest hash matches; artifact hashes match files; no step in both completed and pending |
| evidence.json | evidence | IDs unique; case_id matches; sha256 matches artifact; locator resolves |
| findings.json | finding | IDs unique; confirmed has evidence; evidence IDs resolve; conflicts resolve |
| audit.jsonl | audit-event | sequence monotonic; hash chain valid; case_id matches |
| report.json | case-report | evidence and findings match canonical sources; case_id matches |
| experiment.json | experiment | parameter grid non-empty; limits in range; rubric version present |
| experiment runs | experiment-run | run_id derived from canonical hash; metrics typed |
| knowledge chunks | knowledge-chunk | T0 reviewed; reviewed chunks have expiry |
| imports | sarif-import, sbom-import, test-result-import | input hash matches; locations workspace-relative |
| approvals | approval-record | decision matches audit event |
| classification | classification | CVSS score matches severity; CWE format valid |
| provenance | provenance-entry | dual-use and offensive sources list excluded components |
| slsa | slsa-provenance | subject digests match artifacts |

## Semantic Validation Rules

- Every evidence ID referenced by a finding exists in the same case.
- Every confirmed finding has at least one deterministic evidence source.
- Every artifact hash in checkpoint matches the current file content.
- Every audit event hash matches the recomputed canonical hash.
- Every report evidence and finding set matches the canonical files.
- Every imported report input hash matches the original file.
- Every promoted knowledge chunk has reviewed status and expiry.
- Every approval-required action has a corresponding approval record.
- Every SLSA subject digest matches the artifact digest.
- No secret pattern appears in persisted content after redaction.

## Validation Cadence

- Before every checkpoint write.
- Before every report render.
- Before every curated knowledge promotion.
- Before every case completion.
- On demand via `labctl.py validate`.

## Failure Handling

A validation failure:

1. Blocks the current transition.
2. Records a `case_blocked` audit event.
3. Preserves the last valid state.
4. Reports all errors, not just the first.
5. Requires human review or deterministic repair before retry.

## Schema Evolution

Schema changes:

1. Increment `schema_version`.
2. Add a migration function that reads the old version and writes the new.
3. Validate migrated records against the new schema.
4. Preserve provenance by recording the migration as an audit event.
5. Update the ADR that introduced the schema.

Old schema versions remain readable for archived cases.
