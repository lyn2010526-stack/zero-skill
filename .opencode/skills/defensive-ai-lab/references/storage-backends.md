# Storage Backend Abstraction

## Interface

The Skill treats storage as an abstract backend with a stable interface. Concrete backends are pluggable. The default backend is single-file JSON per case.

### CheckpointBackend

```text
load(case_id) -> checkpoint_dict
save(case_id, checkpoint_dict) -> revision
list_cases(workspace_fingerprint) -> [case_id]
lock(case_id) -> lock_token
unlock(lock_token) -> bool
```

### EvidenceBackend

```text
add(case_id, evidence_dict) -> evidence_id
get(case_id, evidence_id) -> evidence_dict
list(case_id) -> [evidence_dict]
search(case_id, filters) -> [evidence_dict]
```

### AuditBackend

```text
append(case_id, event_dict) -> sequence
read(case_id) -> [event_dict]
verify(case_id) -> chain_valid
```

### KnowledgeBackend

```text
promote(chunk_dict) -> chunk_id
retrieve(query_dict) -> [chunk_dict]
quarantine(chunk_id) -> bool
reindex(workspace_fingerprint) -> stats
```

## Backend Selection

| Backend | Use case | Concurrency | Persistence |
| --- | --- | --- | --- |
| json-file | default, single process | serialized | filesystem |
| sqlite | larger cases, indexed retrieval | serialized write, concurrent read | filesystem |
| memory | ephemeral experiments | in-process | none |
| external | prohibited without explicit ADR and human approval | n/a | n/a |

External backends require ADR-NNNN documenting:

- Data location and residency.
- Encryption at rest and in transit.
- Network policy (loopback only by default).
- Retention and deletion controls.
- Access control and audit integration.
- Boundary review confirming no offensive capability is enabled.

## Concurrency Rules

- One writer per case.
- Reads are non-blocking and may serve stale snapshots with a revision label.
- Writers acquire a lock token. Stale tokens are rejected.
- Atomic writes use a temporary sibling file followed by `replace`.

## Integrity Rules

- Every persisted blob has a SHA-256.
- Every backend record includes a schema version.
- Every backend mutation appends an audit event.
- Every backend returns provenance on read.

## Prohibited Backends

- Backends that require network access to offensive services.
- Backends that store credentials in plaintext.
- Backends that bypass the audit ledger.
- Backends that mix case namespaces.

## Migration

Migration between backends is a deterministic, audited operation. A migration:

1. Reads all records from the source.
2. Validates each against its schema.
3. Writes to the destination with the same hashes.
4. Verifies the destination hashes match.
5. Records the migration as an audit event.
6. Archives the source backend without deleting it.

## Testing

Every backend implementation must pass:

- Round-trip load and save.
- Hash integrity after write.
- Audit chain validity after append.
- Concurrent read during write returns a consistent snapshot.
- Corruption detection returns a clear error.
