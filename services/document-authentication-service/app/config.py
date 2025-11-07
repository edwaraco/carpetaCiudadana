"""
Configuration module for the document authentication service.

This module loads environment variables and provides configuration
settings for the entire application.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All configuration is externalized following 12-factor app principles.
    """

    # Service Configuration
    service_port: int = 8083
    service_name: str = "document-authentication-service"
    log_level: str = "INFO"

    # RabbitMQ Configuration
    rabbitmq_url: str
    document_authenticated_queue: str = "document_authenticated_response"

    # External Services
    carpeta_ciudadana_service_url: str
    gov_carpeta_service_url: str = "https://govcarpeta-apis-4905ff3c005b.herokuapp.com"

    # JWT Configuration
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"

    # Circuit Breaker Configuration
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_timeout_seconds: int = 60
    circuit_breaker_recovery_timeout: int = 30

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )


try:
    # Global settings instance
    settings = Settings()
except Exception:
    # If settings can't be loaded (e.g., in test environment without .env),
    # create a dummy settings object that will be mocked in tests
    import os

    os.environ.setdefault("RABBITMQ_URL", "amqp://test:test@localhost:5672/")
    os.environ.setdefault("CARPETA_CIUDADANA_SERVICE_URL", "http://localhost:8082")
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
    settings = Settings()
