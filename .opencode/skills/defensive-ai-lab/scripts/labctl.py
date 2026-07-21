#!/usr/bin/env python3
"""Deterministic local case manager for Defensive AI Lab."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SCHEMA_VERSION = "1.0"
WORKFLOWS = {
    "ai_experiment",
    "local_security_review",
    "authorization_regression",
    "evidence_report",
    "mixed",
}
EVENTS = {
    "case_created",
    "scope_checked",
    "plan_written",
    "tool_started",
    "tool_finished",
    "claim_accepted",
    "claim_rejected",
    "artifact_redacted",
    "checkpoint_written",
    "report_exported",
    "case_blocked",
    "case_completed",
}
STATES = {
    "created",
    "scoped",
    "planned",
    "running",
    "paused",
    "validating",
    "completed",
    "blocked",
}
DETERMINISTIC_SOURCES = {"local_test", "source_code", "project_tool", "user_artifact"}
SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
STEP_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
SECRET_PATTERNS = [
    (re.compile(r"(?i)(authorization\s*[:=]\s*bearer\s+)[^\s,;]+"), r"\1[REDACTED_TOKEN]"),
    (re.compile(r"(?i)((?:api[_-]?key|token|password|secret|cookie|session[_-]?id)\s*[:=]\s*)[^\s,;]+"), r"\1[REDACTED_SECRET]"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.DOTALL), "[REDACTED_PRIVATE_KEY]"),
    (re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b"), "[REDACTED_EMAIL]"),
    (re.compile(r"(?<![\w-])(?:\+\d{8,15}|1[3-9]\d{9})(?![\w-])"), "[REDACTED_PHONE]"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent, text=True)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def write_json(path: Path, value: Any) -> None:
    atomic_write(path, json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


def redact_text(value: str) -> str:
    redacted = value
    for pattern, replacement in SECRET_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted


def redact_value(value: Any) -> Any:
    if isinstance(value, str):
        return redact_text(value)
    if isinstance(value, list):
        return [redact_value(item) for item in value]
    if isinstance(value, dict):
        output = {}
        for key, item in value.items():
            if re.search(r"(?i)(api[_-]?key|token|password|secret|cookie|session)", str(key)):
                output[key] = "[REDACTED_SECRET]"
            else:
                output[key] = redact_value(item)
        return output
    return value


def workspace_fingerprint(workspace: Path) -> str:
    marker = workspace.resolve().as_posix().encode("utf-8")
    git_head = workspace / ".git" / "HEAD"
    if git_head.is_file():
        marker += b"\0" + git_head.read_bytes().strip()
    return f"sha256:{sha256_bytes(marker)}"


def require_case(case_dir: Path) -> dict[str, Any]:
    manifest_path = case_dir / "manifest.json"
    if not manifest_path.is_file():
        raise ValueError(f"case manifest missing: {manifest_path}")
    manifest = read_json(manifest_path)
    uuid.UUID(manifest["case_id"])
    return manifest


def append_audit(case_dir: Path, event: str, metadata: dict[str, Any]) -> dict[str, Any]:
    if event not in EVENTS:
        raise ValueError(f"unsupported event: {event}")
    manifest = require_case(case_dir)
    audit_path = case_dir / "audit.jsonl"
    records = load_audit(audit_path)
    previous_hash = records[-1]["event_hash"] if records else None
    record = {
        "schema_version": SCHEMA_VERSION,
        "sequence": len(records) + 1,
        "case_id": manifest["case_id"],
        "timestamp": utc_now(),
        "event": event,
        "metadata": redact_value(metadata),
        "previous_hash": previous_hash,
    }
    record["event_hash"] = sha256_bytes(canonical_bytes(record))
    line = json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n"
    with audit_path.open("a", encoding="utf-8") as handle:
        handle.write(line)
        handle.flush()
        os.fsync(handle.fileno())
    return record


def load_audit(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    records = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if line.strip():
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError as error:
                    raise ValueError(f"invalid audit JSON at line {line_number}: {error}") from error
    return records


def validate_audit(case_id: str, records: list[dict[str, Any]]) -> list[str]:
    errors = []
    previous_hash = None
    for index, record in enumerate(records, start=1):
        if record.get("sequence") != index:
            errors.append(f"audit sequence mismatch at record {index}")
        if record.get("case_id") != case_id:
            errors.append(f"audit case mismatch at record {index}")
        if record.get("event") not in EVENTS:
            errors.append(f"audit event unsupported at record {index}")
        if record.get("previous_hash") != previous_hash:
            errors.append(f"audit previous hash mismatch at record {index}")
        supplied_hash = record.get("event_hash")
        unhashed = {key: value for key, value in record.items() if key != "event_hash"}
        expected_hash = sha256_bytes(canonical_bytes(unhashed))
        if supplied_hash != expected_hash:
            errors.append(f"audit event hash mismatch at record {index}")
        previous_hash = supplied_hash
    return errors


def command_init(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace).resolve()
    if args.workflow not in WORKFLOWS:
        raise ValueError(f"unsupported workflow: {args.workflow}")
    case_id = str(uuid.uuid4())
    root = Path(args.root)
    if not root.is_absolute():
        root = workspace / root
    case_dir = root / case_id
    case_dir.mkdir(parents=True, exist_ok=False)
    (case_dir / "artifacts").mkdir()
    exclusions = [
        "external network reconnaissance or scanning",
        "exploitation, credential attacks, or authorization bypass",
        "traffic tunneling, proxy rotation, or third-party agent execution",
    ]
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "case_id": case_id,
        "workflow": args.workflow,
        "created_at": utc_now(),
        "workspace_fingerprint": workspace_fingerprint(workspace),
        "scope": {
            "allowed_sources": args.scope or ["."],
            "excluded_operations": exclusions,
        },
        "limits": {
            "profile": args.profile,
            "network": "loopback-only" if args.loopback else "disabled",
            "concurrency": args.concurrency,
            "timeout_seconds": args.timeout,
        },
        "requested_outputs": args.output or ["markdown", "json"],
    }
    write_json(case_dir / "manifest.json", manifest)
    write_json(case_dir / "evidence.json", [])
    write_json(case_dir / "findings.json", [])
    report = {
        "schema_version": SCHEMA_VERSION,
        "case_id": case_id,
        "generated_at": utc_now(),
        "scope": manifest["scope"]["allowed_sources"],
        "exclusions": exclusions,
        "methods": ["Pending execution"],
        "evidence": [],
        "findings": [],
        "conflicts": [],
        "limitations": ["Case initialized; analysis has not run"],
        "validation": {"commands": [], "passed": False, "notes": "Pending validation"},
    }
    write_json(case_dir / "report.json", report)
    checkpoint = {
        "schema_version": SCHEMA_VERSION,
        "case_id": case_id,
        "revision": 1,
        "state": "created",
        "manifest_sha256": sha256_file(case_dir / "manifest.json"),
        "completed_steps": [],
        "pending_steps": [],
        "artifacts": {},
        "evidence_ids": [],
        "claim_ids": [],
        "updated_at": utc_now(),
    }
    write_json(case_dir / "checkpoint.json", checkpoint)
    if getattr(args, "backend", "json") == "sqlite":
        from storage_sqlite import SQLiteBackend
        backend = SQLiteBackend(case_dir / "case.db")
        now = utc_now()
        backend.upsert(case_id, "manifest", "manifest", manifest, now)
        backend.upsert(case_id, "checkpoint", "checkpoint", checkpoint, now)
        backend.upsert(case_id, "evidence", "root", [], now)
        backend.upsert(case_id, "findings", "root", [], now)
        write_json(case_dir / "backend.json", {"backend": "sqlite", "db_path": "case.db"})
        append_audit(case_dir, "case_created", {"workflow": args.workflow, "scope": args.scope or ["."], "backend": "sqlite"})
    else:
        append_audit(case_dir, "case_created", {"workflow": args.workflow, "scope": args.scope or ["."]})
    print(case_dir)
    return 0


def command_audit(args: argparse.Namespace) -> int:
    metadata = json.loads(args.metadata)
    if not isinstance(metadata, dict):
        raise ValueError("metadata must be a JSON object")
    record = append_audit(Path(args.case), args.event, metadata)
    print(record["event_hash"])
    return 0


def command_checkpoint(args: argparse.Namespace) -> int:
    case_dir = Path(args.case)
    manifest = require_case(case_dir)
    checkpoint_path = case_dir / "checkpoint.json"
    previous = read_json(checkpoint_path) if checkpoint_path.is_file() else {"revision": 0, "artifacts": {}}
    if args.state not in STATES:
        raise ValueError(f"unsupported state: {args.state}")
    steps = list(args.completed or []) + list(args.pending or [])
    invalid_steps = [step for step in steps if not STEP_RE.fullmatch(step)]
    if invalid_steps:
        raise ValueError(f"invalid step IDs: {', '.join(invalid_steps)}")
    overlap = set(args.completed or []) & set(args.pending or [])
    if overlap:
        raise ValueError(f"steps cannot be both completed and pending: {', '.join(sorted(overlap))}")
    artifacts = dict(previous.get("artifacts", {}))
    for item in args.artifact or []:
        artifact_path = Path(item)
        if not artifact_path.is_absolute():
            artifact_path = case_dir / artifact_path
        resolved = artifact_path.resolve()
        try:
            relative = resolved.relative_to(case_dir.resolve()).as_posix()
        except ValueError as error:
            raise ValueError(f"artifact outside case directory: {item}") from error
        if not resolved.is_file():
            raise ValueError(f"artifact missing: {resolved}")
        artifacts[relative] = sha256_file(resolved)
    checkpoint = {
        "schema_version": SCHEMA_VERSION,
        "case_id": manifest["case_id"],
        "revision": int(previous.get("revision", 0)) + 1,
        "state": args.state,
        "manifest_sha256": sha256_file(case_dir / "manifest.json"),
        "completed_steps": sorted(set(args.completed or [])),
        "pending_steps": sorted(set(args.pending or [])),
        "artifacts": artifacts,
        "evidence_ids": sorted(set(args.evidence or [])),
        "claim_ids": sorted(set(args.claim or [])),
        "updated_at": utc_now(),
    }
    write_json(checkpoint_path, checkpoint)
    append_audit(case_dir, "checkpoint_written", {"revision": checkpoint["revision"], "state": args.state})
    print(checkpoint["revision"])
    return 0


def validate_manifest(manifest: dict[str, Any]) -> list[str]:
    errors = []
    required = {"schema_version", "case_id", "workflow", "created_at", "scope", "limits", "requested_outputs"}
    missing = required - manifest.keys()
    if missing:
        errors.append(f"manifest missing fields: {', '.join(sorted(missing))}")
        return errors
    try:
        uuid.UUID(manifest["case_id"])
    except (ValueError, TypeError, AttributeError):
        errors.append("manifest case_id is not a UUID")
    if manifest["workflow"] not in WORKFLOWS:
        errors.append("manifest workflow is unsupported")
    if manifest.get("schema_version") != SCHEMA_VERSION:
        errors.append("manifest schema_version is unsupported")
    limits = manifest.get("limits", {})
    if limits.get("network") not in {"disabled", "loopback-only"}:
        errors.append("manifest network must be disabled or loopback-only")
    if not 1 <= int(limits.get("concurrency", 0)) <= 4:
        errors.append("manifest concurrency must be between 1 and 4")
    return errors


def validate_evidence(case_id: str, evidence: Any, case_dir: Path) -> tuple[list[str], set[str], dict[str, dict[str, Any]]]:
    errors = []
    ids = set()
    by_id = {}
    if not isinstance(evidence, list):
        return ["evidence.json must contain an array"], ids, by_id
    for index, item in enumerate(evidence):
        label = f"evidence[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        evidence_id = item.get("evidence_id")
        if not isinstance(evidence_id, str) or not re.fullmatch(r"EV-[A-Z0-9-]{6,64}", evidence_id):
            errors.append(f"{label} has invalid evidence_id")
            continue
        if evidence_id in ids:
            errors.append(f"duplicate evidence_id: {evidence_id}")
        ids.add(evidence_id)
        by_id[evidence_id] = item
        if item.get("case_id") != case_id:
            errors.append(f"{evidence_id} belongs to another case")
        if item.get("source_type") not in DETERMINISTIC_SOURCES:
            errors.append(f"{evidence_id} has unsupported source_type")
        digest = item.get("sha256")
        if not isinstance(digest, str) or not SHA256_RE.fullmatch(digest):
            errors.append(f"{evidence_id} has invalid sha256")
        locator = item.get("locator")
        if not isinstance(locator, str) or not locator:
            errors.append(f"{evidence_id} has empty locator")
        elif locator.startswith("artifact:"):
            relative = locator.removeprefix("artifact:")
            artifact = (case_dir / relative).resolve()
            try:
                artifact.relative_to(case_dir.resolve())
            except ValueError:
                errors.append(f"{evidence_id} artifact escapes case directory")
            else:
                if not artifact.is_file():
                    errors.append(f"{evidence_id} artifact is missing: {relative}")
                elif digest and sha256_file(artifact) != digest:
                    errors.append(f"{evidence_id} artifact hash mismatch: {relative}")
    return errors, ids, by_id


def validate_findings(findings: Any, evidence_ids: set[str], evidence_by_id: dict[str, dict[str, Any]]) -> list[str]:
    errors = []
    finding_ids = set()
    if not isinstance(findings, list):
        return ["findings.json must contain an array"]
    for index, finding in enumerate(findings):
        label = f"findings[{index}]"
        if not isinstance(finding, dict):
            errors.append(f"{label} must be an object")
            continue
        finding_id = finding.get("finding_id")
        if not isinstance(finding_id, str) or not re.fullmatch(r"F-[A-Z0-9-]{4,64}", finding_id):
            errors.append(f"{label} has invalid finding_id")
            continue
        if finding_id in finding_ids:
            errors.append(f"duplicate finding_id: {finding_id}")
        finding_ids.add(finding_id)
        state = finding.get("state")
        references = finding.get("evidence_ids", [])
        if not isinstance(references, list):
            errors.append(f"{finding_id} evidence_ids must be an array")
            continue
        missing = set(references) - evidence_ids
        if missing:
            errors.append(f"{finding_id} references missing evidence: {', '.join(sorted(missing))}")
        conflicts = finding.get("conflicting_evidence_ids", [])
        if not isinstance(conflicts, list):
            errors.append(f"{finding_id} conflicting_evidence_ids must be an array")
        else:
            missing_conflicts = set(conflicts) - evidence_ids
            if missing_conflicts:
                errors.append(f"{finding_id} references missing conflicts: {', '.join(sorted(missing_conflicts))}")
        if state == "confirmed":
            if not references:
                errors.append(f"{finding_id} is confirmed without evidence")
            if not str(finding.get("validation", "")).strip():
                errors.append(f"{finding_id} is confirmed without validation")
            if references and not any(evidence_by_id.get(item, {}).get("source_type") in DETERMINISTIC_SOURCES for item in references):
                errors.append(f"{finding_id} lacks deterministic evidence")
    return errors


def validate_checkpoint(case_dir: Path, case_id: str) -> list[str]:
    errors = []
    path = case_dir / "checkpoint.json"
    if not path.is_file():
        return ["checkpoint.json is missing"]
    checkpoint = read_json(path)
    if checkpoint.get("case_id") != case_id:
        errors.append("checkpoint belongs to another case")
    if checkpoint.get("state") not in STATES:
        errors.append("checkpoint state is unsupported")
    if checkpoint.get("manifest_sha256") != sha256_file(case_dir / "manifest.json"):
        errors.append("checkpoint manifest hash mismatch")
    completed = set(checkpoint.get("completed_steps", []))
    pending = set(checkpoint.get("pending_steps", []))
    if completed & pending:
        errors.append("checkpoint has overlapping completed and pending steps")
    for relative, expected in checkpoint.get("artifacts", {}).items():
        artifact = (case_dir / relative).resolve()
        try:
            artifact.relative_to(case_dir.resolve())
        except ValueError:
            errors.append(f"checkpoint artifact escapes case directory: {relative}")
            continue
        if not artifact.is_file():
            errors.append(f"checkpoint artifact missing: {relative}")
        elif sha256_file(artifact) != expected:
            errors.append(f"checkpoint artifact hash mismatch: {relative}")
    return errors


def command_validate(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    errors = validate_manifest(manifest)
    evidence_path = case_dir / "evidence.json"
    findings_path = case_dir / "findings.json"
    if not evidence_path.is_file():
        errors.append("evidence.json is missing")
        evidence = []
    else:
        evidence = read_json(evidence_path)
    evidence_errors, evidence_ids, evidence_by_id = validate_evidence(manifest["case_id"], evidence, case_dir)
    errors.extend(evidence_errors)
    if not findings_path.is_file():
        errors.append("findings.json is missing")
        findings = []
    else:
        findings = read_json(findings_path)
    errors.extend(validate_findings(findings, evidence_ids, evidence_by_id))
    errors.extend(validate_checkpoint(case_dir, manifest["case_id"]))
    errors.extend(validate_audit(manifest["case_id"], load_audit(case_dir / "audit.jsonl")))
    report_path = case_dir / "report.json"
    if report_path.is_file():
        report = read_json(report_path)
        if report.get("case_id") != manifest["case_id"]:
            errors.append("report belongs to another case")
        report_evidence = {item.get("evidence_id") for item in report.get("evidence", []) if isinstance(item, dict)}
        report_findings = {item.get("finding_id") for item in report.get("findings", []) if isinstance(item, dict)}
        source_findings = {item.get("finding_id") for item in findings if isinstance(item, dict)}
        if report_evidence != evidence_ids:
            errors.append("report evidence differs from evidence.json")
        if report_findings != source_findings:
            errors.append("report findings differ from findings.json")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("case validation: OK")
    return 0


def markdown_list(items: Any) -> str:
    if not items:
        return "None recorded"
    return "\n".join(f"- {redact_text(str(item))}" for item in items)


def command_render(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    if command_validate(argparse.Namespace(case=str(case_dir))) != 0:
        raise ValueError("case validation failed; repair report sources before rendering")
    report_path = case_dir / "report.json"
    if not report_path.is_file():
        raise ValueError("report.json is missing")
    report = redact_value(read_json(report_path))
    if report.get("case_id") != manifest["case_id"]:
        raise ValueError("report belongs to another case")
    sections = [
        "# Defensive AI Lab Report",
        "",
        "## Case",
        "",
        f"- Case ID: `{report['case_id']}`",
        f"- Generated: `{report.get('generated_at', utc_now())}`",
        f"- Workflow: `{manifest['workflow']}`",
        f"- Network profile: `{manifest['limits']['network']}`",
        "",
        "## Scope",
        "",
        markdown_list(report.get("scope")),
        "",
        "## Exclusions",
        "",
        markdown_list(report.get("exclusions")),
        "",
        "## Methods",
        "",
        markdown_list(report.get("methods")),
        "",
        "## Findings",
        "",
    ]
    findings = report.get("findings", [])
    if findings:
        for finding in findings:
            sections.extend([
                f"### {finding.get('finding_id', 'Unknown')} {redact_text(str(finding.get('title', 'Untitled')))}",
                "",
                f"- State: `{finding.get('state', 'unverified')}`",
                f"- Severity: `{finding.get('severity', 'informational')}`",
                f"- Evidence: {', '.join(finding.get('evidence_ids', [])) or 'None recorded'}",
                "",
                redact_text(str(finding.get("claim", "None recorded"))),
                "",
                "Remediation:",
                "",
                redact_text(str(finding.get("remediation", "None recorded"))),
                "",
                "Validation:",
                "",
                redact_text(str(finding.get("validation", "None recorded"))),
                "",
            ])
    else:
        sections.extend(["None recorded", ""])
    sections.extend([
        "## Evidence Index",
        "",
    ])
    evidence = report.get("evidence", [])
    if evidence:
        for item in evidence:
            sections.append(f"- `{item.get('evidence_id')}`: {redact_text(str(item.get('summary') or item.get('locator') or 'No summary'))} (`{item.get('sha256', 'no-hash')}`)")
    else:
        sections.append("None recorded")
    validation = report.get("validation", {})
    sections.extend([
        "",
        "## Conflicts",
        "",
        markdown_list(report.get("conflicts")),
        "",
        "## Validation",
        "",
        f"- Passed: `{bool(validation.get('passed', False))}`",
        f"- Notes: {redact_text(str(validation.get('notes', 'None recorded')))}",
        "",
        markdown_list(validation.get("commands")),
        "",
        "## Limitations",
        "",
        markdown_list(report.get("limitations")),
        "",
    ])
    output = Path(args.output) if args.output else case_dir / "report.md"
    atomic_write(output, "\n".join(sections))
    append_audit(case_dir, "report_exported", {"path": output.name, "sha256": sha256_file(output)})
    print(output)
    return 0


def command_sync_report(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    report_path = case_dir / "report.json"
    report = read_json(report_path) if report_path.is_file() else {}
    report.update({
        "schema_version": SCHEMA_VERSION,
        "case_id": manifest["case_id"],
        "generated_at": utc_now(),
        "scope": manifest["scope"]["allowed_sources"],
        "exclusions": manifest["scope"]["excluded_operations"],
        "evidence": read_json(case_dir / "evidence.json"),
        "findings": read_json(case_dir / "findings.json"),
    })
    report.setdefault("methods", ["Pending execution"])
    report.setdefault("conflicts", [])
    report.setdefault("limitations", [])
    report.setdefault("validation", {"commands": [], "passed": False, "notes": "Pending validation"})
    write_json(report_path, redact_value(report))
    print(report_path)
    return 0


def command_redact(args: argparse.Namespace) -> int:
    source = Path(args.input)
    destination = Path(args.output)
    atomic_write(destination, redact_text(source.read_text(encoding="utf-8")))
    print(sha256_file(destination))
    return 0


SARIF_SEVERITY = {"error": "high", "warning": "medium", "note": "low", "none": "informational"}


def _import_path(case_dir: Path, namespace: str, input_path: Path, payload: dict[str, Any]) -> Path:
    (case_dir / "artifacts" / "imports").mkdir(parents=True, exist_ok=True)
    digest = sha256_file(input_path)
    destination = case_dir / "artifacts" / "imports" / f"{namespace}-{digest}.json"
    write_json(destination, payload)
    return destination


def command_import_sarif(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    input_path = Path(args.input).resolve()
    raw = json.loads(input_path.read_text(encoding="utf-8"))
    runs = raw.get("runs", []) if isinstance(raw, dict) else []
    results = []
    for run in runs:
        tool = run.get("tool", {}).get("driver", {})
        for result in run.get("results", []):
            location = result.get("locations", [{}])[0].get("physicalLocation", {})
            artifact = location.get("artifactLocation", {}).get("uri", "unknown")
            region = location.get("region", {})
            snippet = region.get("snippet", {}).get("text", "")
            snippet_hash = sha256_bytes(redact_text(snippet).encode("utf-8")) if snippet else None
            results.append({
                "rule_id": result.get("ruleId", "unknown"),
                "level": result.get("level", "warning"),
                "message": redact_text(str(result.get("message", {}).get("text", "")))[:2000],
                "location": {
                    "path": artifact,
                    "start_line": region.get("startLine", 1),
                    "end_line": region.get("endLine", region.get("startLine", 1)),
                    "snippet_sha256": snippet_hash,
                },
            })
    payload = {
        "schema_version": SCHEMA_VERSION,
        "case_id": manifest["case_id"],
        "source_type": "user_artifact",
        "tool": {
            "name": runs[0].get("tool", {}).get("driver", {}).get("name", "sarif") if runs else "sarif",
            "version": runs[0].get("tool", {}).get("driver", {}).get("version", "") if runs else "",
            "sarif_version": raw.get("version", "2.1.0") if isinstance(raw, dict) else "2.1.0",
        },
        "imported_at": utc_now(),
        "input_sha256": sha256_file(input_path),
        "results": results,
    }
    destination = _import_path(case_dir, "sarif", input_path, payload)
    append_audit(case_dir, "tool_finished", {"event": "import-sarif", "path": destination.name, "results": len(results)})
    print(destination)
    return 0


def _detect_sbom_format(raw: Any) -> str:
    if isinstance(raw, dict):
        if raw.get("bomFormat") == "CycloneDX" or "cycloneDx" in str(raw.get("$schema", "")).lower():
            return "cyclonedx"
        if "SPDXRef" in str(raw) or raw.get("spdxVersion"):
            return "spdx"
        if "artifacts" in raw and isinstance(raw.get("artifacts"), list):
            return "syft"
    return "generic"


def command_import_sbom(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    input_path = Path(args.input).resolve()
    raw = json.loads(input_path.read_text(encoding="utf-8"))
    fmt = _detect_sbom_format(raw)
    components = []
    if fmt == "cyclonedx":
        for comp in raw.get("components", []):
            components.append({
                "name": comp.get("name", "unknown"),
                "version": comp.get("version", ""),
                "ecosystem": "generic",
                "purl": comp.get("purl", ""),
                "license": ",".join(l.get("license", {}).get("id", "") or l.get("license", {}).get("name", "") for l in comp.get("licenses", [])),
                "supplier": comp.get("supplier", {}).get("name", ""),
                "scope": comp.get("scope", "required"),
            })
    elif fmt == "spdx":
        for comp in raw.get("packages", []):
            components.append({
                "name": comp.get("name", "unknown"),
                "version": comp.get("versionInfo", ""),
                "ecosystem": "generic",
                "purl": comp.get("externalRefs", [{}])[0].get("referenceLocator", "") if comp.get("externalRefs") else "",
                "license": comp.get("licenseConcluded", ""),
                "supplier": comp.get("supplier", ""),
                "scope": "required",
            })
    elif fmt == "syft":
        for comp in raw.get("artifacts", []):
            components.append({
                "name": comp.get("name", "unknown"),
                "version": comp.get("version", ""),
                "ecosystem": comp.get("type", "generic"),
                "purl": comp.get("purl", ""),
                "license": ",".join(comp.get("licenses", [])),
                "supplier": "",
                "scope": "required",
            })
    payload = {
        "schema_version": SCHEMA_VERSION,
        "case_id": manifest["case_id"],
        "source_type": "user_artifact",
        "format": fmt,
        "imported_at": utc_now(),
        "input_sha256": sha256_file(input_path),
        "components": components,
    }
    destination = _import_path(case_dir, "sbom", input_path, payload)
    append_audit(case_dir, "tool_finished", {"event": "import-sbom", "path": destination.name, "components": len(components)})
    print(destination)
    return 0


def command_import_tests(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    input_path = Path(args.input).resolve()
    raw = json.loads(input_path.read_text(encoding="utf-8"))
    framework = args.framework
    results: list[dict[str, Any]] = []
    if framework == "pytest" and isinstance(raw, dict) and "tests" in raw:
        for node in raw.get("tests", []):
            outcome = node.get("outcome", "unknown")
            results.append({
                "test_id": node.get("nodeid", ""),
                "name": node.get("name", node.get("nodeid", "")),
                "status": "passed" if outcome == "passed" else "failed" if outcome == "failed" else "skipped" if outcome == "skipped" else "error",
                "duration_ms": float(node.get("duration", 0)) * 1000,
                "failure": {"message_sha256": sha256_bytes(redact_text(str(node.get("longrepr", ""))).encode("utf-8")), "locator": node.get("nodeid", "")} if outcome == "failed" else None,
                "locator": node.get("nodeid", ""),
            })
    else:
        iterable = raw if isinstance(raw, list) else raw.get("tests", []) if isinstance(raw, dict) else []
        for index, item in enumerate(iterable if isinstance(iterable, list) else []):
            if not isinstance(item, dict):
                continue
            results.append({
                "test_id": item.get("test_id", item.get("name", f"test-{index}")),
                "name": item.get("name", item.get("test_id", f"test-{index}")),
                "status": item.get("status", "passed"),
                "duration_ms": item.get("duration_ms", 0),
                "failure": None,
                "locator": item.get("locator", ""),
            })
    payload = {
        "schema_version": SCHEMA_VERSION,
        "case_id": manifest["case_id"],
        "source_type": "user_artifact",
        "framework": framework,
        "imported_at": utc_now(),
        "input_sha256": sha256_file(input_path),
        "results": results,
    }
    destination = _import_path(case_dir, "tests", input_path, payload)
    append_audit(case_dir, "tool_finished", {"event": "import-tests", "path": destination.name, "results": len(results)})
    print(destination)
    return 0


AUTH_MATRIX_TESTS = [
    ("AUTH-OWNER-READ", "user-a", "resource-a", "read", "allow"),
    ("AUTH-CROSS-OWNER-READ", "user-b", "resource-a", "read", "deny"),
    ("AUTH-CROSS-TENANT-READ", "user-c", "resource-a", "read", "deny"),
    ("AUTH-ANON-READ", "anonymous", "resource-a", "read", "deny"),
    ("AUTH-OWNER-DELETE", "user-a", "resource-a", "delete", "allow"),
    ("AUTH-CROSS-OWNER-DELETE", "user-b", "resource-a", "delete", "deny"),
    ("AUTH-ADMIN-TENANT-READ", "admin-a", "resource-b", "read", "deny"),
    ("AUTH-MEMBER-ADMIN-OP", "user-a", "tenant-a", "admin_op", "deny"),
]


def command_generate_auth_tests(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    app_module = args.app_module
    if args.framework == "pytest":
        lines = [
            "import pytest",
            f"from {app_module} import app, create_test_client, create_fixture",
            "",
            "",
            "@pytest.fixture",
            "def client():",
            "    return create_test_client(app)",
            "",
            "",
            "@pytest.fixture",
            "def fixture():",
            "    return create_fixture(principals=['user-a', 'user-b', 'user-c', 'admin-a'])",
            "",
            "",
        ]
        for test_id, principal, resource, operation, expected in AUTH_MATRIX_TESTS:
            lines.extend([
                f"def test_{test_id.lower().replace('-', '_')}(client, fixture):",
                f"    fixture.as_principal('{principal}')",
                f"    response = client.{operation}('/resources/{resource}')",
                f"    assert response.status_code == {302 if expected == 'allow' else 403}",
                f"    fixture.assert_owner_only('{resource}', '{principal}', '{operation}')",
                "",
                "",
            ])
    else:
        lines = [
            "import unittest",
            f"from {app_module} import app, create_test_client, create_fixture",
            "",
            "",
            "class AuthorizationRegressionTests(unittest.TestCase):",
            "    def setUp(self):",
            "        self.client = create_test_client(app)",
            "        self.fixture = create_fixture(principals=['user-a', 'user-b', 'user-c', 'admin-a'])",
            "",
        ]
        for test_id, principal, resource, operation, expected in AUTH_MATRIX_TESTS:
            lines.extend([
                f"    def test_{test_id.lower().replace('-', '_')}(self):",
                f"        self.fixture.as_principal('{principal}')",
                f"        response = self.client.{operation}('/resources/{resource}')",
                f"        self.assertEqual(response.status_code, {302 if expected == 'allow' else 403})",
                "",
            ])
    content = "\n".join(lines) + "\n"
    output = Path(args.output) if args.output else case_dir / "artifacts" / "test_authorization_regression.py"
    output.parent.mkdir(parents=True, exist_ok=True)
    atomic_write(output, content)
    digest = sha256_file(output)
    append_audit(case_dir, "tool_finished", {"event": "generate-auth-tests", "path": output.name, "tests": len(AUTH_MATRIX_TESTS), "sha256": digest})
    print(output)
    return 0


def _mock_provider_response(model_alias: str, prompt_hash: str, temperature: float) -> dict[str, Any]:
    echo = f"[mock-{model_alias}] response to {prompt_hash[:12]} at temperature={temperature}"
    return {
        "text": echo,
        "finish_reason": "stop",
        "provider_model_id": f"mock:{model_alias}",
    }


def command_run_experiment(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    prompt_path = Path(args.prompt_file).resolve()
    dataset_path = Path(args.dataset_file).resolve()
    prompt_hash = sha256_file(prompt_path)
    dataset_hash = sha256_file(dataset_path)
    canonical = canonical_bytes({
        "model_alias": args.model_alias,
        "prompt_sha256": prompt_hash,
        "dataset_sha256": dataset_hash,
        "temperature": args.temperature,
        "max_tokens": args.max_tokens,
        "repetition": 0,
    })
    run_id = "RUN-" + sha256_bytes(canonical)[:8].upper()
    started = utc_now()
    if args.provider == "openai":
        from llm_provider import LlmProvider, MissingConfiguration
        try:
            provider = LlmProvider.from_environment()
        except MissingConfiguration as error:
            raise ValueError(str(error))
        prompt_text = redact_text(prompt_path.read_text(encoding="utf-8"))
        try:
            llm_response = provider.complete(model=args.model_alias, prompt=prompt_text, temperature=args.temperature, max_tokens=args.max_tokens)
        except RuntimeError as error:
            payload = {
                "schema_version": SCHEMA_VERSION,
                "run_id": run_id,
                "case_id": manifest["case_id"],
                "model_alias": args.model_alias,
                "provider_model_id": args.model_alias,
                "parameters": {"temperature": args.temperature, "top_p": 1.0, "seed": None, "max_input_tokens": 4096, "max_output_tokens": args.max_tokens, "repetition": 0},
                "status": "failed",
                "metrics": {},
                "started_at": started,
                "finished_at": utc_now(),
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0,
                "retries": 0,
                "output_sha256": "",
                "assertions": [],
                "error": redact_text(str(error))[:2000],
            }
            (case_dir / "artifacts" / "experiments").mkdir(parents=True, exist_ok=True)
            destination = case_dir / "artifacts" / "experiments" / f"{run_id}.json"
            write_json(destination, payload)
            append_audit(case_dir, "case_blocked", {"run_id": run_id, "error": "provider failure"})
            print(destination)
            return 0
        output_text = llm_response.text
        provider_model_id = llm_response.provider_model_id
        input_tokens = llm_response.input_tokens
        output_tokens = llm_response.output_tokens
        raw_hash = llm_response.raw_sha256
        finish_reason = llm_response.finish_reason
    else:
        response = _mock_provider_response(args.model_alias, prompt_hash, args.temperature)
        output_text = response["text"]
        provider_model_id = response["provider_model_id"]
        input_tokens = 0
        output_tokens = len(output_text) // 4
        raw_hash = ""
        finish_reason = "stop"
    output_hash = sha256_bytes(redact_text(output_text).encode("utf-8"))
    assertions = [
        {"name": "non-empty-output", "passed": bool(output_text.strip())},
        {"name": "no-secret-leak", "passed": "[REDACTED" not in output_text},
        {"name": "within-token-limit", "passed": len(output_text) <= args.max_tokens * 4},
        {"name": "finish-clean", "passed": finish_reason in ("stop", "length")},
    ]
    all_passed = all(item["passed"] for item in assertions)
    payload = {
        "schema_version": SCHEMA_VERSION,
        "run_id": run_id,
        "case_id": manifest["case_id"],
        "model_alias": args.model_alias,
        "provider_model_id": provider_model_id,
        "parameters": {
            "temperature": args.temperature,
            "top_p": 1.0,
            "seed": None,
            "max_input_tokens": 4096,
            "max_output_tokens": args.max_tokens,
            "repetition": 0,
        },
        "status": "completed",
        "metrics": {"output_chars": len(output_text), "assertions_passed": sum(1 for item in assertions if item["passed"])},
        "started_at": started,
        "finished_at": utc_now(),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost": 0.0,
        "retries": 0,
        "output_sha256": output_hash,
        "raw_response_sha256": raw_hash,
        "assertions": assertions,
        "error": "",
    }
    (case_dir / "artifacts" / "experiments").mkdir(parents=True, exist_ok=True)
    destination = case_dir / "artifacts" / "experiments" / f"{run_id}.json"
    write_json(destination, payload)
    append_audit(case_dir, "tool_finished", {"event": "run-experiment", "run_id": run_id, "all_passed": all_passed})
    print(destination)
    return 0


TIER_ORDER = {"T0": 0, "T1": 1, "T2": 2, "T3": 3, "T4": 4}


def _knowledge_file(case_dir: Path) -> Path:
    return case_dir / "knowledge.json"


def _load_knowledge(case_dir: Path) -> list[dict[str, Any]]:
    path = _knowledge_file(case_dir)
    if not path.is_file():
        return []
    return read_json(path)


def _save_knowledge(case_dir: Path, chunks: list[dict[str, Any]]) -> None:
    write_json(_knowledge_file(case_dir), chunks)


def command_knowledge_promote(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    findings = read_json(case_dir / "findings.json") if (case_dir / "findings.json").is_file() else []
    target = next((item for item in findings if isinstance(item, dict) and item.get("finding_id") == args.finding_id), None)
    if not target:
        raise ValueError(f"finding not found: {args.finding_id}")
    if target.get("state") not in ("confirmed", "supported"):
        raise ValueError(f"finding {args.finding_id} is not confirmed or supported; cannot promote")
    evidence = read_json(case_dir / "evidence.json") if (case_dir / "evidence.json").is_file() else []
    evidence_summary = redact_text(str(target.get("claim", "")))
    content_hash = sha256_bytes(evidence_summary.encode("utf-8"))
    chunk = {
        "schema_version": SCHEMA_VERSION,
        "chunk_id": "CH-" + content_hash[:12].upper(),
        "trust_tier": "T0" if target.get("state") == "confirmed" else "T1",
        "source_class": "curated",
        "case_origin": manifest["case_id"],
        "artifact_hash": None,
        "locator": args.finding_id,
        "language": args.language,
        "framework": args.framework,
        "defensive_control": args.defensive_control,
        "content_sha256": content_hash,
        "review_status": "reviewed",
        "reviewed_at": utc_now(),
        "expires_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "provenance": [args.finding_id],
        "confidence": "high" if target.get("state") == "confirmed" else "medium",
    }
    chunks = _load_knowledge(case_dir)
    if any(item.get("chunk_id") == chunk["chunk_id"] for item in chunks):
        raise ValueError(f"knowledge chunk already exists: {chunk['chunk_id']}")
    chunks.append(chunk)
    _save_knowledge(case_dir, chunks)
    append_audit(case_dir, "claim_accepted", {"event": "knowledge-promote", "chunk_id": chunk["chunk_id"], "finding_id": args.finding_id})
    print(chunk["chunk_id"])
    return 0


def command_knowledge_retrieve(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    require_case(case_dir)
    chunks = _load_knowledge(case_dir)
    min_tier = TIER_ORDER[args.min_tier]
    matches = [item for item in chunks if item.get("defensive_control") == args.defensive_control and TIER_ORDER.get(item.get("trust_tier", "T4"), 4) <= min_tier and item.get("review_status") == "reviewed"]
    matches.sort(key=lambda item: TIER_ORDER.get(item.get("trust_tier", "T4"), 4))
    output = matches[: args.limit]
    print(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


def command_approve(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    approval = {
        "schema_version": SCHEMA_VERSION,
        "approval_id": "AP-" + sha256_bytes(canonical_bytes({"case_id": manifest["case_id"], "request": args.request, "decided_at": utc_now()}))[:12].upper(),
        "case_id": manifest["case_id"],
        "request": args.request,
        "justification": args.justification,
        "requested_by": "agent",
        "approved_by": args.approved_by,
        "decided_at": utc_now(),
        "decision": args.decision,
        "conditions": [],
    }
    (case_dir / "approvals").mkdir(parents=True, exist_ok=True)
    destination = case_dir / "approvals" / f"{approval['approval_id']}.json"
    write_json(destination, approval)
    event = "claim_accepted" if args.decision == "approved" else "claim_rejected" if args.decision == "rejected" else "case_blocked"
    append_audit(case_dir, event, {"approval_id": approval["approval_id"], "request": redact_text(args.request)[:200]})
    print(approval["approval_id"])
    return 0


def command_knowledge_search(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    require_case(case_dir)
    from vector_index import KnowledgeIndex
    index_path = case_dir / "knowledge-index.json"
    index = KnowledgeIndex.load(index_path)
    if index is None:
        chunks = _load_knowledge(case_dir)
        if not chunks:
            print("[]")
            return 0
        index = KnowledgeIndex(index_path)
        index.build(chunks)
    results = index.search(args.query, limit=args.limit, min_score=args.min_score)
    print(json.dumps(results, ensure_ascii=False, indent=2, sort_keys=True))
    append_audit(case_dir, "tool_finished", {"event": "knowledge-search", "query_hash": sha256_bytes(args.query.encode("utf-8")), "results": len(results)})
    return 0


def command_export_sarif(args: argparse.Namespace) -> int:
    case_dir = Path(args.case).resolve()
    manifest = require_case(case_dir)
    from sarif_export import export_sarif
    output = Path(args.output) if args.output else None
    destination = export_sarif(case_dir, output)
    digest = sha256_file(destination)
    append_audit(case_dir, "report_exported", {"format": "sarif", "path": destination.name, "sha256": digest})
    print(destination)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage local Defensive AI Lab cases without external dependencies.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init = subparsers.add_parser("init", help="Create an isolated case directory.")
    init.add_argument("--workflow", required=True, choices=sorted(WORKFLOWS))
    init.add_argument("--workspace", default=".")
    init.add_argument("--root", default=".defensive-ai-lab/cases")
    init.add_argument("--scope", action="append")
    init.add_argument("--output", action="append", choices=["markdown", "json", "patch", "tests"])
    init.add_argument("--profile", default="low", choices=["low", "standard", "custom"])
    init.add_argument("--concurrency", type=int, default=1, choices=range(1, 5))
    init.add_argument("--timeout", type=int, default=120)
    init.add_argument("--loopback", action="store_true")
    init.add_argument("--backend", default="json", choices=["json", "sqlite"])
    init.set_defaults(func=command_init)

    audit = subparsers.add_parser("audit", help="Append a redacted hash-chained audit event.")
    audit.add_argument("--case", required=True)
    audit.add_argument("--event", required=True, choices=sorted(EVENTS))
    audit.add_argument("--metadata", default="{}")
    audit.set_defaults(func=command_audit)

    checkpoint = subparsers.add_parser("checkpoint", help="Atomically write resumable case state.")
    checkpoint.add_argument("--case", required=True)
    checkpoint.add_argument("--state", default="paused", choices=sorted(STATES))
    checkpoint.add_argument("--completed", action="append")
    checkpoint.add_argument("--pending", action="append")
    checkpoint.add_argument("--artifact", action="append")
    checkpoint.add_argument("--evidence", action="append")
    checkpoint.add_argument("--claim", action="append")
    checkpoint.set_defaults(func=command_checkpoint)

    validate = subparsers.add_parser("validate", help="Validate case isolation, evidence, hashes, and audit chain.")
    validate.add_argument("--case", required=True)
    validate.set_defaults(func=command_validate)

    render = subparsers.add_parser("render", help="Render redacted Markdown from report.json.")
    render.add_argument("--case", required=True)
    render.add_argument("--output")
    render.set_defaults(func=command_render)

    sync_report = subparsers.add_parser("sync-report", help="Synchronize canonical evidence and findings into report.json.")
    sync_report.add_argument("--case", required=True)
    sync_report.set_defaults(func=command_sync_report)

    redact = subparsers.add_parser("redact", help="Redact sensitive text into a separate artifact.")
    redact.add_argument("--input", required=True)
    redact.add_argument("--output", required=True)
    redact.set_defaults(func=command_redact)

    import_sarif = subparsers.add_parser("import-sarif", help="Parse and normalize a SARIF 2.1.0 report.")
    import_sarif.add_argument("--case", required=True)
    import_sarif.add_argument("--input", required=True)
    import_sarif.set_defaults(func=command_import_sarif)

    import_sbom = subparsers.add_parser("import-sbom", help="Parse and normalize a CycloneDX/SPDX/Syft SBOM.")
    import_sbom.add_argument("--case", required=True)
    import_sbom.add_argument("--input", required=True)
    import_sbom.set_defaults(func=command_import_sbom)

    import_tests = subparsers.add_parser("import-tests", help="Parse and normalize pytest/JSON test results.")
    import_tests.add_argument("--case", required=True)
    import_tests.add_argument("--input", required=True)
    import_tests.add_argument("--framework", default="generic", choices=["pytest", "unittest", "junit", "vitest", "jest", "go-test", "generic"])
    import_tests.set_defaults(func=command_import_tests)

    generate_auth_tests = subparsers.add_parser("generate-auth-tests", help="Generate an authorization regression test skeleton.")
    generate_auth_tests.add_argument("--case", required=True)
    generate_auth_tests.add_argument("--framework", required=True, choices=["pytest", "unittest"])
    generate_auth_tests.add_argument("--app-module", required=True)
    generate_auth_tests.add_argument("--output")
    generate_auth_tests.set_defaults(func=command_generate_auth_tests)

    run_experiment = subparsers.add_parser("run-experiment", help="Execute a bounded AI experiment run against a local mock provider.")
    run_experiment.add_argument("--case", required=True)
    run_experiment.add_argument("--model-alias", required=True)
    run_experiment.add_argument("--prompt-file", required=True)
    run_experiment.add_argument("--dataset-file", required=True)
    run_experiment.add_argument("--temperature", type=float, default=0.0)
    run_experiment.add_argument("--max-tokens", type=int, default=512)
    run_experiment.add_argument("--provider", default="mock", choices=["mock", "openai"])
    run_experiment.set_defaults(func=command_run_experiment)

    knowledge_promote = subparsers.add_parser("knowledge-promote", help="Promote a reviewed knowledge chunk into the local knowledge base.")
    knowledge_promote.add_argument("--case", required=True)
    knowledge_promote.add_argument("--finding-id", required=True)
    knowledge_promote.add_argument("--defensive-control", required=True)
    knowledge_promote.add_argument("--language", default="generic")
    knowledge_promote.add_argument("--framework", default="generic")
    knowledge_promote.add_argument("--expires-days", type=int, default=365)
    knowledge_promote.set_defaults(func=command_knowledge_promote)

    knowledge_retrieve = subparsers.add_parser("knowledge-retrieve", help="Retrieve advisory knowledge chunks by defensive control.")
    knowledge_retrieve.add_argument("--case", required=True)
    knowledge_retrieve.add_argument("--defensive-control", required=True)
    knowledge_retrieve.add_argument("--min-tier", default="T1", choices=["T0", "T1", "T2", "T3", "T4"])
    knowledge_retrieve.add_argument("--limit", type=int, default=5)
    knowledge_retrieve.set_defaults(func=command_knowledge_retrieve)

    approve = subparsers.add_parser("approve", help="Record a human approval decision for a high-risk action.")
    approve.add_argument("--case", required=True)
    approve.add_argument("--request", required=True)
    approve.add_argument("--decision", required=True, choices=["approved", "rejected", "deferred"])
    approve.add_argument("--approved-by", required=True)
    approve.add_argument("--justification", default="")
    approve.set_defaults(func=command_approve)

    knowledge_search = subparsers.add_parser("knowledge-search", help="Vector search over the knowledge base using a text query.")
    knowledge_search.add_argument("--case", required=True)
    knowledge_search.add_argument("--query", required=True)
    knowledge_search.add_argument("--limit", type=int, default=5)
    knowledge_search.add_argument("--min-score", type=float, default=0.01)
    knowledge_search.set_defaults(func=command_knowledge_search)

    export_sarif_cmd = subparsers.add_parser("export-sarif", help="Export findings and evidence as a SARIF 2.1.0 document.")
    export_sarif_cmd.add_argument("--case", required=True)
    export_sarif_cmd.add_argument("--output")
    export_sarif_cmd.set_defaults(func=command_export_sarif)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        if getattr(args, "timeout", 1) < 1 or getattr(args, "timeout", 1) > 1800:
            raise ValueError("timeout must be between 1 and 1800 seconds")
        return args.func(args)
    except (ValueError, OSError, json.JSONDecodeError, KeyError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
