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

# IMPORTANT: Configure SendGrid API Key
# ============================================================================
# Before deploying, you MUST update the SENDGRID_API_KEY in the ConfigMap
# 1. Edit: services/notifications-service/k8s/00-configmap.yaml
# 2. Find line 22 that says: SENDGRID_API_KEY: "SENDGRID_API_KEY"
# 3. Replace "SENDGRID_API_KEY" with your actual SendGrid API key
# 4. Example: SENDGRID_API_KEY: "SG.xxxxxxxxxxxx.yyyyyyyyyyyy"
# ============================================================================

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
# STEP 8: Install Kubernetes Dashboard (OPTIONAL - Cluster Management UI)
# ============================================================================
# Provides a web-based UI for managing and monitoring your Kubernetes cluster

# 8.1 Deploy Kubernetes Dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# 8.2 Create admin user for Dashboard access
kubectl create serviceaccount admin-user -n kubernetes-dashboard
kubectl create clusterrolebinding admin-user-binding --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:admin-user

# 8.3 Get access token (save this for later)
kubectl -n kubernetes-dashboard create token admin-user
# Copy the token output - you'll need it to login to the Dashboard

# 8.4 Set up port-forward for Dashboard (KEEP THIS TERMINAL OPEN)
# Open ANOTHER NEW PowerShell terminal and run:
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard 8443:443
# Dashboard will be available at https://localhost:8443
# Use the token from step 8.3 to login

# ============================================================================
# STEP 9: Verify all deployments
# ============================================================================

# 9.1 Check all pods are running
kubectl get pods -n carpeta-ciudadana

# 9.2 Check all services
kubectl get svc -n carpeta-ciudadana

# 9.3 Check RabbitMQ cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# 9.4 Check Kubernetes Dashboard (if installed)
kubectl get pods -n kubernetes-dashboard

# 9.5 Check resource usage
kubectl top pods -n carpeta-ciudadana
kubectl top nodes

# ============================================================================
# STEP 10: Access Points - Admin Interfaces & APIs
# ============================================================================

# REQUIRED PORT-FORWARDS
# Keep these terminals open for accessing the services:

# Terminal 1 - Frontend (REQUIRED)
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080

# Terminal 2 - RabbitMQ (REQUIRED for monitoring)
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672

# Terminal 3 - MinIO Console (OPTIONAL - file management)
kubectl port-forward -n carpeta-ciudadana svc/minio-console 9001:9001

# Terminal 4 - MinIO API (OPTIONAL - S3 operations)
kubectl port-forward -n carpeta-ciudadana svc/minio 9000:9000

# Terminal 5 - Carpeta Ciudadana API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8082:8080

# Terminal 6 - Ciudadano Registry API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-service 8081:8081

# Terminal 7 - Document Authentication API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083

# Terminal 8 - Auth Service PostgreSQL (OPTIONAL - database admin)
kubectl port-forward -n carpeta-ciudadana svc/auth-postgres-service 5432:5432

# Terminal 9 - Ciudadano Registry PostgreSQL (OPTIONAL - database admin)
kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-postgres-service 5433:5432

# Terminal 10 - Kubernetes Dashboard (OPTIONAL - cluster management)
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard 8443:443

# ====================================================================================
# WEB INTERFACES - Open in your browser:
# ====================================================================================

# MAIN APPLICATION
# ----------------
# Citizen Web Frontend
start http://localhost:8080
# Main interface for citizens (registration, login, document management)

# ADMINISTRATION INTERFACES
# -------------------------
# RabbitMQ Management UI (Credentials: admin / admin123)
start http://localhost:15672
# - Queue and message monitoring
# - Exchange and binding management  
# - Performance statistics
# - User and permission management

# MinIO Console (Credentials: admin / admin123)
start http://localhost:9001
# - S3 bucket browser
# - File upload/download interface
# - Access policy management
# - Storage usage monitoring
# - Object versioning

# Kubernetes Dashboard (requires token authentication)
start https://localhost:8443
# - Pod and deployment monitoring
# - Cluster logs and events
# - Resource management
# - Real-time metrics
#
# To get access token:
# kubectl -n kubernetes-dashboard create token admin-user
# Then paste the token in the Dashboard login page

