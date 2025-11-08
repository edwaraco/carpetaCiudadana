#!/bin/bash

# 🚀 Deploy Auth Service to Kubernetes
set -e

echo "🏗️  Building auth-service Docker image..."
cd "$(dirname "$0")/.."
docker build -t auth-service-auth-service:latest .

echo "📤 Loading image into minikube..."
minikube image load auth-service-auth-service:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres-init.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/configmap.yaml

echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-postgres -n carpeta-ciudadana --timeout=120s

echo "🚀 Deploying auth-service..."
kubectl apply -f k8s/deployment.yaml

echo "⏳ Waiting for auth-service to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-service -n carpeta-ciudadana --timeout=120s

echo "✅ Auth service deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://auth-service.carpeta-ciudadana.svc.cluster.local:8080"
echo "   External: http://$(minikube ip):30080"
echo ""
echo "🧪 Test health:"
echo "   curl http://$(minikube ip):30080/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=auth-service"