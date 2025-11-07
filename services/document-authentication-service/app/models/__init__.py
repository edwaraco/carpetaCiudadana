"""
Pydantic models for request/response validation.

This module contains all data models used for API requests,
responses, and internal event structures.
"""

from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from typing import Optional


class AuthenticateDocumentRequest(BaseModel):
    """
    Request model for document authentication endpoint.

    Attributes:
        document_id: UUID of the document to authenticate
        document_title: Human-readable title of the document (e.g., "Diploma Grado")
    """

    document_id: str = Field(
        ..., description="UUID of the document to authenticate", alias="documentId"
    )
    document_title: str = Field(
        ..., description="Title of the document", alias="documentTitle"
    )

    model_config = {"populate_by_name": True}


class AuthenticateDocumentResponse(BaseModel):
    """
    Response model for document authentication endpoint.

    Returns a 202 Accepted status immediately while processing
    continues in the background.

    Attributes:
        status: HTTP status code (202)
        message: Response message ("Accepted")
    """

    status: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Response message")


class GovCarpetaAuthenticationRequest(BaseModel):
    """
    Request model for Gov Carpeta authentication API.

    Attributes:
        id_citizen: Citizen identification number
        url_document: Presigned URL to download the document
        document_title: Title of the document being authenticated
    """

    id_citizen: int = Field(..., description="Citizen ID", alias="idCitizen")
    url_document: str = Field(
        ..., description="Presigned URL for document download", alias="UrlDocument"
    )
    document_title: str = Field(
        ..., description="Document title", alias="documentTitle"
    )

    model_config = {"populate_by_name": True}


class DocumentoAutenticadoEvent(BaseModel):
    """
    Event model for RabbitMQ message publication.

    This event is published to the document_authenticated_response queue
    after processing the authentication request.

    Attributes:
        documento_id: Document UUID
        carpeta_id: Folder UUID (from JWT token)
        status_code: Result status code (200, 204, 500, 501)
        mensaje: Response message from Gov Carpeta or error message
        fecha_autenticacion: Timestamp when authentication was processed
    """

    documento_id: str = Field(..., description="Document UUID")
    carpeta_id: str = Field(..., description="Folder UUID from JWT token")
    status_code: str = Field(..., description="Authentication status code")
    mensaje: str = Field(..., description="Authentication result message")
    fecha_autenticacion: datetime = Field(
        default_factory=datetime.utcnow, description="Authentication timestamp"
    )


class JWTPayload(BaseModel):
    """
    JWT token payload structure.

    This model represents the expected JWT token payload
    used for authentication.

    Attributes:
        folder_id: Citizen's folder ID
        citizen_id: Citizen identification number
        sub: Subject (user ID)
        exp: Token expiration timestamp
    """

    folder_id: Optional[str] = Field(None, alias="folderId")
    citizen_id: Optional[int] = Field(None, alias="citizenId")
    carpeta_id: Optional[str] = Field(None, alias="carpetaId")
    id_citizen: Optional[int] = Field(None, alias="idCitizen")
    sub: Optional[str] = None
    exp: Optional[int] = None

    model_config = {"populate_by_name": True}
