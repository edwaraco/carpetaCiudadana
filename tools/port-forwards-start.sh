#!/bin/bash
# Script para iniciar todos los port-forwards necesarios en background

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
GRAY='\033[0;90m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Iniciando Port-Forwards en Background${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Verificar que minikube esta corriendo
if ! minikube status > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Minikube no esta corriendo${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Minikube esta corriendo${NC}"
echo ""

# Directorio para PIDs
PID_DIR="/tmp/k8s-port-forwards"
mkdir -p "$PID_DIR"

# Función para iniciar un port-forward en background
start_port_forward() {
    local name=$1
    local namespace=$2
    local service=$3
    local ports=$4
    local type=$5
    
    local pid_file="$PID_DIR/${name}.pid"
    
    # Verificar si ya existe
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "  ${YELLOW}[WARN] Port-forward '$name' ya esta corriendo${NC}"
            return
        else
            rm -f "$pid_file"
        fi
    fi
    
    # Iniciar port-forward en background
    kubectl port-forward -n "$namespace" "svc/$service" $ports > /dev/null 2>&1 &
    local new_pid=$!
    echo "$new_pid" > "$pid_file"
    
    # Esperar un poco para verificar que inicio correctamente
    sleep 0.5
    
    if ps -p "$new_pid" > /dev/null 2>&1; then
        if [ "$type" = "REQUERIDO" ]; then
            echo -e "  ${GREEN}[OK] $name [$type] - Puertos: $ports${NC}"
        else
            echo -e "  ${CYAN}[OK] $name [$type] - Puertos: $ports${NC}"
        fi
    else
        echo -e "  ${RED}[ERROR] Error iniciando $name${NC}"
        rm -f "$pid_file"
    fi
}

echo -e "${GREEN}Iniciando port-forwards...${NC}"
echo ""

echo -e "${GREEN}SERVICIOS REQUERIDOS:${NC}"
start_port_forward "citizen-web" "carpeta-ciudadana" "citizen-web" "8080:8080" "REQUERIDO"
start_port_forward "rabbitmq" "carpeta-ciudadana" "carpeta-rabbitmq" "5672:5672 15672:15672" "REQUERIDO"

echo ""
echo -e "${CYAN}INTERFACES DE ADMINISTRACION:${NC}"
start_port_forward "minio-console" "carpeta-ciudadana" "minio-console" "9001:9001" "OPCIONAL"
start_port_forward "minio-api" "carpeta-ciudadana" "minio" "9000:9000" "OPCIONAL"
start_port_forward "k8s-dashboard" "kubernetes-dashboard" "kubernetes-dashboard" "8443:443" "OPCIONAL"

echo ""
echo -e "${CYAN}APIS Y DOCUMENTACION:${NC}"
start_port_forward "carpeta-api" "carpeta-ciudadana" "carpeta-ciudadana-service" "8082:8080" "OPCIONAL"
start_port_forward "registry-api" "carpeta-ciudadana" "ciudadano-registry-service" "8081:8081" "OPCIONAL"
start_port_forward "doc-auth-api" "carpeta-ciudadana" "document-authentication-service" "8083:8083" "OPCIONAL"

echo ""
echo -e "${CYAN}BASE DE DATOS:${NC}"
start_port_forward "auth-postgres" "carpeta-ciudadana" "auth-postgres-service" "5432:5432" "OPCIONAL"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Port-Forwards Iniciados${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

echo -e "${YELLOW}ACCESO A LOS SERVICIOS:${NC}"
echo ""
echo -e "  ${GREEN}Frontend:              http://localhost:8080${NC}"
echo -e "  ${CYAN}RabbitMQ Management:   http://localhost:15672 (admin/admin123)${NC}"
echo -e "  ${CYAN}MinIO Console:         http://localhost:9001 (admin/admin123)${NC}"
echo -e "  ${CYAN}Kubernetes Dashboard:  https://localhost:8443 (requiere token)${NC}"
echo -e "  ${CYAN}Carpeta API Swagger:   http://localhost:8082/api/v1/swagger-ui.html${NC}"
echo -e "  ${CYAN}Registry API Swagger:  http://localhost:8081/ciudadano-registry/swagger-ui.html${NC}"
echo -e "  ${CYAN}Doc Auth API Docs:     http://localhost:8083/api/v1/docs${NC}"
echo -e "  ${CYAN}PostgreSQL (Auth):     localhost:5432 (auth_service_db)${NC}"
echo ""
echo -e "${GREEN}[OK] Todos los port-forwards estan activos en background${NC}"
echo -e "     ${GRAY}Para detenerlos: ./port-forwards-stop.sh${NC}"
echo -e "     ${GRAY}Ver estado: ./port-forwards-status.sh${NC}"
echo ""
