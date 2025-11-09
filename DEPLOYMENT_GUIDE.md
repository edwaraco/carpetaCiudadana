# Full deployment centralized guide

This file is a compilation of most important things on each deployment guide, and provides how to run all services with a Makefile for Windows users (Powershell) and Linux/Mac users (bash).

- [Full deployment centralized guide](#full-deployment-centralized-guide)
  - [Individual deployment guides](#individual-deployment-guides)
  - [For windows users (Powershell)](#for-windows-users-powershell)
    - [Tools and start cluster (Powershell)](#tools-and-start-cluster-powershell)
    - [Run all services with Makefile (Powershell)](#run-all-services-with-makefile-powershell)
    - [Run all services manually (Powershell)](#run-all-services-manually-powershell)
  - [For Linux/Mac users (bash)](#for-linuxmac-users-bash)
    - [Tools and start cluster (bash)](#tools-and-start-cluster-bash)
    - [Run all services with Makefile (bash)](#run-all-services-with-makefile-bash)
    - [Run all services manually (bash)](#run-all-services-manually-bash)

## Individual deployment guides

- carpeta-ciudadana-service
  - [DEPLOYMENT_GUIDE](./services/carpeta-ciudadana-service/DEPLOYMENT_GUIDE.md)
  - [README](./services/carpeta-ciudadana-service/README.md)

- rabbitmq-service
  - [DEPLOYMENT_GUIDE](./services/rabbitmq-service/DEPLOYMENT_GUIDE.md)
  - [DEPLOYMENT_GUIDE_EXTENDED](./services/rabbitmq-service/DEPLOYMENT_GUIDE_EXTENDED.md)
  - [README](./services/rabbitmq-service/README.md)

- citizen-web
  - [README](./services/citizen-web/README.md)

- auth-service
  - [README](./services/auth-service/README.md)

- ciudadano-registry-service
  - [README](./services/ciudadano-registry-service/README.md)

- notifications-service
  - [README](./services/notifications-service/README.md)

- document-authentication-service
  - [DEPLOYMENT_GUIDE](./services/document-authentication-service/DEPLOYMENT_GUIDE.md)
  - [README](./services/document-authentication-service/README.md)

## For windows users (Powershell)

### Tools and start cluster (Powershell)

```powershell
# Powershell:

winget install -e --id Kubernetes.kubectl
kubectl version --client  # (verify)

winget install -e --id Kubernetes.minikube

# (Start Docker Desktop)

# This on an admin powershell.
minikube start --driver=docker --memory=16384 --cpus=2
kubectl cluster-info  # (verify)
kubectl get nodes  # (verify)

minikube addons enable metrics-server
kubectl get pods -n kube-system | Select-String metrics-server  # (verify)
kubectl top node  # (verify)
kubectl top pods -A  # (verify)
docker stats minikube --no-stream  # (verify)
```

### Run all services with Makefile (Powershell)

```powershell
# This on an admin powershell.
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
choco install make
make powershell-deploy-all
```

### Run all services manually (Powershell)

```powershell
```

## For Linux/Mac users (bash)

```bash
```

### Tools and start cluster (bash)

```bash
```

### Run all services with Makefile (bash)

```bash
```

### Run all services manually (bash)

```bash
```
