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

from app.config import settings
from app.models import JWTPayload

logger = logging.getLogger(__name__)

# Security scheme for bearer token
security = HTTPBearer()


def decode_jwt_token(token: str) -> Optional[JWTPayload]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        JWTPayload object containing the token claims

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return JWTPayload(**payload)
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> JWTPayload:
    """
    Extract and validate JWT token from Authorization header.

    This function is used as a FastAPI dependency to protect endpoints.

    Args:
        credentials: HTTP Authorization credentials from request

    Returns:
        JWTPayload object containing the validated token claims

    Raises:
        HTTPException: If token is missing, invalid, or expired
    """
    token = credentials.credentials
    return decode_jwt_token(token)
