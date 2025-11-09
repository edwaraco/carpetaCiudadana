"""
Tests for configuration loading.
"""

import os
import pytest
from app.config import Settings


def test_settings_from_env():
    """Test that settings can be loaded from environment variables."""
    # Save original values
    original_port = os.environ.get("SERVICE_PORT")
    original_queue = os.environ.get("DOCUMENT_AUTHENTICATION_REQUEST_QUEUE")
    
    os.environ["SERVICE_PORT"] = "9999"
    os.environ["RABBITMQ_URL"] = "amqp://test:test@localhost:5672/"
    os.environ["JWT_SECRET_KEY"] = "test-secret"
    os.environ[
        "DOCUMENT_AUTHENTICATION_REQUEST_QUEUE"
    ] = "test.authentication.request.queue"

    settings = Settings()

    assert settings.service_port == 9999
    assert settings.rabbitmq_url == "amqp://test:test@localhost:5672/"
    assert settings.jwt_secret_key == "test-secret"
    assert (
        settings.document_authentication_request_queue
        == "test.authentication.request.queue"
    )

    # Clean up
    del os.environ["SERVICE_PORT"]
    del os.environ["DOCUMENT_AUTHENTICATION_REQUEST_QUEUE"]
    if original_port:
        os.environ["SERVICE_PORT"] = original_port
    if original_queue:
        os.environ["DOCUMENT_AUTHENTICATION_REQUEST_QUEUE"] = original_queue


def test_settings_defaults():
    """Test default configuration values."""
    settings = Settings()

    assert settings.service_name == "document-authentication-proxy"
    assert settings.log_level == "INFO"
    assert settings.jwt_algorithm == "HS256"
    assert (
        settings.document_authentication_request_queue
        == "document.authentication.request.queue"
    )
