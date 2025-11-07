"""
API routes for document authentication service.

This module defines the FastAPI endpoints for the document
authentication service.
"""

import logging
from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials

from app.models import (
    AuthenticateDocumentRequest,
    AuthenticateDocumentResponse,
    JWTPayload,
)
from app.models.enums import AuthenticationStatus, AuthenticationMessage
from app.utils.auth import get_current_token_payload, security
from app.services.authentication_service import process_document_authentication

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["authentication"])


@router.post(
    "/authenticateDocument",
    response_model=AuthenticateDocumentResponse,
    status_code=202,
    summary="Authenticate a document",
    description=(
        "Submit a document for authentication with Gov Carpeta service. "
        "The request is accepted immediately (202) and processed asynchronously. "
        "Results are published to RabbitMQ queue."
    ),
)
async def authenticate_document(
    request: AuthenticateDocumentRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticateDocumentResponse:
    """
    Authenticate a document with Gov Carpeta service.

    This endpoint accepts a document authentication request and processes it
    asynchronously in the background. The response is returned immediately
    with a 202 Accepted status.

    The authentication flow:
    1. Validate request and JWT token (or skip validation if dummyJWT=true)
    2. Return 202 Accepted immediately
    3. In background:
       - Check Gov Carpeta service health
       - Get presigned URL from carpeta-ciudadana-service (or use dummyURL if provided)
       - Authenticate with Gov Carpeta
       - Publish result to RabbitMQ queue

    Args:
        request: Document authentication request containing documentId, documentTitle,
                 and optional dummyJWT and dummyURL flags
        background_tasks: FastAPI background tasks manager
        http_request: HTTP request object (to extract raw token)
        credentials: HTTP Authorization credentials (from dependency)

    Returns:
        AuthenticateDocumentResponse with status 202 and message "Accepted"

    Raises:
        HTTPException: 401 if JWT token is invalid or expired (when dummyJWT=false)
    """
    logger.info(
        f"Received authentication request for document {request.document_id} "
        f"with title '{request.document_title}' "
        f"(dummyJWT={request.dummy_jwt}, dummyURL={bool(request.dummy_url)})"
    )

    # Extract raw token from credentials
    raw_token = credentials.credentials

    # Decode JWT with or without validation based on dummyJWT flag
    from app.utils.auth import decode_jwt_token

    jwt_payload = decode_jwt_token(
        raw_token, skip_validation=request.dummy_jwt or False
    )

    # Add background task for processing
    background_tasks.add_task(
        process_document_authentication, request, jwt_payload, raw_token
    )

    logger.info(
        f"Authentication request accepted, processing in background for document {request.document_id}"
    )

    return AuthenticateDocumentResponse(
        status=202, message=AuthenticationMessage.ACCEPTED.value
    )


@router.get(
    "/health",
    summary="Health check",
    description="Check if the service is running and healthy",
)
async def health_check():
    """
    Health check endpoint.

    Returns service health status and basic information.

    Returns:
        Dictionary with service status information
    """
    return {
        "status": "healthy",
        "service": "document-authentication-service",
        "version": "1.0.0",
    }
