# Architecture Decision Records

## Format

Each ADR follows:

```markdown
# ADR-NNNN: Title

- Status: proposed | accepted | deprecated | superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: names or roles
- Related sources: SRC-XXX entries from provenance-registry.md
- License impact: SPDX identifier or none

## Context

Why this decision is needed.

## Decision

What was decided and why.

## Defensive Boundary

What was explicitly excluded and why.

## Consequences

Positive, negative, and neutral effects.

## Compliance Check

Confirmation that the decision respects the safety policy.
```

## Numbering

ADR numbers are monotonic and never reused. Superseded ADRs remain in place with a `superseded by` status and a pointer to the replacement.

## Required ADRs

Maintain an ADR for each of the following decisions:

1. Adoption of any external project as architecture or protocol reference.
2. Introduction of a new storage backend or memory namespace.
3. Changes to the evidence gate or verification states.
4. Changes to the sandbox policy defaults.
5. Changes to data retention or human approval gates.
6. Addition of a new report format or external schema import.

## Review Triggers

Re-open or supersede an ADR when:

- The referenced source version changes.
- A security review identifies a boundary gap.
- A new defensive alternative becomes available.
- The Skill license changes.

## Storage

ADR files live in `.opencode/skills/defensive-ai-lab/adr/`. They are version-controlled alongside the Skill.
