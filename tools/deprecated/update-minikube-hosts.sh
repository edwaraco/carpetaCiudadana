#!/bin/bash
# Updates /etc/hosts with the current Minikube IP for k8s.local
# run after minikube start so the changes take effect

set -e

echo "========================================"
echo "  Configuración de Minikube Hosts"
echo "========================================"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de tener 'minikube tunnel' corriendo"
echo "   El tunnel es NECESARIO para que el Ingress funcione."
echo ""
echo "   Si aún no lo has iniciado, abre OTRA terminal y ejecuta:"
echo "   sudo minikube tunnel"
echo ""

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

echo ""
echo "========================================"
echo "  ✅ Configuración completada"
echo "========================================"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Asegúrate de tener 'minikube tunnel' corriendo"
echo "   (en otra terminal con sudo):"
echo "   sudo minikube tunnel"
echo ""
echo "2. Luego accede a la aplicación en tu navegador:"
echo "   http://citizen-web.local"
echo ""
echo "📝 Troubleshooting si no funciona:"
echo ""
echo "  • Verifica pods: kubectl get pods -n carpeta-ciudadana"
echo "  • Verifica Ingress: kubectl get ingress -n carpeta-ciudadana"
echo "  • Verifica tunnel: debe estar corriendo y mostrar 'citizen-web'"