#!/bin/bash
set -e

# ==============================================================================
# Kubernetes Service Update Script
# ==============================================================================
# Script genérico para actualizar servicios en Kubernetes (Minikube)
#
# Uso:
#   ./k8s-update-service.sh <service-name> [options]
#
# Ejemplos:
#   ./k8s-update-service.sh citizen-web
#   ./k8s-update-service.sh auth-service --skip-build
#   ./k8s-update-service.sh carpeta-ciudadana-service --namespace carpeta-ciudadana
#
# ==============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para mostrar uso
show_usage() {
    cat << EOF
${GREEN}Kubernetes Service Update Script${NC}

${YELLOW}Uso:${NC}
    $0 <service-name> [options]

${YELLOW}Argumentos:${NC}
    service-name        Nombre del servicio (citizen-web, auth-service, etc.)

${YELLOW}Opciones:${NC}
    -n, --namespace     Namespace de Kubernetes (default: carpeta-ciudadana)
    -s, --skip-build    Saltar construcción de imagen Docker
    -l, --skip-load     Saltar carga de imagen en Minikube
    -c, --skip-config   Saltar aplicación de ConfigMap
    -t, --tag           Tag de la imagen Docker (default: latest)
    -h, --help          Mostrar esta ayuda

${YELLOW}Ejemplos:${NC}
    # Actualización completa
    $0 citizen-web

    # Solo rebuild sin cargar en Minikube
    $0 auth-service --skip-load

    # Actualizar sin reconstruir imagen
    $0 carpeta-ciudadana-service --skip-build

    # Usar tag específico
    $0 document-authentication-service --tag v1.2.0

${YELLOW}Servicios disponibles:${NC}
    - citizen-web
    - auth-service
    - carpeta-ciudadana-service
    - ciudadano-registry-service
    - document-authentication-service
    - notifications-service
EOF
}

# Valores por defecto
NAMESPACE="carpeta-ciudadana"
SKIP_BUILD=false
SKIP_LOAD=false
SKIP_CONFIG=false
IMAGE_TAG="latest"
SERVICE_NAME=""

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -l|--skip-load)
            SKIP_LOAD=true
            shift
            ;;
        -c|--skip-config)
            SKIP_CONFIG=true
            shift
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -*)
            print_error "Opción desconocida: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$SERVICE_NAME" ]; then
                SERVICE_NAME="$1"
            else
                print_error "Argumento extra: $1"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validar que se proporcionó el nombre del servicio
if [ -z "$SERVICE_NAME" ]; then
    print_error "Debe proporcionar el nombre del servicio"
    show_usage
    exit 1
fi

# Mapeo de servicios a directorios
declare -A SERVICE_DIRS=(
    ["citizen-web"]="services/citizen-web"
    ["auth-service"]="services/auth-service"
    ["carpeta-ciudadana-service"]="services/carpeta-ciudadana-service"
    ["ciudadano-registry-service"]="services/ciudadano-registry-service"
    ["document-authentication-service"]="services/document-authentication-service"
    ["notifications-service"]="services/notifications-service"
)

# Validar que el servicio existe
if [ -z "${SERVICE_DIRS[$SERVICE_NAME]}" ]; then
    print_error "Servicio desconocido: $SERVICE_NAME"
    echo ""
    echo "Servicios disponibles:"
    for service in "${!SERVICE_DIRS[@]}"; do
        echo "  - $service"
    done
    exit 1
fi

SERVICE_DIR="${SERVICE_DIRS[$SERVICE_NAME]}"

# Obtener la ruta del proyecto de forma dinámica
# El script está en /tools/, entonces subimos un nivel para llegar a la raíz
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE_PATH="$PROJECT_ROOT/$SERVICE_DIR"
IMAGE_NAME="$SERVICE_NAME:$IMAGE_TAG"

# Verificar que el directorio existe
if [ ! -d "$SERVICE_PATH" ]; then
    print_error "Directorio no encontrado: $SERVICE_PATH"
    exit 1
fi

# Verificar que existe Dockerfile
if [ ! -f "$SERVICE_PATH/Dockerfile" ]; then
    print_error "Dockerfile no encontrado en: $SERVICE_PATH"
    exit 1
fi

echo ""
print_step "🚀 Actualizando $SERVICE_NAME en Kubernetes..."
echo ""
print_step "📋 Configuración:"
echo "  - Servicio: $SERVICE_NAME"
echo "  - Namespace: $NAMESPACE"
echo "  - Imagen: $IMAGE_NAME"
echo "  - Directorio: $SERVICE_PATH"
echo ""

