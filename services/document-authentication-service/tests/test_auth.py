"""
Unit tests for authentication utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from jose import jwt

from app.utils.auth import decode_jwt_token
from app.models import JWTPayload


class TestAuthUtilities(unittest.TestCase):
    """Test cases for JWT authentication utilities."""

    def setUp(self):
        """Set up test fixtures."""
        self.secret_key = "test-secret-key"
        self.algorithm = "HS256"

    @patch("app.utils.auth.settings")
    def test_decode_valid_token(self, mock_settings):
        """Test decoding a valid JWT token."""
        mock_settings.jwt_secret_key = self.secret_key
        mock_settings.jwt_algorithm = self.algorithm

        # Create a valid token
        payload = {
            "folderId": "folder-123",
            "citizenId": 1234567890,
            "sub": "user-123",
            "exp": 9999999999,
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

        # Decode token
        result = decode_jwt_token(token)

        self.assertIsInstance(result, JWTPayload)
        self.assertEqual(result.folder_id, "folder-123")
        self.assertEqual(result.citizen_id, 1234567890)

    @patch("app.utils.auth.settings")
    def test_decode_invalid_token(self, mock_settings):
        """Test that invalid token raises HTTPException."""
        mock_settings.jwt_secret_key = self.secret_key
        mock_settings.jwt_algorithm = self.algorithm

        invalid_token = "invalid.token.here"

        with self.assertRaises(HTTPException) as context:
            decode_jwt_token(invalid_token)

        self.assertEqual(context.exception.status_code, 401)

    @patch("app.utils.auth.settings")
    def test_decode_expired_token(self, mock_settings):
        """Test that expired token raises HTTPException."""
        mock_settings.jwt_secret_key = self.secret_key
        mock_settings.jwt_algorithm = self.algorithm

        # Create an expired token
        payload = {"sub": "user-123", "exp": 1}  # Expired timestamp
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

        with self.assertRaises(HTTPException) as context:
            decode_jwt_token(token)

        self.assertEqual(context.exception.status_code, 401)

    @patch("app.utils.auth.settings")
    def test_decode_token_wrong_signature(self, mock_settings):
        """Test that token with wrong signature raises HTTPException."""
        mock_settings.jwt_secret_key = self.secret_key
        mock_settings.jwt_algorithm = self.algorithm

        # Create token with different secret
        payload = {"sub": "user-123", "exp": 9999999999}
        token = jwt.encode(payload, "wrong-secret", algorithm=self.algorithm)

        with self.assertRaises(HTTPException) as context:
            decode_jwt_token(token)

        self.assertEqual(context.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
