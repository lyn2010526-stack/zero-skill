"""Attention mechanism for Zero Apex.

Applies transformer-style multi-head attention to agent decision-making.
Given a task context, computes attention scores over memories, tools,
rules, evidence, and policies to select the most relevant information.

Inspired by: Transformer self-attention, AutoGen model_context,
LangChain retrieval scoring, mem0 vector similarity.
"""
from __future__ import annotations
import math, time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _softmax(values: List[float], temperature: float = 1.0) -> List[float]:
    """Compute softmax with temperature scaling."""
    if not values:
        return []
    max_v = max(values)
    exps = [math.exp((v - max_v) / max(temperature, 0.01)) for v in values]
    total = sum(exps)
    if total == 0:
        return [1.0 / len(values)] * len(values)
    return [e / total for e in exps]


def _text_to_features(text: str, vocab_size: int = 256) -> List[float]:
    """Convert text to a simple feature vector using character hash.
    
    This is a lightweight feature extractor for environments where
    real embedding models are not available. Uses character frequency
    distribution as a proxy for semantic content.
    """
    if not text:
        return [0.0] * vocab_size
    features = [0.0] * vocab_size
    for char in text:
        features[ord(char) % vocab_size] += 1.0
    # Normalize
    norm = math.sqrt(sum(f * f for f in features))
    if norm > 0:
        features = [f / norm for f in features]
    return features


@dataclass
class AttentionItem:
    """An item that can receive attention scoring."""
    id: str
    content: str                           # Text content for feature extraction
    item_type: str = ''                    # memory / tool / rule / evidence / policy
    features: Optional[List[float]] = None  # Pre-computed feature vector
    priority: float = 0.5                  # 0.0-1.0, intrinsic priority
    recency: float = 1.0                   # 0.0-1.0, decay over time
    metadata: Dict[str, Any] = field(default_factory=dict)

    def ensure_features(self, vocab_size: int = 256):
        if self.features is None:
            self.features = _text_to_features(self.content, vocab_size)


@dataclass
class AttentionScore:
    """Result of attention computation for a single item."""
    item_id: str
    item_type: str
    score: float            # Final attention weight (0.0-1.0)
    raw_similarity: float   # Cosine similarity before weighting
    head_scores: Dict[str, float] = field(default_factory=dict)
    selected: bool = False  # Whether this item was selected


