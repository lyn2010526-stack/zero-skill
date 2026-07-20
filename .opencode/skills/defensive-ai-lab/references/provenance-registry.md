# Provenance And Sources Registry

## Purpose

Record every external idea, design, library, or dataset that informed this Skill so future contributors can reproduce, audit, and relicense the work. This file is a research registry only. It records metadata and adoption decisions. It never copies executable attack logic, payloads, scanner templates, or exploitation code.

## Registry Entry Fields

Each entry includes:

- `id`: stable identifier such as `SRC-001`.
- `name`: project or document name.
- `version`: pinned release, commit, or document revision.
- `license`: SPDX identifier or `proprietary` with documented review status.
- `role`: `architecture-reference`, `protocol-reference`, `tool-wrapper`, `dataset`, `documentation`, `test-fixture`.
- `adoption`: `adopted`, `adapted-defensively`, `research-only`, `rejected`.
- `safety_class`: `defensive`, `dual-use`, `offensive`.
- `offensive_components_excluded`: explicit list when `safety_class` is not `defensive`.
- `locator`: immutable URL, commit, or DOI.
- `hash`: SHA-256 of the reviewed artifact when applicable.
- `notes`: concise adoption or rejection rationale.

## Adoption Rules

1. Adopt only the defensive, non-offensive portions of a source.
2. Reject sources whose core value is automated scanning, exploitation, credential attacks, authorization bypass, traffic forwarding, or third-party agent execution.
3. Adapt dual-use sources by extracting architectural ideas such as state machines, checkpoint formats, and audit ledgers, while excluding attack logic.
4. Pin versions and record hashes so later changes can be re-reviewed.
5. Update this registry before promoting any external idea into curated knowledge.
6. Track license compatibility with the Skill license. Flag incompatible licenses for human review.

## Research-Only Sources

The following projects were reviewed as architecture references only. Their attack, scanning, and exploitation components are explicitly excluded. They are recorded here to credit ideas and to prevent silent reintroduction of excluded logic.

| ID | Name | Role | Safety | Excluded components |
| --- | --- | --- | --- | --- |
| SRC-001 | PentAGI | architecture-reference | dual-use | autonomous red-team agents, live scanning, exploitation workflows |
| SRC-002 | Strix | architecture-reference | dual-use | live target scanning, credential use, offensive orchestration |
| SRC-003 | LangGraph | protocol-reference | defensive | none; only checkpoint and state-graph concepts adopted |
| SRC-004 | Promptfoo | protocol-reference | defensive | none; assertion and schema validation concepts adopted |
| SRC-005 | Pentest Agent Suite | architecture-reference | dual-use | code execution isolation for offensive scripts; only sandbox boundary concepts adapted |
| SRC-006 | Katana | research-only | offensive | crawling and attack-surface discovery against external targets |
| SRC-007 | fscan | research-only | offensive | port scanning, admin path discovery, weak password probing |
| SRC-008 | subDomainsBrute | research-only | offensive | subdomain enumeration against external targets |
| SRC-009 | IDOR_detect_tool | research-only | offensive | live request replay and identifier substitution |
| SRC-010 | Nuclei | research-only | offensive | template-based vulnerability scanning against live hosts |
| SRC-011 | Autorize | research-only | offensive | multi-account live authorization testing |
| SRC-012 | MonkeyCode | research-only | offensive | backend code analysis for exploitation |
| SRC-013 | MobSF | research-only | offensive | APK key and token extraction for offensive use |
| SRC-014 | AutoHunt-Bounty | research-only | offensive | bounty-platform red-team automation |

Adoption decisions are recorded individually under `.opencode/skills/defensive-ai-lab/adr/`.

## License Inventory

Maintain a per-file license inventory at `licenses/INVENTORY.md`. Each tracked Skill file declares its license in frontmatter or in the inventory. Third-party excerpts carry their original SPDX identifier and a review note when adapted.

## Review Cadence

Re-review a source when:

- The pinned version changes.
- The source adds offensive capabilities that were previously absent.
- The Skill license changes.
- A security review requests reprovenance.

Record the re-review as a new registry entry or as an ADR superseding the prior decision.
