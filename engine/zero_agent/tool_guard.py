"""ToolGuard: call budget, repeated failure and summary gate."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Optional

@dataclass
class ToolState:
    total_calls: int = 0
    last_tool: Optional[str] = None
    consecutive_current: int = 0
    failures_by_key: Dict[str, int] = field(default_factory=dict)
    blocked_tools: set[str] = field(default_factory=set)

class ToolGuard:
    def __init__(self, max_total: int = 80, max_consecutive_normal: int = 8, max_same_error: int = 3):
        self.max_total = max_total; self.max_consecutive_normal = max_consecutive_normal; self.max_same_error = max_same_error; self.state = ToolState()
    def before_call(self, tool_name: str) -> tuple[bool, str]:
        if tool_name in self.state.blocked_tools: return False, 'tool blocked after repeated failures'
        if self.state.total_calls >= self.max_total: return False, 'tool budget exceeded'
        if self.state.last_tool == tool_name:
            if self.state.consecutive_current >= self.max_consecutive_normal: return False, 'summarize before continuing same tool'
            self.state.consecutive_current += 1
        else:
            self.state.last_tool = tool_name; self.state.consecutive_current = 1
        self.state.total_calls += 1; return True, 'allowed'
    def record_failure(self, tool_name: str, error: str) -> tuple[bool, str]:
        key = f'{tool_name}:{self._normalize_error(error)}'; self.state.failures_by_key[key] = self.state.failures_by_key.get(key,0)+1
        if self.state.failures_by_key[key] >= self.max_same_error:
            self.state.blocked_tools.add(tool_name); return False, 'same error repeated, switch strategy'
        return True, 'retry allowed'
    def record_success(self, tool_name: str) -> None:
        for key in list(self.state.failures_by_key):
            if key.startswith(f'{tool_name}:'): del self.state.failures_by_key[key]
    def mark_summarized(self, tool_name: str | None = None) -> None:
        if tool_name is None or self.state.last_tool == tool_name: self.state.consecutive_current = 0
    def reset_task(self) -> None: self.state = ToolState()
    def _normalize_error(self, error: str) -> str: return ' '.join((error or '').lower().split())[:160]
