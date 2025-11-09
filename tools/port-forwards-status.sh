#!/bin/bash
# Script para ver el estado de todos los port-forwards

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
GRAY='\033[0;90m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Estado de Port-Forwards${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Directorio para PIDs
PID_DIR="/tmp/k8s-port-forwards"

# Verificar si existe el directorio de PIDs
if [ ! -d "$PID_DIR" ]; then
    echo -e "${RED}[ERROR] No hay port-forwards activos${NC}"
    echo ""
    echo -e "${GRAY}Para iniciarlos:${NC}"
    echo -e "  ${YELLOW}./port-forwards-start.sh${NC}"
    echo ""
    exit 0
fi

# Contar archivos PID
pid_count=$(ls -1 "$PID_DIR"/*.pid 2>/dev/null | wc -l)

if [ "$pid_count" -eq 0 ]; then
    echo -e "${RED}[ERROR] No hay port-forwards activos${NC}"
    echo ""
    echo -e "${GRAY}Para iniciarlos:${NC}"
    echo -e "  ${YELLOW}./port-forwards-start.sh${NC}"
    echo ""
    exit 0
fi

echo -e "${YELLOW}Total de port-forwards: $pid_count${NC}"
echo ""

# Arrays para clasificar servicios
running=()
stopped=()

# Revisar cada archivo PID
for pid_file in "$PID_DIR"/*.pid; do
    [ -f "$pid_file" ] || continue
    
    service_name=$(basename "$pid_file" .pid)
    pid=$(cat "$pid_file")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        running+=("$service_name")
    else
        stopped+=("$service_name")
    fi
done

# Mostrar servicios activos
if [ ${#running[@]} -gt 0 ]; then
    echo -e "${GREEN}[OK] ACTIVOS (${#running[@]}):${NC}"
    for name in "${running[@]}"; do
        echo -e "  - $name"
    done
    echo ""
fi

# Mostrar servicios detenidos
if [ ${#stopped[@]} -gt 0 ]; then
    echo -e "${YELLOW}[WARN] DETENIDOS (${#stopped[@]}):${NC}"
    for name in "${stopped[@]}"; do
        echo -e "  - $name"
    done
    echo ""
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}DETALLES:${NC}"
echo ""

# Mostrar tabla de detalles
printf "%-20s %-10s %-8s\n" "Servicio" "Estado" "PID"
printf "%-20s %-10s %-8s\n" "--------" "------" "---"

for pid_file in "$PID_DIR"/*.pid; do
    [ -f "$pid_file" ] || continue
    
    service_name=$(basename "$pid_file" .pid)
    pid=$(cat "$pid_file")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        status="Running"
    else
        status="Stopped"
    fi
    
    printf "%-20s %-10s %-8s\n" "$service_name" "$status" "$pid"
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo ""
