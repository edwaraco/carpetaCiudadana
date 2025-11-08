"""
Unit tests for Pydantic models.
"""

import unittest
from datetime import datetime
from pydantic import ValidationError

from app.models import (
    AuthenticateDocumentRequest,
    AuthenticateDocumentResponse,
    GovCarpetaAuthenticationRequest,
    DocumentoAutenticadoEvent,
    JWTPayload,
)


class TestAuthenticateDocumentRequest(unittest.TestCase):
    """Test cases for AuthenticateDocumentRequest model."""

    def test_valid_request(self):
        """Test creation of valid request."""
        request = AuthenticateDocumentRequest(
            documentId="123e4567-e89b-12d3-a456-426614174000",
            documentTitle="Diploma Grado",
        )
        self.assertEqual(request.document_id, "123e4567-e89b-12d3-a456-426614174000")
        self.assertEqual(request.document_title, "Diploma Grado")

    def test_alias_support(self):
        """Test that model accepts camelCase aliases."""
        data = {
            "documentId": "123e4567-e89b-12d3-a456-426614174000",
            "documentTitle": "Diploma Grado",
        }
        request = AuthenticateDocumentRequest(**data)
        self.assertIsNotNone(request.document_id)
        self.assertIsNotNone(request.document_title)

    def test_missing_fields(self):
        """Test that missing required fields raise validation error."""
        with self.assertRaises(ValidationError):
            AuthenticateDocumentRequest(documentId="123")


class TestGovCarpetaAuthenticationRequest(unittest.TestCase):
    """Test cases for GovCarpetaAuthenticationRequest model."""

    def test_valid_request(self):
        """Test creation of valid Gov Carpeta request."""
        request = GovCarpetaAuthenticationRequest(
            idCitizen=1234567890,
            UrlDocument="https://example.com/document.pdf",
            documentTitle="Diploma Grado",
        )
        self.assertEqual(request.id_citizen, 1234567890)
        self.assertEqual(request.url_document, "https://example.com/document.pdf")
        self.assertEqual(request.document_title, "Diploma Grado")

    def test_alias_serialization(self):
        """Test that model serializes with correct aliases."""
        request = GovCarpetaAuthenticationRequest(
            idCitizen=1234567890,
            UrlDocument="https://example.com/document.pdf",
            documentTitle="Diploma Grado",
        )
        data = request.model_dump(by_alias=True)
        self.assertIn("idCitizen", data)
        self.assertIn("UrlDocument", data)
        self.assertIn("documentTitle", data)


class TestDocumentoAutenticadoEvent(unittest.TestCase):
    """Test cases for DocumentoAutenticadoEvent model."""

    def test_valid_event(self):
        """Test creation of valid event."""
        event = DocumentoAutenticadoEvent(
            documento_id="doc-123",
            carpeta_id="folder-456",
            status_code="200",
            mensaje="Success",
        )
        self.assertEqual(event.documento_id, "doc-123")
        self.assertEqual(event.carpeta_id, "folder-456")
        self.assertEqual(event.status_code, "200")
        self.assertEqual(event.mensaje, "Success")
        self.assertIsInstance(event.fecha_autenticacion, datetime)

    def test_default_timestamp(self):
        """Test that timestamp defaults to current UTC time."""
        event = DocumentoAutenticadoEvent(
            documento_id="doc-123",
            carpeta_id="folder-456",
            status_code="200",
            mensaje="Success",
        )
        # Just verify it's a datetime object
        self.assertIsInstance(event.fecha_autenticacion, datetime)


class TestJWTPayload(unittest.TestCase):
    """Test cases for JWTPayload model."""

    def test_valid_payload(self):
        """Test creation of valid JWT payload."""
        payload = JWTPayload(
            folderId="folder-123", citizenId=1234567890, sub="user-123", exp=9999999999
        )
        self.assertEqual(payload.folder_id, "folder-123")
        self.assertEqual(payload.citizen_id, 1234567890)
        self.assertEqual(payload.sub, "user-123")
        self.assertEqual(payload.exp, 9999999999)

    def test_alternative_field_names(self):
        """Test alternative field name support."""
        # Test with alternative names
        payload = JWTPayload(carpetaId="folder-123", idCitizen=1234567890)
        self.assertEqual(payload.carpeta_id, "folder-123")
        self.assertEqual(payload.id_citizen, 1234567890)

    def test_optional_fields(self):
        """Test that all fields are optional."""
        payload = JWTPayload()
        self.assertIsNone(payload.folder_id)
        self.assertIsNone(payload.citizen_id)


if __name__ == "__main__":
    unittest.main()
