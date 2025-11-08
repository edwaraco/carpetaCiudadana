"""
JWT authentication utilities.

This module provides functions for JWT token validation and
extraction of claims from bearer tokens.
"""

from jose import jwt, JWTError
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
import json
import base64

from app.config import settings
from app.models import JWTPayload

logger = logging.getLogger(__name__)

# Security scheme for bearer token
security = HTTPBearer()


def decode_jwt_token(token: str, skip_validation: bool = False) -> JWTPayload:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string
        skip_validation: If True, parse the token as plain JSON without signature verification

    Returns:
        JWTPayload object containing the token claims

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        if skip_validation:
            # Dummy mode: parse JWT payload without validation
            logger.warning("JWT validation SKIPPED - dummy mode enabled")
            # JWT structure: header.payload.signature
            parts = token.split(".")
            if len(parts) != 3:
                raise ValueError("Invalid JWT format")

            # Decode the payload (add padding if needed)
            payload_part = parts[1]
            # Add padding if needed
            padding = 4 - (len(payload_part) % 4)
            if padding != 4:
                payload_part += "=" * padding

            decoded_bytes = base64.urlsafe_b64decode(payload_part)
            payload = json.loads(decoded_bytes)
            return JWTPayload(**payload)
        else:
            # Normal mode: validate JWT signature
            payload = jwt.decode(
                token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )
            return JWTPayload(**payload)
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            statusCode=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"JWT parsing error: {str(e)}")
        raise HTTPException(
            statusCode=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not parse JWT token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Security(security),
    skip_validation: bool = False,
) -> JWTPayload:
    """
    Extract and validate JWT token from Authorization header.

    This function is used as a FastAPI dependency to protect endpoints.

    Args:
        credentials: HTTP Authorization credentials from request
        skip_validation: If True, skip JWT signature validation (for testing)

    Returns:
        JWTPayload object containing the validated token claims

    Raises:
        HTTPException: If token is missing, invalid, or expired
    """
    token = credentials.credentials
    return decode_jwt_token(token, skip_validation=skip_validation)
