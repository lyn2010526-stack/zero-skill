# Agent Closed Loop Protocol

## Principle

Tools always take priority. Never solve through chat what a tool can solve. The Skill must follow:

> Search -> Analyze -> Design -> Code -> Compile -> Install -> Run -> Logcat or logs -> Test -> Fix -> Re-verify.

## Prohibited

- Using chat to complete a task that a tool can complete.
- Outputting long code or entire file contents in chat.
- Using static analysis as a substitute for real compilation and execution.

## Preferred Tools

| Domain | Tools |
| --- | --- |
| Source and project | git, read_file, edit_file, search, grep, find |
| Build | gradlew, build scripts, CI |
| Run and logs | adb, logcat, terminal |
| Reverse engineering and debugging | apktool, jadx, aapt, zipalign, apksigner, sqlite |
| Automated testing | unit tests, instrumentation tests, security regression tests |
| Defensive analysis | project-native SAST, dependency audit, supplied report parsing |

## Architecture References

The closed loop is informed by mature multi-step agent architectures. The following sources are recorded as architecture references only. Their offensive components are excluded.

- PentAGI: multi-agent task decomposition, tool orchestration, checkpoint isolation, and case-scoped memory. See `references/provenance-registry.md` SRC-001.
- Strix: structured reporting in SARIF and Markdown, isolated execution, multi-step verification flow. See `references/provenance-registry.md` SRC-002.

Adopted concepts:

- Task decomposition into bounded steps with declared inputs and outputs.
- Per-case checkpoint isolation.
- Structured SARIF and Markdown report output.
- Sandboxed execution with redaction and resource limits.

Excluded concepts:

- Live target scanning, exploitation, credential use, and authorization bypass.
- Autonomous red-team agents that contact external targets.
- Any replay of captured credentials or tokens.

## Tool Failure Handling

When a tool execution fails:

1. Read the error output immediately.
2. Try an equivalent alternative tool.
3. Reset the sandbox environment if needed, never the user environment.
4. Never let one tool failure stop the entire flow.

## Defensive Boundary

The closed loop operates on:

- Workspace source code.
- Local builds, tests, and fixtures.
- Loopback mock services with synthetic identities.
- User-supplied reports, logs, and request samples parsed offline.

It never operates on:

- External targets.
- Live services the user does not own.
- Captured credentials replayed against live systems.
- Network scanners or exploit tools against live hosts.

Requests for live offensive operations are converted to local defensive equivalents according to `references/safety-policy.md` and `references/external-report-normalization.md`.