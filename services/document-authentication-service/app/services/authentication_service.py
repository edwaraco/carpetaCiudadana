"""
Background task service for document authentication processing.

This module handles the asynchronous processing of document
authentication requests, including:
1. Health check of Gov Carpeta service
2. Retrieving presigned URL from carpeta-ciudadana-service
3. Authenticating document with Gov Carpeta
4. Publishing results to RabbitMQ
"""

import logging
from datetime import datetime

from app.models import (
    AuthenticateDocumentRequest,
    GovCarpetaAuthenticationRequest,
    DocumentoAutenticadoEvent,
    JWTPayload,
)
from app.models.enums import AuthenticationStatus, AuthenticationMessage
from app.services.external_services import (
    check_gov_carpeta_health,
    get_presigned_document_url,
    authenticate_document_with_gov_carpeta,
    ExternalServiceError,
)
from app.services.rabbitmq_client import rabbitmq_client

logger = logging.getLogger(__name__)


async def process_document_authentication(
    request: AuthenticateDocumentRequest,
    jwt_payload: JWTPayload,
    raw_token: str,
) -> None:
    """
    Process document authentication in the background.

    This is the main orchestration function that coordinates all steps
    of the document authentication flow:

    1. Check Gov Carpeta service health
    2. If unavailable, publish error event and exit
    3. Get presigned URL from carpeta-ciudadana-service (or use dummyURL if provided)
    4. Call Gov Carpeta authentication API
    5. Publish result event to RabbitMQ

    Args:
        request: Document authentication request data (may include dummyURL)
        jwt_payload: Decoded JWT token payload
        raw_token: Raw JWT token string for service-to-service calls

    Note:
        This function handles all errors internally and always publishes
        an event to RabbitMQ, even in case of failures.
    """
    documentoId = request.document_id
    document_title = request.document_title

    # Extract folder_id and citizen_id from JWT payload
    # Handle different possible field names
    carpetaId = (
        jwt_payload.folder_id or jwt_payload.carpetaId or jwt_payload.sub or "unknown"
    )
    citizen_id = jwt_payload.citizen_id or jwt_payload.id_citizen or 0

    logger.info(
        f"Starting authentication process for document {documentoId} "
        f"in folder {carpetaId} (dummy_url={bool(request.dummy_url)})"
    )

    try:
        # Step 1: Health check for Gov Carpeta service
        logger.info("Checking Gov Carpeta service health...")
        is_healthy = await check_gov_carpeta_health()

        if not is_healthy:
            logger.warning("Gov Carpeta service is unavailable")
            # Publish failure event
            event = DocumentoAutenticadoEvent(
                documentoId=documentoId,
                carpetaId=str(carpetaId),
                statusCode=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=AuthenticationMessage.GOV_CARPETA_UNAVAILABLE.value,
                fechaAutenticacion=datetime.now(),
            )
            await rabbitmq_client.publish_authentication_event(event)
            return

        # Step 2: Get presigned URL (or use dummy URL if provided)
        if request.dummy_url:
            logger.warning(
                f"Using DUMMY URL instead of calling carpeta-ciudadana-service: {request.dummy_url}"
            )
            presigned_url = request.dummy_url
        else:
            logger.info("Retrieving presigned URL from carpeta-ciudadana-service...")
            try:
                presigned_url = await get_presigned_document_url(
                    carpetaId=str(carpetaId),
                    documentoId=documentoId,
                    jwt_token=raw_token,
                )
                logger.info(f"Presigned URL retrieved successfully")
            except ExternalServiceError as e:
                logger.error(f"Failed to get presigned URL: {str(e)}")
                event = DocumentoAutenticadoEvent(
                    documentoId=documentoId,
                    carpetaId=str(carpetaId),
                    statusCode=AuthenticationStatus.INTERNAL_ERROR.value,
                    mensaje=f"Failed to retrieve document URL: {str(e)}",
                    fechaAutenticacion=datetime.now(),
                )
                await rabbitmq_client.publish_authentication_event(event)
                return

        # Step 3: Authenticate with Gov Carpeta
        logger.info("Authenticating document with Gov Carpeta...")
        gov_carpeta_request = GovCarpetaAuthenticationRequest(
            idCitizen=citizen_id,
            UrlDocument=presigned_url,
            documentTitle=document_title,
        )

        try:
            result = await authenticate_document_with_gov_carpeta(gov_carpeta_request)
            logger.info(
                f"Gov Carpeta authentication completed with status {result['statusCode']}"
            )

            # Step 4: Publish success event
            event = DocumentoAutenticadoEvent(
                documentoId=documentoId,
                carpetaId=str(carpetaId),
                statusCode=result["statusCode"],
                mensaje=result["message"],
                fechaAutenticacion=datetime.now(),
            )
            await rabbitmq_client.publish_authentication_event(event)
            logger.info(
                f"Authentication event published successfully for document {documentoId}"
            )

        except ExternalServiceError as e:
            logger.error(f"Failed to authenticate with Gov Carpeta: {str(e)}")
            event = DocumentoAutenticadoEvent(
                documentoId=documentoId,
                carpetaId=str(carpetaId),
                statusCode=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=f"Authentication failed: {str(e)}",
                fechaAutenticacion=datetime.now(),
            )
            await rabbitmq_client.publish_authentication_event(event)

    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(f"Unexpected error in authentication process: {str(e)}")
        try:
            event = DocumentoAutenticadoEvent(
                documentoId=documentoId,
                carpetaId=str(carpetaId),
                statusCode=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=f"Internal error: {str(e)}",
                fechaAutenticacion=datetime.now(),
            )
            await rabbitmq_client.publish_authentication_event(event)
        except Exception as publish_error:
            logger.critical(
                f"Failed to publish error event to RabbitMQ: {str(publish_error)}"
            )


async def process_document_authentication_from_event(
    document_id: str,
    document_title: str,
    jwt_payload: JWTPayload,
    raw_token: str,
    dummy_jwt: bool = False,
    dummy_url: str = None,
) -> None:
    """
    Process document authentication from RabbitMQ event.

    This function is called by the RabbitMQ consumer when an authentication
    request event is received from document-authentication-proxy.

    Args:
        document_id: UUID of the document to authenticate
        document_title: Title of the document
        jwt_payload: Decoded JWT token payload with folderId and citizenId
        raw_token: Raw JWT token string for service-to-service calls
        dummy_jwt: If True, JWT validation was skipped in proxy
        dummy_url: Optional presigned URL (dummy mode)

    Note:
        This is a wrapper around the existing process_document_authentication
        function that adapts event parameters to the expected format.
    """
    # Create AuthenticateDocumentRequest from event parameters
    from app.models import AuthenticateDocumentRequest

    request = AuthenticateDocumentRequest(
        documentId=document_id,
        documentTitle=document_title,
        dummyJWT=dummy_jwt,
        dummyURL=dummy_url,
    )

    # Call existing authentication processing logic
    await process_document_authentication(request, jwt_payload, raw_token)
