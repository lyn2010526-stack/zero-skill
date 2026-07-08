"""Chain of Thought execution framework.

Inspired by LangChain/LangGraph chains + AutoGen multi-step reasoning.
Breaks complex tasks into executable steps with verification gates.
"""
from __future__ import annotations
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class StepStatus(Enum):
    PENDING = 'pending'
    RUNNING = 'running'
    PASSED = 'passed'
    FAILED = 'failed'
    SKIPPED = 'skipped'
    BLOCKED = 'blocked'


@dataclass
class ChainStep:
    """Single step in a reasoning chain."""
    id: int
    name: str
    description: str = ''
    action: Optional[Callable] = None
    verify: Optional[Callable] = None
    expected_output: str = ''
    status: StepStatus = StepStatus.PENDING
    result: Any = None
    evidence: str = ''
    error: str = ''
    duration_ms: float = 0.0
    max_retries: int = 1
    retry_count: int = 0
    depends_on: List[int] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id, 'name': self.name,
            'status': self.status.value, 'result': str(self.result)[:200],
            'evidence': self.evidence[:200], 'duration_ms': round(self.duration_ms, 1),
            'retry_count': self.retry_count,
        }


@dataclass
class ChainResult:
    """Result of executing a full chain."""
    chain_name: str
    success: bool
    steps_completed: int
    steps_total: int
    steps_failed: List[str] = field(default_factory=list)
    evidence_level: str = 'L0'
    total_duration_ms: float = 0.0
    output: Any = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'chain': self.chain_name, 'success': self.success,
            'steps': f'{self.steps_completed}/{self.steps_total}',
            'failed': self.steps_failed, 'evidence': self.evidence_level,
            'duration_ms': round(self.total_duration_ms, 1),
        }


class ChainOfThought:
    """Executes a reasoning chain with verification gates.

    Each step can have a verify function. If verification fails,
    the step retries (up to max_retries). If all retries fail,
    the chain stops and reports the failure.

    Inspired by LangChain's sequential chains + AutoGen's
    multi-step task execution pattern.

    Args:
        name: Chain identifier.
        stop_on_failure: Stop chain if any step fails.
        max_retries_per_step: Default retries per step.

    Examples:

        >>> chain = ChainOfThought('compile-app')
        >>> chain.add_step('read', description='Read project files')
        >>> chain.add_step('modify', description='Apply changes')
        >>> chain.add_step('verify', description='Check build output')
        >>> result = chain.execute()
    """

    def __init__(self, name: str = 'unnamed_chain',
                 stop_on_failure: bool = True,
                 max_retries_per_step: int = 1):
        self.name = name
        self._steps: List[ChainStep] = []
        self._stop_on_failure = stop_on_failure
        self._default_retries = max_retries_per_step
        self._step_counter = 0

    def add_step(self, name: str, description: str = '',
                 action: Optional[Callable] = None,
                 verify: Optional[Callable] = None,
                 expected_output: str = '',
                 depends_on: Optional[List[int]] = None,
                 max_retries: Optional[int] = None) -> ChainStep:
        self._step_counter += 1
        step = ChainStep(
            id=self._step_counter, name=name,
            description=description, action=action, verify=verify,
            expected_output=expected_output,
            depends_on=depends_on or [],
            max_retries=max_retries if max_retries is not None else self._default_retries,
        )
        self._steps.append(step)
        return step

    def _deps_satisfied(self, step: ChainStep) -> bool:
        for dep_id in step.depends_on:
            dep = next((s for s in self._steps if s.id == dep_id), None)
            if not dep or dep.status != StepStatus.PASSED:
                return False
        return True

    def _execute_step(self, step: ChainStep) -> bool:
        """Execute a single step with retry logic. Returns True if passed."""
        if not self._deps_satisfied(step):
            step.status = StepStatus.BLOCKED
            step.error = 'Dependencies not satisfied'
            return False

        for attempt in range(step.max_retries + 1):
            step.status = StepStatus.RUNNING
            step.retry_count = attempt
            start = time.time()

            try:
                if step.action:
                    step.result = step.action()
                else:
                    step.result = f'No action defined for {step.name}'
                step.duration_ms = (time.time() - start) * 1000
            except Exception as e:
                step.duration_ms = (time.time() - start) * 1000
                step.error = str(e)
                step.status = StepStatus.FAILED
                continue

            if step.verify:
                try:
                    passed = step.verify(step.result)
                    if passed:
                        step.status = StepStatus.PASSED
                        step.evidence = f'Verified: {str(step.result)[:200]}'
                        return True
                    else:
                        step.error = f'Verification failed (attempt {attempt+1})'
                        step.status = StepStatus.FAILED
                except Exception as e:
                    step.error = f'Verify error: {e}'
                    step.status = StepStatus.FAILED
            else:
                step.status = StepStatus.PASSED
                step.evidence = f'Completed (no verify): {str(step.result)[:200]}'
                return True

        return False

    def execute(self) -> ChainResult:
        """Execute the full chain."""
        start = time.time()
        completed = 0
        failed_steps = []

        for step in self._steps:
            if step.status in (StepStatus.PASSED, StepStatus.SKIPPED):
                completed += 1
                continue

            passed = self._execute_step(step)
            if passed:
                completed += 1
            else:
                failed_steps.append(f'{step.name}: {step.error[:100]}')
                if self._stop_on_failure:
                    for s in self._steps:
                        if s.status == StepStatus.PENDING:
                            s.status = StepStatus.SKIPPED
                    break

        total_ms = (time.time() - start) * 1000
        all_passed = completed == len(self._steps)

        return ChainResult(
            chain_name=self.name,
            success=all_passed,
            steps_completed=completed,
            steps_total=len(self._steps),
            steps_failed=failed_steps,
            evidence_level='L3' if all_passed else 'L1',
            total_duration_ms=total_ms,
        )

    def get_steps(self) -> List[Dict[str, Any]]:
        return [s.to_dict() for s in self._steps]

    def reset(self):
        for s in self._steps:
            s.status = StepStatus.PENDING
            s.result = None
            s.error = ''
            s.evidence = ''
            s.retry_count = 0
