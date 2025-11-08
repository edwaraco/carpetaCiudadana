#!/bin/bash

# 🚀 Deploy Carpeta Ciudadana Service to Kubernetes
set -e

echo "🏗️  Building carpeta-ciudadana-service Docker image..."
cd "$(dirname "$0")/.."
docker build -t carpeta-ciudadana-service:latest .

echo "📤 Loading image into minikube..."
minikube image load carpeta-ciudadana-service:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml

echo "🚀 Deploying carpeta-ciudadana-service..."
kubectl apply -f k8s/deployment.yaml

echo "⏳ Waiting for carpeta-ciudadana-service to be ready..."
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
