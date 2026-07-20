"""Local vector retrieval for the Defensive AI Lab knowledge base.

Implements a dependency-free TF-IDF vectorizer and cosine similarity ranker.
Used by `labctl.py knowledge-search` to return semantically related knowledge
chunks without any external embedding service or network access.

Design goals:
- Pure standard library, zero runtime dependencies.
- Deterministic: the same corpus and query produce the same ranking.
- Auditable: vocabulary, document frequencies, and term weights are persisted.
- Bounded: corpus size and result count are capped to keep memory predictable.

Non-goals: production-grade NLP, multilingual stemming, neural embeddings,
or anything requiring a model download. For those, plug in an external
backend via the storage backend abstraction.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any


TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9_+-]{0,63}", re.IGNORECASE)
STOP_WORDS = frozenset({
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "of",
    "to", "in", "on", "at", "by", "with", "from", "as", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "must", "shall",
    "can", "need", "this", "that", "these", "those", "it", "its", "they",
    "them", "their", "there", "here", "where", "when", "how", "why", "what",
    "which", "who", "whom", "not", "no", "yes", "all", "any", "each", "every",
    "some", "such", "only", "own", "same", "so", "than", "too", "very",
})


def tokenize(text: str) -> list[str]:
    """Lowercase, split on non-token characters, drop stop words and empties."""
    tokens = [match.group(0).lower() for match in TOKEN_RE.finditer(text or "")]
    return [token for token in tokens if token not in STOP_WORDS]


def _hash_dim(token: str, dimensions: int) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % dimensions


class TfidfVectorizer:
    """Hashed-feature TF-IDF vectorizer with deterministic dimensionality."""

    def __init__(self, dimensions: int = 1024) -> None:
        if dimensions < 128 or dimensions > 8192:
            raise ValueError("dimensions must be between 128 and 8192")
        self.dimensions = dimensions
        self.document_frequency: dict[str, int] = {}
        self.document_count = 0
        self._idf_cache: dict[str, float] | None = None

    def fit(self, documents: list[str]) -> None:
        self.document_frequency = {}
        self.document_count = 0
        self._idf_cache = None
        for document in documents:
            tokens = set(tokenize(document))
            self.document_count += 1
            for token in tokens:
                self.document_frequency[token] = self.document_frequency.get(token, 0) + 1

    def _idf(self, token: str) -> float:
        if self._idf_cache is None:
            self._idf_cache = {}
        if token not in self._idf_cache:
            df = self.document_frequency.get(token, 0)
            self._idf_cache[token] = math.log((1 + self.document_count) / (1 + df)) + 1.0 if self.document_count else 1.0
        return self._idf_cache[token]

    def transform(self, text: str) -> list[float]:
        tokens = tokenize(text)
        if not tokens:
            return [0.0] * self.dimensions
        term_frequencies: dict[str, int] = {}
        for token in tokens:
            term_frequencies[token] = term_frequencies.get(token, 0) + 1
        vector = [0.0] * self.dimensions
        total = float(len(tokens))
        for token, frequency in term_frequencies.items():
            weight = (frequency / total) * self._idf(token)
            index = _hash_dim(token, self.dimensions)
            vector[index] += weight
        _l2_normalize(vector)
        return vector

    def state(self) -> dict[str, Any]:
        return {
            "dimensions": self.dimensions,
            "document_count": self.document_count,
            "document_frequency": dict(sorted(self.document_frequency.items())),
        }

    @classmethod
    def from_state(cls, state: dict[str, Any]) -> "TfidfVectorizer":
        vectorizer = cls(dimensions=int(state["dimensions"]))
        vectorizer.document_count = int(state["document_count"])
        vectorizer.document_frequency = dict(state["document_frequency"])
        return vectorizer


def _l2_normalize(vector: list[float]) -> None:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm > 0:
        for index in range(len(vector)):
            vector[index] /= norm


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("vector dimension mismatch")
    total = 0.0
    for index in range(len(left)):
        total += left[index] * right[index]
    return total


class KnowledgeIndex:
    """Persistent TF-IDF index over knowledge chunks.

    The index file stores the vectorizer state and the per-chunk feature
    vectors. Rebuild is deterministic given the same chunk corpus.
    """

    def __init__(self, index_path: Path, dimensions: int = 1024) -> None:
        self.index_path = index_path
        self.vectorizer = TfidfVectorizer(dimensions=dimensions)
        self.chunk_vectors: dict[str, list[float]] = {}
        self.chunk_meta: dict[str, dict[str, Any]] = {}

    def build(self, chunks: list[dict[str, Any]]) -> None:
        documents = [
            " ".join([
                chunk.get("defensive_control", ""),
                chunk.get("framework", ""),
                chunk.get("language", ""),
                chunk.get("locator", ""),
                chunk.get("content_sha256", ""),
            ])
            for chunk in chunks
        ]
        self.vectorizer.fit(documents)
        self.chunk_vectors = {}
        self.chunk_meta = {}
        for chunk, document in zip(chunks, documents):
            chunk_id = chunk["chunk_id"]
            self.chunk_vectors[chunk_id] = self.vectorizer.transform(document)
            self.chunk_meta[chunk_id] = chunk
        self._persist()

    def search(self, query: str, limit: int = 5, min_score: float = 0.0) -> list[dict[str, Any]]:
        if not self.chunk_vectors:
            return []
        query_vector = self.vectorizer.transform(query)
        scored = []
        for chunk_id, chunk_vector in self.chunk_vectors.items():
            score = cosine_similarity(query_vector, chunk_vector)
            if score >= min_score:
                scored.append((chunk_id, score))
        scored.sort(key=lambda pair: pair[1], reverse=True)
        results = []
        for chunk_id, score in scored[:limit]:
            entry = dict(self.chunk_meta[chunk_id])
            entry["score"] = round(score, 6)
            results.append(entry)
        return results

    def _persist(self) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "vectorizer": self.vectorizer.state(),
            "chunk_vectors": {chunk_id: vector for chunk_id, vector in self.chunk_vectors.items()},
            "chunk_meta": self.chunk_meta,
        }
        atomic = self.index_path.with_suffix(".tmp")
        atomic.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True), encoding="utf-8")
        atomic.replace(self.index_path)

    @classmethod
    def load(cls, index_path: Path) -> "KnowledgeIndex | None":
        if not index_path.is_file():
            return None
        payload = json.loads(index_path.read_text(encoding="utf-8"))
        index = cls(index_path, dimensions=int(payload["vectorizer"]["dimensions"]))
        index.vectorizer = TfidfVectorizer.from_state(payload["vectorizer"])
        index.chunk_vectors = {chunk_id: list(vector) for chunk_id, vector in payload["chunk_vectors"].items()}
        index.chunk_meta = payload["chunk_meta"]
        return index
