"""SQLite storage backend for Defensive AI Lab cases.

Provides indexed, transactional storage for checkpoints, evidence, findings,
audit events, and knowledge chunks. Replaces the default JSON-file backend
when a case is initialized with `--backend sqlite`.

The module uses only the Python standard library. It never contacts the
network and stores no secrets. All writes occur inside transactions with
WAL mode disabled to keep the on-disk representation simple and auditable.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any, Iterator


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS records (
    case_id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    record_id TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (case_id, namespace, record_id)
);

CREATE TABLE IF NOT EXISTS audit_chain (
    case_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    event TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    previous_hash TEXT,
    payload TEXT NOT NULL,
    PRIMARY KEY (case_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_records_namespace
    ON records(case_id, namespace);

CREATE INDEX IF NOT EXISTS idx_audit_case
    ON audit_chain(case_id, sequence);
"""


class SQLiteBackend:
    """Thread-safe, transactional storage backend.

    Concurrency model: one writer per case, protected by a per-case lock.
    Readers use read-only transactions and may observe a committed snapshot.
    Every mutation returns the new revision so callers can detect stale reads.
    """

    _locks: dict[str, threading.Lock] = {}
    _locks_guard = threading.Lock()

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_schema()

    @classmethod
    def _lock_for(cls, case_id: str) -> threading.Lock:
        with cls._locks_guard:
            if case_id not in cls._locks:
                cls._locks[case_id] = threading.Lock()
            return cls._locks[case_id]

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, isolation_level=None, timeout=30.0)
        connection.execute("PRAGMA journal_mode=DELETE")
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA synchronous=FULL")
        return connection

    def _initialize_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(SCHEMA_SQL)

    def upsert(self, case_id: str, namespace: str, record_id: str, payload: dict[str, Any], now: str) -> int:
        lock = self._lock_for(case_id)
        with lock:
            with self._connect() as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT revision FROM records WHERE case_id=? AND namespace=? AND record_id=?",
                    (case_id, namespace, record_id),
                ).fetchone()
                revision = (row[0] + 1) if row else 1
                connection.execute(
                    """
                    INSERT INTO records (case_id, namespace, record_id, revision, payload, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(case_id, namespace, record_id) DO UPDATE SET
                        revision=excluded.revision,
                        payload=excluded.payload,
                        updated_at=excluded.updated_at
                    """,
                    (case_id, namespace, record_id, revision, json.dumps(payload, ensure_ascii=False, sort_keys=True), now, now),
                )
                connection.execute("COMMIT")
                return revision

    def get(self, case_id: str, namespace: str, record_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT payload, revision FROM records WHERE case_id=? AND namespace=? AND record_id=?",
                (case_id, namespace, record_id),
            ).fetchone()
        if row is None:
            return None
        return {"payload": json.loads(row[0]), "revision": row[1]}

    def list(self, case_id: str, namespace: str) -> Iterator[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload, revision FROM records WHERE case_id=? AND namespace=? ORDER BY record_id",
                (case_id, namespace),
            ).fetchall()
        for row in rows:
            payload = json.loads(row[0])
            payload["_revision"] = row[1]
            yield payload

    def delete(self, case_id: str, namespace: str, record_id: str) -> bool:
        lock = self._lock_for(case_id)
        with lock:
            with self._connect() as connection:
                cursor = connection.execute(
                    "DELETE FROM records WHERE case_id=? AND namespace=? AND record_id=?",
                    (case_id, namespace, record_id),
                )
                return cursor.rowcount > 0

    def append_audit(self, case_id: str, sequence: int, event: str, event_hash: str, previous_hash: str | None, payload: dict[str, Any]) -> None:
        lock = self._lock_for(case_id)
        with lock:
            with self._connect() as connection:
                connection.execute(
                    """
                    INSERT INTO audit_chain (case_id, sequence, event, event_hash, previous_hash, payload)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (case_id, sequence, event, event_hash, previous_hash, json.dumps(payload, ensure_ascii=False, sort_keys=True)),
                )

    def read_audit(self, case_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT sequence, event, event_hash, previous_hash, payload FROM audit_chain WHERE case_id=? ORDER BY sequence",
                (case_id,),
            ).fetchall()
        return [
            {"sequence": row[0], "event": row[1], "event_hash": row[2], "previous_hash": row[3], "payload": json.loads(row[4])}
            for row in rows
        ]

    def verify_audit_chain(self, case_id: str, recompute_hash) -> list[str]:
        errors: list[str] = []
        previous_hash = None
        for index, record in enumerate(self.read_audit(case_id), start=1):
            if record["sequence"] != index:
                errors.append(f"audit sequence mismatch at record {index}")
            if record["previous_hash"] != previous_hash:
                errors.append(f"audit previous hash mismatch at record {index}")
            canonical = json.dumps(record["payload"], ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("utf-8")
            expected_hash = recompute_hash(record["sequence"], record["event"], record["previous_hash"], canonical)
            if record["event_hash"] != expected_hash:
                errors.append(f"audit event hash mismatch at record {index}")
            previous_hash = record["event_hash"]
        return errors

    def stats(self) -> dict[str, int]:
        with self._connect() as connection:
            records = connection.execute("SELECT COUNT(*) FROM records").fetchone()[0]
            audit = connection.execute("SELECT COUNT(*) FROM audit_chain").fetchone()[0]
        return {"records": records, "audit_events": audit}
