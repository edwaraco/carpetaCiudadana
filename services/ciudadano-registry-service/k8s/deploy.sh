#!/bin/bash

# 🚀 Deploy Notifications Service to Kubernetes
set -e

cd "$(dirname "$0")/.."

echo "📤 Deleting Current infra..."
kubectl delete -f k8s/ || echo "Infra clean"

echo "🏗️  Building ciudadano-registry-service Docker image..."
docker build -t ciudadano-registry-service:latest .

echo "📤 Removing image into minikube..."
minikube image rm ciudadano-registry-service:latest || echo "Image not found"

echo "📤 Loading image into minikube..."
minikube image load ciudadano-registry-service:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml

echo "🚀 Deploying ciudadano-registry-service..."
kubectl apply -f k8s/deployment.yaml

echo "🚀 Enabling the Load balancer..."
kubectl apply -f k8s/services.yml


echo "⏳ Waiting for ciudadano-registry-service to be ready..."
kubectl wait --for=condition=ready pod -l app=ciudadano-registry-service -n carpeta-ciudadana --timeout=120s

echo "✅ Notifications service deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://ciudadano-registry-service.carpeta-ciudadana.svc.cluster.local:8080"
echo "   External: http://$(minikube ip):30090"
echo ""
echo "🧪 Test health:"
echo "   curl http://$(minikube ip):30090/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=ciudadano-registry-service"