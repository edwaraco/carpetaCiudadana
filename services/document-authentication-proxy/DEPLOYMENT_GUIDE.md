# Event-Driven Document Authentication Architecture - Deployment Guide

This guide covers the deployment of the new event-driven architecture for document authentication, which includes the new `document-authentication-proxy` service.

## Architecture Overview

### Previous Architecture (REST-based)
```
citizen-web → nginx → document-authentication-service → Gov Carpeta API
                           ↓
                      documento.autenticado.queue
```

### New Architecture (Event-driven)
```
citizen-web → nginx → document-authentication-proxy → RabbitMQ (document.authentication.request.queue)
                                                           ↓
                                          document-authentication-service → Gov Carpeta API
                                                           ↓
                                              RabbitMQ (documento.autenticado.queue)
```

## Services Involved

### 1. document-authentication-proxy (NEW)
- **Port**: 8084
- **Purpose**: HTTP-to-Event converter
- **Input**: HTTP POST requests with JWT
- **Output**: RabbitMQ events to `document.authentication.request.queue`

### 2. document-authentication-service (MODIFIED)
- **Port**: 8083
- **Purpose**: Event consumer and Gov Carpeta integrator
- **Input**: RabbitMQ events from `document.authentication.request.queue`
- **Output**: RabbitMQ events to `documento.autenticado.queue`
- **Note**: HTTP endpoint still available for backward compatibility

### 3. citizen-web (MODIFIED)
- **Port**: 8080
- **Changes**: 
  - Nginx routes `/api/v1/authentication/*` to proxy service (8084)
  - ConfigMap updated with `DOCUMENT_AUTHENTICATION_PROXY_URL`

### 4. rabbitmq-service (MODIFIED)
- **New Queues**:
  - `document.authentication.request.queue` - Authentication requests from proxy
  - `document.authentication.request.queue.dlq` - Dead letter queue

## Deployment Steps

### Prerequisites
- Kubernetes cluster running
- `carpeta-ciudadana` namespace exists
- RabbitMQ cluster deployed and healthy

### Step 1: Update RabbitMQ Queue Definitions

```bash
cd services/rabbitmq-service/k8s
kubectl apply -f 05-queue-definitions.yaml
```

**Verification**:
```bash
# Port-forward to RabbitMQ management UI
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 15672:15672

# Open browser: http://localhost:15672
# Login: admin / admin123
# Check that these queues exist:
# - document.authentication.request.queue
# - document.authentication.request.queue.dlq
```

### Step 2: Deploy document-authentication-proxy

```bash
cd services/document-authentication-proxy

# Build Docker image
docker build -t document-authentication-proxy:latest .

# Deploy to Kubernetes
cd k8s
./deploy.sh

# Or manually:
kubectl apply -f 00-configmap.yaml
kubectl apply -f 01-deployment.yaml
```

**Verification**:
```bash
# Check pods are running
kubectl get pods -n carpeta-ciudadana -l app=document-authentication-proxy

# Check service
kubectl get svc -n carpeta-ciudadana document-authentication-proxy

# View logs
kubectl logs -n carpeta-ciudadana -l app=document-authentication-proxy --tail=50 -f

# Expected log output:
# "Starting document authentication proxy service..."
# "RabbitMQ connection established"
# "Connected to RabbitMQ and declared queue: document.authentication.request.queue"
```

### Step 3: Update document-authentication-service

```bash
cd services/document-authentication-service

# Rebuild Docker image with consumer changes
docker build -t document-authentication-service:latest .

# Redeploy
kubectl rollout restart deployment/document-authentication-service -n carpeta-ciudadana
```

**Verification**:
```bash
# Check pods are running
kubectl get pods -n carpeta-ciudadana -l app=document-authentication-service

# View logs - should show consumer started
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=50 -f

# Expected log output:
# "Starting document authentication service..."
# "RabbitMQ connection established"
# "RabbitMQ consumer started"
# "Starting to consume from queue: document.authentication.request.queue"
# "Consumer started successfully"
```

