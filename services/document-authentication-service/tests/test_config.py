"""
Unit tests for configuration module.
"""

import unittest
from unittest.mock import patch
import os

from app.config import Settings


class TestConfiguration(unittest.TestCase):
    """Test cases for configuration loading."""

    def test_default_values(self):
        """Test that default values are set correctly."""
        with patch.dict(
            os.environ,
            {
                "RABBITMQ_URL": "amqp://test:test@localhost:5672/",
                "CARPETA_CIUDADANA_SERVICE_URL": "http://localhost:8082",
                "JWT_SECRET_KEY": "test-secret",
            },
            clear=True,
        ):
            settings = Settings()
            self.assertEqual(settings.service_port, 8083)
            self.assertEqual(settings.service_name, "document-authentication-service")
            self.assertEqual(settings.log_level, "INFO")
            self.assertEqual(
                settings.document_authenticated_queue,
                "documento.autenticado.queue",
            )

    def test_custom_values(self):
        """Test that custom environment values override defaults."""
        with patch.dict(
            os.environ,
            {
                "SERVICE_PORT": "9000",
                "SERVICE_NAME": "custom-service",
                "LOG_LEVEL": "DEBUG",
                "RABBITMQ_URL": "amqp://custom:custom@localhost:5672/",
                "CARPETA_CIUDADANA_SERVICE_URL": "http://custom:8082",
                "JWT_SECRET_KEY": "custom-secret",
            },
            clear=True,
        ):
            settings = Settings()
            self.assertEqual(settings.service_port, 9000)
            self.assertEqual(settings.service_name, "custom-service")
            self.assertEqual(settings.log_level, "DEBUG")

    def test_circuit_breaker_defaults(self):
        """Test circuit breaker default configuration."""
        with patch.dict(
            os.environ,
            {
                "RABBITMQ_URL": "amqp://test:test@localhost:5672/",
                "CARPETA_CIUDADANA_SERVICE_URL": "http://localhost:8082",
                "JWT_SECRET_KEY": "test-secret",
            },
            clear=True,
        ):
            settings = Settings()
            self.assertEqual(settings.circuit_breaker_failure_threshold, 5)
            self.assertEqual(settings.circuit_breaker_timeout_seconds, 60)
            self.assertEqual(settings.circuit_breaker_recovery_timeout, 30)


if __name__ == "__main__":
    unittest.main()
