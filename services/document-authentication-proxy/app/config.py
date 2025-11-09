"""
Configuration module for the document authentication proxy service.

This module loads environment variables and provides configuration
settings for the entire application.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All configuration is externalized following 12-factor app principles.
    """

    # Service Configuration
    service_port: int = 8084
    service_name: str = "document-authentication-proxy"
    log_level: str = "INFO"

    # RabbitMQ Configuration
    rabbitmq_url: str
    document_authentication_request_queue: str = "document.authentication.request.queue"

    # JWT Configuration
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )


try:
    # Global settings instance
    settings = Settings()  # type: ignore
except Exception:
    # If settings can't be loaded (e.g., in test environment without .env),
    # create a dummy settings object that will be mocked in tests
    import os

    os.environ.setdefault("RABBITMQ_URL", "amqp://test:test@localhost:5672/")
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
    settings = Settings()  # type: ignore
