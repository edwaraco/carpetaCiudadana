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

The Makefile automates ALL the deployment steps. It's the easiest way to deploy.

**Prerequisites**:
- Chocolatey installed (package manager for Windows)
- Make installed via Chocolatey

**Install Chocolatey and Make**:

```powershell
# Install Chocolatey (run in an admin PowerShell)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Make (after Chocolatey is installed, in admin PowerShell)
choco install make

# Verify installation (close and reopen PowerShell)
make --version
```

**Deploy All Services**:

```powershell
# Run in the root directory of the project
make deploy-windows
```

This will:
1. Deploy RabbitMQ Cluster Operator and RabbitMQ Service
2. Deploy Auth Service (with PostgreSQL)
3. Deploy Ciudadano Registry Service (with PostgreSQL)
4. Deploy Notifications Service
5. Deploy Carpeta Ciudadana Service (with DynamoDB Local and MinIO)
6. Deploy Document Authentication Service
7. Deploy Citizen Web (Frontend)
8. Update your Windows hosts file automatically

**Other Makefile Commands**:

```powershell
# Update a specific service after making changes
make update-service-windows SERVICE=citizen-web

# Verify all deployments are healthy
make verify-windows

# Show port-forward commands (run these in separate terminals)
make port-forwards-windows

# Update hosts file manually
make update-hosts-windows

# Remove all deployments (clean up)
make clean-windows

# Show help
make help
```

**Important**: After deployment completes, run `make port-forwards-windows` to see the port-forward commands. You need to run those in separate PowerShell terminals and keep them open.

### Run all services manually (Powershell)

This section contains ALL the deployment steps in the correct order for deploying all services.

**Prerequisites**: You must have completed the "Tools and start cluster" section above.

