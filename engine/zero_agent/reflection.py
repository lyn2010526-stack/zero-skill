"""Reflection / Self-critique module.

Inspired by Reflexion (Shinn et al.), AutoGen's self-reflection pattern,
and Zero Apex's postmortem system. After completing a task, the agent
reflects on what went well, what failed, and generates improvement rules.
"""
from __future__ import annotations
import time, json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ReflectionEntry:
    """Single reflection record."""
    task_id: str
    task_description: str
    success: bool
    steps_taken: List[str] = field(default_factory=list)
    what_went_well: List[str] = field(default_factory=list)
    what_failed: List[str] = field(default_factory=list)
    root_cause: str = ''
    improvement_rules: List[str] = field(default_factory=list)
    evidence_level: str = 'L0'
    timestamp: float = field(default_factory=time.time)
    duration_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            'task_id': self.task_id, 'success': self.success,
            'steps': self.steps_taken, 'good': self.what_went_well,
            'failed': self.what_failed, 'root_cause': self.root_cause,
            'rules': self.improvement_rules, 'evidence': self.evidence_level,
        }


@dataclass
class ImprovementRule:
    """A rule generated from reflection."""
    rule_id: str
    source_task: str
    rule_text: str
    trigger_condition: str
    confidence: float = 0.5  # 0-1, increases with repeated observations
    times_observed: int = 1
    created_at: float = field(default_factory=time.time)
    last_observed: float = field(default_factory=time.time)
    active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.rule_id, 'source': self.source_task,
            'rule': self.rule_text, 'trigger': self.trigger_condition,
            'confidence': round(self.confidence, 2),
            'observed': self.times_observed, 'active': self.active,
        }


class ReflectionEngine:
    """Self-critique and improvement system.

    After each task, generates structured reflection and extracts
    reusable improvement rules. Rules accumulate over time and
    are consulted before future similar tasks.

    Inspired by Reflexion paper + Zero Apex postmortem + AutoGen patterns.

    Args:
        max_history: Maximum reflection records to keep.
        min_observations: Minimum observations to activate a rule.

    Examples:

        >>> engine = ReflectionEngine()
        >>> entry = engine.reflect(
        ...     task_id='t1', task_description='compile app',
        ...     success=False, steps_taken=['read', 'modify', 'build'],
        ...     what_failed=['build failed due to missing import'],
        ...     root_cause='forgot to add dependency'
        ... )
        >>> print(entry.improvement_rules)
        ['Always check imports before build']
    """

    def __init__(self, max_history: int = 100, min_observations: int = 2):
        self._history: List[ReflectionEntry] = []
        self._rules: Dict[str, ImprovementRule] = {}
        self._max_history = max_history
        self._min_observations = min_observations
        self._rule_counter = 0

    def reflect(self, task_id: str, task_description: str = '',
                success: bool = True, steps_taken: Optional[List[str]] = None,
                what_went_well: Optional[List[str]] = None,
                what_failed: Optional[List[str]] = None,
                root_cause: str = '',
                evidence_level: str = 'L0') -> ReflectionEntry:
        """Generate a reflection entry and extract improvement rules."""
        entry = ReflectionEntry(
            task_id=task_id, task_description=task_description,
            success=success, steps_taken=steps_taken or [],
            what_went_well=what_went_well or [],
            what_failed=what_failed or [],
            root_cause=root_cause, evidence_level=evidence_level,
        )

        # Extract rules from failures
        if not success:
            for failure in entry.what_failed:
                rule_text = f'避免: {failure}'
                if root_cause:
                    rule_text += f' (根因: {root_cause})'
                self._add_or_update_rule(rule_text, task_id, root_cause)

        # Extract rules from successes (positive reinforcement)
        if success and entry.what_went_well:
            for good in entry.what_went_well:
                rule_text = f'继续: {good}'
                self._add_or_update_rule(rule_text, task_id, good)

        self._history.append(entry)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

        return entry

    def _add_or_update_rule(self, rule_text: str, source: str, trigger: str):
        """Add a new rule or increase confidence of existing rule."""
        key = rule_text[:80]
        if key in self._rules:
            rule = self._rules[key]
            rule.times_observed += 1
            rule.last_observed = time.time()
            rule.confidence = min(1.0, rule.confidence + 0.1)
            rule.active = rule.times_observed >= self._min_observations
        else:
            self._rule_counter += 1
            self._rules[key] = ImprovementRule(
                rule_id=f'rule_{self._rule_counter:04d}',
                source_task=source, rule_text=rule_text,
                trigger_condition=trigger,
            )

    def get_applicable_rules(self, context: str = '') -> List[ImprovementRule]:
        """Get active rules that might apply to the current context."""
        if not context:
            return [r for r in self._rules.values() if r.active]
        context_lower = context.lower()
        applicable = []
        for rule in self._rules.values():
            if not rule.active:
                continue
            trigger_words = rule.trigger_condition.lower().split()
            overlap = sum(1 for w in trigger_words if w in context_lower)
            if overlap > 0 or rule.confidence > 0.7:
                applicable.append(rule)
        applicable.sort(key=lambda r: -r.confidence)
        return applicable[:10]

    def get_history(self, limit: int = 10,
                    success_only: Optional[bool] = None) -> List[ReflectionEntry]:
        results = self._history
        if success_only is not None:
            results = [h for h in results if h.success == success_only]
        return results[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        total = len(self._history)
        success = sum(1 for h in self._history if h.success)
        active_rules = sum(1 for r in self._rules.values() if r.active)
        return {
            'total_reflections': total,
            'success_rate': round(success / max(1, total) * 100, 1),
            'total_rules': len(self._rules),
            'active_rules': active_rules,
            'failure_rate': round((total - success) / max(1, total) * 100, 1),
        }

    def get_top_failures(self, top_k: int = 5) -> List[Dict[str, str]]:
        failure_rules = [r for r in self._rules.values()
                        if not r.active and r.times_observed == 1]
        failure_rules.sort(key=lambda r: -r.confidence)
        return [{'rule': r.rule_text, 'trigger': r.trigger_condition,
                'source': r.source_task} for r in failure_rules[:top_k]]

    def summary(self) -> str:
        stats = self.get_stats()
        lines = [
            f'Reflections: {stats["total_reflections"]}',
            f'Success rate: {stats["success_rate"]}%',
            f'Active rules: {stats["active_rules"]}/{stats["total_rules"]}',
        ]
        return '\n'.join(lines)
