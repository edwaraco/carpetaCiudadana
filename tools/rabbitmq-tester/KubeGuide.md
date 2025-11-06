# Kubectl and Krew guide for Windows

Kubectl
<https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/#install-nonstandard-package-tools>

Krew
<https://krew.sigs.k8s.io/docs/user-guide/setup/install/>
<https://github.com/kubernetes-sigs/krew/releases>

Commands:

```powershell
winget install -e --id Kubernetes.kubectl
kubectl version --client  # to check
# download a .exe from https://github.com/kubernetes-sigs/krew/releases
.\krew install krew   # on admin CMD
# add %USERPROFILE%\.krew\bin to PATH
kubectl krew  # to check
```

## Kubernetes Cluster Setup (REQUIRED)

**Before installing RabbitMQ Operator, you need a Kubernetes cluster running!**

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

## RabbitMQ Cluster Operator Installation

**❌ DON'T use krew for RabbitMQ plugin** - it's not available for Windows.

**✅ Use the official installation method:**

```powershell
# Install RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Verify installation
kubectl get pods -n rabbitmq-system
kubectl get customresourcedefinition | Select-String rabbitmq
```
