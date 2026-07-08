"""Agent runtime for Zero Apex.

Inspired by Microsoft AutoGen's agent runtime architecture.
Implements message passing, event-driven agents, and multi-agent coordination.
"""
from __future__ import annotations
import time, json, uuid, threading
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set


class AgentState(Enum):
    IDLE = 'idle'
    RUNNING = 'running'
    WAITING = 'waiting'
    ERROR = 'error'
    TERMINATED = 'terminated'


@dataclass
class Message:
    """Message passed between agents."""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    source: str = ''
    target: str = ''
    message_type: str = ''     # task / result / error / heartbeat
    content: Any = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    priority: int = 5          # 1=highest, 10=lowest
    requires_response: bool = False
    response_timeout_ms: int = 30000

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id, 'source': self.source, 'target': self.target,
            'message_type': self.message_type, 'content': str(self.content),
            'metadata': self.metadata, 'timestamp': self.timestamp,
            'priority': self.priority,
        }


@dataclass
class AgentConfig:
    """Configuration for an agent."""
    name: str
    description: str = ''
    system_prompt: str = ''
    tools: List[str] = field(default_factory=list)
    max_iterations: int = 10
    timeout_seconds: int = 300
    capabilities: Set[str] = field(default_factory=set)


class BaseAgent:
    """Base agent class.

    All agents inherit from this class and implement the process() method.
    Based on AutoGen's BaseAgent pattern.

    Args:
        config: Agent configuration.

    Examples:

        >>> agent = BaseAgent(AgentConfig(name='assistant', description='General'))
        >>> result = agent.process(Message(content='Hello'))
    """

    def __init__(self, config: AgentConfig):
        self.config = config
        self.state = AgentState.IDLE
        self._message_history: List[Message] = []
        self._created_at = time.time()
        self._total_processed = 0
        self._errors: List[str] = []

    @property
    def name(self) -> str:
        return self.config.name

    def process(self, message: Message) -> Optional[Message]:
        """Process an incoming message and return a response.

        Override this method in subclasses to implement agent logic.
        """
        self._message_history.append(message)
        self.state = AgentState.RUNNING
        try:
            response = self._handle(message)
            self.state = AgentState.IDLE
            self._total_processed += 1
            return response
        except Exception as e:
            self.state = AgentState.ERROR
            self._errors.append(str(e))
            return Message(source=self.name, target=message.source,
                          message_type='error', content=str(e))

    def _handle(self, message: Message) -> Optional[Message]:
        """Override this to implement actual logic."""
        return Message(source=self.name, target=message.source,
                      message_type='result', content=f'{self.name} processed: {message.content}')

    def get_stats(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'state': self.state.value,
            'total_processed': self._total_processed,
            'errors': len(self._errors),
            'uptime': round(time.time() - self._created_at, 1),
        }

    def reset(self):
        self.state = AgentState.IDLE
        self._message_history.clear()
        self._errors.clear()


class AgentRuntime:
    """Multi-agent runtime system.

    Manages agent registration, message routing, and execution coordination.
    Inspired by AutoGen's SingleThreadedAgentRuntime.

    Args:
        max_agents: Maximum number of agents.
        timeout_seconds: Default timeout for operations.

    Examples:

        >>> runtime = AgentRuntime()
        >>> runtime.register_agent(BaseAgent(AgentConfig(name='a1')))
        >>> result = runtime.send_message(Message(source='user', target='a1', content='test'))
    """

    def __init__(self, max_agents: int = 20, timeout_seconds: int = 300):
        self._agents: Dict[str, BaseAgent] = {}
        self._max_agents = max_agents
        self._timeout = timeout_seconds
        self._message_queue: List[Message] = []
        self._dispatch_log: List[Dict] = []
        self._lock = threading.Lock()
        self._total_messages = 0
        self._started_at = time.time()

    def register_agent(self, agent: BaseAgent) -> bool:
        if len(self._agents) >= self._max_agents:
            return False
        self._agents[agent.name] = agent
        return True

    def unregister_agent(self, name: str) -> bool:
        return self._agents.pop(name, None) is not None

    def get_agent(self, name: str) -> Optional[BaseAgent]:
        return self._agents.get(name)

    def list_agents(self) -> List[Dict[str, Any]]:
        return [a.get_stats() for a in self._agents.values()]

    def send_message(self, message: Message) -> Optional[Message]:
        """Route a message to the target agent and return response."""
        target_agent = self._agents.get(message.target)
        if not target_agent:
            return Message(source='runtime', target=message.source,
                          message_type='error', content=f'Agent {message.target} not found')

        start = time.time()
        response = target_agent.process(message)
        duration_ms = (time.time() - start) * 1000

        with self._lock:
            self._total_messages += 1
            self._dispatch_log.append({
                'from': message.source, 'to': message.target,
                'type': message.message_type, 'duration_ms': round(duration_ms, 1),
                'success': response is not None and response.message_type != 'error',
            })

        return response

    def broadcast(self, message: Message) -> Dict[str, Message]:
        """Send message to all agents except sender."""
        responses = {}
        for name, agent in self._agents.items():
            if name != message.source:
                msg = Message(source=message.source, target=name,
                            message_type=message.message_type,
                            content=message.content)
                resp = agent.process(msg)
                if resp:
                    responses[name] = resp
        return responses

    def shutdown(self):
        for agent in self._agents.values():
            agent.state = AgentState.TERMINATED

    def get_runtime_stats(self) -> Dict[str, Any]:
        return {
            'total_agents': len(self._agents),
            'total_messages': self._total_messages,
            'uptime': round(time.time() - self._started_at, 1),
            'agents': {name: a.get_stats() for name, a in self._agents.items()},
        }
