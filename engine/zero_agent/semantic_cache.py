"""Semantic cache for Zero Apex.

Caches task results by semantic similarity. If a new task is sufficiently
similar to a cached task, returns the cached result directly.

Inspired by LangChain caches + mem0 retrieval caching.
"""
from __future__ import annotations
import time, math
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


def _text_vector(text: str, dim: int = 128) -> List[float]:
    v = [0.0] * dim
    for c in text:
        v[ord(c) % dim] += 1.0
    n = math.sqrt(sum(x*x for x in v))
    return [x/n for x in v] if n > 0 else v


def _cosine(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b): return 0.0
    d = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    return d/(na*nb) if na>0 and nb>0 else 0.0


@dataclass
class CacheEntry:
    key: str
    query_text: str
    query_vector: List[float] = field(default_factory=list)
    result: Any = None
    created_at: float = field(default_factory=time.time)
    hits: int = 0
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class SemanticCache:
    """Semantic similarity cache for task results.

    Args:
        similarity_threshold: Min cosine similarity to use cached result.
        max_entries: Max cache entries.
        ttl_seconds: Time-to-live for cache entries.

    Examples:

        >>> cache = SemanticCache()
        >>> cache.put('compile app', result={'status': 'ok'}, tags=['build'])
        >>> hit = cache.get('compile android app')
        >>> print(hit is not None)  # True (similar enough)
    """

    def __init__(self, similarity_threshold: float = 0.85,
                 max_entries: int = 200,
                 ttl_seconds: int = 3600):
        self._entries: Dict[str, CacheEntry] = {}
        self._threshold = similarity_threshold
        self._max = max_entries
        self._ttl = ttl_seconds
        self._hit_count = 0
        self._miss_count = 0

    def put(self, query: str, result: Any = None,
            tags: Optional[List[str]] = None, **metadata) -> str:
        import hashlib
        key = hashlib.md5(query.encode()).hexdigest()[:12]
        entry = CacheEntry(
            key=key, query_text=query,
            query_vector=_text_vector(query),
            result=result, tags=tags or [], metadata=metadata,
        )
        self._entries[key] = entry
        if len(self._entries) > self._max:
            oldest = min(self._entries.values(), key=lambda e: e.hits)
            del self._entries[oldest.key]
        return key

    def get(self, query: str) -> Optional[Any]:
        qv = _text_vector(query)
        best_match = None
        best_score = 0.0
        now = time.time()
        for entry in self._entries.values():
            if now - entry.created_at > self._ttl:
                continue
            score = _cosine(qv, entry.query_vector)
            if score > best_score:
                best_score = score
                best_match = entry
        if best_match and best_score >= self._threshold:
            best_match.hits += 1
            self._hit_count += 1
            return best_match.result
        self._miss_count += 1
        return None

    def get_by_tag(self, tag: str) -> List[Dict]:
        return [{'query': e.query_text, 'result': str(e.result)[:200],
                'hits': e.hits} for e in self._entries.values() if tag in e.tags]

    def invalidate(self, key: str) -> bool:
        return self._entries.pop(key, None) is not None

    def clear(self):
        self._entries.clear()
        self._hit_count = 0
        self._miss_count = 0

    def get_stats(self) -> Dict[str, Any]:
        total = self._hit_count + self._miss_count
        return {
            'entries': len(self._entries),
            'hits': self._hit_count, 'misses': self._miss_count,
            'hit_rate': round(self._hit_count / max(1, total) * 100, 1),
            'ttl_seconds': self._ttl,
            'threshold': self._threshold,
        }