### Step 4: Update citizen-web

```bash
cd services/citizen-web

# Rebuild Docker image with updated nginx config
docker build -t citizen-web:latest .

# Update ConfigMap
kubectl apply -f k8s/00-configmap.yaml

# Redeploy
kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana
```

**Verification**:
```bash
# Check pods are running
kubectl get pods -n carpeta-ciudadana -l app=citizen-web

# Port-forward to citizen-web
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080

# Verify nginx upstream configuration
kubectl exec -n carpeta-ciudadana deployment/citizen-web -- cat /etc/nginx/nginx.conf | grep -A 2 "document_authentication_proxy"
# Should output:
# upstream document_authentication_proxy {
#     server document-authentication-proxy:8084;
# }
```

## Testing the End-to-End Flow

### 1. Manual API Test

```bash
# Get JWT token (login first)
JWT_TOKEN="eyJ..."  # Your JWT token

# Test proxy endpoint directly
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-proxy 8084:8084

curl -X POST http://localhost:8084/api/v1/authenticateDocument \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "123e4567-e89b-12d3-a456-426614174000",
    "documentTitle": "Test Document",
    "dummyJWT": true,
    "dummyURL": "https://example.com/document.pdf"
  }'

# Expected response (202 Accepted):
# {
#   "status": 202,
#   "message": "Accepted"
# }
```

### 2. Check RabbitMQ Queue

```bash
# Access RabbitMQ Management UI
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 15672:15672

# Open: http://localhost:15672
# Navigate to: Queues → document.authentication.request.queue
# Should see: 1 message (if consumer is not running yet)
```

### 3. Check Consumer Processing

```bash
# Watch document-authentication-service logs
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=100 -f

# Expected output:
# "Received authentication request for document 123e4567-e89b-12d3-a456-426614174000"
# "JWT parsed successfully - folderId: ..., citizenId: ..."
# "Starting authentication process for document ..."
# "Checking Gov Carpeta service health..."
# "Using DUMMY URL instead of calling carpeta-ciudadana-service: https://example.com/document.pdf"
# "Authenticating document with Gov Carpeta..."
# "Gov Carpeta authentication completed with status 200"
# "Authentication event published successfully for document ..."
```

### 4. Integration Test from citizen-web

```bash
# Port-forward citizen-web
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080

# Open browser: http://localhost:8080
# 1. Login with credentials
# 2. Navigate to Documents page
# 3. Click "Authenticate" button on a document
# 4. Confirm in dialog

# Check browser console:
# - Should see: "Document authentication request accepted"
# - Network tab shows: POST /api/v1/authentication/authenticateDocument → 202 Accepted

# Check logs:
kubectl logs -n carpeta-ciudadana -l app=document-authentication-proxy --tail=20
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=20
```

## Monitoring and Troubleshooting

### Common Issues

#### 1. Proxy service can't connect to RabbitMQ

**Symptoms**: Proxy logs show "Failed to connect to RabbitMQ"

**Solution**:
```bash
# Check RabbitMQ is running
kubectl get pods -n carpeta-ciudadana -l app.kubernetes.io/name=carpeta-rabbitmq

# Check ConfigMap has correct RabbitMQ URL
kubectl get configmap document-authentication-proxy-config -n carpeta-ciudadana -o yaml | grep RABBITMQ_URL

# Should be: amqp://admin:admin123@carpeta-rabbitmq:5672/
```

#### 2. Consumer not processing events

**Symptoms**: Events stuck in `document.authentication.request.queue`

**Solution**:
```bash
# Check document-authentication-service logs
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=100

# Look for:
# "Starting to consume from queue: document.authentication.request.queue"
# "Consumer started successfully"

# If not present, restart the service
kubectl rollout restart deployment/document-authentication-service -n carpeta-ciudadana
```

#### 3. citizen-web still routes to old service

