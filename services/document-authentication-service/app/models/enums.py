"""
Enumerations for the document authentication service.

This module contains all enum types used throughout the application
for type safety and validation.
"""

from enum import Enum


class AuthenticationStatus(str, Enum):
    """Status codes for document authentication responses."""

    ACCEPTED = "202"
    SUCCESS = "200"
    NO_CONTENT = "204"
    INTERNAL_ERROR = "500"
    WRONG_PARAMETERS = "501"
    SERVICE_UNAVAILABLE = "503"


class AuthenticationMessage(str, Enum):
    """Standard messages for authentication responses."""

    ACCEPTED = "Accepted"
    SUCCESS = "Document authenticated successfully"
    GOV_CARPETA_UNAVAILABLE = "Gov Carpeta service unavailable"
    INTERNAL_ERROR = "Internal server error"
    WRONG_PARAMETERS = "Wrong parameters"
