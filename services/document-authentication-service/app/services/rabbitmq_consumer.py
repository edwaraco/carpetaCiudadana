"""
RabbitMQ consumer for document authentication request events.

This module handles consuming events from the document.authentication.request.queue
and processing them asynchronously.
"""

import json
import logging
import asyncio
from typing import Optional, Callable
from aio_pika import IncomingMessage
from aio_pika.abc import AbstractQueue

from app.config import settings
from app.services.rabbitmq_client import rabbitmq_client
from app.services.authentication_service import process_document_authentication_from_event
from app.models import JWTPayload

logger = logging.getLogger(__name__)


class RabbitMQConsumer:
    """
    RabbitMQ consumer for processing document authentication request events.

    This class manages consuming events from the request queue and
    delegates processing to the authentication service.
    """

    def __init__(self):
        """Initialize RabbitMQ consumer."""
        self.queue_name = "document.authentication.request.queue"
        self.queue: Optional[AbstractQueue] = None
        self.is_consuming = False

    async def start_consuming(self) -> None:
        """
        Start consuming messages from the request queue.

        This method sets up the consumer and begins processing
        incoming authentication request events.
        """
        try:
            if not rabbitmq_client.channel:
                logger.error("RabbitMQ channel not initialized")
                raise Exception("RabbitMQ channel not initialized")

            # Declare and get the queue
            self.queue = await rabbitmq_client.channel.declare_queue(
                self.queue_name, durable=True
            )

            logger.info(f"Starting to consume from queue: {self.queue_name}")

            # Start consuming with prefetch count to limit concurrent processing
            await rabbitmq_client.channel.set_qos(prefetch_count=10)

            self.is_consuming = True

            # Consume messages
            await self.queue.consume(self._process_message)

            logger.info("Consumer started successfully")

        except Exception as e:
            logger.error(f"Failed to start consumer: {str(e)}")
            raise

    async def stop_consuming(self) -> None:
        """
        Stop consuming messages from the queue.

        Gracefully stops the consumer.
        """
        self.is_consuming = False
        if self.queue:
            try:
                await self.queue.cancel()
                logger.info("Consumer stopped")
            except Exception as e:
                logger.error(f"Error stopping consumer: {str(e)}")

    async def _process_message(self, message: IncomingMessage) -> None:
        """
        Process an incoming authentication request message.

        Args:
            message: Incoming RabbitMQ message containing authentication request event

        Note:
            This method acknowledges the message after successful processing
            or rejects it on failure (to send to DLQ after retry limit).
        """
        async with message.process():
            try:
                # Parse message body
                body = message.body.decode()
                event_data = json.loads(body)

                logger.info(
                    f"Received authentication request for document {event_data.get('documentId')}"
                )

                # Extract event fields
                document_id = event_data.get("documentId")
                document_title = event_data.get("documentTitle")
                folder_id = event_data.get("folderId")
                citizen_id = event_data.get("citizenId")
                dummy_jwt = event_data.get("dummyJWT", False)
                dummy_url = event_data.get("dummyURL")
                raw_token = event_data.get("rawToken")

                # Create JWT payload object from extracted fields
                jwt_payload = JWTPayload(
                    folderId=folder_id,
                    citizenId=citizen_id,
                    folder_id=folder_id,
                    citizen_id=citizen_id,
                )

                # Process authentication (existing logic from routes.py)
                await process_document_authentication_from_event(
                    document_id=document_id,
                    document_title=document_title,
                    jwt_payload=jwt_payload,
                    raw_token=raw_token,
                    dummy_jwt=dummy_jwt,
                    dummy_url=dummy_url,
                )

                logger.info(
                    f"Successfully processed authentication request for document {document_id}"
                )

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {str(e)}")
                # Message will be rejected and sent to DLQ
                raise

            except KeyError as e:
                logger.error(f"Missing required field in event: {str(e)}")
                # Message will be rejected and sent to DLQ
                raise

            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                # Message will be rejected and sent to DLQ after retries
                raise


# Global consumer instance
rabbitmq_consumer = RabbitMQConsumer()
