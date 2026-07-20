# Orchestration Protocol

## State Machine

Every case follows these states:

1. `created`: manifest exists and scope is unreviewed.
2. `scoped`: local-only boundary has passed.
3. `planned`: steps, dependencies, limits, and stop conditions are recorded.
4. `running`: one bounded step is active.
5. `paused`: checkpoint is valid and no command is active.
6. `validating`: evidence and output integrity checks are running.
7. `completed`: requested artifacts exist and validation passes.
8. `blocked`: policy, missing input, unavailable isolation, or deterministic failure prevents progress.

State transitions are append-only audit events. A resumed case starts from the last valid checkpoint and recomputes pending steps from completed IDs.

## Step Contract

Each step declares:

- Stable step ID and purpose.
- Inputs by artifact ID and hash.
- Outputs by path, media type, and expected schema.
- Allowed commands or model aliases.
- Network profile, timeout, concurrency, and size limits.
- Preconditions and postconditions.
- Retry class and maximum attempts.
- Evidence produced and redaction requirements.

Run one state-mutating step at a time. Independent read-only analysis may run concurrently within the manifest limit.

## Retry Policy

- Syntax or validation failures: repair once from the deterministic error.
- Local test instability: retry once, then classify as unstable and preserve both results.
- Provider throttling or transient 5xx: exponential backoff with jitter within the declared retry and cost budget.
- Authentication, authorization, balance, or configuration errors: pause and request user-controlled configuration.
- Policy boundary or isolation failure: block immediately.

Never change provider, endpoint, scope, security posture, or evidence standard during an automatic retry.

## Failure Isolation

Write each step output to a temporary sibling file, verify it, then atomically replace the destination. Preserve the previous valid checkpoint. A failed step records bounded redacted diagnostics and leaves unrelated artifacts unchanged.

## Human Gates

Require explicit user approval before:

- Applying a security-sensitive patch with broad behavior changes.
- Increasing resource limits beyond the standard profile.
- Persisting user-provided evidence containing sensitive business data after redaction.
- Promoting a `supported` finding into curated knowledge.
