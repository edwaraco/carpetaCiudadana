#!/bin/bash

# 🚀 Deploy Notifications Service to Kubernetes
set -e

# Check if .env file exists and get SendGrid API key
if [ -f "../.env" ]; then
    echo "📧 Found .env file, extracting SendGrid API key..."
    SENDGRID_KEY=$(grep SENDGRID_API_KEY ../.env | cut -d'=' -f2)
    if [ -n "$SENDGRID_KEY" ]; then
        echo "🔧 Updating configmap with real SendGrid API key..."
        # Create a temporary configmap with the real API key
        sed "s/SG\.REPLACE_WITH_YOUR_SENDGRID_API_KEY_BEFORE_DEPLOYING/$SENDGRID_KEY/g" configmap.yaml > /tmp/configmap-temp.yaml
        USE_TEMP_CONFIG=true
    else
        echo "⚠️  No SendGrid API key found in .env file"
        USE_TEMP_CONFIG=false
    fi
else
    echo "⚠️  No .env file found, using placeholder API key"
    USE_TEMP_CONFIG=false
fi

cd "$(dirname "$0")/.."

echo "📤 Deleting Current infra..."
kubectl delete -f k8s/ || echo "Infra clean"

echo "🏗️  Building notifications-service Docker image..."
docker build -t notifications-service:latest .

echo "📤 Removing image into minikube..."
minikube rm load notifications-service:latest || echo "Image not founddocuments"

echo "📤 Loading image into minikube..."
minikube image load notifications-service:latest

echo "🗂️  Applying Kubernetes manifests..."
if [ "$USE_TEMP_CONFIG" = true ]; then
    kubectl apply -f /tmp/configmap-temp.yaml
    rm /tmp/configmap-temp.yaml
else
    kubectl apply -f k8s/configmap.yaml
fi

echo "🚀 Deploying notifications-service..."
kubectl apply -f k8s/deployment.yaml

echo "⏳ Waiting for notifications-service to be ready..."
kubectl wait --for=condition=ready pod -l app=notifications-service -n carpeta-ciudadana --timeout=120s

echo "✅ Notifications service deployed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Internal: http://notifications-service.carpeta-ciudadana.svc.cluster.local:8080"
echo "   External: http://$(minikube ip):30090"
echo ""
echo "🧪 Test health:"
echo "   curl http://$(minikube ip):30090/health"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n carpeta-ciudadana -l app=notifications-service"