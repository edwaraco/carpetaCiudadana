"""
Document Authentication Service - Main Application

This FastAPI application handles document authentication by coordinating
between carpeta-ciudadana-service and Gov Carpeta's external API.

The service:
- Accepts document authentication requests via REST API
- Validates requests using JWT bearer tokens
- Processes authentication asynchronously in background
- Publishes results to RabbitMQ for downstream processing
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router
from app.services.rabbitmq_client import rabbitmq_client

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Connect to RabbitMQ and start event consumer
    - Shutdown: Stop event consumer and disconnect from RabbitMQ

    Args:
        app: FastAPI application instance
    """
    # Startup
    logger.info("Starting document authentication service...")
    try:
        await rabbitmq_client.connect()
        logger.info("RabbitMQ connection established")
        
        # Start consuming authentication request events
        from app.services.rabbitmq_consumer import rabbitmq_consumer
        await rabbitmq_consumer.start_consuming()
        logger.info("RabbitMQ consumer started")
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ or start consumer: {str(e)}")
        logger.warning("Service starting without RabbitMQ connection/consumer")

    yield

    # Shutdown
    logger.info("Shutting down document authentication service...")
    try:
        from app.services.rabbitmq_consumer import rabbitmq_consumer
        await rabbitmq_consumer.stop_consuming()
        logger.info("RabbitMQ consumer stopped")
    except Exception as e:
        logger.error(f"Error stopping consumer: {str(e)}")
    
    await rabbitmq_client.disconnect()
    logger.info("Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Document Authentication Service",
    description=(
        "Service for authenticating documents with Gov Carpeta external API. "
        "Handles asynchronous document verification and publishes results to RabbitMQ."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/swagger-ui.html",
    openapi_url="/api/v1/api-docs",
    redoc_url="/api/v1/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint - redirect to docs."""
    return {
        "message": "Document Authentication Service",
        "docs": "/api/v1/swagger-ui.html",
        "openapi": "/api/v1/api-docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.service_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
