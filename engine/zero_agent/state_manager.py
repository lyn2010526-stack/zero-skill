"""State management for Zero Apex.

Inspired by AutoGen's runtime state + LangChain's chat_history.
Manages task state, session state, and cross-session persistence.
"""
from __future__ import annotations
import time, json, threading
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class TaskPhase(Enum):
    IDLE = 'idle'
    PLANNING = 'planning'
    EXECUTING = 'executing'
    VERIFYING = 'verifying'
    COMPLETED = 'completed'
    FAILED = 'failed'


@dataclass
class TaskState:
    task_id: str
    phase: TaskPhase = TaskPhase.IDLE
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    goal: str = ''
    plan: List[Dict[str, Any]] = field(default_factory=list)
    completed_steps: List[int] = field(default_factory=list)
    current_step: int = 0
    artifacts: List[str] = field(default_factory=list)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    verification_level: str = 'L0'  # L0-L6
    metadata: Dict[str, Any] = field(default_factory=dict)

    def step(self, step_num: int, description: str = ''):
        self.completed_steps.append(step_num)
        self.current_step = step_num + 1
        self.updated_at = time.time()

    def add_evidence(self, level: str, description: str, details: Dict = None):
        self.evidence.append({'level': level, 'description': description,
                              'timestamp': time.time(), 'details': details or {}})
        self.verification_level = level

    def add_error(self, error: str):
        self.errors.append(error)
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            'task_id': self.task_id, 'phase': self.phase.value,
            'goal': self.goal, 'current_step': self.current_step,
            'completed_steps': self.completed_steps,
            'verification_level': self.verification_level,
            'errors': self.errors, 'artifacts': self.artifacts,
            'evidence_count': len(self.evidence),
        }


class StateManager:
    """Manages task and session state.

    Tracks task phases, evidence, verification levels, and errors.
    Supports persistence to disk for cross-session continuity.

    Examples:

        >>> sm = StateManager()
        >>> sm.start_task('t1', 'compile app')
        >>> sm.current_task.add_evidence('L3', 'BUILD SUCCESSFUL')
        >>> print(sm.current_task.verification_level)
        L3
    """

    def __init__(self, persist_dir: Optional[str] = None):
        self._tasks: Dict[str, TaskState] = {}
        self._current_task_id: Optional[str] = None
        self._persist_dir = Path(persist_dir) if persist_dir else None
        if self._persist_dir:
            self._persist_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._total_tasks = 0
        self._total_errors = 0

    @property
    def current_task(self) -> Optional[TaskState]:
        if self._current_task_id:
            return self._tasks.get(self._current_task_id)
        return None

    def start_task(self, task_id: str, goal: str = '') -> TaskState:
        with self._lock:
            task = TaskState(task_id=task_id, goal=goal, phase=TaskPhase.PLANNING)
            self._tasks[task_id] = task
            self._current_task_id = task_id
            self._total_tasks += 1
            return task

    def complete_task(self, task_id: str, success: bool = True):
        with self._lock:
            task = self._tasks.get(task_id)
            if task:
                task.phase = TaskPhase.COMPLETED if success else TaskPhase.FAILED
                task.updated_at = time.time()
                self._persist(task)

    def advance_phase(self, phase: TaskPhase):
        if self.current_task:
            self.current_task.phase = phase
            self.current_task.updated_at = time.time()

    def add_evidence(self, level: str, description: str, details: Dict = None):
        if self.current_task:
            self.current_task.add_evidence(level, description, details)

    def add_error(self, error: str):
        if self.current_task:
            self.current_task.add_error(error)
            self._total_errors += 1

    def _persist(self, task: TaskState):
        if not self._persist_dir: return
        path = self._persist_dir / f'{task.task_id}.json'
        try:
            path.write_text(json.dumps(task.to_dict(), ensure_ascii=False, indent=2), encoding='utf-8')
        except Exception: pass

    def get_task(self, task_id: str) -> Optional[TaskState]:
        return self._tasks.get(task_id)

    def get_verification_level(self) -> str:
        if self.current_task:
            return self.current_task.verification_level
        return 'L0'

    def get_stats(self) -> Dict[str, Any]:
        return {
            'total_tasks': self._total_tasks,
            'total_errors': self._total_errors,
            'active_task': self._current_task_id,
            'tasks': {tid: t.to_dict() for tid, t in self._tasks.items()},
        }
