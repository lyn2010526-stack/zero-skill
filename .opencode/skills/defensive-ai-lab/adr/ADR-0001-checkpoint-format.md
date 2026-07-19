- Status: accepted
- Date: 2026-07-19
- Deciders: Defensive AI Lab maintainers
- Related sources: SRC-001, SRC-002, SRC-003
- License impact: none

## Context

The Skill needs persistent task state so long-running local reviews and AI experiments can resume after interruption without losing evidence integrity.

## Decision

Adopt a single-file JSON checkpoint per case, written atomically, with a monotonic revision, manifest hash, workspace fingerprint, and artifact hash map. Do not adopt any external red-team agent persistence format directly. Use the conceptual model of LangGraph checkpointing (SRC-003) as a protocol reference only.

## Defensive Boundary

No source code from offensive agent frameworks is copied. No checkpoint field stores credentials, prompts containing sensitive data, raw tool output, hidden reasoning, or reversible redaction maps. Checkpoints never reference external targets.

## Consequences

Positive: deterministic resume, audit-friendly, no external dependencies.
Negative: single-file concurrency requires write serialization.
Compliance: checkpoint schema enforces local-only state.

## Compliance Check

Confirmed against `references/safety-policy.md`. No external target access, no credential persistence, no third-party agent execution.
