- Status: accepted
- Date: 2026-07-19
- Deciders: Defensive AI Lab maintainers
- Related sources: SRC-006 through SRC-014
- License impact: none

## Context

The original integration request listed offensive security tools as directly reusable sources. The platform safety policy prohibits automated scanning, exploitation, credential attacks, authorization bypass, traffic forwarding, and third-party agent execution.

## Decision

Record all offensive sources as `research-only` in `references/provenance-registry.md`. Do not copy their code, payloads, templates, or orchestration logic. Replace each offensive capability with a defensive alternative.

Mapping:

| Offensive source | Excluded capability | Defensive alternative in this Skill |
| --- | --- | --- |
| Katana | external crawling | workspace route inventory parsing |
| fscan | port and weak password probing | project-native dependency audit and config review |
| subDomainsBrute | subdomain enumeration | local asset manifest parsing |
| IDOR_detect_tool | live request replay | local authorization regression matrix with synthetic principals |
| Nuclei | live vulnerability scanning | offline parsing of user-supplied scanner reports |
| Autorize | live multi-account authorization testing | loopback mock authorization regression tests |
| MobSF | APK key extraction for offensive use | user-supplied APK analysis report parsing |
| PentAGI | autonomous red-team agents | state machine with human gates |
| AutoHunt-Bounty | bounty automation | evidence-only report export |

## Defensive Boundary

No executable attack logic is included. Sources are credited for architecture ideas only.

## Consequences

Positive: clear audit trail for excluded capabilities.
Negative: requires manual construction of defensive equivalents.
Compliance: aligns with `references/safety-policy.md`.

## Compliance Check

Confirmed. No offensive capability is reintroduced through code, prompt, or memory.
