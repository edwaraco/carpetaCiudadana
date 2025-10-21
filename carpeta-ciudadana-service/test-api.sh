#!/bin/bash

# Script de ejemplo para probar la API del microservicio Carpeta Ciudadana
# Solo incluye las 4 funcionalidades básicas requeridas:
# 1. Crear carpetas ciudadanas únicas
# 2. Almacenar documentos (firmados o no)
# 3. Ver mis documentos
# 4. Integración con microservicio de firma digital

BASE_URL="http://localhost:8080/api/v1"

echo "=== Probando API Carpeta Ciudadana ==="
echo "Base URL: $BASE_URL"
echo ""

# 1. Crear una carpeta ciudadana
echo "1. Creando carpeta ciudadana..."
CARPETA_RESPONSE=$(curl -s -X POST "$BASE_URL/carpetas" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "nombreCompleto": "Juan Pérez García",
    "operadorActual": "MiOperador"
  }')

echo "Respuesta: $CARPETA_RESPONSE"
CARPETA_ID=$(echo $CARPETA_RESPONSE | jq -r '.carpetaId')
echo "Carpeta ID: $CARPETA_ID"
echo ""

# 2. Obtener la carpeta creada
echo "2. Obteniendo carpeta por ID..."
curl -s -X GET "$BASE_URL/carpetas/$CARPETA_ID" | jq '.'
echo ""

# 3. Obtener la carpeta por cédula
echo "3. Obteniendo carpeta por cédula..."
curl -s -X GET "$BASE_URL/carpetas/cedula/1234567890" | jq '.'
echo ""

# 4. Crear un archivo de prueba
echo "4. Creando archivo de prueba..."
echo "Este es un documento de prueba para la carpeta ciudadana" > documento_prueba.txt

# 5. Subir documento (requiere archivo real)
echo "5. Subiendo documento..."
echo "Nota: Este comando requiere un archivo real. Ejemplo:"
echo "curl -X POST \"$BASE_URL/carpetas/$CARPETA_ID/documentos\" \\"
echo "  -F \"archivo=@documento_prueba.txt\" \\"
echo "  -F \"titulo=Documento de Prueba\" \\"
echo "  -F \"tipoDocumento=DIPLOMA\" \\"
echo "  -F \"contextoDocumento=EDUCACION\""
echo ""

# 6. Obtener documentos de la carpeta
echo "6. Obteniendo documentos de la carpeta..."
curl -s -X GET "$BASE_URL/carpetas/$CARPETA_ID/documentos" | jq '.'
echo ""

# 7. Obtener documento específico (requiere documento existente)
echo "7. Obteniendo documento específico..."
echo "Nota: Este comando requiere un documento existente. Ejemplo:"
echo "curl -X GET \"$BASE_URL/carpetas/$CARPETA_ID/documentos/{documentoId}\""
echo ""

# 8. Autenticar documento (requiere documento existente)
echo "8. Autenticando documento..."
echo "Nota: Este comando requiere un documento existente. Ejemplo:"
echo "curl -X POST \"$BASE_URL/firma-digital/$CARPETA_ID/documentos/{documentoId}/autenticar?funcionarioSolicitante=JuanPerez&entidadSolicitante=UniversidadEAFIT\""
echo ""

# 9. Verificar estado de autenticación (requiere documento existente)
echo "9. Verificando estado de autenticación..."
echo "Nota: Este comando requiere un documento existente. Ejemplo:"
echo "curl -X GET \"$BASE_URL/firma-digital/$CARPETA_ID/documentos/{documentoId}/estado\""
echo ""

# 10. Obtener certificado (requiere documento autenticado)
echo "10. Obteniendo certificado de validez..."
echo "Nota: Este comando requiere un documento autenticado. Ejemplo:"
echo "curl -X GET \"$BASE_URL/firma-digital/$CARPETA_ID/documentos/{documentoId}/certificado\""
echo ""

# Limpiar archivo de prueba
rm -f documento_prueba.txt

echo "=== Pruebas completadas ==="
echo ""
echo "Para probar con archivos reales:"
echo "1. Asegúrate de que el servicio esté ejecutándose"
echo "2. Usa un cliente REST como Postman o Insomnia"
echo "3. O modifica este script para incluir archivos reales"
echo ""
echo "Endpoints disponibles (solo 4 funcionalidades básicas):"
echo "- POST /api/v1/carpetas - Crear carpeta"
echo "- GET /api/v1/carpetas/{id} - Obtener carpeta por ID"
echo "- GET /api/v1/carpetas/cedula/{cedula} - Obtener carpeta por cédula"
echo "- POST /api/v1/carpetas/{id}/documentos - Subir documento"
echo "- GET /api/v1/carpetas/{id}/documentos - Obtener documentos"
echo "- GET /api/v1/carpetas/{id}/documentos/{docId} - Obtener documento"
echo "- POST /api/v1/firma-digital/{id}/documentos/{docId}/autenticar - Autenticar documento (FR-AF-01)"
echo "- GET /api/v1/firma-digital/{id}/documentos/{docId}/estado - Verificar estado de autenticación"
echo "- GET /api/v1/firma-digital/{id}/documentos/{docId}/certificado - Obtener certificado"