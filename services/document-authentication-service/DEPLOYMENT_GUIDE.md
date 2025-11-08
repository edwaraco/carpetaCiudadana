# Document Authentication Service - Deployment Guide

## Despliegue en Kubernetes (Minikube)

### 1. Construir imagen Docker

```bash
docker build -t document-authentication-service:latest .
```

### 2. Cargar imagen en minikube

```bash
minikube image load document-authentication-service:latest
```

### 3. Desplegar servicio

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
```

### 4. Verificar despliegue

```bash
kubectl get pods -n carpeta-ciudadana -l app=document-authentication-service
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service -f
```

### Acceso

- **Interno**: `http://document-authentication-service.carpeta-ciudadana.svc.cluster.local:8083`
- **Externo**: `http://$(minikube ip):30093`
- **Swagger**: `http://$(minikube ip):30093/api/v1/docs`

### Health Check

```bash
curl http://$(minikube ip):30093/api/v1/health
```

### Testing (Modo Dummy)

```bash
# Port-forward para testing local
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083

# Ejecutar scripts de prueba
cd events
python example_6_full_dummy.py
```

### Actualizar servicio

```bash
docker build -t document-authentication-service:latest .
minikube image load document-authentication-service:latest
kubectl rollout restart deployment/document-authentication-service -n carpeta-ciudadana
```

### Troubleshooting

```bash
# Ver logs
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=50

# Describir pod
kubectl describe pod -n carpeta-ciudadana -l app=document-authentication-service

# Verificar conexión a RabbitMQ
kubectl exec -n carpeta-ciudadana <pod-name> -- nc -zv carpeta-rabbitmq 5672

# Verificar conexión a carpeta-ciudadana-service
kubectl exec -n carpeta-ciudadana <pod-name> -- curl -I http://carpeta-ciudadana-service:8080/api/v1/actuator/health
```

### Nota Importante

⚠️ El `JWT_SECRET_KEY` en `k8s/configmap.yaml` debe coincidir con auth-service:

```yaml
JWT_SECRET_KEY: "super-secret-jwt-key-for-microservices-2024"
```

