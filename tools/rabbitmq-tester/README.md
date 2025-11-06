# RabbitMQ Tester - Carpeta Ciudadana

Simple Python scripts for testing RabbitMQ queues in the Carpeta Ciudadana project.

## Overview

These scripts allow you to send and receive test messages to/from the RabbitMQ queues used in the Carpeta Ciudadana system. They support three main queues with their specific message formats.

## Supported Queues

1. **document_verification_request** - Document verification requests
2. **document_verified_response** - Document verification responses
3. **test_queue** - Simple test messages

For detailed information about the RabbitMQ service configuration, see `services/rabbitmq-service/README.md`.

## Prerequisites

- Python 3.8+
- RabbitMQ cluster running (see `services/rabbitmq-service/` for setup)
- Network access to RabbitMQ (default: localhost:5672)

## Installation

Install the required Python dependency:

```bash
cd tools/rabbitmq-tester
pip install -r requirements.txt
```

## Usage

### Producer (Send Messages)

#### Interactive Mode

Run without arguments to use the interactive menu:

```bash
python producer.py
```

You'll see a menu where you can:

- Select which queue to send to (1-3)
- Specify how many messages to send
- Send multiple batches without reconnecting

#### Command-Line Mode

Send messages directly with arguments:

```bash
# Send 1 message to document_verification_request
python producer.py --queue document_verification_request

# Send 5 messages to document_verified_response
python producer.py --queue document_verified_response --count 5

# Send to test_queue with custom connection
python producer.py --queue test_queue --count 3 \
  --host localhost --port 5672 --user admin --password admin123
```

#### Options

- `--host` - RabbitMQ host (default: localhost)
- `--port` - RabbitMQ port (default: 5672)
- `--user` - RabbitMQ username (default: admin)
- `--password` - RabbitMQ password (default: admin123)
- `--queue` - Queue name (document_verification_request, document_verified_response, test_queue)
- `--count` - Number of messages to send (default: 1)

### Consumer (Receive Messages)

#### Interactive Mode

Run without arguments to use the interactive menu:

```bash
python consumer.py
```

You'll see a menu where you can:

- Select which queue to consume from (1-3)
- Switch between queues without reconnecting
- Press Ctrl+C to return to menu (not exit)

#### Command-Line Mode

Consume messages directly with arguments:

```bash
# Consume from document_verification_request
python consumer.py --queue document_verification_request

# Consume from test_queue with custom connection
python consumer.py --queue test_queue \
  --host localhost --port 5672 --user admin --password admin123
```

#### Options

- `--host` - RabbitMQ host (default: localhost)
- `--port` - RabbitMQ port (default: 5672)
- `--user` - RabbitMQ username (default: admin)
- `--password` - RabbitMQ password (default: admin123)
- `--queue` - Queue name (document_verification_request, document_verified_response, test_queue)

### Using with Kubernetes

If RabbitMQ is running in Kubernetes, use port-forward and pass credentials:

```bash
# Terminal 1: Port forward
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672

# Terminal 2: Get credentials
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

# Terminal 3: Run producer
python producer.py --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 4: Run consumer
python consumer.py --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD
```

## Message Formats

### document_verification_request

```json
{
  "idCitizen": 1234567890,
  "UrlDocument": "https://carpeta-ciudadana-docs.s3.amazonaws.com/uuid.image.jpg?AWSAccessKeyId=<key>&Expires=145671",
  "documentTitle": "Diploma Grado"
}
```

### document_verified_response

```json
{
  "status": 200,
  "message": "El documento: Diploma Grado del ciudadano 1234567890 ha sido autenticado exitosamente"
}
```

### test_queue

```json
{
  "id": "uuid-v4",
  "timestamp": "2025-11-06T12:00:00.000000Z",
  "message": "Test message #123",
  "data": {
    "key1": "value1",
    "key2": 42
  }
}
```

## Examples

### Quick Test

```bash
# Terminal 1: Start consumer
python consumer.py --queue test_queue

# Terminal 2: Send test messages
python producer.py --queue test_queue --count 5
```

> Note: if you don't specify --queue, you'll enter interactive mode, to select the queue.

### Document Verification Flow

```bash
# Terminal 1: Listen for verification requests
python consumer.py --queue document_verification_request

# Terminal 2: Send verification request
python producer.py --queue document_verification_request

# Terminal 3: Listen for verification responses
python consumer.py --queue document_verified_response

# Terminal 4: Send verification response
python producer.py --queue document_verified_response
```

## Troubleshooting

### Connection Failed

**Error**: `[ERROR] Connection failed: [Errno 111] Connection refused`

**Solution**:

- Verify RabbitMQ is running: `kubectl get pods -n carpeta-ciudadana`
- Check port-forward is active
- Verify credentials are correct

### Queue Not Found

**Error**: Queue doesn't exist

**Solution**:

- Queues are created automatically by RabbitMQ cluster
- Check queue definitions in `services/rabbitmq-service/k8s/05-queue-definitions.yaml`
- Verify cluster is properly deployed

### Module Not Found

**Error**: `ModuleNotFoundError: No module named 'pika'`

**Solution**:

```bash
pip install -r requirements.txt
```

## Notes

- All messages are persistent (survive RabbitMQ restart)
- Manual acknowledgment is used (messages are re-delivered on consumer failure)
- Connection uses heartbeat (600s) to keep connection alive
- Scripts use simple text-based output (no emojis)

## References

- RabbitMQ Service Documentation: `services/rabbitmq-service/README.md`
- Queue Definitions: `services/rabbitmq-service/k8s/05-queue-definitions.yaml`
- Pika Documentation: <https://pika.readthedocs.io/>
