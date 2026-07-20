# Data Retention And Human Approval Protocol

## Retention Classes

| Class | Default retention | Disposal |
| --- | --- | --- |
| raw model output | 7 days | archive then expire |
| redacted evidence | 90 days | archive then expire |
| confirmed findings | indefinite | user-controlled |
| curated knowledge | until superseded or expired | quarantine then archive |
| audit ledger | indefinite | never auto-delete |
| imported reports | 90 days | archive then expire |
| case checkpoints | 30 days after completion | archive then expire |
| temporary case directory | 7 days after completion | archive on user request |

Retention is advisory and configurable per case. Expiration removes an item from retrieval eligibility. Physical deletion is always a user-controlled repository operation.

## Lifecycle States

1. `active`: in use by an open case.
2. `archived`: closed case, retained for provenance.
3. `expired`: past retention, excluded from retrieval.
4. `quarantined`: flagged for review, excluded from retrieval.
5. `superseded`: replaced by a newer record, retained for history.

## Human Approval Gates

Require explicit user approval before:

- Promoting a `supported` finding to `confirmed` when evidence is indirect.
- Promoting any finding or pattern into curated knowledge.
- Applying a patch with broad security-sensitive behavior changes.
- Increasing resource limits beyond the `standard` profile.
- Persisting user-provided evidence that contains sensitive business data after redaction.
- Exporting a report that includes `unverified` findings as if they were `confirmed`.
- Migrating case data to a new storage backend.
- Disabling a safety check for a specific case.

## Approval Record

```json
{
  "approval_id": "AP-...",
  "case_id": "<uuid>",
  "request": "promote finding F-AUTH-1 to confirmed",
  "justification": "...",
  "requested_by": "agent",
  "approved_by": "user",
  "decided_at": "<date-time>",
  "decision": "approved | rejected",
  "conditions": ["..."],
  "audit_event": "claim_accepted | claim_rejected"
}
```

Approval records are append-only. A rejected approval prevents the action and records the reason.

## Quarantine Workflow

1. Flag a record as `quarantined` when malformed, conflicting, expired, or unverified.
2. Exclude it from retrieval.
3. Preserve it for review with provenance.
4. A human or deterministic revalidation may promote, demote, or archive it.
5. Record the decision as an audit event.

## Archival

Archival produces:

- A read-only snapshot of the case directory.
- A manifest of included files and hashes.
- A signature over the manifest hash.
- A retention expiration timestamp.

Archived snapshots are stored under `.defensive-ai-lab/archive/<case_id>/` and are never modified after creation.

## Reproducibility

A completed case must be reproducible from:

- The checkpoint.
- The evidence and findings files.
- The audit ledger.
- The manifest of artifact hashes.
- The report.

If any of these is missing or mismatched, the case is marked `blocked` and requires human review.
