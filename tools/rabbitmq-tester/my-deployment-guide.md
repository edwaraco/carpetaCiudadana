# This is MY deployment guide

this is a guide i did myself and it worked perfectly, so these are the steps I want to have in the final guide somehow

## Install kubectl

```powershell
winget install -e --id Kubernetes.kubectl
kubectl version --client  # to check
```

## install a kubernetes cluster manager

### Option 1: Minikube (Recommended for development)

```powershell
# Install Minikube
winget install -e --id Kubernetes.Minikube
# Start Minikube cluster
minikube start --driver=hyperv --memory=4096 --cpus=2
# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### Option 2: Docker Desktop Kubernetes

If you have Docker Desktop:

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Enable "Enable Kubernetes"
4. Wait for cluster to start
5. Verify: `kubectl cluster-info`

## To have "make" available on Windows

This is for being able to use the multiple useful commands defined in the Makefile.

Restart your powershell terminal after each installation step.

- Install chocolatey package manager

```powershell
# on an admin privileged Powershell shell

Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

- Install make

```powershell
# on an admin privileged Powershell shell

choco install make
```

## Deploy RabbitMQ Cluster Operator

```powershell
# Install RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Verify installation
kubectl get pods -n rabbitmq-system
kubectl get customresourcedefinition | Select-String rabbitmq
```

## Deploy the RabbitMQ Cluster

```powershell
cd services/rabbitmq-service
kubectl apply -f k8s/
```

## Verify Deployment

```powershell
# Ver cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# Ver pods (esperar hasta que estén 1/1 Running)
kubectl get pods -n carpeta-ciudadana -w

# Ver PVCs
kubectl get pvc -n carpeta-ciudadana

# Ver estado del cluster RabbitMQ
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status
```

## Go to UI management

```powershell
# Port-forward
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672

# Open Management UI in browser
start http://localhost:15672

# Obtain credentials from here:

## Linux
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)
echo "User: $RABBITMQ_USER"
echo "Password: $RABBITMQ_PASSWORD"

## Windows Powershell
$RABBITMQ_USER = kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
$RABBITMQ_PASSWORD = kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
Write-Host "User: $RABBITMQ_USER"
Write-Host "Password: $RABBITMQ_PASSWORD"

# You can also verify users in the server
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_users
```

## Rollout after changing any k8s file

```powershell
kubectl apply -f k8s/
kubectl rollout restart statefulset/carpeta-rabbitmq-server -n carpeta-ciudadana

# Con esto verificas que terminó el rollout:
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n carpeta-ciudadana --timeout=300s
```

## KILL the deployment

```powershell
kubectl delete -f k8s/
```
