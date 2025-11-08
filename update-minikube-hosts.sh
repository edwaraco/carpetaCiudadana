#!/bin/bash
# Updates /etc/hosts with the current Minikube IP for k8s.local
MINIKUBE_IP=$(minikube ip)
sudo sed -i '' '/k8s.local/d' /etc/hosts
echo "$MINIKUBE_IP k8s.local" | sudo tee -a /etc/hosts
