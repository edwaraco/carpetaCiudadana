"""
Authentication status and message enumerations.
"""

from enum import Enum


class AuthenticationMessage(Enum):
    """Standard authentication response messages."""

    ACCEPTED = "Accepted"
