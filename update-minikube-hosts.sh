#!/bin/bash
# Updates /etc/hosts with the current Minikube IP for k8s.local
# run after minikube start so the changes take effect
MINIKUBE_IP=$(minikube ip)
for DOMAIN in citizen-web.local citizen-os.local; do
  sudo sed -i '' "/$DOMAIN/d" /etc/hosts
  echo "$MINIKUBE_IP $DOMAIN" | sudo tee -a /etc/hosts
done