class MultiHeadAttention:
    """Multi-head attention for agent decision-making.
    
    Each "head" focuses on a different aspect:
    - relevance: semantic similarity to the task
    - priority: intrinsic importance of the item
    - recency: how fresh/recent the information is
    - safety: risk-related relevance
    
    The heads are weighted and combined to produce final attention scores.
    
    Args:
        vocab_size: Feature vector dimension.
        temperature: Softmax temperature. Lower = sharper focus.
        max_items: Maximum items to attend to per head.
    
    Examples:
    
        >>> attn = MultiHeadAttention()
        >>> items = [AttentionItem(id='m1', content='compile app', item_type='memory'),
        ...          AttentionItem(id='t1', content='read_file', item_type='tool')]
        >>> scores = attn.attend('compile Android project', items)
        >>> print(scores[0].score)  # Highest scoring item
    """

    HEAD_WEIGHTS = {
        'relevance': 0.40,    # How semantically relevant
        'priority':   0.25,   # Intrinsic importance
        'recency':    0.20,   # How recent/fresh
        'safety':     0.15,   # Safety-related importance
    }

    SAFETY_KEYWORDS = [
        'delete', 'remove', 'rm', 'dangerous', 'risk', 'threat',
        '删除', '危险', '威胁', '防护', '守卫', '锁', 'guard',
        'firewall', 'verify', 'confirmation', '禁止',
    ]

    def __init__(self, vocab_size: int = 256,
                 temperature: float = 0.5,
                 max_items: int = 50):
        self.vocab_size = vocab_size
        self.temperature = temperature
        self.max_items = max_items
        self._query_cache: Dict[str, List[float]] = {}

    def _get_query_features(self, query: str) -> List[float]:
        if query not in self._query_cache:
            self._query_cache[query] = _text_to_features(query, self.vocab_size)
        return self._query_cache[query]

    def _compute_relevance(self, query_features: List[float],
                          item: AttentionItem) -> float:
        item.ensure_features(self.vocab_size)
        return max(0.0, _cosine_similarity(query_features, item.features))

    def _compute_priority(self, item: AttentionItem) -> float:
        return item.priority

    def _compute_recency(self, item: AttentionItem) -> float:
        return item.recency

    def _compute_safety(self, item: AttentionItem, query: str) -> float:
        content_lower = item.content.lower()
        query_lower = query.lower()
        score = 0.0
        for kw in self.SAFETY_KEYWORDS:
            if kw in content_lower:
                score += 0.2
            if kw in query_lower:
                score += 0.1
        if item.item_type in ('policy', 'rule'):
            score += 0.3
        return min(score, 1.0)

    def _score_item(self, query_features: List[float],
                    query: str, item: AttentionItem) -> AttentionScore:
        head_scores = {
            'relevance': self._compute_relevance(query_features, item),
            'priority': self._compute_priority(item),
            'recency': self._compute_recency(item),
            'safety': self._compute_safety(item, query),
        }
        combined = sum(
            head_scores[h] * self.HEAD_WEIGHTS.get(h, 0)
            for h in head_scores
        )
        return AttentionScore(
            item_id=item.id,
            item_type=item.item_type,
            score=combined,
            raw_similarity=head_scores['relevance'],
            head_scores=head_scores,
        )

    def attend(self, query: str, items: List[AttentionItem],
               top_k: int = 10,
               type_filter: Optional[List[str]] = None) -> List[AttentionScore]:
        """Compute attention scores for all items given a query.
        
        Args:
            query: The task description or question.
            items: List of items to score.
            top_k: Number of top items to return.
            type_filter: Optional list of item types to include.
            
        Returns:
            List of AttentionScore, sorted by score descending.
        """
        if not items:
            return []

        query_features = self._get_query_features(query)

        filtered = items
        if type_filter:
            filtered = [i for i in items if i.item_type in type_filter]

        filtered = filtered[:self.max_items]

        scores = [self._score_item(query_features, query, item)
                  for item in filtered]

        # Softmax normalization
        raw_values = [s.score for s in scores]
        normalized = _softmax(raw_values, self.temperature)
        for score, norm in zip(scores, normalized):
            score.score = norm

        scores.sort(key=lambda s: -s.score)

        for s in scores[:top_k]:
            s.selected = True

        return scores[:top_k]

    def attend_with_merge(self, query: str,
                          items_by_source: Dict[str, List[AttentionItem]],
                          top_k: int = 10) -> Dict[str, List[AttentionScore]]:
        """Multi-source attention. Attend to items from different sources
        independently, then merge results.
        
        Args:
            query: The task description.
            items_by_source: Dict of source_name -> items.
            top_k: Top items per source.
            
        Returns:
            Dict of source_name -> ranked scores.
        """
        results = {}
        for source, items in items_by_source.items():
            results[source] = self.attend(query, items, top_k)
        return results

    def explain(self, query: str, item: AttentionItem) -> str:
        """Explain why an item received its attention score."""
        query_features = self._get_query_features(query)
        score = self._score_item(query_features, query, item)
        lines = [
            f'Item: {item.id} ({item.item_type})',
            f'Total score: {score.score:.4f}',
            'Head breakdown:'
        ]
        for head, value in score.head_scores.items():
            weight = self.HEAD_WEIGHTS.get(head, 0)
            lines.append(f'  {head}: {value:.3f} x {weight:.2f} = {value * weight:.4f}')
        lines.append(f'Raw similarity: {score.raw_similarity:.4f}')
        return '\n'.join(lines)

    def clear_cache(self):
        self._query_cache.clear()


