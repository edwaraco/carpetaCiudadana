#!/bin/bash

set -e

echo "🏗️  Building citizen-web Docker image..."
cd "$(dirname "$0")/.."
docker build -t citizen-web:latest .

echo "Deleting Kubernets setup..."
kubectl delete -f k8s/ || echo "Some services don't exist"

echo "📤 Removing image into minikube..."
minikube image rm citizen-web:latest || echo "Image doesn't exist"
echo "📤 Loading image into minikube..."
minikube image load citizen-web:latest

echo "🗂️  Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "⏳ Waiting for citizen-web to be ready..."
kubectl wait --for=condition=ready pod -l app=citizen-web -n carpeta-ciudadana --timeout=120s

echo "✅ Citizen-web deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://citizen-web.carpeta-ciudadana.svc.cluster.local:8080"
echo "   External (LoadBalancer): Run 'minikube tunnel' in another terminal, then check 'kubectl get svc -n carpeta-ciudadana citizen-web'"
echo ""
echo "🧪 Test health:"
echo "   kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080"
echo "   curl http://localhost:8080/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=citizen-web"
echo "   kubectl logs -n carpeta-ciudadana -l app=citizen-web --tail=50"

