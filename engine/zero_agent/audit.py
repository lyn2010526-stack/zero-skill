"""Audit logging system for Zero Apex."""
from __future__ import annotations
import json, time, threading
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

@dataclass
class AuditEntry:
    """Single audit log entry."""
    timestamp: float = field(default_factory=time.time)
    event_type: str = ''          # tool_call / decision / violation / system / memory
    action: str = ''              # read_file / delete / policy_apply / etc
    target: str = ''              # file path / tool name / module name
    success: bool = True
    exit_code: Optional[int] = None
    details: Dict[str, Any] = field(default_factory=dict)
    risk_level: str = 'S0'       # S0-S4
    violation: bool = False
    violation_type: str = ''      # hallucination / deletion / rate_limit / firewall
    duration_ms: float = 0.0
    session_id: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


class AuditLogger:
    """Thread-safe audit logging system.
    
    Records every significant action: tool calls, policy decisions,
    violations, errors, memory operations. Logs are stored in JSONL
    format (one JSON object per line) for easy parsing.
    
    Args:
        log_dir: Directory to store audit logs.
        max_entries_in_memory: Max entries to buffer before flushing.
    
    Examples:
        
        >>> logger = AuditLogger('/tmp/zero-audit')
        >>> logger.log_tool_call('read_file', '/sdcard/app.py', exit_code=0)
        >>> logger.log_violation('hallucination', 'No evidence for claim')
        >>> entries = logger.query(event_type='violation')
    """
    
    def __init__(self, log_dir: str | Path = '/tmp/zero-audit',
                 max_entries_in_memory: int = 100):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._buffer: List[AuditEntry] = []
        self._lock = threading.Lock()
        self._max_buffer = max_entries_in_memory
        self._total_entries = 0
        self._total_violations = 0
        self._current_session_id = f'session_{int(time.time())}'
        
        # Stats
        self._stats: Dict[str, int] = {
            'tool_calls': 0,
            'decisions': 0,
            'violations': 0,
            'errors': 0,
            'memory_ops': 0,
            'system_events': 0,
        }
    
    @property
    def session_id(self) -> str:
        return self._current_session_id
    
    def _write_entry(self, entry: AuditEntry):
        """Write a single entry to the log file."""
        log_file = self.log_dir / f'{self._current_session_id}.jsonl'
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(entry.to_json() + '\n')
        except Exception:
            pass  # Audit logging should never crash the system
    
    def _flush_buffer(self):
        """Flush buffered entries to disk."""
        for entry in self._buffer:
            self._write_entry(entry)
        self._buffer.clear()
    
    def log(self, event_type: str, action: str, target: str = '',
            success: bool = True, exit_code: Optional[int] = None,
            details: Optional[Dict[str, Any]] = None,
            risk_level: str = 'S0', violation: bool = False,
            violation_type: str = '', duration_ms: float = 0.0) -> AuditEntry:
        """Log an audit event.
        
        Args:
            event_type: Category (tool_call, decision, violation, system, memory).
            action: Action name (read_file, delete, policy_apply, etc).
            target: Target resource (file path, tool name).
            success: Whether the action succeeded.
            exit_code: Exit code if applicable.
            details: Additional key-value details.
            risk_level: Risk level S0-S4.
            violation: Whether this is a violation.
            violation_type: Type of violation.
            duration_ms: Action duration.
            
        Returns:
            The AuditEntry that was logged.
        """
        entry = AuditEntry(
            timestamp=time.time(),
            event_type=event_type,
            action=action,
            target=target,
            success=success,
            exit_code=exit_code,
            details=details or {},
            risk_level=risk_level,
            violation=violation,
            violation_type=violation_type,
            duration_ms=duration_ms,
            session_id=self._current_session_id,
        )
        
        with self._lock:
            self._buffer.append(entry)
            self._total_entries += 1
            self._stats[event_type] = self._stats.get(event_type, 0) + 1
            if violation:
                self._total_violations += 1
            if len(self._buffer) >= self._max_buffer:
                self._flush_buffer()
        
        return entry
    
    def log_tool_call(self, tool_name: str, target: str = '',
                      success: bool = True, exit_code: Optional[int] = None,
                      duration_ms: float = 0.0, **details) -> AuditEntry:
        """Convenience: log a tool call."""
        return self.log('tool_call', tool_name, target, success, exit_code,
                        details, duration_ms=duration_ms)
    
    def log_decision(self, action: str, reason: str = '',
                     **details) -> AuditEntry:
        """Convenience: log a decision."""
        d = {'reason': reason, **details}
        return self.log('decision', action, details=d)
    
    def log_violation(self, violation_type: str, description: str = '',
                      **details) -> AuditEntry:
        """Convenience: log a violation."""
        d = {'description': description, **details}
        return self.log('violation', violation_type, violation=True,
                        violation_type=violation_type, details=d)
    
    def log_memory(self, action: str, target: str = '',
                   **details) -> AuditEntry:
        """Convenience: log a memory operation."""
        return self.log('memory', action, target, details=details)
    
    def log_error(self, action: str, error: str = '',
                  **details) -> AuditEntry:
        """Convenience: log an error."""
        d = {'error': error, **details}
        return self.log('system', action, success=False, details=d)
    
    def flush(self):
        """Force flush all buffered entries to disk."""
        with self._lock:
            self._flush_buffer()
    
    def query(self, event_type: str = '', action: str = '',
              violation_only: bool = False,
              limit: int = 100) -> List[AuditEntry]:
        """Query audit entries from current session."""
        results = []
        log_file = self.log_dir / f'{self._current_session_id}.jsonl'
        if not log_file.exists():
            return results
        
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    entry = AuditEntry(**data)
                    if violation_only and not entry.violation:
                        continue
                    if event_type and entry.event_type != event_type:
                        continue
                    if action and entry.action != action:
                        continue
                    results.append(entry)
                    if len(results) >= limit:
                        break
                except (json.JSONDecodeError, TypeError):
                    continue
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Return audit statistics."""
        with self._lock:
            return {
                'total_entries': self._total_entries,
                'total_violations': self._total_violations,
                'violations_per_100': round(
                    self._total_violations / max(1, self._total_entries) * 100, 1),
                'by_type': dict(self._stats),
                'session_id': self._current_session_id,
                'buffered': len(self._buffer),
            }
    
    def get_violation_rate(self) -> float:
        """Return violation rate (0.0 to 1.0)."""
        with self._lock:
            if self._total_entries == 0:
                return 0.0
            return self._total_violations / self._total_entries
    
    def summary(self) -> str:
        """Return a human-readable summary."""
        stats = self.get_stats()
        lines = [
            f'Audit Session: {stats["session_id"]}',
            f'Total entries: {stats["total_entries"]}',
            f'Violations: {stats["total_violations"]} ({stats["violations_per_100"]}%)',
        ]
        for k, v in stats['by_type'].items():
            if v > 0:
                lines.append(f'  {k}: {v}')
        return '\n'.join(lines)