# API DOCUMENTATION
# -----------------
# Carpeta Ciudadana Service - Swagger UI
start http://localhost:8082/api/v1/swagger-ui.html
# Interactive API documentation for document management

# Ciudadano Registry Service - Swagger UI
start http://localhost:8081/ciudadano-registry/swagger-ui.html
# Interactive API documentation for citizen registration

# Document Authentication Service - API Docs  
start http://localhost:8083/api/v1/docs
# FastAPI interactive documentation for document authentication

# MinIO S3 API Endpoint
# http://localhost:9000
# Programmatic S3 API access (use AWS SDK or MinIO client)

# DATABASES (use PostgreSQL clients like pgAdmin, DBeaver, etc.)
# --------------------------------------------------------------
# Auth Service PostgreSQL
# Host: localhost, Port: 5432
# Database: auth_service_db
# User: auth_service_user, Password: auth_service_password123

# Ciudadano Registry PostgreSQL
# Host: localhost, Port: 5433
# Database: ciudadano_registry_db
# User: ciudadano_registry_user, Password: ciudadano_registry_password123

# ============================================================================
# IMPORTANT NOTES
# ============================================================================
# 
# Port Forwards Required (keep these terminals open):
# 1. Frontend: kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080
# 2. RabbitMQ: kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672
# 3. MinIO Console: kubectl port-forward -n carpeta-ciudadana svc/minio-console 9001:9001
# 4. MinIO API: kubectl port-forward -n carpeta-ciudadana svc/minio 9000:9000
# 5. Carpeta Ciudadana API: kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8082:8080
# 6. Ciudadano Registry API: kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-service 8081:8081
# 7. Document Auth API: kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083
# 8. Auth PostgreSQL: kubectl port-forward -n carpeta-ciudadana svc/auth-postgres-service 5432:5432
# 9. Registry PostgreSQL: kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-postgres-service 5433:5432
# 10. Kubernetes Dashboard: kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard 8443:443
#
# Admin Credentials:
# - RabbitMQ: admin / admin123
# - MinIO: admin / admin123
# - Auth PostgreSQL: auth_service_user / auth_service_password123
# - Registry PostgreSQL: ciudadano_registry_user / ciudadano_registry_password123
# - Kubernetes Dashboard: Use token from: kubectl -n kubernetes-dashboard create token admin-user
#
# To update a service after making changes:
# Use the script: .\tools\k8s-update-service.ps1 -ServiceName <service-name>
# Example: .\tools\k8s-update-service.ps1 -ServiceName citizen-web
#
# Manual update if image doesn't change (use force remove):
# cd services/citizen-web; docker build -t citizen-web:latest .; cd ../..
# minikube ssh "docker rmi -f docker.io/library/citizen-web:latest"
# minikube image load citizen-web:latest
# kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana
#
# IMPORTANT: Restart port-forwards after updating services
# After updating any service that has port-forwards (almost all of them),
# you need to stop and restart the port-forwards:
# cd tools
# .\port-forwards-stop.ps1
# .\port-forwards-start.ps1
#
# To check RAM usage:
# kubectl top nodes
# docker stats minikube --no-stream
#
# ============================================================================
```

## For Linux/Mac users (bash)

### Tools and start cluster (bash)

```bash
# Install kubectl
# For macOS:
brew install kubectl
# For Linux (Debian/Ubuntu):
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
# Verify:
kubectl version --client

# Install minikube
# For macOS:
brew install minikube
# For Linux:
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# (Start Docker Desktop on macOS, or ensure Docker daemon is running on Linux)

# Start minikube cluster
minikube start --driver=docker --memory=16384 --cpus=2
kubectl cluster-info  # (verify)
kubectl get nodes  # (verify)

# Enable metrics server
minikube addons enable metrics-server
kubectl get pods -n kube-system | grep metrics-server  # (verify)
kubectl top node  # (verify)
kubectl top pods -A  # (verify)
docker stats minikube --no-stream  # (verify)
```

### Run all services with Makefile (bash)

The Makefile automates ALL the deployment steps. It's the easiest way to deploy.

**Prerequisites**:
- Make should be pre-installed on most Linux/Mac systems

**Verify Make Installation**:

```bash
# Check if make is installed
make --version

# If not installed:
# macOS:
xcode-select --install

