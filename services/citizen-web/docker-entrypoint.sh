#!/bin/sh
set -e

# API Gateway Environment Variables Configuration
# This script substitutes environment variables in nginx.conf.template
# to generate the final nginx.conf with actual service URLs
# Also generates runtime configuration for Vite frontend

echo "🚀 Starting citizen-web container initialization..."

# ============================================================================
# STEP 1: Generate runtime configuration for Vite frontend
# ============================================================================
echo "📝 Generating runtime configuration..."

cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-/api/v1}",
  VITE_OPERATOR_ID: "${VITE_OPERATOR_ID:-micarpeta}",
  VITE_OPERATOR_NAME: "${VITE_OPERATOR_NAME:-MiCarpeta}",
  VITE_MFA_REQUIRED: "${VITE_MFA_REQUIRED:-false}",
  VITE_FEATURE_PORTABILITY: "${VITE_FEATURE_PORTABILITY:-false}",
  VITE_FEATURE_DOCUMENT_REQUESTS: "${VITE_FEATURE_DOCUMENT_REQUESTS:-false}",
  VITE_FEATURE_DOCUMENTS: "${VITE_FEATURE_DOCUMENTS:-true}",
  VITE_FEATURE_UPLOAD_DOCUMENTS: "${VITE_FEATURE_UPLOAD_DOCUMENTS:-true}",
  VITE_FEATURE_DOWNLOAD_DOCUMENTS: "${VITE_FEATURE_DOWNLOAD_DOCUMENTS:-true}",
  VITE_FEATURE_DELETE_DOCUMENTS: "${VITE_FEATURE_DELETE_DOCUMENTS:-false}",
  VITE_FEATURE_NOTIFICATIONS: "${VITE_FEATURE_NOTIFICATIONS:-true}",
  VITE_FEATURE_STORAGE_STATS: "${VITE_FEATURE_STORAGE_STATS:-true}",
  VITE_FEATURE_RECENT_ACTIVITY: "${VITE_FEATURE_RECENT_ACTIVITY:-false}",
  VITE_FEATURE_MFA: "${VITE_FEATURE_MFA:-false}",
  VITE_FEATURE_REGISTRATION: "${VITE_FEATURE_REGISTRATION:-true}",
  VITE_FEATURE_AUDIT_LOGS: "${VITE_FEATURE_AUDIT_LOGS:-true}",
  VITE_USE_MOCKS: "${VITE_USE_MOCKS:-true}",
  VITE_MOCK_AUTHENTICATION: "${VITE_MOCK_AUTHENTICATION:-true}",
  VITE_MOCK_IDENTITY: "${VITE_MOCK_IDENTITY:-true}",
  VITE_MOCK_DOCUMENTS: "${VITE_MOCK_DOCUMENTS:-false}",
  VITE_MOCK_CARPETA: "${VITE_MOCK_CARPETA:-false}",
  VITE_MOCK_PORTABILITY: "${VITE_MOCK_PORTABILITY:-true}",
  VITE_MOCK_REQUESTS: "${VITE_MOCK_REQUESTS:-true}",
  VITE_MOCK_NOTIFICATIONS: "${VITE_MOCK_NOTIFICATIONS:-true}",
  VITE_MOCK_AUDIT: "${VITE_MOCK_AUDIT:-true}"
};
EOF

echo "✅ Runtime configuration generated"

# ============================================================================
# STEP 2: Configure Nginx API Gateway
# ============================================================================
echo "🔧 Configuring Nginx API Gateway..."

# Export environment variables with defaults for all microservices
export DOCUMENTS_SERVICE_URL="${DOCUMENTS_SERVICE_URL:-carpeta-ciudadana-service:8080}"
export FOLDERS_SERVICE_URL="${FOLDERS_SERVICE_URL:-carpeta-ciudadana-service:8080}"
export IDENTITY_SERVICE_URL="${IDENTITY_SERVICE_URL:-identity-service:8080}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-auth-service:8080}"
export NOTIFICATIONS_SERVICE_URL="${NOTIFICATIONS_SERVICE_URL:-notifications-service:8080}"
export PORTABILITY_SERVICE_URL="${PORTABILITY_SERVICE_URL:-carpeta-ciudadana-service:8080}"
export REQUESTS_SERVICE_URL="${REQUESTS_SERVICE_URL:-carpeta-ciudadana-service:8080}"

echo "📋 Microservices Configuration:"
echo "  - Documents Service: ${DOCUMENTS_SERVICE_URL}"
echo "  - Folders Service: ${FOLDERS_SERVICE_URL}"
echo "  - Identity Service: ${IDENTITY_SERVICE_URL}"
echo "  - Auth Service: ${AUTH_SERVICE_URL}"
echo "  - Notifications Service: ${NOTIFICATIONS_SERVICE_URL}"
echo "  - Portability Service: ${PORTABILITY_SERVICE_URL}"
echo "  - Requests Service: ${REQUESTS_SERVICE_URL}"

# Substitute environment variables in nginx template
echo "🔧 Generating nginx.conf from template..."
envsubst '${DOCUMENTS_SERVICE_URL} ${FOLDERS_SERVICE_URL} ${IDENTITY_SERVICE_URL} ${AUTH_SERVICE_URL} ${NOTIFICATIONS_SERVICE_URL} ${PORTABILITY_SERVICE_URL} ${REQUESTS_SERVICE_URL}' \
    < /etc/nginx/conf.d/nginx.conf.template \
    > /etc/nginx/conf.d/default.conf

echo "✅ Nginx configuration generated successfully"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Start nginx
echo "🎉 Starting nginx..."
exec nginx -g 'daemon off;'

