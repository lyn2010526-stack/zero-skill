"""Tool registry and execution framework.

Inspired by LangChain tools + AutoGen tool_agent.
Provides tool registration, validation, execution, and safety checking.
"""
from __future__ import annotations
import time, json, traceback
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class ToolRisk(Enum):
    SAFE = 0        # read_file, list_files, search
    LOW = 1         # edit_file, write_file
    MEDIUM = 2      # terminal, shell
    HIGH = 3        # delete_file, move_file
    CRITICAL = 4    # system commands, root access


class ToolStatus(Enum):
    AVAILABLE = 'available'
    DISABLED = 'disabled'
    RATE_LIMITED = 'rate_limited'
    BLOCKED = 'blocked'
    ERROR = 'error'


@dataclass
class ToolDefinition:
    """Complete tool definition with metadata."""
    name: str
    description: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    risk: ToolRisk = ToolRisk.SAFE
    requires_confirmation: bool = False
    timeout_seconds: int = 30
    max_calls_per_task: int = 50
    tags: List[str] = field(default_factory=list)
    handler: Optional[Callable] = None

    def matches_query(self, query: str) -> float:
        """Score how relevant this tool is to a query."""
        q = query.lower()
        score = 0.0
        if self.name.lower() in q: score += 0.5
        for word in self.name.lower().replace('_', ' ').split():
            if word in q: score += 0.15
        for tag in self.tags:
            if tag.lower() in q: score += 0.1
        desc_words = self.description.lower().split()
        matched = sum(1 for w in desc_words if w in q)
        score += min(matched * 0.05, 0.3)
        return min(score, 1.0)


@dataclass
class ToolResult:
    """Result of a tool execution."""
    tool_name: str
    success: bool
    output: Any = None
    error: str = ''
    duration_ms: float = 0.0
    exit_code: Optional[int] = None
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def summary(self) -> str:
        if self.success:
            return f'{self.tool_name}: OK ({self.duration_ms:.0f}ms)'
        return f'{self.tool_name}: FAILED - {self.error}'


class ToolRegistry:
    """Central tool registry with safety validation.

    Combines LangChain's tool pattern with AutoGen's tool agent concept
    and adds Zero Apex's safety validation layer.

    Examples:

        >>> registry = ToolRegistry()
        >>> registry.register(ToolDefinition(name='read_file', description='Read a file'))
        >>> result = registry.execute('read_file', {'path': '/tmp/test.txt'})
    """

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._call_counts: Dict[str, int] = {}
        self._call_history: List[Dict] = []
        self._blocked: set = set()

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def register_function(self, name: str, description: str,
                          handler: Callable, risk: ToolRisk = ToolRisk.SAFE,
                          **kwargs) -> None:
        self.register(ToolDefinition(name=name, description=description,
                                     handler=handler, risk=risk, **kwargs))

    def unregister(self, name: str) -> bool:
        return self._tools.pop(name, None) is not None

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [{'name': t.name, 'description': t.description,
                'risk': t.risk.value, 'tags': t.tags} for t in self._tools.values()]

    def search(self, query: str, top_k: int = 5) -> List[ToolDefinition]:
        scored = [(tool, tool.matches_query(query)) for tool in self._tools.values()]
        scored.sort(key=lambda x: -x[1])
        return [t for t, s in scored[:top_k] if s > 0]

    def can_execute(self, name: str) -> tuple[bool, str]:
        tool = self._tools.get(name)
        if not tool: return False, f'Tool {name} not found'
        if name in self._blocked: return False, f'Tool {name} is blocked due to repeated errors'
        count = self._call_counts.get(name, 0)
        if count >= tool.max_calls_per_task: return False, f'Tool {name} call limit reached ({count}/{tool.max_calls_per_task})'
        return True, 'ok'

    def execute(self, name: str, params: Optional[Dict] = None,
                context: Optional[Dict] = None) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(name, False, error=f'Tool {name} not found')
        if name in self._blocked:
            return ToolResult(name, False, error=f'Tool {name} is blocked')
        count = self._call_counts.get(name, 0)
        if count >= tool.max_calls_per_task:
            return ToolResult(name, False, error=f'Tool {name} call limit reached')
        if not tool.handler:
            return ToolResult(name, False, error=f'Tool {name} has no handler')

        start = time.time()
        self._call_counts[name] = count + 1
        try:
            output = tool.handler(**(params or {}))
            duration = (time.time() - start) * 1000
            result = ToolResult(name, True, output=output, duration_ms=duration)
            self._call_history.append({'tool': name, 'success': True, 'ms': round(duration)})
            return result
        except Exception as e:
            duration = (time.time() - start) * 1000
            self._call_counts[name] = self._call_counts.get(name, 0) + 1
            if self._call_counts[name] >= 3:
                self._blocked.add(name)
            result = ToolResult(name, False, error=str(e), duration_ms=duration)
            self._call_history.append({'tool': name, 'success': False, 'error': str(e)[:100]})
            return result

    def reset_counts(self):
        self._call_counts.clear()
        self._blocked.clear()

    def get_stats(self) -> Dict[str, Any]:
        total = len(self._call_history)
        success = sum(1 for h in self._call_history if h['success'])
        return {
            'total_tools': len(self._tools),
            'total_calls': total,
            'success_rate': round(success / max(1, total) * 100, 1),
            'blocked': list(self._blocked),
            'call_counts': dict(self._call_counts),
        }
