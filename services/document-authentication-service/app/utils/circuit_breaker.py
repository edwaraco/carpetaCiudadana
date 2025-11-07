"""
Circuit breaker implementation for external service resilience.

This module implements a simple circuit breaker pattern to handle
failures in external service calls gracefully.
"""

import time
import logging
from enum import Enum
from typing import Callable, Any, TypeVar, Generic
from functools import wraps

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit is open, calls are rejected
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Simple circuit breaker implementation.

    The circuit breaker prevents cascading failures by stopping
    requests to a failing service temporarily.

    Attributes:
        failure_threshold: Number of failures before opening circuit
        timeout: Time in seconds before attempting recovery
        recovery_timeout: Time in seconds to stay in half-open state
    """

    def __init__(
        self,
        failure_threshold: int = None,
        timeout: int = None,
        recovery_timeout: int = None,
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening (default from settings)
            timeout: Seconds before attempting recovery (default from settings)
            recovery_timeout: Seconds to stay in half-open (default from settings)
        """
        self.failure_threshold = (
            failure_threshold or settings.circuit_breaker_failure_threshold
        )
        self.timeout = timeout or settings.circuit_breaker_timeout_seconds
        self.recovery_timeout = (
            recovery_timeout or settings.circuit_breaker_recovery_timeout
        )
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """
        Execute a function with circuit breaker protection.

        Args:
            func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function

        Returns:
            Result of the function call

        Raises:
            Exception: If circuit is open or function call fails
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering HALF_OPEN state")
            else:
                logger.warning("Circuit breaker is OPEN, rejecting call")
                raise Exception("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        """
        Check if enough time has passed to attempt recovery.

        Returns:
            True if recovery should be attempted, False otherwise
        """
        if self.last_failure_time is None:
            return False
        return (time.time() - self.last_failure_time) >= self.timeout

    def _on_success(self) -> None:
        """Handle successful call - reset failure count and close circuit."""
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            logger.info("Circuit breaker recovered, state: CLOSED")

    def _on_failure(self) -> None:
        """Handle failed call - increment failure count and potentially open circuit."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"Circuit breaker OPENED after {self.failure_count} failures")

    def reset(self) -> None:
        """Manually reset the circuit breaker to CLOSED state."""
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        logger.info("Circuit breaker manually reset to CLOSED")


# Global circuit breaker instances for external services
gov_carpeta_circuit_breaker = CircuitBreaker()
carpeta_service_circuit_breaker = CircuitBreaker()
