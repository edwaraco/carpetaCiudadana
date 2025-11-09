#!/bin/bash
# Updates /etc/hosts with the current Minikube IP for k8s.local
# run after minikube start so the changes take effect

set -e

echo "🔧 Actualizando hosts con la IP de Minikube..."

MINIKUBE_IP=$(minikube ip)

if [ -z "$MINIKUBE_IP" ]; then
    echo "❌ Error: No se pudo obtener la IP de Minikube. ¿Está Minikube ejecutándose?"
    exit 1
fi

echo "✅ IP de Minikube: $MINIKUBE_IP"

for DOMAIN in citizen-web.local; do
  sudo sed -i '' "/$DOMAIN/d" /etc/hosts
  echo "$MINIKUBE_IP $DOMAIN" | sudo tee -a /etc/hosts > /dev/null
  echo "✅ Agregado: $MINIKUBE_IP $DOMAIN"
done

echo ""
echo "✅ Archivo hosts actualizado exitosamente"
echo ""
echo "Entradas actuales:"
grep "citizen-web.local" /etc/hosts

# Verificar acceso al frontend
echo ""
echo "🔍 Verificando acceso al frontend..."
echo "⏳ Esperando a que el Ingress esté listo (esto puede tomar 10-30 segundos)..."

max_attempts=30
attempt=0
success=false

while [ $attempt -lt $max_attempts ] && [ "$success" = "false" ]; do
    attempt=$((attempt + 1))
    sleep 2
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://citizen-web.local --connect-timeout 5 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        success=true
        echo ""
        echo "✅ Frontend accesible en http://citizen-web.local"
        echo ""
        echo "🎉 ¡Todo listo! Puedes acceder a la aplicación en tu navegador:"
        echo "   http://citizen-web.local"
    else
        printf "."
    fi
done

if [ "$success" = "false" ]; then
    echo ""
    echo ""
    echo "⚠️  No se pudo conectar al frontend después de $max_attempts intentos"
    echo "   Esto puede deberse a que los pods todavía se están iniciando."
    echo ""
    echo "   Verifica el estado de los pods:"
    echo "   kubectl get pods -n carpeta-ciudadana"
    echo ""
    echo "   Verifica el Ingress:"
    echo "   kubectl get ingress -n carpeta-ciudadana"
    echo ""
    echo "   Luego intenta acceder manualmente a: http://citizen-web.local"
fi