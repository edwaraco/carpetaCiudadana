"""
Integration test for document authentication event flow.

This test demonstrates the complete flow:
1. HTTP request to proxy
2. Event published to RabbitMQ
3. Event consumed by authentication service
4. Result published to result queue

Note: This is a conceptual test. In a real environment, you would need:
- Running RabbitMQ instance
- Mocked Gov Carpeta API
"""

import pytest
import json
from datetime import datetime


# Mock test to verify event structure
def test_authentication_request_event_structure():
    """Test that authentication request events have the correct structure."""
    from app.models import DocumentAuthenticationRequestEvent

    event = DocumentAuthenticationRequestEvent(
        documentId="123e4567-e89b-12d3-a456-426614174000",
        documentTitle="Test Diploma",
        folderId="456e7890-e89b-12d3-a456-426614174001",
        citizenId=123456789,
        dummyJWT=False,
        dummyURL=None,
        rawToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        timestamp=datetime.now(),
    )

    # Verify all required fields are present
    assert event.documentId == "123e4567-e89b-12d3-a456-426614174000"
    assert event.documentTitle == "Test Diploma"
    assert event.folderId == "456e7890-e89b-12d3-a456-426614174001"
    assert event.citizenId == 123456789
    assert event.dummyJWT is False
    assert event.dummyURL is None
    assert event.rawToken.startswith("eyJ")

    # Verify event can be serialized to JSON (for RabbitMQ)
    event_dict = event.model_dump()
    event_dict["timestamp"] = event.timestamp.isoformat()
    json_str = json.dumps(event_dict)
    assert json_str is not None
    assert "documentId" in json_str
    assert "citizenId" in json_str


def test_jwt_payload_extraction():
    """Test JWT payload extraction with different field name variations."""
    from app.models import JWTPayload

    # Test with folderId and citizenId (standard names)
    payload1 = JWTPayload(
        folderId="folder-123", citizenId=987654321, sub="user-123", exp=1234567890
    )
    assert payload1.folder_id == "folder-123"
    assert payload1.citizen_id == 987654321

    # Test with carpetaId and idCitizen (alternative names)
    payload2 = JWTPayload(
        carpetaId="folder-456", idCitizen=111222333, sub="user-456", exp=1234567890
    )
    assert payload2.carpetaId == "folder-456"
    assert payload2.id_citizen == 111222333


def test_authentication_request_validation():
    """Test request validation."""
    from app.models import AuthenticateDocumentRequest

    # Valid request
    request = AuthenticateDocumentRequest(
        documentId="doc-123", documentTitle="My Document", dummyJWT=False, dummyURL=None
    )
    assert request.document_id == "doc-123"
    assert request.document_title == "My Document"

    # Request with dummy URL
    request_with_url = AuthenticateDocumentRequest(
        documentId="doc-456",
        documentTitle="Another Document",
        dummyJWT=True,
        dummyURL="https://example.com/doc.pdf",
    )
    assert request_with_url.dummy_jwt is True
    assert request_with_url.dummy_url == "https://example.com/doc.pdf"


def test_response_model():
    """Test response model."""
    from app.models import AuthenticateDocumentResponse

    response = AuthenticateDocumentResponse(status=202, message="Accepted")
    assert response.status == 202
    assert response.message == "Accepted"
