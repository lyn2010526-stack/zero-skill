"""SARIF 2.1.0 exporter for Defensive AI Lab findings.

Converts the canonical findings and evidence stored in a case into a SARIF
2.1.0 document suitable for ingestion by IDEs, CI pipelines, and security
reporting tools that consume SARIF.

The exporter is deterministic: the same case state always produces the same
SARIF document hash. Secrets are redacted before any message or snippet is
written. No network access is performed.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SARIF_LEVEL = {
    "critical": "error",
    "high": "error",
    "medium": "warning",
    "low": "note",
    "informational": "none",
}

SARIF_VERSION = "2.1.0"
SARIF_SCHEMA = "https://json.schemastore.org/sarif-2.1.0.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def redact_text(value: str) -> str:
    """Minimal redaction matching labctl.redact_text to avoid cross-imports."""
    import re
    patterns = [
        (re.compile(r"(?i)(authorization\s*[:=]\s*bearer\s+)[^\s,;]+"), r"\1[REDACTED_TOKEN]"),
        (re.compile(r"(?i)((?:api[_-]?key|token|password|secret|cookie|session[_-]?id)\s*[:=]\s*)[^\s,;]+"), r"\1[REDACTED_SECRET]"),
        (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.DOTALL), "[REDACTED_PRIVATE_KEY]"),
        (re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b"), "[REDACTED_EMAIL]"),
        (re.compile(r"(?<![\w-])(?:\+\d{8,15}|1[3-9]\d{9})(?![\w-])"), "[REDACTED_PHONE]"),
    ]
    result = value
    for pattern, replacement in patterns:
        result = pattern.sub(replacement, result)
    return result


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _rule_for(finding: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": finding.get("finding_id", "F-UNKNOWN"),
        "name": finding.get("title", "untitled-finding")[:120],
        "shortDescription": {"text": redact_text(str(finding.get("title", "Untitled finding")))[:200]},
        "fullDescription": {"text": redact_text(str(finding.get("claim", "")))[:1000]},
        "defaultConfiguration": {"level": SARIF_LEVEL.get(finding.get("severity", "informational"), "none")},
        "properties": {
            "security-severity": _cvss_score(finding),
            "state": finding.get("state", "unverified"),
        },
    }


def _cvss_score(finding: dict[str, Any]) -> str:
    severity = finding.get("severity", "informational")
    mapping = {"critical": "9.0", "high": "7.5", "medium": "5.0", "low": "2.5", "informational": "0.0"}
    return mapping.get(severity, "0.0")


def _result_for(finding: dict[str, Any], evidence_by_id: dict[str, dict[str, Any]], rule_index: int) -> dict[str, Any]:
    locations = []
    for evidence_id in finding.get("evidence_ids", []):
        evidence = evidence_by_id.get(evidence_id, {})
        locator = str(evidence.get("locator", "unknown"))
        if locator.startswith("source:"):
            parts = locator.split(":", 2)
            path = parts[1] if len(parts) > 1 else "unknown"
            line = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 1
            locations.append({
                "physicalLocation": {
                    "artifactLocation": {"uri": path},
                    "region": {"startLine": line},
                }
            })
    if not locations:
        locations.append({"physicalLocation": {"artifactLocation": {"uri": "unknown"}}})
    return {
        "ruleId": finding.get("finding_id", "F-UNKNOWN"),
        "ruleIndex": rule_index,
        "level": SARIF_LEVEL.get(finding.get("severity", "informational"), "none"),
        "message": {"text": redact_text(str(finding.get("claim", "")))[:5000]},
        "locations": locations,
        "partialFingerprints": {"primaryLocationLineHash": _sha256_bytes(redact_text(str(finding.get("claim", ""))).encode("utf-8"))[:16]},
        "properties": {
            "severity": finding.get("severity", "informational"),
            "state": finding.get("state", "unverified"),
            "remediation": redact_text(str(finding.get("remediation", "")))[:2000],
            "evidence_ids": finding.get("evidence_ids", []),
        },
    }


def export_sarif(case_dir: Path, output_path: Path | None = None) -> Path:
    """Export findings.json and evidence.json to a SARIF 2.1.0 document.

    Returns the path to the written SARIF file.
    """
    findings_path = case_dir / "findings.json"
    evidence_path = case_dir / "evidence.json"
    findings = json.loads(findings_path.read_text(encoding="utf-8")) if findings_path.is_file() else []
    evidence = json.loads(evidence_path.read_text(encoding="utf-8")) if evidence_path.is_file() else []
    evidence_by_id = {item.get("evidence_id"): item for item in evidence if isinstance(item, dict)}

    rules = [_rule_for(finding) for finding in findings]
    results = [
        _result_for(finding, evidence_by_id, index)
        for index, finding in enumerate(findings)
    ]

    sarif = {
        "$schema": SARIF_SCHEMA,
        "version": SARIF_VERSION,
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "defensive-ai-lab",
                        "version": "1.0",
                        "informationUri": "https://local.invalid/defensive-ai-lab",
                        "rules": rules,
                    }
                },
                "results": results,
                "invocations": [
                    {
                        "executionSuccessful": True,
                        "endTimeUtc": utc_now(),
                    }
                ],
            }
        ],
    }

    destination = output_path or (case_dir / "report.sarif")
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(sarif, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    destination.write_text(content, encoding="utf-8")
    return destination


def sarif_hash(case_dir: Path) -> str:
    """Compute a stable hash of the SARIF export without writing it."""
    import io
    buffer = io.StringIO()
    findings_path = case_dir / "findings.json"
    evidence_path = case_dir / "evidence.json"
    findings = json.loads(findings_path.read_text(encoding="utf-8")) if findings_path.is_file() else []
    evidence = json.loads(evidence_path.read_text(encoding="utf-8")) if evidence_path.is_file() else []
    evidence_by_id = {item.get("evidence_id"): item for item in evidence if isinstance(item, dict)}
    rules = [_rule_for(finding) for finding in findings]
    results = [_result_for(finding, evidence_by_id, index) for index, finding in enumerate(findings)]
    payload = {"rules": rules, "results": results}
    json.dump(payload, buffer, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return _sha256_bytes(buffer.getvalue().encode("utf-8"))
