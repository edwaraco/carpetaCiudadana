#!/bin/bash
# Script para detener todos los port-forwards en background

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
GRAY='\033[0;90m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Deteniendo Port-Forwards${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Directorio para PIDs
PID_DIR="/tmp/k8s-port-forwards"

# Verificar si existe el directorio de PIDs
if [ ! -d "$PID_DIR" ]; then
    echo -e "${GREEN}[OK] No hay port-forwards activos${NC}"
    echo ""
    exit 0
fi

# Contar archivos PID
pid_count=$(ls -1 "$PID_DIR"/*.pid 2>/dev/null | wc -l)

if [ "$pid_count" -eq 0 ]; then
    echo -e "${GREEN}[OK] No hay port-forwards activos${NC}"
    echo ""
    exit 0
fi

echo -e "${YELLOW}Encontrados $pid_count port-forwards activos:${NC}"
echo ""

# Detener cada port-forward
for pid_file in "$PID_DIR"/*.pid; do
    [ -f "$pid_file" ] || continue
    
    service_name=$(basename "$pid_file" .pid)
    pid=$(cat "$pid_file")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        status="Running"
    else
        status="Stopped"
    fi
    
    echo -ne "  - ${service_name} [${status}] "
    
    # Intentar matar el proceso
    if ps -p "$pid" > /dev/null 2>&1; then
        kill "$pid" 2>/dev/null || true
        # Esperar un poco
        sleep 0.2
        # Forzar si sigue vivo
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
    
    # Eliminar archivo PID
    rm -f "$pid_file"
    
    echo -e "-> Detenido ${GREEN}[OK]${NC}"
done

# Limpiar directorio si esta vacio
rmdir "$PID_DIR" 2>/dev/null || true

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}[OK] Todos los port-forwards han sido detenidos${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${GRAY}Para reiniciarlos:${NC}"
echo -e "  ${YELLOW}./port-forwards-start.sh${NC}"
echo ""
