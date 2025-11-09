# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Carpeta Ciudadana Frontend.

## Files

- `deployment.yaml` - Deployment configuration with 3 replicas
- `service.yaml` - LoadBalancer service
- `configmap.yaml` - Environment configuration
- `hpa.yaml` - Horizontal Pod Autoscaler (3-10 replicas)
- `ingress.yaml` - Ingress configuration with TLS

## Quick Start

### 1. Create namespace

```bash
kubectl create namespace carpeta-ciudadana
```

### 2. Apply all manifests

```bash
kubectl apply -f k8s/
```

El orden de aplicación será:
- 00-configmap.yaml (Environment configuration)
- 01-deployment.yaml (Deployment with 3 replicas)
- 02-service.yaml (LoadBalancer service)
- 03-hpa.yaml (Horizontal Pod Autoscaler)
- 04-ingress.yaml (Ingress with TLS)

Or apply individually:

```bash
kubectl apply -f k8s/00-configmap.yaml -n carpeta-ciudadana
kubectl apply -f k8s/01-deployment.yaml -n carpeta-ciudadana
kubectl apply -f k8s/02-service.yaml -n carpeta-ciudadana
kubectl apply -f k8s/03-hpa.yaml -n carpeta-ciudadana
kubectl apply -f k8s/04-ingress.yaml -n carpeta-ciudadana
```

### 3. Verify deployment

```bash
kubectl get all -n carpeta-ciudadana
kubectl get pods -n carpeta-ciudadana
kubectl get svc -n carpeta-ciudadana
```

### 4. Check logs

```bash
kubectl logs -f deployment/carpeta-ciudadana-frontend -n carpeta-ciudadana
```

## Configuration

### Environment Variables

Edit `configmap.yaml` to change configuration:

```yaml
data:
  api-base-url: "http://backend-api-service:8080/api"  # Backend API URL
  use-mock-api: "false"                                 # Use mock API (true/false)
  operator-id: "micarpeta"                              # Operator ID
  operator-name: "MiCarpeta"                            # Operator name
```

After editing, reapply:

```bash
kubectl apply -f k8s/00-configmap.yaml -n carpeta-ciudadana
kubectl rollout restart deployment/carpeta-ciudadana-frontend -n carpeta-ciudadana
```

### Scaling

#### Manual scaling

```bash
kubectl scale deployment carpeta-ciudadana-frontend --replicas=5 -n carpeta-ciudadana
```

#### Autoscaling (HPA)

The HPA is configured to:
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

Check HPA status:

```bash
kubectl get hpa -n carpeta-ciudadana
```

### Ingress & TLS

Update `ingress.yaml` with your domain:

```yaml
spec:
  tls:
  - hosts:
    - your-domain.com  # Change this
    secretName: carpeta-ciudadana-tls
  rules:
  - host: your-domain.com  # Change this
```

**Prerequisites**:
- Nginx Ingress Controller installed
- cert-manager installed for automatic TLS certificates

## Monitoring

### Health checks

The deployment includes:
- **Liveness probe**: `/health` endpoint
- **Readiness probe**: `/health` endpoint

### Resource limits

Each pod has:
- Requests: 100m CPU, 128Mi memory
- Limits: 200m CPU, 256Mi memory

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n carpeta-ciudadana
kubectl logs <pod-name> -n carpeta-ciudadana
```

### Service not accessible

```bash
kubectl get svc -n carpeta-ciudadana
kubectl describe svc carpeta-ciudadana-frontend -n carpeta-ciudadana
```

### ConfigMap changes not applied

```bash
kubectl apply -f k8s/00-configmap.yaml -n carpeta-ciudadana
kubectl rollout restart deployment/carpeta-ciudadana-frontend -n carpeta-ciudadana
```

## Cleanup

Remove all resources:

```bash
kubectl delete -f k8s/ -n carpeta-ciudadana
kubectl delete namespace carpeta-ciudadana
```

