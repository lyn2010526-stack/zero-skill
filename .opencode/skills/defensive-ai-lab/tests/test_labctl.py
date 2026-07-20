import importlib.util
import json
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "labctl.py"
SPEC = importlib.util.spec_from_file_location("labctl", SCRIPT)
labctl = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(labctl)


class LabctlTests(unittest.TestCase):
    def create_case(self, root: Path) -> Path:
        args = Namespace(
            workflow="local_security_review",
            workspace=str(root),
            root=str(root / "cases"),
            scope=["src"],
            output=["markdown", "json"],
            profile="low",
            concurrency=1,
            timeout=30,
            loopback=False,
        )
        self.assertEqual(labctl.command_init(args), 0)
        return next((root / "cases").iterdir())

    def test_initial_case_validates(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            self.assertEqual(labctl.command_validate(Namespace(case=str(case))), 0)

    def test_audit_chain_detects_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            audit = case / "audit.jsonl"
            records = labctl.load_audit(audit)
            records[0]["metadata"]["workflow"] = "tampered"
            audit.write_text("\n".join(json.dumps(item) for item in records) + "\n", encoding="utf-8")
            self.assertTrue(labctl.validate_audit(records[0]["case_id"], labctl.load_audit(audit)))

    def test_confirmed_finding_requires_evidence_and_validation(self):
        finding = {
            "finding_id": "F-AUTH-1",
            "state": "confirmed",
            "evidence_ids": [],
            "validation": "",
        }
        errors = labctl.validate_findings([finding], set(), {})
        self.assertIn("F-AUTH-1 is confirmed without evidence", errors)
        self.assertIn("F-AUTH-1 is confirmed without validation", errors)

    def test_redaction_hides_common_secrets(self):
        value = "Authorization: Bearer abc123 api_key=secret@example.com password=hunter2"
        redacted = labctl.redact_text(value)
        self.assertNotIn("abc123", redacted)
        self.assertNotIn("hunter2", redacted)
        self.assertIn("[REDACTED_TOKEN]", redacted)

    def test_redaction_preserves_uuid_and_masks_phone(self):
        case_id = "90bd87e1-d778-4b58-8748-99f958ef1407"
        value = f"case={case_id} phone=13800138000"
        redacted = labctl.redact_text(value)
        self.assertIn(case_id, redacted)
        self.assertNotIn("13800138000", redacted)

    def test_sync_report_restores_canonical_sources(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            report_path = case / "report.json"
            report = json.loads(report_path.read_text(encoding="utf-8"))
            report["evidence"] = [{"evidence_id": "EV-STALE1"}]
            report_path.write_text(json.dumps(report), encoding="utf-8")
            self.assertEqual(labctl.command_sync_report(Namespace(case=str(case))), 0)
            synced = json.loads(report_path.read_text(encoding="utf-8"))
            self.assertEqual(synced["evidence"], [])
            self.assertEqual(labctl.command_validate(Namespace(case=str(case))), 0)

    def test_checkpoint_rejects_artifact_outside_case(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            case = self.create_case(root)
            outside = root / "outside.txt"
            outside.write_text("outside", encoding="utf-8")
            args = Namespace(
                case=str(case),
                state="paused",
                completed=[],
                pending=[],
                artifact=[str(outside)],
                evidence=[],
                claim=[],
            )
            with self.assertRaises(ValueError):
                labctl.command_checkpoint(args)

    def test_render_valid_case(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            self.assertEqual(labctl.command_render(Namespace(case=str(case), output=None)), 0)
            report = (case / "report.md").read_text(encoding="utf-8")
            self.assertIn("# Defensive AI Lab Report", report)

    def write_fixture(self, directory: Path, name: str, content: str) -> Path:
        path = Path(directory) / name
        path.write_text(content, encoding="utf-8")
        return path

    def add_confirmed_finding(self, case: Path) -> None:
        findings = [{
            "finding_id": "F-AUTH-1",
            "title": "Missing cross-tenant authorization check",
            "state": "confirmed",
            "severity": "high",
            "claim": "cross-tenant read returns 200",
            "evidence_ids": ["EV-1"],
            "conflicting_evidence_ids": [],
            "remediation": "add tenant filter",
            "validation": "regression test passes",
            "limitations": ["mock environment only"],
        }]
        (case / "findings.json").write_text(json.dumps(findings), encoding="utf-8")
        evidence = [{
            "evidence_id": "EV-1",
            "case_id": json.loads((case / "manifest.json").read_text(encoding="utf-8"))["case_id"],
            "source_type": "local_test",
            "provenance": "tests/test_auth.py::test_cross_tenant_read",
            "locator": "source:tests/test_auth.py:42",
            "sha256": "a" * 64,
            "observed_at": "2026-07-19T00:00:00Z",
            "redacted": True,
            "summary": "cross-tenant read returned 200",
        }]
        (case / "evidence.json").write_text(json.dumps(evidence), encoding="utf-8")

    def test_import_sarif_normalizes_results(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            sarif = self.write_fixture(directory, "sample.sarif", json.dumps({
                "version": "2.1.0",
                "runs": [{
                    "tool": {"driver": {"name": "semgrep", "version": "1.45.0"}},
                    "results": [{
                        "ruleId": "python.security.dangerous-subprocess",
                        "level": "warning",
                        "message": {"text": "shell=True"},
                        "locations": [{"physicalLocation": {"artifactLocation": {"uri": "src/server.py"}, "region": {"startLine": 42, "endLine": 42, "snippet": {"text": "subprocess.call(x, shell=True)"}}}}],
                    }],
                }],
            }))
            args = Namespace(case=str(case), input=str(sarif))
            self.assertEqual(labctl.command_import_sarif(args), 0)
            imports = list((case / "artifacts" / "imports").glob("sarif-*.json"))
            self.assertEqual(len(imports), 1)
            data = json.loads(imports[0].read_text(encoding="utf-8"))
            self.assertEqual(data["tool"]["name"], "semgrep")
            self.assertEqual(len(data["results"]), 1)
            self.assertEqual(data["results"][0]["rule_id"], "python.security.dangerous-subprocess")

    def test_import_sbom_cyclonedx(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            sbom = self.write_fixture(directory, "sbom.json", json.dumps({
                "bomFormat": "CycloneDX",
                "components": [
                    {"name": "requests", "version": "2.28.1", "purl": "pkg:pypi/requests@2.28.1", "licenses": [{"license": {"id": "Apache-2.0"}}], "supplier": {"name": "PSF"}, "scope": "required"},
                ],
            }))
            args = Namespace(case=str(case), input=str(sbom))
            self.assertEqual(labctl.command_import_sbom(args), 0)
            data = json.loads(next((case / "artifacts" / "imports").glob("sbom-*.json")).read_text(encoding="utf-8"))
            self.assertEqual(data["format"], "cyclonedx")
            self.assertEqual(data["components"][0]["name"], "requests")

    def test_import_tests_pytest(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            pytest_report = self.write_fixture(directory, "pytest.json", json.dumps({
                "tests": [
                    {"nodeid": "tests/test_auth.py::test_owner_read", "name": "test_owner_read", "outcome": "passed", "duration": 0.12},
                    {"nodeid": "tests/test_auth.py::test_cross_owner_read", "name": "test_cross_owner_read", "outcome": "failed", "duration": 0.08, "longrepr": "AssertionError: expected 403 got 200"},
                ],
            }))
            args = Namespace(case=str(case), input=str(pytest_report), framework="pytest")
            self.assertEqual(labctl.command_import_tests(args), 0)
            data = json.loads(next((case / "artifacts" / "imports").glob("tests-*.json")).read_text(encoding="utf-8"))
            self.assertEqual(data["framework"], "pytest")
            self.assertEqual(len(data["results"]), 2)
            self.assertEqual(data["results"][0]["status"], "passed")
            self.assertEqual(data["results"][1]["status"], "failed")

    def test_generate_auth_tests_pytest(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            args = Namespace(case=str(case), framework="pytest", app_module="myapp", output=None)
            self.assertEqual(labctl.command_generate_auth_tests(args), 0)
            output = case / "artifacts" / "test_authorization_regression.py"
            self.assertTrue(output.is_file())
            content = output.read_text(encoding="utf-8")
            self.assertIn("import pytest", content)
            self.assertIn("def test_auth_owner_read", content)
            self.assertIn("def test_auth_cross_tenant_read", content)

    def test_run_experiment_mock_provider(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            prompt = self.write_fixture(directory, "prompt.txt", "Analyze auth")
            dataset = self.write_fixture(directory, "dataset.json", '{"sample":1}')
            args = Namespace(case=str(case), model_alias="gpt-mock", prompt_file=str(prompt), dataset_file=str(dataset), temperature=0.7, max_tokens=256, provider="mock")
            self.assertEqual(labctl.command_run_experiment(args), 0)
            run = json.loads(next((case / "artifacts" / "experiments").glob("RUN-*.json")).read_text(encoding="utf-8"))
            self.assertEqual(run["status"], "completed")
            self.assertEqual(run["model_alias"], "gpt-mock")
            self.assertTrue(run["metrics"]["assertions_passed"] >= 1)

    def test_knowledge_promote_requires_confirmed_finding(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            args = Namespace(case=str(case), finding_id="F-MISSING", defensive_control="authorization", language="python", framework="flask", expires_days=365)
            with self.assertRaises(ValueError):
                labctl.command_knowledge_promote(args)

    def test_knowledge_promote_and_retrieve(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            self.add_confirmed_finding(case)
            promote_args = Namespace(case=str(case), finding_id="F-AUTH-1", defensive_control="authorization", language="python", framework="flask", expires_days=365)
            self.assertEqual(labctl.command_knowledge_promote(promote_args), 0)
            retrieve_args = Namespace(case=str(case), defensive_control="authorization", min_tier="T0", limit=5)
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(labctl.command_knowledge_retrieve(retrieve_args), 0)
            chunks = json.loads(buf.getvalue())
            self.assertEqual(len(chunks), 1)
            self.assertEqual(chunks[0]["trust_tier"], "T0")
            self.assertEqual(chunks[0]["defensive_control"], "authorization")

    def test_approve_creates_record(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            args = Namespace(case=str(case), request="promote F-1", decision="approved", approved_by="alice", justification="reviewed")
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(labctl.command_approve(args), 0)
            approval_id = buf.getvalue().strip()
            self.assertTrue(approval_id.startswith("AP-"))
            record = json.loads((case / "approvals" / f"{approval_id}.json").read_text(encoding="utf-8"))
            self.assertEqual(record["decision"], "approved")
            self.assertEqual(record["approved_by"], "alice")

    def test_sqlite_backend_roundtrip(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            args = Namespace(
                workflow="local_security_review",
                workspace=str(Path(directory)),
                root=str(Path(directory) / "sqlite-cases"),
                scope=["src"],
                output=["markdown", "json"],
                profile="low",
                concurrency=1,
                timeout=30,
                loopback=False,
                backend="sqlite",
            )
            self.assertEqual(labctl.command_init(args), 0)
            sqlite_case = next((Path(directory) / "sqlite-cases").iterdir())
            self.assertTrue((sqlite_case / "case.db").is_file())
            self.assertTrue((sqlite_case / "backend.json").is_file())
            backend_config = json.loads((sqlite_case / "backend.json").read_text(encoding="utf-8"))
            self.assertEqual(backend_config["backend"], "sqlite")

    def test_knowledge_search_returns_relevant_chunks(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            self.add_confirmed_finding(case)
            promote_args = Namespace(case=str(case), finding_id="F-AUTH-1", defensive_control="authorization", language="python", framework="flask", expires_days=365)
            self.assertEqual(labctl.command_knowledge_promote(promote_args), 0)
            search_args = Namespace(case=str(case), query="cross tenant authorization", limit=3, min_score=0.0)
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(labctl.command_knowledge_search(search_args), 0)
            results = json.loads(buf.getvalue())
            self.assertGreater(len(results), 0)
            self.assertIn("score", results[0])
            self.assertGreater(results[0]["score"], 0.0)

    def test_export_sarif_produces_valid_document(self):
        with tempfile.TemporaryDirectory() as directory:
            case = self.create_case(Path(directory))
            self.add_confirmed_finding(case)
            labctl.command_sync_report(Namespace(case=str(case)))
            args = Namespace(case=str(case), output=None)
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(labctl.command_export_sarif(args), 0)
            sarif_path = Path(buf.getvalue().strip())
            sarif = json.loads(sarif_path.read_text(encoding="utf-8"))
            self.assertEqual(sarif["version"], "2.1.0")
            self.assertEqual(len(sarif["runs"]), 1)
            run = sarif["runs"][0]
            self.assertEqual(run["tool"]["driver"]["name"], "defensive-ai-lab")
            self.assertEqual(len(run["results"]), 1)
            self.assertEqual(run["results"][0]["ruleId"], "F-AUTH-1")
            self.assertEqual(run["results"][0]["level"], "error")

    def test_vector_index_deterministic(self):
        import sys
        sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
        from vector_index import KnowledgeIndex, TfidfVectorizer, cosine_similarity

        chunks = [
            {"chunk_id": "CH-A", "defensive_control": "authorization", "framework": "flask", "language": "python", "locator": "F-1", "content_sha256": "aaa"},
            {"chunk_id": "CH-B", "defensive_control": "injection", "framework": "django", "language": "python", "locator": "F-2", "content_sha256": "bbb"},
        ]
        with tempfile.TemporaryDirectory() as directory:
            index_path = Path(directory) / "index.json"
            index = KnowledgeIndex(index_path)
            index.build(chunks)
            results = index.search("authorization flask", limit=2)
            self.assertEqual(results[0]["chunk_id"], "CH-A")
            # Reload and verify determinism
            reloaded = KnowledgeIndex.load(index_path)
            results2 = reloaded.search("authorization flask", limit=2)
            self.assertEqual(results2[0]["chunk_id"], "CH-A")
            self.assertAlmostEqual(results[0]["score"], results2[0]["score"], places=6)

    def test_llm_provider_missing_config_raises(self):
        import sys
        sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
        from llm_provider import LlmProvider, MissingConfiguration
        # Clear any matching env vars
        import os
        for key in list(os.environ):
            if key.startswith("USER_LLM_"):
                del os.environ[key]
        with self.assertRaises(MissingConfiguration):
            LlmProvider.from_environment()
        self.assertFalse(LlmProvider.is_configured())

    def test_sqlite_backend_upsert_and_get(self):
        import sys
        sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
        from storage_sqlite import SQLiteBackend
        with tempfile.TemporaryDirectory() as directory:
            backend = SQLiteBackend(Path(directory) / "test.db")
            revision = backend.upsert("case-1", "evidence", "EV-1", {"evidence_id": "EV-1"}, "2026-07-19T00:00:00Z")
            self.assertEqual(revision, 1)
            revision = backend.upsert("case-1", "evidence", "EV-1", {"evidence_id": "EV-1", "updated": True}, "2026-07-19T00:00:01Z")
            self.assertEqual(revision, 2)
            record = backend.get("case-1", "evidence", "EV-1")
            self.assertIsNotNone(record)
            self.assertEqual(record["payload"]["evidence_id"], "EV-1")
            self.assertTrue(record["payload"]["updated"])
            self.assertEqual(record["revision"], 2)


if __name__ == "__main__":
    unittest.main()
