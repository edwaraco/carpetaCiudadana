# Carpeta Ciudadana Service - Deployment Guide

## Despliegue en Kubernetes (Minikube)

### 1. Desplegar infraestructura (DynamoDB Local + MinIO)

```bash
kubectl apply -f k8s/infrastructure.yaml
kubectl wait --for=condition=ready pod -l app=dynamodb-local -n carpeta-ciudadana --timeout=60s
kubectl wait --for=condition=ready pod -l app=minio -n carpeta-ciudadana --timeout=60s
```

### 2. Construir imagen Docker

```bash
docker build -t carpeta-ciudadana-service:latest .
```

### 3. Cargar imagen en minikube

```bash
minikube image load carpeta-ciudadana-service:latest
```

### 4. Desplegar servicio

```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
```

### 5. Verificar despliegue

```bash
kubectl get pods -n carpeta-ciudadana -l app=carpeta-ciudadana-service
kubectl logs -n carpeta-ciudadana -l app=carpeta-ciudadana-service -f
```

### Acceso

- **Interno**: `http://carpeta-ciudadana-service.carpeta-ciudadana.svc.cluster.local:8080`
- **Externo**: `http://$(minikube ip):30081`
- **Swagger**: `http://$(minikube ip):30081/api/v1/swagger-ui.html`

### Health Check

```bash
curl http://$(minikube ip):30081/api/v1/actuator/health
```

### Actualizar servicio

```bash
docker build -t carpeta-ciudadana-service:latest .
minikube image load carpeta-ciudadana-service:latest
kubectl rollout restart deployment/carpeta-ciudadana-service -n carpeta-ciudadana
```

### Troubleshooting

```bash
# Ver logs
kubectl logs -n carpeta-ciudadana -l app=carpeta-ciudadana-service --tail=50

# Describir pod
kubectl describe pod -n carpeta-ciudadana -l app=carpeta-ciudadana-service

# Ver eventos
kubectl get events -n carpeta-ciudadana --sort-by='.lastTimestamp'
```
