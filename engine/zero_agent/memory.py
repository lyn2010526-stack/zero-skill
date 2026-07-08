"""Project memory: success/failure separated, no fake vector DB."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
@dataclass
class MemoryEntry:
    kind: str; project: str; summary: str; evidence: str = ''; created_at: str = ''
class ProjectMemory:
    def __init__(self): self.entries: list[MemoryEntry] = []
    def record_success(self, project: str, summary: str, evidence: str) -> MemoryEntry:
        e = MemoryEntry('success', project, summary, evidence, datetime.utcnow().isoformat()); self.entries.append(e); return e
    def record_failure(self, project: str, summary: str, evidence: str = '') -> MemoryEntry:
        e = MemoryEntry('failure', project, summary, evidence, datetime.utcnow().isoformat()); self.entries.append(e); return e
    def recall(self, project: str, kind: str | None = None) -> list[MemoryEntry]:
        return [e for e in self.entries if e.project == project and (kind is None or e.kind == kind)]
