"""
Tests for dummy mode features (dummyJWT and dummyURL).

These tests verify the testing/development features that allow
bypassing JWT validation and providing presigned URLs directly.
"""

import unittest
import base64
import json
from fastapi import HTTPException

from app.models import AuthenticateDocumentRequest, JWTPayload
from app.utils.auth import decode_jwt_token


class TestDummyJWT(unittest.TestCase):
    """Tests for dummyJWT feature (skip JWT validation)."""

    def test_decode_jwt_with_validation_skipped(self):
        """Test that JWT can be decoded without signature validation when skip_validation=True."""
        # Create a JWT-like token with a valid payload but invalid signature
        payload = {
            "folderId": "test-folder-123",
            "citizenId": 1234567890,
            "sub": "test-user",
            "exp": 9999999999,
        }

        # Encode payload as base64
        payload_json = json.dumps(payload)
        payload_bytes = payload_json.encode("utf-8")
        payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8")

        # Remove padding for JWT format
        payload_b64 = payload_b64.rstrip("=")

        # Create a fake JWT (header.payload.signature)
        fake_jwt = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{payload_b64}.fake-signature"

        # Decode with validation skipped
        result = decode_jwt_token(fake_jwt, skip_validation=True)

        # Verify payload was correctly parsed
        self.assertIsInstance(result, JWTPayload)
        self.assertEqual(result.folder_id, "test-folder-123")
        self.assertEqual(result.citizen_id, 1234567890)
        self.assertEqual(result.sub, "test-user")
        self.assertEqual(result.exp, 9999999999)

    def test_decode_jwt_with_validation_fails_on_invalid_signature(self):
        """Test that JWT validation fails with invalid signature when skip_validation=False."""
        # Create a JWT with invalid signature
        fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6InRlc3QifQ.invalid-sig"

        # Should raise HTTPException when validation is not skipped
        with self.assertRaises(HTTPException) as context:
            decode_jwt_token(fake_jwt, skip_validation=False)

        self.assertEqual(context.exception.status_code, 401)

    def test_decode_jwt_invalid_format_with_skip_validation(self):
        """Test that invalid JWT format raises error even with skip_validation=True."""
        # JWT with wrong number of parts
        invalid_jwt = "only.two.parts"

        with self.assertRaises(HTTPException):
            decode_jwt_token(invalid_jwt, skip_validation=True)

    def test_decode_jwt_with_padding_needed(self):
        """Test JWT decoding when base64 padding is needed."""
        # Create payload that will need padding when base64 decoded
        payload = {"folderId": "test", "citizenId": 123}
        payload_json = json.dumps(payload)
        payload_bytes = payload_json.encode("utf-8")
        payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8")

        # Remove padding
        payload_b64_no_padding = payload_b64.rstrip("=")

        # Create fake JWT
        fake_jwt = f"eyJhbGciOiJIUzI1NiJ9.{payload_b64_no_padding}.sig"

        # Should decode successfully
        result = decode_jwt_token(fake_jwt, skip_validation=True)
        self.assertEqual(result.folder_id, "test")
        self.assertEqual(result.citizen_id, 123)


class TestDummyURL(unittest.TestCase):
    """Tests for dummyURL feature (provide presigned URL directly)."""

    def test_request_with_dummy_url(self):
        """Test that AuthenticateDocumentRequest accepts dummyURL."""
        request = AuthenticateDocumentRequest(
            documentId="test-doc-123",
            documentTitle="Test Document",
            dummyURL="https://test-bucket.s3.amazonaws.com/test.pdf?sig=xyz",
        )

        self.assertEqual(request.document_id, "test-doc-123")
        self.assertEqual(request.document_title, "Test Document")
        self.assertEqual(
            request.dummy_url, "https://test-bucket.s3.amazonaws.com/test.pdf?sig=xyz"
        )
        self.assertFalse(request.dummy_jwt)  # Should default to False

    def test_request_without_dummy_url(self):
        """Test that dummyURL is optional and defaults to None."""
        request = AuthenticateDocumentRequest(
            documentId="test-doc-123",
            documentTitle="Test Document",
        )

        self.assertIsNone(request.dummy_url)
        self.assertFalse(request.dummy_jwt)

    def test_request_with_alias(self):
        """Test that dummyURL works with camelCase alias."""
        # Test with camelCase
        request = AuthenticateDocumentRequest(
            documentId="test-doc-123",
            documentTitle="Test Document",
            dummyURL="https://example.com/doc.pdf",
        )
        self.assertEqual(request.dummy_url, "https://example.com/doc.pdf")

        # Test serialization includes alias
        request_dict = request.model_dump(by_alias=True)
        self.assertIn("dummyURL", request_dict)


