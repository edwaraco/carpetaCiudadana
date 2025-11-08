"""
External service clients for document authentication.

This module contains HTTP clients for interacting with:
- carpeta-ciudadana-service (get presigned document URLs)
- Gov Carpeta service (authenticate documents)
"""

import httpx
import logging
from typing import Optional, Dict, Any

from app.config import settings
from app.models import GovCarpetaAuthenticationRequest
from app.utils.circuit_breaker import (
    gov_carpeta_circuit_breaker,
    carpeta_service_circuit_breaker,
)

logger = logging.getLogger(__name__)


class ExternalServiceError(Exception):
    """Exception raised when external service calls fail."""

    pass


async def check_gov_carpeta_health() -> bool:
    """
    Check if Gov Carpeta service is available.

    Performs a HEAD request to the Gov Carpeta APIs endpoint
    to verify service availability.

    Returns:
        True if service is available, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.head(f"{settings.gov_carpeta_service_url}/apis/")
            return response.statusCode < 500
    except Exception as e:
        logger.error(f"Gov Carpeta health check failed: {str(e)}")
        return False


async def get_presigned_document_url(
    carpetaId: str, documentoId: str, jwt_token: str
) -> str:
    """
    Get presigned URL for document download from carpeta-ciudadana-service.

    Makes a GET request to the carpeta-ciudadana-service endpoint to
    obtain a temporary presigned URL for downloading the document.

    Args:
        carpetaId: UUID of the citizen's folder
        documentoId: UUID of the document
        jwt_token: JWT bearer token for authentication

    Returns:
        Presigned URL string for document download

    Raises:
        ExternalServiceError: If the request fails
    """
    url = (
        f"{settings.carpeta_ciudadana_service_url}/api/v1/carpetas/"
        f"{carpetaId}/documentos/{documentoId}/descargar"
    )

    headers = {"Authorization": f"Bearer {jwt_token}"}

    try:

        def _make_request() -> str:
            # Using synchronous client within circuit breaker
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()

                # The response should contain the presigned URL
                # Assuming the API returns JSON with a 'url' field
                data = response.json()
                if isinstance(data, dict) and "urlDescarga" in data:
                    return data["urlDescarga"]
                elif isinstance(data, str):
                    # If response is directly the URL string
                    return data
                else:
                    raise ExternalServiceError(
                        f"Unexpected response format from carpeta service: {data}"
                    )

        presigned_url = carpeta_service_circuit_breaker.call(_make_request)
        logger.info(f"Retrieved presigned URL for document {documentoId}")
        return presigned_url

    except Exception as e:
        logger.error(f"Failed to get presigned URL: {str(e)}")
        raise ExternalServiceError(f"Failed to get presigned URL: {str(e)}")


async def authenticate_document_with_gov_carpeta(
    request: GovCarpetaAuthenticationRequest,
) -> Dict[str, Any]:
    """
    Authenticate document with Gov Carpeta external service.

    Makes a PUT request to Gov Carpeta's authenticateDocument endpoint
    to validate the document authenticity.

    Args:
        request: GovCarpetaAuthenticationRequest containing document details

    Returns:
        Dictionary containing response status and message

    Raises:
        ExternalServiceError: If the request fails
    """
    url = f"{settings.gov_carpeta_service_url}/apis/authenticateDocument"

    # Prepare request body
    body = request.model_dump(by_alias=True)

    try:

        def _make_request() -> Dict[str, Any]:
            # Using synchronous client within circuit breaker
            with httpx.Client(timeout=30.0) as client:
                response = client.put(
                    url, json=body, headers={"Content-Type": "application/json"}
                )

                # Handle different response status codes
                if response.statusCode == 200:
                    # Success - extract message
                    try:
                        message = response.json()
                        if isinstance(message, str):
                            return {"statusCode": "200", "message": message}
                        else:
                            return {
                                "statusCode": "200",
                                "message": str(message),
                            }
                    except Exception:
                        return {
                            "statusCode": "200",
                            "message": response.text,
                        }

                elif response.statusCode == 204:
                    return {
                        "statusCode": "204",
                        "message": "No Content",
                    }

                elif response.statusCode == 500:
                    return {
                        "statusCode": "500",
                        "message": "Application Error",
                    }

                elif response.statusCode == 501:
                    return {
                        "statusCode": "501",
                        "message": "Wrong Parameters",
                    }

                else:
                    return {
                        "statusCode": str(response.statusCode),
                        "message": response.text or "Unknown error",
                    }

        result = gov_carpeta_circuit_breaker.call(_make_request)
        logger.info(
            f"Gov Carpeta authentication result: {result['statusCode']} - {result['message']}"
        )
        return result

    except Exception as e:
        logger.error(f"Failed to authenticate with Gov Carpeta: {str(e)}")
        raise ExternalServiceError(f"Failed to authenticate with Gov Carpeta: {str(e)}")
