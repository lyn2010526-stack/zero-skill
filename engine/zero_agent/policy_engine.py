"""Policy engine with validation, priority, conflict resolution, and action execution."""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
try:
    import yaml
except Exception:
    yaml = None

class Decision(Enum):
    ALLOW = "allow"
    BLOCK = "block"
    REQUIRE_CONFIRM = "require_confirm"
    LOG_ONLY = "log_only"

@dataclass
class PolicyRule:
    id: str
    raw: Dict[str, Any]
    path: str = ''
    trigger: str = ''
    priority: int = 100
    action: str = 'allow'
    conditions: Dict[str, Any] = field(default_factory=dict)
    verify: str = ''

@dataclass
class PolicyResult:
    decision: Decision
    rule_id: str
    reason: str
    matched_rules: int = 0
    conflicts_resolved: List[str] = field(default_factory=list)

REQUIRED_FIELDS = {'id', 'trigger'}

class PolicyEngine:
    def __init__(self, policy_dir: str | Path):
        self.policy_dir = Path(policy_dir)
        self.rules: List[PolicyRule] = []
        self.errors: List[str] = []
        self.action_handlers: Dict[str, Callable] = {}
        self._register_default_handlers()

    def _register_default_handlers(self):
        """Register built-in action handlers for common actions."""
        self.action_handlers['block'] = lambda ctx: PolicyResult(Decision.BLOCK, '', 'blocked by policy')
        self.action_handlers['allow'] = lambda ctx: PolicyResult(Decision.ALLOW, '', 'allowed by policy')
        self.action_handlers['require_confirm'] = lambda ctx: PolicyResult(Decision.REQUIRE_CONFIRM, '', 'confirmation required')
        self.action_handlers['log_only'] = lambda ctx: PolicyResult(Decision.LOG_ONLY, '', 'logged but allowed')

    def load(self) -> None:
        """Load and validate all YAML policy files from the policy directory."""
        self.rules.clear()
        self.errors.clear()
        if not self.policy_dir.exists():
            return
        for path in sorted(self.policy_dir.glob('*.yaml')):
            data = self._load_yaml(path)
            for item in data.get('rules', []):
                missing = REQUIRED_FIELDS - set(item)
                if missing:
                    self.errors.append(f'{path}:{item.get("id", "<no-id>")} missing fields: {sorted(missing)}')
                    continue
                self.rules.append(PolicyRule(
                    id=item['id'],
                    raw=item,
                    path=str(path),
                    trigger=item.get('trigger', ''),
                    priority=item.get('priority', 100),
                    action=str(item.get('action', 'allow')),
                    conditions=item.get('conditions', {}),
                    verify=item.get('verify', ''),
                ))

    def _load_yaml(self, path: Path) -> Dict[str, Any]:
        text = path.read_text(encoding='utf-8')
        if yaml is not None:
            return yaml.safe_load(text) or {}
        return self._tiny_yaml_rules(text)

    def _tiny_yaml_rules(self, text: str) -> Dict[str, Any]:
        rules = []
        cur = None
        for line in text.splitlines():
            s = line.strip()
            if s.startswith('- id:'):
                if cur:
                    rules.append(cur)
                cur = {'id': s.split(':', 1)[1].strip()}
            elif cur and s.startswith('trigger:'):
                cur['trigger'] = s.split(':', 1)[1].strip()
            elif cur and s.startswith('priority:'):
                try:
                    cur['priority'] = int(s.split(':', 1)[1].strip())
                except Exception:
                    cur['priority'] = 100
            elif cur and s.startswith('action:'):
                cur['action'] = s.split(':', 1)[1].strip()
        if cur:
            rules.append(cur)
        return {'rules': rules}

    def match(self, trigger: str, context: Dict[str, Any] | None = None) -> List[PolicyRule]:
        """Find all rules matching a trigger and context conditions."""
        context = context or {}
        out = []
        for r in self.rules:
            if r.trigger == trigger and self._conditions_match(r.conditions, context):
                out.append(r)
        return sorted(out, key=lambda r: r.priority)

    def _conditions_match(self, conditions: Any, context: Dict[str, Any]) -> bool:
        if not conditions:
            return True
        if isinstance(conditions, dict):
            return all(context.get(k) == v for k, v in conditions.items())
        if isinstance(conditions, list):
            return all(
                all(context.get(k) == v for k, v in item.items())
                for item in conditions if isinstance(item, dict)
            )
        return False

    def apply(self, trigger: str, context: Dict[str, Any] | None = None) -> PolicyResult:
        """Match rules for a trigger, resolve conflicts, execute the winning action.

        Returns a PolicyResult with the final decision.
        The decision is derived from the highest-priority matching rule's action.
        If multiple rules conflict (e.g., one says block, one says allow),
        the highest priority wins.
        """
        context = context or {}
        matched = self.match(trigger, context)
        if not matched:
            return PolicyResult(Decision.ALLOW, '<no-match>', 'no matching policy rule', 0)

        conflicts = []
        actions = [r.action for r in matched]
        unique_actions = list(dict.fromkeys(actions))
        if len(unique_actions) > 1:
            conflicts = [f'conflict: {a1} vs {a2}' for a1, a2 in zip(unique_actions, unique_actions[1:])]

        winning = matched[0]  # lowest priority number = highest priority
        decision_map = {
            'block': Decision.BLOCK,
            'require_confirm': Decision.REQUIRE_CONFIRM,
            'log_only': Decision.LOG_ONLY,
            'allow': Decision.ALLOW,
        }
        decision = decision_map.get(winning.action, Decision.ALLOW)

        result = PolicyResult(
            decision=decision,
            rule_id=winning.id,
            reason=f'rule {winning.id} matched (action={winning.action})',
            matched_rules=len(matched),
            conflicts_resolved=conflicts,
        )
        return result

    def register_action(self, action_name: str, handler: Callable) -> None:
        """Register a custom action handler for a given action name."""
        self.action_handlers[action_name] = handler

    def validate_schema(self, policy_data: Dict[str, Any]) -> List[str]:
        """Validate a policy data dict against the required schema. Returns list of errors."""
        errors = []
        if 'id' not in policy_data:
            errors.append('missing required field: id')
        if 'trigger' not in policy_data:
            errors.append('missing required field: trigger')
        valid_actions = {'allow', 'block', 'require_confirm', 'log_only'}
        action = policy_data.get('action', 'allow')
        if action not in valid_actions:
            errors.append(f'invalid action: {action}. valid: {sorted(valid_actions)}')
        priority = policy_data.get('priority', 100)
        if not isinstance(priority, int) or priority < 0:
            errors.append(f'invalid priority: {priority}. must be non-negative int')
        return errors

    def summary(self) -> Dict[str, Any]:
        """Return a summary of loaded policies."""
        action_counts = {}
        trigger_counts = {}
        for r in self.rules:
            action_counts[r.action] = action_counts.get(r.action, 0) + 1
            trigger_counts[r.trigger] = trigger_counts.get(r.trigger, 0) + 1
        return {
            'total_rules': len(self.rules),
            'errors': len(self.errors),
            'error_messages': self.errors[:10],
            'action_distribution': action_counts,
            'trigger_distribution': trigger_counts,
        }
