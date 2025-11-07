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
    documento_id = request.document_id
    document_title = request.document_title

    # Extract folder_id and citizen_id from JWT payload
    # Handle different possible field names
    carpeta_id = (
        jwt_payload.folder_id or jwt_payload.carpeta_id or jwt_payload.sub or "unknown"
    )
    citizen_id = jwt_payload.citizen_id or jwt_payload.id_citizen or 0

    logger.info(
        f"Starting authentication process for document {documento_id} "
        f"in folder {carpeta_id} (dummy_url={bool(request.dummy_url)})"
    )

    try:
        # Step 1: Health check for Gov Carpeta service
        logger.info("Checking Gov Carpeta service health...")
        is_healthy = await check_gov_carpeta_health()

        if not is_healthy:
            logger.warning("Gov Carpeta service is unavailable")
            # Publish failure event
            event = DocumentoAutenticadoEvent(
                documento_id=documento_id,
                carpeta_id=str(carpeta_id),
                status_code=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=AuthenticationMessage.GOV_CARPETA_UNAVAILABLE.value,
                fecha_autenticacion=datetime.utcnow(),
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
                    carpeta_id=str(carpeta_id),
                    documento_id=documento_id,
                    jwt_token=raw_token,
                )
                logger.info(f"Presigned URL retrieved successfully")
            except ExternalServiceError as e:
                logger.error(f"Failed to get presigned URL: {str(e)}")
                event = DocumentoAutenticadoEvent(
                    documento_id=documento_id,
                    carpeta_id=str(carpeta_id),
                    status_code=AuthenticationStatus.INTERNAL_ERROR.value,
                    mensaje=f"Failed to retrieve document URL: {str(e)}",
                    fecha_autenticacion=datetime.utcnow(),
                )
                await rabbitmq_client.publish_authentication_event(event)
                return

        # Step 3: Authenticate with Gov Carpeta
        logger.info("Authenticating document with Gov Carpeta...")
        gov_carpeta_request = GovCarpetaAuthenticationRequest(
            id_citizen=citizen_id,
            url_document=presigned_url,
            document_title=document_title,
        )

        try:
            result = await authenticate_document_with_gov_carpeta(gov_carpeta_request)
            logger.info(
                f"Gov Carpeta authentication completed with status {result['status_code']}"
            )

            # Step 4: Publish success event
            event = DocumentoAutenticadoEvent(
                documento_id=documento_id,
                carpeta_id=str(carpeta_id),
                status_code=result["status_code"],
                mensaje=result["message"],
                fecha_autenticacion=datetime.utcnow(),
            )
            await rabbitmq_client.publish_authentication_event(event)
            logger.info(
                f"Authentication event published successfully for document {documento_id}"
            )

        except ExternalServiceError as e:
            logger.error(f"Failed to authenticate with Gov Carpeta: {str(e)}")
            event = DocumentoAutenticadoEvent(
                documento_id=documento_id,
                carpeta_id=str(carpeta_id),
                status_code=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=f"Authentication failed: {str(e)}",
                fecha_autenticacion=datetime.utcnow(),
            )
            await rabbitmq_client.publish_authentication_event(event)

    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(f"Unexpected error in authentication process: {str(e)}")
        try:
            event = DocumentoAutenticadoEvent(
                documento_id=documento_id,
                carpeta_id=str(carpeta_id),
                status_code=AuthenticationStatus.INTERNAL_ERROR.value,
                mensaje=f"Internal error: {str(e)}",
                fecha_autenticacion=datetime.utcnow(),
            )
            await rabbitmq_client.publish_authentication_event(event)
        except Exception as publish_error:
            logger.critical(
                f"Failed to publish error event to RabbitMQ: {str(publish_error)}"
            )