```powershell
# ============================================================================
# STEP 1: Deploy RabbitMQ Cluster Operator and RabbitMQ Service
# ============================================================================
# RabbitMQ is the message broker used by all services for event-driven communication

# 1.1 Install RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# 1.2 Verify operator is running
kubectl get pods -n rabbitmq-system
kubectl get customresourcedefinition | Select-String rabbitmq

# 1.3 Deploy RabbitMQ cluster
cd services/rabbitmq-service
kubectl apply -f k8s/

# 1.4 Wait for RabbitMQ pods to be ready (this takes 2-3 minutes)
kubectl get pods -n carpeta-ciudadana -w
# Press Ctrl+C when all carpeta-rabbitmq-server-* pods show 1/1 Running

# 1.5 Verify cluster status
kubectl get rabbitmqclusters -n carpeta-ciudadana
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status

# 1.6 Set up port-forward for RabbitMQ (KEEP THIS TERMINAL OPEN)
# Open a NEW PowerShell terminal and run:
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672
# RabbitMQ Management UI will be available at http://localhost:15672
# AMQP will be available at amqp://localhost:5672
# Credentials: admin / admin123

cd ../..

# ============================================================================
# STEP 2: Deploy Auth Service (Authentication & Authorization)
# ============================================================================
# Handles user registration, login, and JWT token generation

cd services/auth-service

# 2.1 Build Docker image
docker build -t auth-service:latest .

# 2.2 Load image into minikube
minikube image load auth-service:latest

# 2.3 Deploy service (includes PostgreSQL database)
kubectl apply -f k8s/

# 2.4 Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=auth-service -n carpeta-ciudadana --timeout=120s

# 2.5 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=auth-service
kubectl logs -n carpeta-ciudadana -l app=auth-service --tail=20

cd ../..

# ============================================================================
# STEP 3: Deploy Ciudadano Registry Service
# ============================================================================
# Manages citizen registration and identity validation

cd services/ciudadano-registry-service

# 3.1 Build Docker image
docker build -t ciudadano-registry-service:latest .

# 3.2 Load image into minikube
minikube image load ciudadano-registry-service:latest

# 3.3 Deploy service (includes PostgreSQL infrastructure)
kubectl apply -f k8s/

# 3.4 Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=ciudadano-registry-service -n carpeta-ciudadana --timeout=120s

# 3.5 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=ciudadano-registry-service
kubectl logs -n carpeta-ciudadana -l app=ciudadano-registry-service --tail=20

cd ../..

# ============================================================================
# STEP 4: Deploy Notifications Service
# ============================================================================
# Handles email notifications (verification, welcome, etc.)

cd services/notifications-service

# 4.1 Build Docker image
docker build -t notifications-service:latest .

# 4.2 Load image into minikube
minikube image load notifications-service:latest

# 4.3 Deploy service
kubectl apply -f k8s/

# 4.4 Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=notifications-service -n carpeta-ciudadana --timeout=120s

# 4.5 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=notifications-service
kubectl logs -n carpeta-ciudadana -l app=notifications-service --tail=20

cd ../..

# ============================================================================
# STEP 5: Deploy Carpeta Ciudadana Service (Main Document Management)
# ============================================================================
# Core service for managing citizen folders and documents

cd services/carpeta-ciudadana-service

# 5.1 Build Docker image
docker build -t carpeta-ciudadana-service:latest .

# 5.2 Load image into minikube
minikube image load carpeta-ciudadana-service:latest

# 5.3 Deploy service (includes DynamoDB Local and MinIO)
kubectl apply -f k8s/

# 5.4 Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=dynamodb-local -n carpeta-ciudadana --timeout=120s
kubectl wait --for=condition=ready pod -l app=minio -n carpeta-ciudadana --timeout=120s

# 5.5 Wait for service to be ready
kubectl wait --for=condition=ready pod -l app=carpeta-ciudadana-service -n carpeta-ciudadana --timeout=120s

# 5.6 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=carpeta-ciudadana-service
kubectl logs -n carpeta-ciudadana -l app=carpeta-ciudadana-service --tail=20

# 5.7 Set up port-forward for carpeta-ciudadana-service (KEEP THIS TERMINAL OPEN)
# Open ANOTHER NEW PowerShell terminal and run:
kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8080:8080

cd ../..

# ============================================================================
# STEP 6: Deploy Document Authentication Service
# ============================================================================
# Validates document authenticity with Gov Carpeta API

cd services/document-authentication-service

# 6.1 Build Docker image
docker build -t document-authentication-service:latest .

# 6.2 Load image into minikube
minikube image load document-authentication-service:latest

# 6.3 Deploy service
kubectl apply -f k8s/

# 6.4 Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=document-authentication-service -n carpeta-ciudadana --timeout=120s

# 6.5 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=document-authentication-service
kubectl logs -n carpeta-ciudadana -l app=document-authentication-service --tail=20

# 6.6 Set up port-forward for document-authentication-service (KEEP THIS TERMINAL OPEN)
# Open ANOTHER NEW PowerShell terminal and run:
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083

cd ../..

# ============================================================================
# STEP 7: Deploy Citizen Web (Frontend)
# ============================================================================
# React frontend for citizens to interact with the system

cd services/citizen-web

# 7.1 Build Docker image
docker build -t citizen-web:latest .

# 7.2 Load image into minikube
minikube image load citizen-web:latest

# 7.3 Deploy service
kubectl apply -f k8s/

# 7.4 Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=citizen-web -n carpeta-ciudadana --timeout=120s

# 7.5 Verify deployment
kubectl get pods -n carpeta-ciudadana -l app=citizen-web
kubectl logs -n carpeta-ciudadana -l app=citizen-web --tail=20

# 7.6 Set up port-forward for citizen-web (KEEP THIS TERMINAL OPEN)
# Open ANOTHER NEW PowerShell terminal and run:
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080
# Frontend will be available at http://localhost:8080

cd ../..

# ============================================================================
# STEP 8: Update hosts file for local domain routing
# ============================================================================
# This allows accessing the frontend via citizen-web.local instead of IP

# Run as Administrator
powershell -ExecutionPolicy Bypass -File tools/update-minikube-hosts.ps1

# ============================================================================
# STEP 9: Verify all deployments
# ============================================================================

# 9.1 Check all pods are running
kubectl get pods -n carpeta-ciudadana

# 9.2 Check all services
kubectl get svc -n carpeta-ciudadana

# 9.3 Check RabbitMQ cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# 9.4 Check resource usage
kubectl top pods -n carpeta-ciudadana
kubectl top nodes

# ============================================================================
# STEP 10: Access Points
# ============================================================================

# RabbitMQ Management UI
start http://localhost:15672
# Credentials: admin / admin123

# Carpeta Ciudadana Service API (Swagger)
start http://localhost:8080/api/v1/swagger-ui.html

# Document Authentication Service API (Swagger)
start http://localhost:8083/api/v1/docs

# Citizen Web Frontend
start http://citizen-web.local
# Or use minikube IP:
$minikubeIP = minikube ip
start "http://$minikubeIP:30080"

# ============================================================================
# IMPORTANT NOTES
# ============================================================================
# 
# Port Forwards Required (keep these terminals open):
# 1. RabbitMQ: kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672
# 2. Carpeta Ciudadana Service: kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8080:8080
# 3. Document Authentication: kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083
#
# To update a service after making changes:
# Use the script: .\tools\k8s-update-service.ps1 -ServiceName <service-name>
# Example: .\tools\k8s-update-service.ps1 -ServiceName citizen-web
#
# To check RAM usage:
# kubectl top nodes
# docker stats minikube --no-stream
#
# ============================================================================
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