# Linux (Debian/Ubuntu):
sudo apt-get update && sudo apt-get install build-essential

# Linux (Fedora/RHEL):
sudo dnf install make
```

**Deploy All Services**:

```bash
# Run in the root directory of the project
make deploy-linux
```

This will:
1. Deploy RabbitMQ Cluster Operator and RabbitMQ Service
2. Deploy Auth Service (with PostgreSQL)
3. Deploy Ciudadano Registry Service (with PostgreSQL)
4. Deploy Notifications Service
5. Deploy Carpeta Ciudadana Service (with DynamoDB Local and MinIO)
6. Deploy Document Authentication Service
7. Deploy Citizen Web (Frontend)
8. Update your /etc/hosts file automatically (requires sudo)

**Other Makefile Commands**:

```bash
# Update a specific service after making changes
make update-service-linux SERVICE=citizen-web

# Verify all deployments are healthy
make verify-linux

# Show port-forward commands (run these in separate terminals)
make port-forwards-linux

# Update hosts file manually
make update-hosts-linux

# Remove all deployments (clean up)
make clean-linux

# Show help
make help
```

**Important**: After deployment completes, run `make port-forwards-linux` to see the port-forward commands. You need to run those in separate terminals and keep them open.

### Run all services manually (bash)

This section contains ALL the deployment steps in the correct order for deploying all services.

**Prerequisites**: You must have completed the "Tools and start cluster" section above.

```bash
# ============================================================================
# STEP 1: Deploy RabbitMQ Cluster Operator and RabbitMQ Service
# ============================================================================
# RabbitMQ is the message broker used by all services for event-driven communication

# 1.1 Install RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# 1.2 Verify operator is running
kubectl get pods -n rabbitmq-system
kubectl get customresourcedefinition | grep rabbitmq

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
# Open a NEW terminal and run:
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

# IMPORTANT: Configure SendGrid API Key
# ============================================================================
# Before deploying, you MUST update the SENDGRID_API_KEY in the ConfigMap
# 1. Edit: services/notifications-service/k8s/00-configmap.yaml
# 2. Find line 22 that says: SENDGRID_API_KEY: "SENDGRID_API_KEY"
# 3. Replace "SENDGRID_API_KEY" with your actual SendGrid API key
# 4. Example: SENDGRID_API_KEY: "SG.xxxxxxxxxxxx.yyyyyyyyyyyy"
# ============================================================================

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
# Open ANOTHER NEW terminal and run:
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
# Open ANOTHER NEW terminal and run:
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
# Open ANOTHER NEW terminal and run:
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080
# Frontend will be available at http://localhost:8080

cd ../..

# ============================================================================
# STEP 8: Install Kubernetes Dashboard (OPTIONAL - Cluster Management UI)
# ============================================================================
# Provides a web-based UI for managing and monitoring your Kubernetes cluster

# 8.1 Deploy Kubernetes Dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# 8.2 Create admin user for Dashboard access
kubectl create serviceaccount admin-user -n kubernetes-dashboard
kubectl create clusterrolebinding admin-user-binding --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:admin-user

# 8.3 Get access token (save this for later)
kubectl -n kubernetes-dashboard create token admin-user
# Copy the token output - you'll need it to login to the Dashboard

# 8.4 Set up port-forward for Dashboard (KEEP THIS TERMINAL OPEN)
# Open ANOTHER NEW terminal and run:
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard 8443:443
# Dashboard will be available at https://localhost:8443
# Use the token from step 8.3 to login

# ============================================================================
# STEP 9: Verify all deployments
# ============================================================================

# 9.1 Check all pods are running
kubectl get pods -n carpeta-ciudadana

# 9.2 Check all services
kubectl get svc -n carpeta-ciudadana

# 9.3 Check RabbitMQ cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# 9.4 Check Kubernetes Dashboard (if installed)
kubectl get pods -n kubernetes-dashboard

# 9.5 Check resource usage
kubectl top pods -n carpeta-ciudadana
kubectl top nodes

# ============================================================================
# STEP 10: Port-Forwards Management
# ============================================================================

# OPTION 1: Automated Script (RECOMMENDED) - Starts ALL port-forwards
# -------------------------------------------------------------------------------
cd tools
chmod +x port-forwards-start.sh port-forwards-status.sh port-forwards-stop.sh

