"""Rate limiter for tool calls."""
from __future__ import annotations
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

@dataclass
class LimiterState:
    total_calls: int = 0
    tool_calls: Dict[str, int] = field(default_factory=dict)
    errors: Dict[str, int] = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)
    last_call_time: float = 0.0
    consecutive_same_tool: int = 0
    last_tool_name: str = ''
    paused: bool = False
    pause_reason: str = ''

class RateLimiter:
    MAX_TOTAL = 50
    MAX_SAME_TOOL = 3
    MAX_SAME_ERROR = 2
    MAX_SINGLE_CALL_MS = 30000
    MAX_TOTAL_SECONDS = 600
    WARNING_THRESHOLD = 30

    def __init__(self): self.state = LimiterState()

    def check(self, tool_name: str) -> tuple[bool, str]:
        if self.state.paused: return False, self.state.pause_reason
        elapsed = time.time() - self.state.start_time
        if elapsed > self.MAX_TOTAL_SECONDS:
            self.state.paused = True
            self.state.pause_reason = f'总耗时超过{self.MAX_TOTAL_SECONDS}秒，任务中断'
            return False, self.state.pause_reason
        if self.state.total_calls >= self.MAX_TOTAL:
            self.state.paused = True
            self.state.pause_reason = f'工具调用达到{self.MAX_TOTAL}次上限，任务暂停'
            return False, self.state.pause_reason
        if tool_name == self.state.last_tool_name:
            self.state.consecutive_same_tool += 1
            if self.state.consecutive_same_tool >= self.MAX_SAME_TOOL:
                return False, f'同一工具连续调用{self.state.consecutive_same_tool}次，暂停分析'
        else:
            self.state.consecutive_same_tool = 1
            self.state.last_tool_name = tool_name
        error_count = self.state.errors.get(tool_name, 0)
        if error_count >= self.MAX_SAME_ERROR:
            return False, f'工具 {tool_name} 连续失败{error_count}次，禁止使用'
        warnings = []
        if self.state.total_calls >= self.WARNING_THRESHOLD:
            warnings.append(f'接近调用上限({self.state.total_calls}/{self.MAX_TOTAL})')
        return True, '; '.join(warnings) if warnings else 'ok'

    def record_call(self, tool_name: str, success: bool = True, duration_ms: float = 0.0):
        self.state.total_calls += 1
        self.state.tool_calls[tool_name] = self.state.tool_calls.get(tool_name, 0) + 1
        self.state.last_call_time = time.time()
        if not success:
            self.state.errors[tool_name] = self.state.errors.get(tool_name, 0) + 1
        else:
            self.state.errors[tool_name] = 0

    def record_error(self, tool_name: str):
        self.state.errors[tool_name] = self.state.errors.get(tool_name, 0) + 1
        if self.state.errors[tool_name] >= self.MAX_SAME_ERROR:
            self.state.paused = True
            self.state.pause_reason = f'工具 {tool_name} 连续失败，切换方案'

    def reset(self):
        self.state = LimiterState()

    def get_stats(self) -> Dict:
        elapsed = time.time() - self.state.start_time
        return {
            'total_calls': self.state.total_calls,
            'remaining': self.MAX_TOTAL - self.state.total_calls,
            'elapsed_seconds': round(elapsed, 1),
            'tool_breakdown': dict(self.state.tool_calls),
            'errors': dict(self.state.errors),
            'paused': self.state.paused,
            'pause_reason': self.state.pause_reason,
        }
