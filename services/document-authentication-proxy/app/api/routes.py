"""
API routes for document authentication proxy service.

This module defines the FastAPI endpoints that receive HTTP requests
and convert them to RabbitMQ events.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials

from app.models import (
    AuthenticateDocumentRequest,
    AuthenticateDocumentResponse,
    DocumentAuthenticationRequestEvent,
    JWTPayload,
)
from app.models.enums import AuthenticationMessage
from app.utils.auth import decode_jwt_token, security
from app.services.rabbitmq_client import rabbitmq_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["authentication"])


@router.post(
    "/authenticateDocument",
    response_model=AuthenticateDocumentResponse,
    status_code=202,
    summary="Authenticate a document (Proxy)",
    description=(
        "Submit a document for authentication. This proxy service converts "
        "the HTTP request into a RabbitMQ event for asynchronous processing. "
        "The request is accepted immediately (202) and forwarded to the event queue."
    ),
)
async def authenticate_document(
    request: AuthenticateDocumentRequest,
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticateDocumentResponse:
    """
    Authenticate a document (Proxy endpoint).

    This endpoint receives a document authentication request, extracts
    JWT claims, and publishes an event to RabbitMQ for processing by
    the document-authentication-service.

    The flow:
    1. Validate request and JWT token (or skip validation if dummyJWT=true)
    2. Extract folderId and citizenId from JWT
    3. Publish event to document.authentication.request.queue
    4. Return 202 Accepted immediately

    Args:
        request: Document authentication request containing documentId, documentTitle,
                 and optional dummyJWT and dummyURL flags
        http_request: HTTP request object (for logging)
        credentials: HTTP Authorization credentials (from dependency)

    Returns:
        AuthenticateDocumentResponse with status 202 and message "Accepted"

    Raises:
        HTTPException: 401 if JWT token is invalid or expired (when dummyJWT=false)
        HTTPException: 500 if event publishing fails
    """
    logger.info(
        f"Received authentication request for document {request.document_id} "
        f"with title '{request.document_title}' "
        f"(dummyJWT={request.dummy_jwt}, dummyURL={bool(request.dummy_url)})"
    )

    # Extract raw token from credentials
    raw_token = credentials.credentials

    # Decode JWT with or without validation based on dummyJWT flag
    jwt_payload = decode_jwt_token(
        raw_token, skip_validation=request.dummy_jwt or False
    )

    # Extract folder_id and citizen_id from JWT payload
    # Handle different possible field names
    folder_id = (
        jwt_payload.folder_id or jwt_payload.carpetaId or jwt_payload.sub or "unknown"
    )
    citizen_id = jwt_payload.citizen_id or jwt_payload.id_citizen or 0

    logger.info(
        f"JWT parsed successfully - folderId: {folder_id}, citizenId: {citizen_id}"
    )

    # Create event to publish
    event = DocumentAuthenticationRequestEvent(
        documentId=request.document_id,
        documentTitle=request.document_title,
        folderId=str(folder_id),
        citizenId=citizen_id,
        dummyJWT=request.dummy_jwt or False,
        dummyURL=request.dummy_url,
        rawToken=raw_token,
        timestamp=datetime.now(),
    )

    # Publish event to RabbitMQ
    try:
        await rabbitmq_client.publish_authentication_request_event(event)
        logger.info(
            f"Authentication request event published successfully for document {request.document_id}"
        )
    except Exception as e:
        logger.error(f"Failed to publish authentication request event: {str(e)}")
        from fastapi import HTTPException

        raise HTTPException(
            status_code=500,
            detail=f"Failed to publish authentication request: {str(e)}",
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
        "service": "document-authentication-proxy",
        "version": "1.0.0",
    }