# Start all port-forwards in background
./port-forwards-start.sh

# Check status of port-forwards
./port-forwards-status.sh

# Stop all port-forwards
./port-forwards-stop.sh

cd ..

# ============================================================================
# OPTION 2: Manual - Open separate terminals for each service
# ============================================================================

# Terminal 1 - Frontend (REQUIRED)
kubectl port-forward -n carpeta-ciudadana svc/citizen-web 8080:8080

# Terminal 2 - RabbitMQ (REQUIRED for monitoring)
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672

# Terminal 3 - MinIO Console (OPTIONAL - file management)
kubectl port-forward -n carpeta-ciudadana svc/minio-console 9001:9001

# Terminal 4 - MinIO API (OPTIONAL - S3 operations)
kubectl port-forward -n carpeta-ciudadana svc/minio 9000:9000

# Terminal 5 - Carpeta Ciudadana API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/carpeta-ciudadana-service 8082:8080

# Terminal 6 - Ciudadano Registry API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-service 8081:8081

# Terminal 7 - Document Authentication API (OPTIONAL - Swagger)
kubectl port-forward -n carpeta-ciudadana svc/document-authentication-service 8083:8083

# Terminal 8 - Auth Service PostgreSQL (OPTIONAL - database admin)
kubectl port-forward -n carpeta-ciudadana svc/auth-postgres-service 5432:5432

# Terminal 9 - Ciudadano Registry PostgreSQL (OPTIONAL - database admin)
kubectl port-forward -n carpeta-ciudadana svc/ciudadano-registry-postgres-service 5433:5432

# Terminal 10 - Kubernetes Dashboard (OPTIONAL - cluster management)
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard 8443:443

# ====================================================================================
# WEB INTERFACES - Open in your browser:
# ====================================================================================

# MAIN APPLICATION
# ----------------
# Citizen Web Frontend
open http://localhost:8080  # macOS
xdg-open http://localhost:8080  # Linux
# Main interface for citizens (registration, login, document management)

# ADMINISTRATION INTERFACES
# -------------------------
# RabbitMQ Management UI (Credentials: admin / admin123)
open http://localhost:15672  # macOS
xdg-open http://localhost:15672  # Linux
# - Queue and message monitoring
# - Exchange and binding management  
# - Performance statistics
# - User and permission management

# MinIO Console (Credentials: admin / admin123)
open http://localhost:9001  # macOS
xdg-open http://localhost:9001  # Linux
# - S3 bucket browser
# - File upload/download interface
# - Access policy management
# - Storage usage monitoring
# - Object versioning

# Kubernetes Dashboard (requires token authentication)
open https://localhost:8443  # macOS
xdg-open https://localhost:8443  # Linux
# - Pod and deployment monitoring
# - Cluster logs and events
# - Resource management
# - Real-time metrics
#
# To get access token:
# kubectl -n kubernetes-dashboard create token admin-user
# Then paste the token in the Dashboard login page

# API DOCUMENTATION
# -----------------
# Carpeta Ciudadana Service - Swagger UI
open http://localhost:8082/api/v1/swagger-ui.html  # macOS
xdg-open http://localhost:8082/api/v1/swagger-ui.html  # Linux
# Interactive API documentation for document management

# Ciudadano Registry Service - Swagger UI
open http://localhost:8081/ciudadano-registry/swagger-ui.html  # macOS
xdg-open http://localhost:8081/ciudadano-registry/swagger-ui.html  # Linux
# Interactive API documentation for citizen registration

# Document Authentication Service - API Docs  
open http://localhost:8083/api/v1/docs  # macOS
xdg-open http://localhost:8083/api/v1/docs  # Linux
# FastAPI interactive documentation for document authentication

# MinIO S3 API Endpoint
# http://localhost:9000
# Programmatic S3 API access (use AWS SDK or MinIO client)

# DATABASES (use PostgreSQL clients like pgAdmin, DBeaver, etc.)
# --------------------------------------------------------------
# Auth Service PostgreSQL
# Host: localhost, Port: 5432
# Database: auth_service_db
# User: auth_service_user, Password: auth_service_password123

# Ciudadano Registry PostgreSQL
# Host: localhost, Port: 5433
# Database: ciudadano_registry_db
# User: ciudadano_registry_user, Password: ciudadano_registry_password123

