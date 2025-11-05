# Quick Start - RabbitMQ en Kubernetes

## 🚀 Despliegue Rápido (5 minutos)

### 1. Instalar Cluster Operator

```bash
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml
```

### 2. Desplegar RabbitMQ

```bash
cd services/rabbitmq-service
kubectl apply -f k8s/
```

### 3. Verificar

```bash
# Ver cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# Ver pods (esperar hasta que estén 1/1 Running)
kubectl get pods -n carpeta-ciudadana -w
```

### 4. Obtener Credenciales

```bash
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

echo "User: $RABBITMQ_USER"
echo "Password: $RABBITMQ_PASSWORD"
```

### 5. Acceder al Cluster

```bash
# Port-forward
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672 &

# Management UI
open http://localhost:15672
```

## 🧪 Probar con Scripts

```bash
cd tools/rabbitmq-tester

# Terminal 1: Consumer
python consumer.py --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 2: Producer
python producer.py --count 5 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD
```

## 📊 Verificar Cluster

```bash
# Ver estado del cluster
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status

# Listar queues
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_queues name type members
```

## 🔧 kubectl rabbitmq Plugin (Opcional)

```bash
# Instalar krew
(
  set -x; cd "$(mktemp -d)" &&
  OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
  ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
  KREW="krew-${OS}_${ARCH}" &&
  curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
  tar zxvf "${KREW}.tar.gz" &&
  ./"${KREW}" install krew
)

# Agregar al PATH
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

# Instalar plugin
kubectl krew install rabbitmq

# Usar
kubectl rabbitmq get carpeta-rabbitmq -n carpeta-ciudadana
```

## 📚 Más Información

- **README completo**: `services/rabbitmq-service/README.md`
- **Migración**: `services/rabbitmq-service/MIGRATION_SUMMARY.md`
- **Quorum Queues**: `services/rabbitmq-service/docs/QUORUM_QUEUES.md`
- **kubectl Plugin**: `services/rabbitmq-service/docs/INSTALL_KUBECTL_PLUGIN.md`

## 🆘 Troubleshooting

### Pods no inician

```bash
# Ver logs del operator
kubectl logs -n rabbitmq-system -l app.kubernetes.io/name=rabbitmq-cluster-operator

# Ver eventos del cluster
kubectl describe rabbitmqcluster carpeta-rabbitmq -n carpeta-ciudadana
```

### Connection refused

```bash
# Verificar port-forward está activo
ps aux | grep port-forward

# Reiniciar port-forward
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672
```

### Quorum Queue no funciona

Crear con `x-queue-type=quorum`:

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqadmin declare queue \
  name=documento.deletion.queue \
  durable=true \
  arguments='{"x-queue-type":"quorum","x-quorum-initial-group-size":3}'
```

---

**¿Necesitas ayuda?** Ver documentación completa en `README.md`
