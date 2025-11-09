#!/bin/bash
# Deployment script for document-authentication-proxy service

set -e

echo "======================================"
echo "Document Authentication Proxy Service"
echo "======================================"
echo ""

# Apply ConfigMap
echo "Applying ConfigMap..."
kubectl apply -f 00-configmap.yaml

# Apply Deployment and Service
echo "Applying Deployment and Service..."
kubectl apply -f 01-deployment.yaml

echo ""
echo "Deployment complete!"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n carpeta-ciudadana -l app=document-authentication-proxy"
echo "  kubectl get svc -n carpeta-ciudadana document-authentication-proxy"
echo ""
echo "View logs with:"
echo "  kubectl logs -n carpeta-ciudadana -l app=document-authentication-proxy --tail=100 -f"
