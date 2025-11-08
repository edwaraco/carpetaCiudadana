#!/bin/bash

# 🚀 Deploy Carpeta Ciudadana Service to Kubernetes
set -e

cd "$(dirname "$0")/.."

echo "📤 Deleting Current infra..."
kubectl delete -f k8s/ || echo "Infra clean"

echo "🏗️  Building carpeta-ciudadana-service Docker image..."
docker build -t carpeta-ciudadana-service:latest .

echo "📤 Removing image into minikube..."
minikube image rm carpeta-ciudadana-service:latest || echo "Image not found"

echo "📤 Loading image into minikube..."
minikube image load carpeta-ciudadana-service:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml

echo "🗂️  Applying Kubernetes secrets..."
kubectl apply -f k8s/secret.yaml

echo "🚀 Building carpeta-ciudadana-service OS and DB..."
kubectl apply -f k8s/infrastructure.yaml

echo "🚀 Deploying carpeta-ciudadana-service..."
kubectl apply -f k8s/deployment.yaml
kubectl wait --for=condition=ready pod -l app=carpeta-ciudadana-service -n carpeta-ciudadana --timeout=180s

echo "✅ Carpeta Ciudadana service deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://carpeta-ciudadana-service.carpeta-ciudadana.svc.cluster.local:8080"
echo "   External: http://$(minikube ip):30081"
echo "   Swagger UI: http://$(minikube ip):30081/api/v1/swagger-ui.html"
echo ""
echo "🧪 Test health:"
echo "   curl http://$(minikube ip):30081/api/v1/actuator/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=carpeta-ciudadana-service"
