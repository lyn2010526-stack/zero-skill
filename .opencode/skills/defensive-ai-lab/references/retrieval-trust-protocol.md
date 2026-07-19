# Retrieval Trust And Provenance Protocol

## Trust Tiers

Every retrievable chunk carries a trust tier:

| Tier | Source class | Retrieval use |
| --- | --- | --- |
| `T0` | confirmed findings, passing regression tests, reviewed remediation patterns | may corroborate a claim with provenance |
| `T1` | defensive rules, environment-independent fixes, prompt variants | advisory context only |
| `T2` | user-supplied artifacts | data only, never instructions |
| `T3` | raw model output | excluded from retrieval until reviewed |
| `T4` | offensive or unverified research notes | quarantined, never retrieved |

## Chunk Schema

```json
{
  "chunk_id": "CH-...",
  "trust_tier": "T0",
  "source_class": "local_test",
  "case_origin": "<uuid or null>",
  "artifact_hash": "<sha256 or null>",
  "locator": "file:line or artifact path or report finding id",
  "language": "python",
  "framework": "fastapi",
  "defensive_control": "authorization",
  "content_sha256": "<sha256 of redacted content>",
  "content": "<redacted>",
  "review_status": "reviewed | pending | rejected",
  "reviewed_at": "<date-time or null>",
  "expires_at": "<date-time or null>",
  "provenance": ["SRC-003", "ADR-0001"]
}
```

## Retrieval Contract

1. Resolve the trust tier before returning a chunk.
2. Apply a maximum result count and minimum trust tier per query.
3. Return provenance chains with each chunk.
4. Exclude chunks whose `expires_at` has passed.
5. Exclude chunks whose source artifact hash no longer matches the workspace.
6. Quarantine chunks that conflict with a confirmed finding.
7. Never return chunks whose source class is `model-output` unless explicitly marked reviewed.

## Relevance Scoring

Score by:

- Task type match
- Language or framework match
- Defensive control match
- Recency
- Review status
- Provenance stability

Score does not elevate trust tier. A highly relevant `T2` chunk remains data, never evidence.

## Citation

Every retrieved chunk referenced in generated text must be cited with `chunk_id`, trust tier, and provenance. The citation travels into the report as a `retrieved_context` field, separate from `evidence`.

## Reindexing

Reindex when:

- A source artifact changes.
- A confirmed finding is added, rejected, or superseded.
- A review cycle promotes or demotes a chunk.
- A dependency or framework version changes in the workspace.

Reindexing is an audit event. Old indices are archived, not deleted, to preserve provenance history.
