#!/bin/bash

# 🚀 Deploy Document Authentication Service to Kubernetes
set -e

echo "🏗️  Building document-authentication-service Docker image..."
cd "$(dirname "$0")/.."
docker build -t document-authentication-service:latest .

echo "📤 Loading image into minikube..."
minikube image load document-authentication-service:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml

echo "🚀 Deploying document-authentication-service..."
kubectl apply -f k8s/deployment.yaml

echo "⏳ Waiting for document-authentication-service to be ready..."
kubectl wait --for=condition=ready pod -l app=document-authentication-service -n carpeta-ciudadana --timeout=120s

echo "✅ Document Authentication service deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://document-authentication-service.carpeta-ciudadana.svc.cluster.local:8083"
echo "   External: http://$(minikube ip):30093"
echo ""
echo "🧪 Test health:"
echo "   curl http://$(minikube ip):30093/api/v1/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=document-authentication-service"
echo ""
echo "📜 View logs:"
echo "   kubectl logs -n carpeta-ciudadana -l app=document-authentication-service -f"