# ============================================================================
# TROUBLESHOOTING AND UPDATES
# ============================================================================

# View all pods
kubectl get pods -n carpeta-ciudadana

# View logs by app (ignores specific pod name)
kubectl logs -n carpeta-ciudadana -l app=carpeta-ciudadana-service --tail=50

# Execute command in the first pod of an app
kubectl exec -n carpeta-ciudadana -l app=carpeta-ciudadana-service -it -- sh

# View pods organized by app
kubectl get pods -n carpeta-ciudadana -L app

# View replication status
kubectl get hpa -n carpeta-ciudadana

# View network policies
kubectl get svc -n carpeta-ciudadana
kubectl get networkpolicies -n carpeta-ciudadana

# View recent cluster events (useful for debugging)
kubectl get events -n carpeta-ciudadana --sort-by='.lastTimestamp' | tail -20

# View complete pod description (for scheduling errors, probes, etc)
kubectl describe pod <pod-name> -n carpeta-ciudadana

# View logs from multiple pods of an app
kubectl logs -n carpeta-ciudadana -l app=auth-service --tail=50 --prefix

# View resource usage (CPU/Memory) per pod
kubectl top pods -n carpeta-ciudadana

# View ConfigMap configuration
kubectl get configmap carpeta-ciudadana-config -n carpeta-ciudadana -o yaml

# Test connectivity from one pod to another service
kubectl exec -n carpeta-ciudadana -l app=carpeta-ciudadana-service -it -- sh
# Inside the pod:
# nc -zv minio 9000
# nc -zv carpeta-rabbitmq 5672
# wget -O- http://citizen-web:8080

# View rollout status of a deployment
kubectl rollout status deployment/carpeta-ciudadana-service -n carpeta-ciudadana
kubectl rollout history deployment/carpeta-ciudadana-service -n carpeta-ciudadana

# Verify RabbitMQ health checks
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_queues

# ============================================================================
# UPDATING SERVICES
# ============================================================================

# When you change the code of a service, rebuild its image, load it into minikube, and do a rollout restart
# Example for citizen-web service:
cd services/citizen-web
docker build -t citizen-web:latest .
cd ../..
minikube image load citizen-web:latest
kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana

# If the image doesn't change, use force remove of the image and then load the new one
# This is the safest method without bringing down the deployment
cd services/citizen-web
docker build -t citizen-web:latest .
cd ../..
minikube ssh "docker rmi -f docker.io/library/citizen-web:latest"
minikube image load citizen-web:latest
kubectl rollout restart deployment/citizen-web -n carpeta-ciudadana

# If that still fails, delete the deployment (all its pods), remove its image, remount, and redeploy
kubectl delete deployment citizen-web -n carpeta-ciudadana
minikube ssh "docker rmi -f docker.io/library/citizen-web:latest"
minikube image load citizen-web:latest
cd services/citizen-web
kubectl apply -f k8s/01-deployment.yaml
cd ../..

# If you need to change any k8s config, do it and then apply the changes, and do a rollout restart
cd services/carpeta-ciudadana-service
kubectl apply -f k8s/01-configmap.yaml
cd ../..
kubectl rollout restart deployment carpeta-ciudadana-service -n carpeta-ciudadana

# IMPORTANT: Restart port-forwards after updating services
# Whenever you update a service that has port forwardings (almost all of them), 
# stop and restart the port-forwards
# Using the scripts:
cd tools
./port-forwards-stop.sh
./port-forwards-start.sh
cd ..

# Or use the update script:
cd tools
chmod +x k8s-update-service.sh
./k8s-update-service.sh citizen-web
cd ..

# ============================================================================
# IMPORTANT NOTES
# ============================================================================
# 
# Admin Credentials:
# - RabbitMQ: admin / admin123
# - MinIO: admin / admin123
# - Auth PostgreSQL: auth_service_user / auth_service_password123
# - Registry PostgreSQL: ciudadano_registry_user / ciudadano_registry_password123
# - Kubernetes Dashboard: Use token from: kubectl -n kubernetes-dashboard create token admin-user
#
# To check RAM usage:
# kubectl top nodes
# docker stats minikube --no-stream
#
# ============================================================================
```