**Symptoms**: 404 errors or connection refused when authenticating documents

**Solution**:
```bash
# Verify nginx config was updated
kubectl exec -n carpeta-ciudadana deployment/citizen-web -- cat /etc/nginx/nginx.conf | grep document_authentication

# Should show: document_authentication_proxy (not document_authentication_service)

# If not, redeploy:
kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana
```

### Health Checks

```bash
# Proxy health check
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-proxy 8084:8084
curl http://localhost:8084/api/v1/health
# Expected: {"status":"healthy","service":"document-authentication-proxy","version":"1.0.0"}

# Document authentication service health check
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083
curl http://localhost:8083/api/v1/health
# Expected: {"status":"healthy","service":"document-authentication-service","version":"1.0.0"}
```

### Metrics and Observability

```bash
# Monitor queue depths
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 15672:15672
# Open: http://localhost:15672/api/queues/%2F/document.authentication.request.queue

# Monitor pod resource usage
kubectl top pods -n carpeta-ciudadana -l app=document-authentication-proxy
kubectl top pods -n carpeta-ciudadana -l app=document-authentication-service

# Check event throughput
kubectl logs -n carpeta-ciudadana -l app=document-authentication-proxy | grep "Published authentication request event" | wc -l
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service | grep "Successfully processed authentication request" | wc -l
```

## Rollback Procedure

If issues occur, rollback to the previous architecture:

### 1. Revert citizen-web nginx config

```bash
cd services/citizen-web/k8s

# Edit 00-configmap.yaml - change:
# DOCUMENT_AUTHENTICATION_PROXY_URL → DOCUMENT_AUTHENTICATION_SERVICE_URL

kubectl apply -f 00-configmap.yaml

# Edit nginx.conf.template - change:
# upstream document_authentication_proxy → upstream document_authentication_service
# proxy_pass http://document_authentication_proxy → proxy_pass http://document_authentication_service

# Rebuild and redeploy
docker build -t citizen-web:latest ..
kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana
```

### 2. Revert document-authentication-service

```bash
# Checkout previous version without consumer
git checkout HEAD~1 -- services/document-authentication-service

# Rebuild and redeploy
cd services/document-authentication-service
docker build -t document-authentication-service:latest .
kubectl rollout restart deployment/document-authentication-service -n carpeta-ciudadana
```

### 3. Remove proxy service

```bash
kubectl delete deployment document-authentication-proxy -n carpeta-ciudadana
kubectl delete service document-authentication-proxy -n carpeta-ciudadana
kubectl delete configmap document-authentication-proxy-config -n carpeta-ciudadana
```

## Performance Considerations

### Scaling

Both services can be scaled independently:

```bash
# Scale proxy (handles HTTP load)
kubectl scale deployment document-authentication-proxy -n carpeta-ciudadana --replicas=5

# Scale consumer (handles processing load)
kubectl scale deployment document-authentication-service -n carpeta-ciudadana --replicas=5
```

### Queue Tuning

The queue is configured with:
- **Quorum type**: Ensures data durability across RabbitMQ cluster
- **Delivery limit**: 3 retries before sending to DLQ
- **Prefetch count**: 10 concurrent messages per consumer

To adjust prefetch count, modify `rabbitmq_consumer.py`:
```python
await rabbitmq_client.channel.set_qos(prefetch_count=20)  # Increase for higher throughput
```

## Security Notes

- JWT validation is performed in the proxy before publishing events
- All RabbitMQ connections use credentials (should use Kubernetes secrets in production)
- Events include the raw JWT token for service-to-service authentication
- Consider encryption for sensitive data in RabbitMQ messages

## Additional Resources

- [RabbitMQ Queue Definitions](services/rabbitmq-service/k8s/05-queue-definitions.yaml)
- [Proxy Service README](services/document-authentication-proxy/README.md)
- [Document Authentication Service README](services/document-authentication-service/README.md)
