"""Completion verifier with structured evidence support for Zero Apex."""
from __future__ import annotations
from pathlib import Path
from typing import Optional
from .evidence import EvidenceLayer, CommandEvidence, EvidenceResult


class Verifier:
    COMPLETION_WORDS = [
        '完成', '已完成', '改完', '已修改', '已经修改', '已修复', '已经修复',
        '修好了', '编译通过', '测试通过', '安装成功', '搞定', 'done', 'fixed',
        'done.', 'finished', 'completed', '已部署', '搞定了', '好了',
    ]

    def __init__(self):
        self.evidence = EvidenceLayer()

    def has_completion_claim(self, text: str) -> bool:
        low = (text or '').lower()
        return any(w.lower() in low for w in self.COMPLETION_WORDS)

    def verify(self, claim: str, evidence: str | CommandEvidence | None) -> EvidenceResult:
        """Verify a completion claim against evidence.

        Returns EvidenceResult with:
        - label: VERIFIED / INFERRED / GUESSED / UNKNOWN / NEGATIVE
        - level: L0-L6
        - supports_claim: bool
        - reason: explanation
        """
        return self.evidence.classify(claim, evidence)

    def verify_claim(self, claim: str, evidence: str | CommandEvidence | None) -> bool:
        """Quick check: does the evidence support the claim?"""
        return self.verify(claim, evidence).supports_claim

    def response_allowed(self, response: str, evidence: str | CommandEvidence | None) -> tuple[bool, str]:
        """Check if a response with completion claims is allowed.

        Returns (allowed, reason). If the response contains a completion
        claim but the evidence doesn't support it, the response is blocked.
        """
        if not self.has_completion_claim(response):
            return True, 'no completion claim'
        result = self.verify(response, evidence)
        if result.supports_claim:
            return True, result.reason
        return False, f'completion claim blocked: {result.reason}'

    def verify_build(self, evidence: str | CommandEvidence | None) -> EvidenceResult:
        """Verify a build/compile completion claim."""
        return self.verify('编译通过 build succeeded', evidence)

    def verify_test(self, evidence: str | CommandEvidence | None) -> EvidenceResult:
        """Verify a test completion claim."""
        return self.verify('测试通过 tests passed', evidence)

    def verify_install(self, evidence: str | CommandEvidence | None) -> EvidenceResult:
        """Verify an install completion claim."""
        return self.verify('安装成功 installed', evidence)

    def verify_file_exists(self, file_path: str) -> bool:
        """Check if a file actually exists on disk."""
        return Path(file_path).exists()

    def verify_apk_exists(self, apk_path: str) -> bool:
        """Check if an APK file exists and is non-empty."""
        p = Path(apk_path)
        return p.exists() and p.is_file() and p.stat().st_size > 0

    def comprehensive_verify(self, claim: str, evidence: str | CommandEvidence | None,
                             file_checks: dict | None = None) -> dict:
        """Run comprehensive verification combining evidence + file checks.

        file_checks: dict of {path: should_exist}
        Returns a dict with overall result and per-check details.
        """
        ev_result = self.verify(claim, evidence)
        file_results = {}
        all_files_ok = True

        if file_checks:
            for path, should_exist in file_checks.items():
                exists = Path(path).exists()
                ok = exists == should_exist
                file_results[path] = {'exists': exists, 'expected': should_exist, 'ok': ok}
                if not ok:
                    all_files_ok = False

        overall = ev_result.supports_claim and all_files_ok
        return {
            'overall': overall,
            'evidence': {
                'label': ev_result.label,
                'level': ev_result.level,
                'reason': ev_result.reason,
                'supports_claim': ev_result.supports_claim,
            },
            'file_checks': file_results,
        }