class AttentionRouter:
    """High-level router that uses attention to select relevant
    memories, tools, rules, and evidence for a given task.
    
    Integrates with Zero Apex's existing systems:
    - Queries memory system for relevant past decisions
    - Scores tools for task relevance
    - Checks safety policies
    - Retrieves relevant evidence
    
    Args:
        attention: The attention mechanism to use.
        max_results_per_source: Max items returned per source.
    
    Examples:
    
        >>> router = AttentionRouter()
        >>> result = router.route('compile Android project',
        ...     memories=[AttentionItem(id='m1', content='compiled app before', item_type='memory')],
        ...     tools=[AttentionItem(id='t1', content='gradle build', item_type='tool')],
        ...     policies=[AttentionItem(id='p1', content='delete requires confirmation', item_type='policy')])
        >>> print(result['selected_tools'])
    """

    def __init__(self, attention: Optional[MultiHeadAttention] = None,
                 max_results_per_source: int = 5):
        self.attention = attention or MultiHeadAttention()
        self.max_results = max_results_per_source

    def route(self, query: str,
              memories: Optional[List[AttentionItem]] = None,
              tools: Optional[List[AttentionItem]] = None,
              rules: Optional[List[AttentionItem]] = None,
              policies: Optional[List[AttentionItem]] = None,
              evidence: Optional[List[AttentionItem]] = None) -> Dict[str, Any]:
        """Route a query through attention mechanism.
        
        Returns a routing decision with:
        - selected_memories: Most relevant past experiences
        - selected_tools: Best tools for the task
        - selected_rules: Applicable rules
        - triggered_policies: Safety policies that match
        - relevant_evidence: Evidence to consider
        - attention_summary: Overall attention statistics
        """
        sources = {}
        if memories: sources['memory'] = memories
        if tools: sources['tool'] = tools
        if rules: sources['rule'] = rules
        if policies: sources['policy'] = policies
        if evidence: sources['evidence'] = evidence

        all_results = self.attention.attend_with_merge(
            query, sources, top_k=self.max_results
        )

        # Extract selected items per source
        selected_memories = [s for s in all_results.get('memory', []) if s.selected]
        selected_tools = [s for s in all_results.get('tool', []) if s.selected]
        selected_rules = [s for s in all_results.get('rule', []) if s.selected]
        triggered_policies = [s for s in all_results.get('policy', []) if s.selected]
        relevant_evidence = [s for s in all_results.get('evidence', []) if s.selected]

        # Safety check: if any policy has high attention, flag it
        high_safety = [s for s in triggered_policies if s.score > 0.15]

        return {
            'selected_memories': [s.item_id for s in selected_memories],
            'selected_tools': [s.item_id for s in selected_tools],
            'selected_rules': [s.item_id for s in selected_rules],
            'triggered_policies': [s.item_id for s in triggered_policies],
            'relevant_evidence': [s.item_id for s in relevant_evidence],
            'safety_flag': len(high_safety) > 0,
            'safety_policies': [s.item_id for s in high_safety],
            'attention_summary': {
                'total_items_scored': sum(len(v) for v in all_results.values()),
                'total_selected': sum(1 for scores in all_results.values()
                                    for s in scores if s.selected),
                'sources': list(all_results.keys()),
            },
        }

    def rank_tools(self, query: str, tools: List[AttentionItem],
                   top_k: int = 3) -> List[AttentionScore]:
        """Rank tools by relevance to a task."""
        tool_items = [t for t in tools if t.item_type == 'tool']
        if not tool_items:
            tool_items = tools
        return self.attention.attend(query, tool_items, top_k)

    def find_relevant_memories(self, query: str,
                               memories: List[AttentionItem],
                               threshold: float = 0.1) -> List[AttentionScore]:
        """Find memories relevant to a query above threshold."""
        scores = self.attention.attend(query, memories, top_k=len(memories))
        return [s for s in scores if s.score >= threshold]

    def get_safety_context(self, query: str,
                           rules: List[AttentionItem]) -> Dict[str, Any]:
        """Get safety-relevant context for a task.
        
        Prioritizes safety head when scoring rules.
        """
        # Boost safety weight temporarily
        original = dict(self.attention.HEAD_WEIGHTS)
        self.attention.HEAD_WEIGHTS['safety'] = 0.6
        self.attention.HEAD_WEIGHTS['relevance'] = 0.2
        self.attention.HEAD_WEIGHTS['priority'] = 0.1
        self.attention.HEAD_WEIGHTS['recency'] = 0.1

        scores = self.attention.attend(query, rules, top_k=10)

        # Restore original weights
        self.attention.HEAD_WEIGHTS.update(original)

        return {
            'applicable_rules': [s.item_id for s in scores if s.selected],
            'high_risk': any(s.score > 0.2 for s in scores),
            'top_rule': scores[0].item_id if scores else None,
            'scores': {s.item_id: round(s.score, 4) for s in scores[:5]},
        }
