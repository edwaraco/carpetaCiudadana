"""
RabbitMQ client for publishing document authentication request events.

This module handles connection to RabbitMQ and publishing events
to the document.authentication.request.queue queue.
"""

import json
import logging
from typing import Optional
import aio_pika
from aio_pika import connect_robust, Message, DeliveryMode
from aio_pika.abc import AbstractConnection, AbstractChannel

from app.config import settings
from app.models import DocumentAuthenticationRequestEvent

logger = logging.getLogger(__name__)


class RabbitMQClient:
    """
    RabbitMQ client for publishing document authentication request events.

    This class manages the connection to RabbitMQ and provides
    methods to publish events to the configured queue.
    """

    def __init__(self):
        """Initialize RabbitMQ client with connection parameters."""
        self.connection: Optional[AbstractConnection] = None
        self.channel: Optional[AbstractChannel] = None
        self.queue_name = settings.document_authentication_request_queue

    async def connect(self) -> None:
        """
        Establish connection to RabbitMQ server.

        Creates a robust connection that automatically reconnects
        on connection failures.

        Raises:
            Exception: If connection fails
        """
        try:
            self.connection = await connect_robust(settings.rabbitmq_url)
            self.channel = await self.connection.channel()
            # Declare queue to ensure it exists
            await self.channel.declare_queue(self.queue_name, durable=True)
            logger.info(f"Connected to RabbitMQ and declared queue: {self.queue_name}")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            raise

    async def disconnect(self) -> None:
        """
        Close RabbitMQ connection gracefully.

        Closes the channel and connection if they are open.
        """
        try:
            if self.channel:
                await self.channel.close()
            if self.connection:
                await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
        except Exception as e:
            logger.error(f"Error disconnecting from RabbitMQ: {str(e)}")

    async def publish_authentication_request_event(
        self, event: DocumentAuthenticationRequestEvent
    ) -> None:
        """
        Publish document authentication request event to RabbitMQ queue.

        Args:
            event: DocumentAuthenticationRequestEvent instance to publish

        Raises:
            Exception: If publishing fails
        """
        if not self.channel:
            logger.error("RabbitMQ channel not initialized")
            raise Exception("RabbitMQ channel not initialized")

        try:
            # Convert event to JSON
            event_dict = event.model_dump()
            # Convert datetime to ISO format string
            event_dict["timestamp"] = event.timestamp.isoformat()

            message_body = json.dumps(event_dict)

            # Create message with persistent delivery mode
            message = Message(
                body=message_body.encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
                content_type="application/json",
            )

            # Publish to queue
            await self.channel.default_exchange.publish(
                message, routing_key=self.queue_name
            )

            logger.info(
                f"Published authentication request event for document {event.documentId} "
                f"from folder {event.folderId}"
            )
        except Exception as e:
            logger.error(f"Failed to publish event to RabbitMQ: {str(e)}")
            raise


# Global RabbitMQ client instance
rabbitmq_client = RabbitMQClient()
