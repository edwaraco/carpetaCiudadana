"""
Pydantic models for request/response validation.

This module contains all data models used for API requests,
responses, and internal event structures.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AuthenticateDocumentRequest(BaseModel):
    """
    Request model for document authentication endpoint.

    Attributes:
        document_id: UUID of the document to authenticate
        document_title: Human-readable title of the document (e.g., "Diploma Grado")
        dummy_jwt: If True, skip JWT validation and extract claims directly from token as JSON
        dummy_url: If provided, use this URL instead of calling carpeta-ciudadana-service
    """

    document_id: str = Field(
        ..., description="UUID of the document to authenticate", alias="documentId"
    )
    document_title: str = Field(
        ..., description="Title of the document", alias="documentTitle"
    )
    dummy_jwt: Optional[bool] = Field(
        default=False,
        description="Use dummy JWT mode (skip validation, parse as JSON)",
        alias="dummyJWT",
    )
    dummy_url: Optional[str] = Field(
        default=None,
        description="Use this presigned URL instead of fetching from carpeta-ciudadana-service",
        alias="dummyURL",
    )

    model_config = {"populate_by_name": True}


class AuthenticateDocumentResponse(BaseModel):
    """
    Response model for document authentication endpoint.

    Returns a 202 Accepted status immediately while the request
    is forwarded to RabbitMQ for processing.

    Attributes:
        status: HTTP status code (202)
        message: Response message ("Accepted")
    """

    status: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Response message")


class DocumentAuthenticationRequestEvent(BaseModel):
    """
    Event model for RabbitMQ message publication.

    This event is published to the document.authentication.request.queue
    and consumed by document-authentication-service.

    Attributes:
        documentId: Document UUID
        documentTitle: Title of the document
        folderId: Folder UUID (extracted from JWT token)
        citizenId: Citizen identification number (extracted from JWT token)
        dummyJWT: Flag indicating if JWT validation was skipped
        dummyURL: Optional presigned URL (dummy mode)
        rawToken: Original JWT token for service-to-service calls
        timestamp: Timestamp when request was received
    """

    documentId: str = Field(..., description="Document UUID")
    documentTitle: str = Field(..., description="Document title")
    folderId: str = Field(..., description="Folder UUID from JWT token")
    citizenId: int = Field(..., description="Citizen ID from JWT token")
    dummyJWT: bool = Field(default=False, description="Dummy JWT mode flag")
    dummyURL: Optional[str] = Field(
        default=None, description="Optional presigned URL (dummy mode)"
    )
    rawToken: str = Field(..., description="Original JWT token")
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Request timestamp (naive datetime, no timezone)",
    )


class JWTPayload(BaseModel):
    """
    JWT token payload structure.

    This model represents the expected JWT token payload
    used for authentication.

    Attributes:
        folder_id: Citizen's folder ID
        citizen_id: Citizen identification number
        carpetaId: Alternative field name for folder ID
        id_citizen: Alternative field name for citizen ID
        sub: Subject (user ID)
        exp: Token expiration timestamp
    """

    folder_id: Optional[str] = Field(None, alias="folderId")
    citizen_id: Optional[int] = Field(None, alias="citizenId")
    carpetaId: Optional[str] = Field(None, alias="carpetaId")
    id_citizen: Optional[int] = Field(None, alias="idCitizen")
    sub: Optional[str] = None
    exp: Optional[int] = None

    model_config = {"populate_by_name": True}
