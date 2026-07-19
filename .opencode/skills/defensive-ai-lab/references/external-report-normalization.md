# External Report Normalization Protocol

## Supported Inputs

The Skill imports user-supplied security and test artifacts in their original format, parses them deterministically, and stores a normalized representation. It never contacts the original target, replays requests, or re-runs scanners.

| Input | Source class | Normalized schema |
| --- | --- | --- |
| SARIF 2.1.0 | user_artifact | `schemas/sarif-import.schema.json` |
| CycloneDX SBOM | user_artifact | `schemas/sbom-import.schema.json` |
| SPDX SBOM | user_artifact | `schemas/sbom-import.schema.json` |
| Syft SBOM | user_artifact | `schemas/sbom-import.schema.json` |
| JUnit XML | user_artifact | `schemas/test-result-import.schema.json` |
| pytest JSON report | user_artifact | `schemas/test-result-import.schema.json` |
| Vitest or Jest JSON | user_artifact | `schemas/test-result-import.schema.json` |
| Go test JSON | user_artifact | `schemas/test-result-import.schema.json` |

## Import Workflow

1. Receive an immutable file path from the user.
2. Compute the input SHA-256 and record it.
3. Detect format by content and extension, not by trusting embedded claims.
4. Parse with a defensive parser. Reject malformed input with a clear error.
5. Redact secrets and personal data from messages and snippets.
6. Normalize into the target schema, preserving original rule IDs, test names, and locations.
7. Hash redacted snippets and failure messages for stable evidence locators.
8. Write the normalized artifact into the case directory.
9. Update the checkpoint artifact map.
10. Append an audit event with tool name, version, and input hash.

## Mapping Rules

### Severity Mapping

| Source level | Lab severity |
| --- | --- |
| SARIF error | high |
| SARIF warning | medium |
| SARIF note | low |
| SARIF none | informational |
| Test failure | high when security-relevant, otherwise low |
| SBOM component with known vulnerable license | medium |
| SBOM component with excluded scope | informational |

### Classification Mapping

- SARIF rule IDs and CWE fields map to the findings `classification` field.
- SBOM component names and ecosystems map to dependency findings.
- Test names map to regression evidence locators.

## Trust Rules

- Imported results are `user_artifact` evidence.
- They can corroborate a claim.
- They cannot independently confirm a finding without a local regression test or source trace.
- The original scanner is recorded as provenance, not as an executed tool.
- Re-running the scanner against a live target is prohibited.

## Conflict Handling

When an imported report conflicts with local analysis:

1. Preserve both evidence items.
2. Compare workspace revision, scanner version, and timestamp.
3. Prefer the most recent deterministic local result.
4. Downgrade to `unverified` if the conflict cannot be resolved.
5. Record the conflict in the report.

## Output

Normalized imports are stored as:

```text
.defensive-ai-lab/cases/<case_id>/artifacts/imports/<format>-<input_sha256>.json
```

The path is stable and hash-addressed so the same input always produces the same artifact.
