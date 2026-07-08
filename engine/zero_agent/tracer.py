"""Execution tracer for Zero Apex.

Inspired by LangChain tracers. Records every tool call, decision,
and phase transition as a trace span for debugging and analysis.
"""
from __future__ import annotations
import time, json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class TraceSpan:
    """Single trace span representing one operation."""
    span_id: str
    parent_id: Optional[str] = None
    name: str = ''
    span_type: str = 'tool_call'  # tool_call / decision / phase / error
    start_time: float = field(default_factory=time.time)
    end_time: float = 0.0
    status: str = 'ok'  # ok / error / blocked
    input_data: Any = None
    output_data: Any = None
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def duration_ms(self) -> float:
        if self.end_time == 0.0: return 0.0
        return round((self.end_time - self.start_time) * 1000, 2)

    def end(self, status: str = 'ok', output: Any = None):
        self.end_time = time.time()
        self.status = status
        self.output_data = output

    def to_dict(self) -> Dict[str, Any]:
        return {
            'span_id': self.span_id, 'parent_id': self.parent_id,
            'name': self.name, 'type': self.span_type,
            'duration_ms': self.duration_ms, 'status': self.status,
            'tags': self.tags, 'metadata': self.metadata,
        }


class Tracer:
    """Execution tracing system.

    Records every significant operation as a trace span.
    Provides timeline view, statistics, and error analysis.

    Examples:

        >>> tracer = Tracer()
        >>> span = tracer.start_span('read_file', tags={'path': '/tmp/x.py'})
        >>> span.end(status='ok', output='file contents')
        >>> print(tracer.summary())
    """

    def __init__(self, max_spans: int = 1000):
        self._spans: List[TraceSpan] = []
        self._max_spans = max_spans
        self._span_counter = 0
        self._active_spans: Dict[str, TraceSpan] = {}

    def _next_id(self) -> str:
        self._span_counter += 1
        return f'span_{self._span_counter:06d}'

    def start_span(self, name: str, span_type: str = 'tool_call',
                   parent_id: Optional[str] = None,
                   tags: Optional[Dict] = None,
                   **metadata) -> TraceSpan:
        span_id = self._next_id()
        span = TraceSpan(
            span_id=span_id, parent_id=parent_id, name=name,
            span_type=span_type, tags=tags or {}, metadata=metadata,
        )
        self._spans.append(span)
        self._active_spans[span_id] = span
        if len(self._spans) > self._max_spans:
            self._spans = self._spans[-self._max_spans:]
        return span

    def end_span(self, span_id: str, status: str = 'ok', output: Any = None):
        span = self._active_spans.pop(span_id, None)
        if span:
            span.end(status, output)

    def trace_call(self, name: str, func, *args, **kwargs):
        """Trace a function call automatically."""
        span = self.start_span(name, tags={'args': str(args)[:200]})
        try:
            result = func(*args, **kwargs)
            span.end('ok', str(result)[:500])
            return result
        except Exception as e:
            span.end('error', str(e)[:500])
            raise

    def get_spans(self, span_type: str = '', status: str = '',
                  limit: int = 100) -> List[TraceSpan]:
        results = self._spans
        if span_type:
            results = [s for s in results if s.span_type == span_type]
        if status:
            results = [s for s in results if s.status == status]
        return results[-limit:]

    def get_errors(self) -> List[TraceSpan]:
        return [s for s in self._spans if s.status == 'error']

    def get_slow_operations(self, min_ms: float = 1000) -> List[TraceSpan]:
        return [s for s in self._spans if s.duration_ms >= min_ms]

    def summary(self) -> Dict[str, Any]:
        total = len(self._spans)
        errors = sum(1 for s in self._spans if s.status == 'error')
        total_ms = sum(s.duration_ms for s in self._spans)
        by_type = {}
        for s in self._spans:
            by_type[s.span_type] = by_type.get(s.span_type, 0) + 1
        return {
            'total_spans': total,
            'errors': errors,
            'error_rate': round(errors / max(1, total) * 100, 1),
            'total_duration_ms': round(total_ms, 1),
            'avg_duration_ms': round(total_ms / max(1, total), 1),
            'by_type': by_type,
            'slow_operations': len(self.get_slow_operations()),
        }

    def to_timeline(self, limit: int = 50) -> List[str]:
        lines = []
        for s in self._spans[-limit:]:
            status_icon = '[OK]' if s.status == 'ok' else '[ERR]' if s.status == 'error' else '[X]'
            lines.append(f'{status_icon} {s.span_type}: {s.name} ({s.duration_ms:.0f}ms) [{s.span_id}]')
        return lines

    def export_json(self) -> str:
        return json.dumps([s.to_dict() for s in self._spans], ensure_ascii=False)

    def reset(self):
        self._spans.clear()
        self._active_spans.clear()
        self._span_counter = 0
