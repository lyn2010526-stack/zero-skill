# Restricted Execution Policy

## Preflight

Before executing generated or unfamiliar code:

1. State the exact purpose and expected artifacts.
2. Resolve the executable from an existing project command or known system tool.
3. Inspect arguments for destructive file operations, privilege changes, external network access, credential access, persistence, process control, and unbounded workloads.
4. Define working directory, read paths, write paths, environment allowlist, timeout, concurrency, and maximum input size.
5. Reject execution when isolation guarantees are unavailable for the requested behavior.

## Denied Behaviors

- File deletion, disk formatting, device access, mount operations, or system configuration changes.
- Privilege escalation, user management, service persistence, scheduled tasks, or startup modification.
- Reading secret stores, browser profiles, application-private directories, shell credential files, or unrestricted environment variables.
- External network access, packet generation, scanning, traffic interception, tunneling, or proxying.
- Fork bombs, infinite loops, unrestricted recursion, high concurrency, or unbounded file traversal.
- Dynamic download and execution, package installation initiated by generated code, or third-party agent startup.

## Default Limits

| Resource | Low | Standard |
| --- | ---: | ---: |
| Wall time per command | 30 seconds | 120 seconds |
| Concurrency | 1 | 2 |
| Generated output | 1 MiB | 5 MiB |
| Input files per batch | 20 | 100 |
| Network | Disabled | Disabled |

Project test suites with established longer runtimes may use a documented custom timeout.

## Logging

Log command identity, redacted arguments, working directory, start and end timestamps, exit code, timeout state, and output artifact hash. Store bounded excerpts after redaction. Never log complete environment snapshots.

## Safe Rewrite

When a command violates policy, rewrite the task toward one of these forms:

- Parse a saved report instead of contacting a target.
- Run a unit test against an in-memory fixture.
- Use a loopback mock with synthetic identities.
- Inspect source and configuration statically.
- Produce a patch for human review without executing generated code.
