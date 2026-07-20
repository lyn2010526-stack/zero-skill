# Safety Policy

## Allowed Operations

- Review source code in the current workspace for defensive remediation.
- Run existing project lint, test, type-check, dependency-audit, and static-analysis scripts with bounded execution.
- Add local tests that use synthetic data, test clients, fixtures, and loopback mock services.
- Parse reports and request/response samples supplied by the user without replaying them.
- Generate secure coding recommendations, patches, regression tests, and evidence-based reports.
- Run bounded AI prompt and parameter experiments with user-configured project credentials.

## Prohibited Operations

- Port scans, service fingerprinting, directory discovery, subdomain enumeration, or attack-surface crawling.
- Vulnerability scanning against a live host, including template-based scanners.
- Exploitation, proof-of-concept delivery, payload generation, SQL injection, XSS, command injection, path traversal, or deserialization attacks.
- ID mutation or request replay against live APIs to test horizontal or vertical authorization.
- Password attacks, default-credential checks, credential stuffing, token guessing, or account takeover workflows.
- WAF, CAPTCHA, bot-control, rate-limit, authentication, or authorization evasion.
- Proxy rotation, reverse proxies for target access, tunneling, relays, or traffic forwarding.
- DoS, stress tests, high-volume traffic, or resource-exhaustion tests.
- Installation or execution of third-party autonomous agents or offensive security suites.
- Collection of secrets, private data, authentication material, or environment-provided LLM credentials.

## Decision Rules

1. Confirm ownership and authorization context for report wording, while retaining local-only execution boundaries.
2. Convert live-test requests into local fixture tests or code-level remediation review.
3. Convert scanner-output requests into offline parsing of user-provided reports.
4. Convert exploit requests into secure regression tests that assert the protected behavior.
5. Stop immediately when a planned command can contact an external target or alter access controls.
6. Preserve a concise audit event describing the boundary decision without sensitive request content.

## Evidence Trust Order

From strongest to weakest:

1. Passing or failing deterministic local regression test.
2. Direct source location with verified reachable control flow.
3. Existing project-native analyzer output with version and artifact hash.
4. User-supplied immutable evidence with provenance and hash.
5. Curated defensive knowledge with reviewed provenance.
6. Model inference.

Only levels 1 through 4 can confirm a finding. Level 5 supports interpretation. Level 6 creates an investigation lead.
