# Evidence Protocol

## Claim Construction

Write each finding as one falsifiable claim. Include the affected defensive invariant, local source location, preconditions, observed behavior, expected behavior, evidence IDs, conflicts, and limitations.

## Corroboration

Confirmation requires deterministic local evidence. Prefer two independent evidence classes for high and critical severity, such as source data flow plus a failing regression test. User artifacts can corroborate impact while local code or tests establish the remediation target.

## Conflict Resolution

1. Preserve every conflicting evidence item.
2. Compare workspace revision, fixture, configuration, tool version, timestamp, and execution result.
3. Repeat the smallest deterministic local test once when instability is plausible.
4. Downgrade the claim to `unverified` when conflict remains.
5. Record the unresolved conflict in the final report.

## Confidence

Confidence is descriptive and separate from severity:

- `high`: deterministic reproduction and source trace agree.
- `medium`: strong source trace or deterministic test exists with a documented gap.
- `low`: incomplete or indirect evidence.

Model agreement never raises confidence by itself.

## Severity

Assign severity from demonstrated local impact, reachable preconditions, affected data or operation, and existing controls. Use `informational` for defense-in-depth improvements. Document every assumption that influences severity.

## Anti-Hallucination Assertions

- Every evidence ID exists exactly once.
- Every evidence item belongs to the current case.
- Every artifact-backed hash matches its local file.
- Every `confirmed` claim has deterministic evidence and validation text.
- Every source locator resolves to a workspace file or user-artifact identifier.
- Rejected and unverified claims remain outside confirmed totals.
- Generated advice carries no evidence status.
