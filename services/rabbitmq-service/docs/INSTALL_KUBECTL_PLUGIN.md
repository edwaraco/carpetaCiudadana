# Instalación del kubectl rabbitmq Plugin

Este documento describe cómo instalar el plugin de kubectl para RabbitMQ usando **krew**.

## 📋 Pre-requisitos

- kubectl 1.24+
- Cluster Kubernetes funcionando

## 🔧 Instalar krew (Plugin Manager)

### Linux / macOS

```bash
(
  set -x; cd "$(mktemp -d)" &&
  OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
  ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
  KREW="krew-${OS}_${ARCH}" &&
  curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
  tar zxvf "${KREW}.tar.gz" &&
  ./"${KREW}" install krew
)
```

### Windows (PowerShell)

```powershell
# Download krew
$TempDir = New-Item -Type Directory -Path "$env:TEMP\krew-install" -Force
Set-Location $TempDir

$DownloadURL = "https://github.com/kubernetes-sigs/krew/releases/latest/download/krew-windows_amd64.zip"
Invoke-WebRequest -Uri $DownloadURL -OutFile "krew.zip"

# Extract
Expand-Archive -Path "krew.zip" -DestinationPath . -Force

# Install
.\krew-windows_amd64.exe install krew

# Add to PATH
$KrewPath = "$env:USERPROFILE\.krew\bin"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$KrewPath", "User")
```

### Agregar krew al PATH

Agrega estas líneas a tu archivo de configuración de shell:

**Bash** (~/.bashrc):
```bash
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
```

**Zsh** (~/.zshrc):
```zsh
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
```

**Fish** (~/.config/fish/config.fish):
```fish
set -gx PATH $PATH $HOME/.krew/bin
```

Recargar la configuración:
```bash
source ~/.bashrc  # o ~/.zshrc, o reinicia la terminal
```

## 📦 Instalar el Plugin RabbitMQ

```bash
# Instalar el plugin
kubectl krew install rabbitmq

# Verificar instalación
kubectl rabbitmq version
```

**Salida esperada**:
```
Version: v2.x.x
```

## 🚀 Comandos Principales

### Ver ayuda

```bash
kubectl rabbitmq help
kubectl rabbitmq [command] --help
```

### Gestionar clusters

```bash
# Listar clusters
kubectl rabbitmq list

# Ver detalles de un cluster
kubectl rabbitmq get <cluster-name> -n <namespace>

# Crear cluster (usando custom resource)
kubectl apply -f rabbitmq-cluster.yaml

# Eliminar cluster
kubectl delete rabbitmqcluster <cluster-name> -n <namespace>
```

### Gestionar usuarios y permisos

```bash
# Crear usuario
kubectl rabbitmq manage <cluster-name> -n <namespace>

# En el shell de RabbitMQ:
# rabbitmqctl add_user <username> <password>
# rabbitmqctl set_user_tags <username> administrator
# rabbitmqctl set_permissions -p / <username> ".*" ".*" ".*"
```

### Obtener credenciales

```bash
# Username
kubectl get secret <cluster-name>-default-user -n <namespace> \
  -o jsonpath='{.data.username}' | base64 -d

# Password
kubectl get secret <cluster-name>-default-user -n <namespace> \
  -o jsonpath='{.data.password}' | base64 -d
```

### Exportar/Importar definitions

```bash
# Exportar definitions (queues, exchanges, bindings)
kubectl rabbitmq export-definitions <cluster-name> -n <namespace>

# Exportar a archivo
kubectl rabbitmq export-definitions <cluster-name> -n <namespace> > definitions.json

# Importar desde archivo
kubectl rabbitmq import-definitions <cluster-name> -n <namespace> definitions.json
```

### Acceder al Management UI

```bash
# Port-forward
kubectl rabbitmq manage <cluster-name> -n <namespace>

# O manualmente
kubectl port-forward -n <namespace> svc/<cluster-name> 15672:15672
```

### Debug y troubleshooting

```bash
# Ver logs
kubectl logs -n <namespace> <cluster-name>-server-0

# Ejecutar comandos rabbitmqctl
kubectl exec -n <namespace> <cluster-name>-server-0 -- rabbitmqctl cluster_status

# Ver métricas
kubectl exec -n <namespace> <cluster-name>-server-0 -- rabbitmq-diagnostics status
```

## 🔍 Ejemplo Completo para Carpeta Ciudadana

```bash
# 1. Listar clusters
kubectl rabbitmq list

# 2. Ver detalles del cluster
kubectl rabbitmq get carpeta-rabbitmq -n carpeta-ciudadana

# 3. Obtener credenciales
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

echo "User: $RABBITMQ_USER"
echo "Password: $RABBITMQ_PASSWORD"

# 4. Port-forward para acceso local
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672 &

# 5. Verificar cluster status
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status

# 6. Exportar definitions
kubectl rabbitmq export-definitions carpeta-rabbitmq -n carpeta-ciudadana > backup.json
```

## 🆘 Troubleshooting

### krew no está en el PATH

```bash
# Verificar instalación
ls -la ~/.krew/bin/kubectl-krew

# Agregar manualmente al PATH
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

# Hacer permanente agregando a ~/.bashrc o ~/.zshrc
```

### Plugin no se encuentra

```bash
# Actualizar índice de krew
kubectl krew update

# Buscar plugin
kubectl krew search rabbitmq

# Reinstalar
kubectl krew uninstall rabbitmq
kubectl krew install rabbitmq
```

### Permisos insuficientes

```bash
# Verificar acceso al cluster
kubectl auth can-i get rabbitmqclusters

# Si no tienes permisos, contacta al administrador del cluster
```

## 📚 Referencias

- [kubectl krew - Plugin Manager](https://krew.sigs.k8s.io/)
- [RabbitMQ kubectl Plugin](https://www.rabbitmq.com/kubernetes/operator/kubectl-plugin)
- [RabbitMQ Cluster Operator](https://www.rabbitmq.com/kubernetes/operator/operator-overview)

---

**Última actualización**: 2025-11-05
