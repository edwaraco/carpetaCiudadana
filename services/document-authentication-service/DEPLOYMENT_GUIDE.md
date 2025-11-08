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

### Testing

#### Port-forward para acceso local

```bash
# NodePort a veces falla en Windows, usar port-forward
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083
kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8080:8080
```

#### Health check

```bash
curl http://localhost:8083/api/v1/health
```

#### Ejecutar tests (modo dummy)

```bash
cd events
python example_6_full_dummy.py  # Full dummy (JWT + URL)
python example_7_hybrid_dummy_jwt.py  # JWT dummy + URL real
python example_5_dummy_url.py  # JWT real + URL dummy
```

#### Verificar mensaje en RabbitMQ

```bash
# Listar colas y cantidad de mensajes
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqadmin -u admin -p admin123 list queues name messages

# Leer mensaje de la cola
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqadmin -u admin -p admin123 get queue=document_authenticated_response count=1
```

### Ver Logs

```bash
# Ver logs en tiempo real
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service -f

# Ver últimos 50 logs
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=50

# Ver logs de pod específico
kubectl logs -n carpeta-ciudadana <pod-name>
```

### Actualizar servicio

```bash
docker build -t document-authentication-service:latest .
minikube ssh "docker rmi -f document-authentication-service:latest"
minikube image load document-authentication-service:latest
kubectl delete deployment document-authentication-service -n carpeta-ciudadana
kubectl apply -f k8s/deployment.yaml
kubectl wait --for=condition=ready pod -l app=document-authentication-service -n carpeta-ciudadana --timeout=120s
```

### Troubleshooting

#### Pod no inicia

```bash
# Verificar estado del pod
kubectl get pods -n carpeta-ciudadana -l app=document-authentication-service

# Ver eventos del pod
kubectl describe pod -n carpeta-ciudadana -l app=document-authentication-service

# Ver logs del pod anterior (si crasheó)
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --previous
```

#### Conexión a RabbitMQ falla

```bash
# Verificar que RabbitMQ esté corriendo
kubectl get pods -n carpeta-ciudadana -l app.kubernetes.io/name=carpeta-rabbitmq

# Test de conexión desde el pod
kubectl exec -n carpeta-ciudadana -l app=document-authentication-service -- nc -zv carpeta-rabbitmq 5672
```

#### NodePort no accesible

```bash
# Usar port-forward en lugar de NodePort (más confiable en Windows/minikube)
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083

# O usar minikube service
minikube service document-authentication-service-external -n carpeta-ciudadana
```

#### Imagen antigua en caché

```bash
# Eliminar imagen del cache de minikube
minikube ssh "docker rmi -f document-authentication-service:latest"

# Reconstruir y recargar
docker build -t document-authentication-service:latest .
minikube image load document-authentication-service:latest
kubectl rollout restart deployment/document-authentication-service -n carpeta-ciudadana
```

### Nota Importante

⚠️ El `JWT_SECRET_KEY` en `k8s/configmap.yaml` debe coincidir con auth-service:

```yaml
JWT_SECRET_KEY: "super-secret-jwt-key-for-microservices-2024"
```

