"""
Unit tests for circuit breaker implementation.
"""

import unittest
import time
from unittest.mock import Mock

from app.utils.circuit_breaker import CircuitBreaker, CircuitState


class TestCircuitBreaker(unittest.TestCase):
    """Test cases for circuit breaker functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=3, timeout=1, recovery_timeout=1
        )

    def test_initial_state(self):
        """Test that circuit breaker starts in CLOSED state."""
        self.assertEqual(self.circuit_breaker.state, CircuitState.CLOSED)
        self.assertEqual(self.circuit_breaker.failure_count, 0)

    def test_successful_call(self):
        """Test that successful calls keep circuit CLOSED."""
        mock_func = Mock(return_value="success")

        result = self.circuit_breaker.call(mock_func)

        self.assertEqual(result, "success")
        self.assertEqual(self.circuit_breaker.state, CircuitState.CLOSED)
        self.assertEqual(self.circuit_breaker.failure_count, 0)
        mock_func.assert_called_once()

    def test_circuit_opens_after_threshold(self):
        """Test that circuit opens after failure threshold is reached."""
        mock_func = Mock(side_effect=Exception("Service error"))

        # Call should fail 3 times to reach threshold
        for i in range(3):
            with self.assertRaises(Exception):
                self.circuit_breaker.call(mock_func)

        self.assertEqual(self.circuit_breaker.state, CircuitState.OPEN)
        self.assertEqual(self.circuit_breaker.failure_count, 3)

    def test_open_circuit_rejects_calls(self):
        """Test that open circuit rejects calls."""
        # Force circuit to OPEN state
        self.circuit_breaker.state = CircuitState.OPEN
        self.circuit_breaker.last_failure_time = time.time()

        mock_func = Mock()

        with self.assertRaises(Exception) as context:
            self.circuit_breaker.call(mock_func)

        self.assertIn("Circuit breaker is OPEN", str(context.exception))
        mock_func.assert_not_called()

    def test_half_open_on_timeout(self):
        """Test that circuit enters HALF_OPEN after timeout."""
        # Force circuit to OPEN state with old failure time
        self.circuit_breaker.state = CircuitState.OPEN
        self.circuit_breaker.last_failure_time = time.time() - 2  # 2 seconds ago
        self.circuit_breaker.failure_count = 3

        mock_func = Mock(return_value="success")

        # Should attempt call and succeed
        result = self.circuit_breaker.call(mock_func)

        self.assertEqual(result, "success")
        self.assertEqual(self.circuit_breaker.state, CircuitState.CLOSED)
        self.assertEqual(self.circuit_breaker.failure_count, 0)

    def test_failure_in_half_open_reopens_circuit(self):
        """Test that failure in HALF_OPEN state reopens circuit."""
        # Set to HALF_OPEN
        self.circuit_breaker.state = CircuitState.HALF_OPEN
        self.circuit_breaker.failure_count = 2

        mock_func = Mock(side_effect=Exception("Service still down"))

        with self.assertRaises(Exception):
            self.circuit_breaker.call(mock_func)

        self.assertEqual(self.circuit_breaker.state, CircuitState.OPEN)
        self.assertEqual(self.circuit_breaker.failure_count, 3)

    def test_manual_reset(self):
        """Test manual circuit breaker reset."""
        # Force circuit to OPEN state
        self.circuit_breaker.state = CircuitState.OPEN
        self.circuit_breaker.failure_count = 5
        self.circuit_breaker.last_failure_time = time.time()

        # Reset
        self.circuit_breaker.reset()

        self.assertEqual(self.circuit_breaker.state, CircuitState.CLOSED)
        self.assertEqual(self.circuit_breaker.failure_count, 0)
        self.assertIsNone(self.circuit_breaker.last_failure_time)

    def test_partial_failures_dont_open_circuit(self):
        """Test that failures below threshold don't open circuit."""
        mock_func = Mock(side_effect=Exception("Service error"))

        # Fail 2 times (below threshold of 3)
        for i in range(2):
            with self.assertRaises(Exception):
                self.circuit_breaker.call(mock_func)

        # Circuit should still be CLOSED
        self.assertEqual(self.circuit_breaker.state, CircuitState.CLOSED)
        self.assertEqual(self.circuit_breaker.failure_count, 2)


if __name__ == "__main__":
    unittest.main()