class TestCombinedDummyMode(unittest.TestCase):
    """Tests for combined dummyJWT + dummyURL mode."""

    def test_request_with_both_dummy_flags(self):
        """Test request with both dummyJWT and dummyURL enabled."""
        request = AuthenticateDocumentRequest(
            documentId="test-doc-123",
            documentTitle="Full Dummy Test",
            dummyJWT=True,
            dummyURL="https://example.com/test.pdf",
        )

        self.assertEqual(request.document_id, "test-doc-123")
        self.assertEqual(request.document_title, "Full Dummy Test")
        self.assertTrue(request.dummy_jwt)
        self.assertEqual(request.dummy_url, "https://example.com/test.pdf")

    def test_request_serialization_with_dummy_flags(self):
        """Test that dummy flags serialize correctly."""
        request = AuthenticateDocumentRequest(
            documentId="doc-123",
            documentTitle="Test",
            dummyJWT=True,
            dummyURL="https://test.com/doc.pdf",
        )

        # Serialize with aliases
        data = request.model_dump(by_alias=True)

        self.assertEqual(data["documentId"], "doc-123")
        self.assertEqual(data["documentTitle"], "Test")
        self.assertTrue(data["dummyJWT"])
        self.assertEqual(data["dummyURL"], "https://test.com/doc.pdf")

    def test_full_dummy_mode_workflow(self):
        """Test a complete workflow using both dummy features."""
        # 1. Create request with both dummy flags
        request = AuthenticateDocumentRequest(
            documentId="workflow-test-123",
            documentTitle="Workflow Test Document",
            dummyJWT=True,
            dummyURL="https://dummy-storage.example.com/test-doc.pdf?token=abc123",
        )

        # 2. Create a fake JWT
        payload = {
            "folderId": "workflow-folder",
            "citizenId": 9876543210,
            "sub": "workflow-user",
            "exp": 9999999999,
        }
        payload_b64 = (
            base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        )
        fake_jwt = f"eyJhbGciOiJIUzI1NiJ9.{payload_b64}.fake-sig"

        # 3. Decode JWT without validation
        jwt_payload = decode_jwt_token(fake_jwt, skip_validation=True)

        # 4. Verify everything works together
        self.assertTrue(request.dummy_jwt)
        self.assertIsNotNone(request.dummy_url)
        self.assertEqual(jwt_payload.folder_id, "workflow-folder")
        self.assertEqual(jwt_payload.citizen_id, 9876543210)

        # This simulates what would happen in the actual endpoint:
        # - JWT decoded without validation (dummyJWT=true)
        # - Presigned URL taken from request (dummyURL provided)
        # - Only Gov Carpeta call would be made


class TestDummyModeDefaults(unittest.TestCase):
    """Tests for dummy mode default values and edge cases."""

    def test_dummy_jwt_defaults_to_false(self):
        """Test that dummyJWT defaults to False when not provided."""
        request = AuthenticateDocumentRequest(documentId="test", documentTitle="Test")
        self.assertFalse(request.dummy_jwt)

    def test_dummy_url_defaults_to_none(self):
        """Test that dummyURL defaults to None when not provided."""
        request = AuthenticateDocumentRequest(documentId="test", documentTitle="Test")
        self.assertIsNone(request.dummy_url)

    def test_dummy_jwt_explicit_false(self):
        """Test explicitly setting dummyJWT to False."""
        request = AuthenticateDocumentRequest(
            documentId="test", documentTitle="Test", dummyJWT=False
        )
        self.assertFalse(request.dummy_jwt)

    def test_empty_string_dummy_url(self):
        """Test that empty string for dummyURL is accepted."""
        request = AuthenticateDocumentRequest(
            documentId="test", documentTitle="Test", dummyURL=""
        )
        self.assertEqual(request.dummy_url, "")


if __name__ == "__main__":
    unittest.main()