# Paso 1: Construir imagen Docker
if [ "$SKIP_BUILD" = false ]; then
    print_step "📦 Paso 1: Construyendo imagen Docker..."
    cd "$SERVICE_PATH"

    if docker build -t "$IMAGE_NAME" .; then
        print_success "Imagen construida exitosamente"
    else
        print_error "Fallo al construir la imagen"
        exit 1
    fi
    echo ""
else
    print_warning "Saltando construcción de imagen (--skip-build)"
    echo ""
fi

# Paso 2: Cargar imagen en Minikube
if [ "$SKIP_LOAD" = false ]; then
    print_step "📥 Paso 2: Cargando imagen en Minikube..."
    if minikube image rm "$IMAGE_NAME"; then
        print_success "Imagen eliminada en Minikube"
    else
        print_error "Fallo al eliminar imagen en Minikube (La imagen puede no existir)"
    fi

    if minikube image load "$IMAGE_NAME"; then
        print_success "Imagen cargada en Minikube"
    else
        print_error "Fallo al cargar imagen en Minikube"
        exit 1
    fi
    echo ""
else
    print_warning "Saltando carga en Minikube (--skip-load)"
    echo ""
fi

# Paso 3: Verificar imagen
print_step "✅ Paso 3: Verificando imagen en Minikube..."
if minikube image ls | grep -q "$SERVICE_NAME"; then
    print_success "Imagen verificada en Minikube"
    minikube image ls | grep "$SERVICE_NAME"
else
    print_warning "Imagen no encontrada en Minikube (puede ser normal si se usó --skip-load)"
fi
echo ""

# Paso 4: Aplicar ConfigMap (si existe)
if [ "$SKIP_CONFIG" = false ]; then
    if [ -f "$SERVICE_PATH/k8s/configmap.yaml" ]; then
        print_step "📋 Paso 4: Aplicando ConfigMap..."

        if kubectl apply -f "$SERVICE_PATH/k8s/configmap.yaml"; then
            print_success "ConfigMap aplicado exitosamente"
        else
            print_error "Fallo al aplicar ConfigMap"
            exit 1
        fi
    else
        print_warning "ConfigMap no encontrado (k8s/configmap.yaml) - Saltando"
    fi
else
    print_warning "Saltando aplicación de ConfigMap (--skip-config)"
fi
echo ""

# Paso 5: Reiniciar deployment
print_step "🔄 Paso 5: Reiniciando deployment..."

if kubectl rollout restart deployment/"$SERVICE_NAME" -n "$NAMESPACE"; then
    print_success "Deployment reiniciado"
else
    print_error "Fallo al reiniciar deployment"
    exit 1
fi
echo ""

# Paso 6: Esperar rollout
print_step "⏳ Paso 6: Esperando rollout..."

if kubectl rollout status deployment/"$SERVICE_NAME" -n "$NAMESPACE" --timeout=300s; then
    print_success "Rollout completado exitosamente"
else
    print_error "Timeout o fallo en rollout"
    exit 1
fi
echo ""

# Paso 7: Verificar pods
print_step "🔍 Paso 7: Verificando pods..."
kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME"
echo ""

# Paso 8: Mostrar logs
print_step "📜 Paso 8: Mostrando logs recientes..."
kubectl logs -n "$NAMESPACE" -l app="$SERVICE_NAME" --tail=20
echo ""

# Paso 9: Obtener URL del servicio
print_step "🌐 Paso 9: Información del servicio..."
kubectl get svc "$SERVICE_NAME" -n "$NAMESPACE"
echo ""

# Obtener IP del LoadBalancer
SERVICE_IP=$(kubectl get svc "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
SERVICE_PORT=$(kubectl get svc "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "")

if [ -n "$SERVICE_IP" ] && [ -n "$SERVICE_PORT" ]; then
    print_success "✅ ¡Actualización completada!"
    echo ""
    print_step "📍 Accede al servicio en: http://$SERVICE_IP:$SERVICE_PORT"
else
    print_success "✅ ¡Actualización completada!"
    echo ""
    print_warning "No se pudo obtener la IP del servicio (puede ser ClusterIP)"
    echo "Usa: kubectl port-forward svc/$SERVICE_NAME -n $NAMESPACE <local-port>:<service-port>"
fi

echo ""

