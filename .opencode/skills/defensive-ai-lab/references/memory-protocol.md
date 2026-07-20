# Memory Protocol

## Namespaces

Use a strict namespace tuple:

`workspace_fingerprint / case_id / artifact_class / artifact_id`

The case ID is mandatory for transient state, checkpoints, raw model output, evidence, and reports. Curated knowledge uses a separate reviewed namespace and retains source case IDs as provenance.

## Checkpoint Content

Checkpoint files contain workflow state, manifest hash, workspace fingerprint, completed and pending step IDs, artifact hash map, evidence IDs, claim IDs, update timestamp, and monotonically increasing revision.

Checkpoint files exclude prompts containing sensitive data, raw tool output, credentials, hidden reasoning, and reversible redaction maps.

## Promotion Gate

Promote an item to curated knowledge only when:

1. Its source is a confirmed finding, passing regression test, reviewed prompt experiment, or environment-independent fix.
2. Provenance resolves to immutable artifact hashes.
3. Sensitive values and target-specific identifiers are absent.
4. A reviewer status and expiration date exist.
5. A contradiction search found no unresolved conflict.

## Retrieval Gate

Retrieve by workspace, task type, language or framework, defensive control, and reviewed status. Apply a maximum result count and minimum confidence. Returned memory is advisory context and carries provenance into generated claims.

## Contamination Controls

- Tag source class as `user`, `tool`, `test`, `model`, or `curated`.
- Store raw model output only in the case namespace.
- Quarantine malformed, conflicting, unverified, or expired records.
- Revalidate promoted knowledge when its source artifact or relevant dependency changes.
- Keep case reset operations archival: close the case and start a new UUID while preserving audit integrity.

## Retention

Set retention independently for raw outputs, redacted evidence, reports, audit logs, and curated knowledge. Use explicit timestamps. Expiration removes an item from retrieval eligibility; physical deletion remains a user-controlled repository operation.
