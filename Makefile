# Carpeta Ciudadana - Deployment Makefile (Windows PowerShell)
# =================================================================
# This Makefile automates the deployment of all services in the correct order
# for Windows users using PowerShell.
#
# Prerequisites:
# - Docker Desktop running
# - Minikube installed and running
# - kubectl installed
# - PowerShell (comes with Windows)
#
# Usage:
#   make deploy-windows           - Deploy all services in correct order
#   make update-service-windows SERVICE=citizen-web - Update a specific service
#   make verify-windows           - Verify all deployments
#   make port-forwards-windows    - Show port-forward commands (run in separate terminals)
#   make clean-windows            - Remove all deployments
#   make help                     - Show this help message

.PHONY: help deploy-windows update-service-windows verify-windows port-forwards-windows clean-windows

# Default shell for Windows
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command

# Service names
SERVICES := rabbitmq-service auth-service ciudadano-registry-service notifications-service carpeta-ciudadana-service document-authentication-service citizen-web

# Namespace
NAMESPACE := carpeta-ciudadana

help:
	@Write-Host "Carpeta Ciudadana Deployment Makefile - Windows PowerShell" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Available targets:" -ForegroundColor Yellow
	@Write-Host "  deploy-windows              - Deploy all services in correct order" -ForegroundColor Green
	@Write-Host "  update-service-windows      - Update a specific service (use SERVICE=name)" -ForegroundColor Green
	@Write-Host "  verify-windows              - Verify all deployments are healthy" -ForegroundColor Green
	@Write-Host "  port-forwards-windows       - Show port-forward commands" -ForegroundColor Green
	@Write-Host "  update-hosts-windows        - Update Windows hosts file with minikube IP" -ForegroundColor Green
	@Write-Host "  clean-windows               - Remove all deployments" -ForegroundColor Green
	@Write-Host "  help                        - Show this help message" -ForegroundColor Green
	@Write-Host ""
	@Write-Host "Examples:" -ForegroundColor Yellow
	@Write-Host "  make deploy-windows"
	@Write-Host "  make update-service-windows SERVICE=citizen-web"
	@Write-Host "  make verify-windows"

# =================================================================
# Main deployment target
# =================================================================
deploy-windows: deploy-rabbitmq-windows deploy-auth-windows deploy-ciudadano-registry-windows deploy-notifications-windows deploy-carpeta-ciudadana-windows deploy-document-authentication-windows deploy-citizen-web-windows update-hosts-windows
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "ALL SERVICES DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Next steps:" -ForegroundColor Yellow
	@Write-Host "1. Run 'make port-forwards-windows' to see port-forward commands" -ForegroundColor White
	@Write-Host "2. Open the port-forward commands in separate PowerShell terminals" -ForegroundColor White
	@Write-Host "3. Access the services at:" -ForegroundColor White
	@Write-Host "   - RabbitMQ UI: http://localhost:15672 (admin/admin123)" -ForegroundColor White
	@Write-Host "   - Carpeta Ciudadana API: http://localhost:8080/api/v1/swagger-ui.html" -ForegroundColor White
	@Write-Host "   - Document Auth API: http://localhost:8083/api/v1/docs" -ForegroundColor White
	@Write-Host "   - Citizen Web: http://citizen-web.local" -ForegroundColor White
	@Write-Host ""

# =================================================================
# Individual service deployment targets
# =================================================================
deploy-rabbitmq-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 1/7: Deploying RabbitMQ Cluster Operator and Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Installing RabbitMQ Cluster Operator..." -ForegroundColor Yellow
	kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml
	@Write-Host "Waiting for operator to be ready..." -ForegroundColor Yellow
	Start-Sleep -Seconds 10
	@Write-Host "Deploying RabbitMQ cluster..." -ForegroundColor Yellow
	kubectl apply -f services/rabbitmq-service/k8s/
	@Write-Host "Waiting for RabbitMQ pods to be ready (this may take 2-3 minutes)..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n $(NAMESPACE) --timeout=300s
	@Write-Host "RabbitMQ deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=carpeta-rabbitmq

deploy-auth-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 2/7: Deploying Auth Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/auth-service; docker build -t auth-service:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load auth-service:latest
	@Write-Host "Deploying service..." -ForegroundColor Yellow
	kubectl apply -f services/auth-service/k8s/
	@Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=auth-service -n $(NAMESPACE) --timeout=120s
	@Write-Host "Auth Service deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=auth-service

deploy-ciudadano-registry-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 3/7: Deploying Ciudadano Registry Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/ciudadano-registry-service; docker build -t ciudadano-registry-service:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load ciudadano-registry-service:latest
	@Write-Host "Deploying service..." -ForegroundColor Yellow
	kubectl apply -f services/ciudadano-registry-service/k8s/
	@Write-Host "Waiting for infrastructure to be ready..." -ForegroundColor Yellow
	Start-Sleep -Seconds 10
	@Write-Host "Waiting for service pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=ciudadano-registry-service -n $(NAMESPACE) --timeout=120s
	@Write-Host "Ciudadano Registry Service deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=ciudadano-registry-service

deploy-notifications-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 4/7: Deploying Notifications Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/notifications-service; docker build -t notifications-service:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load notifications-service:latest
	@Write-Host "Deploying service..." -ForegroundColor Yellow
	kubectl apply -f services/notifications-service/k8s/
	@Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=notifications-service -n $(NAMESPACE) --timeout=120s
	@Write-Host "Notifications Service deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=notifications-service

deploy-carpeta-ciudadana-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 5/7: Deploying Carpeta Ciudadana Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/carpeta-ciudadana-service; docker build -t carpeta-ciudadana-service:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load carpeta-ciudadana-service:latest
	@Write-Host "Deploying service (includes DynamoDB and MinIO)..." -ForegroundColor Yellow
	kubectl apply -f services/carpeta-ciudadana-service/k8s/
	@Write-Host "Waiting for infrastructure (DynamoDB, MinIO) to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=dynamodb-local -n $(NAMESPACE) --timeout=120s
	kubectl wait --for=condition=ready pod -l app=minio -n $(NAMESPACE) --timeout=120s
	@Write-Host "Waiting for service pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=carpeta-ciudadana-service -n $(NAMESPACE) --timeout=120s
	@Write-Host "Carpeta Ciudadana Service deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=carpeta-ciudadana-service

deploy-document-authentication-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 6/7: Deploying Document Authentication Service" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/document-authentication-service; docker build -t document-authentication-service:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load document-authentication-service:latest
	@Write-Host "Deploying service..." -ForegroundColor Yellow
	kubectl apply -f services/document-authentication-service/k8s/
	@Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=document-authentication-service -n $(NAMESPACE) --timeout=120s
	@Write-Host "Document Authentication Service deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=document-authentication-service

deploy-citizen-web-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "STEP 7/7: Deploying Citizen Web (Frontend)" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Building Docker image..." -ForegroundColor Yellow
	cd services/citizen-web; docker build -t citizen-web:latest .
	@Write-Host "Loading image into minikube..." -ForegroundColor Yellow
	minikube image load citizen-web:latest
	@Write-Host "Deploying service..." -ForegroundColor Yellow
	kubectl apply -f services/citizen-web/k8s/
	@Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
	kubectl wait --for=condition=ready pod -l app=citizen-web -n $(NAMESPACE) --timeout=120s
	@Write-Host "Citizen Web deployed successfully!" -ForegroundColor Green
	kubectl get pods -n $(NAMESPACE) -l app=citizen-web

# =================================================================
# Update a specific service
# =================================================================
update-service-windows:
	@if ("$(SERVICE)" -eq "") { Write-Host "Error: SERVICE parameter is required. Usage: make update-service-windows SERVICE=citizen-web" -ForegroundColor Red; exit 1 }
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "Updating service: $(SERVICE)" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	.\tools\k8s-update-service.ps1 -ServiceName $(SERVICE) -Namespace $(NAMESPACE)

# =================================================================
# Update hosts file
# =================================================================
update-hosts-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "Updating Windows hosts file with Minikube IP" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "This requires Administrator privileges..." -ForegroundColor Yellow
	powershell -ExecutionPolicy Bypass -File tools/update-minikube-hosts.ps1

# =================================================================
# Verify deployments
# =================================================================
verify-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "Verifying all deployments" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "All pods in namespace $(NAMESPACE):" -ForegroundColor Yellow
	kubectl get pods -n $(NAMESPACE)
	@Write-Host ""
	@Write-Host "All services in namespace $(NAMESPACE):" -ForegroundColor Yellow
	kubectl get svc -n $(NAMESPACE)
	@Write-Host ""
	@Write-Host "RabbitMQ cluster status:" -ForegroundColor Yellow
	kubectl get rabbitmqclusters -n $(NAMESPACE)
	@Write-Host ""
	@Write-Host "Resource usage:" -ForegroundColor Yellow
	kubectl top pods -n $(NAMESPACE)
	@Write-Host ""
	kubectl top nodes
	@Write-Host ""
	@Write-Host "Minikube resource usage:" -ForegroundColor Yellow
	docker stats minikube --no-stream

# =================================================================
# Show port-forward commands
# =================================================================
port-forwards-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "Port Forward Commands" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "Run these commands in SEPARATE PowerShell terminals (keep them open):" -ForegroundColor Yellow
	@Write-Host ""
	@Write-Host "Terminal 1 - RabbitMQ:" -ForegroundColor Cyan
	@Write-Host "kubectl port-forward -n $(NAMESPACE) svc/carpeta-rabbitmq 5672:5672 15672:15672" -ForegroundColor White
	@Write-Host ""
	@Write-Host "Terminal 2 - Carpeta Ciudadana Service:" -ForegroundColor Cyan
	@Write-Host "kubectl port-forward -n $(NAMESPACE) svc/carpeta-ciudadana-service 8080:8080" -ForegroundColor White
	@Write-Host ""
	@Write-Host "Terminal 3 - Document Authentication Service:" -ForegroundColor Cyan
	@Write-Host "kubectl port-forward -n $(NAMESPACE) svc/document-authentication-service 8083:8083" -ForegroundColor White
	@Write-Host ""
	@Write-Host "Once port-forwards are running, access:" -ForegroundColor Yellow
	@Write-Host "  - RabbitMQ UI: http://localhost:15672 (admin/admin123)" -ForegroundColor White
	@Write-Host "  - Carpeta Ciudadana API: http://localhost:8080/api/v1/swagger-ui.html" -ForegroundColor White
	@Write-Host "  - Document Auth API: http://localhost:8083/api/v1/docs" -ForegroundColor White
	@Write-Host "  - Citizen Web: http://citizen-web.local" -ForegroundColor White
	@Write-Host ""

# =================================================================
# Clean up all deployments
# =================================================================
clean-windows:
	@Write-Host ""
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host "Removing all deployments" -ForegroundColor Cyan
	@Write-Host "============================================================================" -ForegroundColor Cyan
	@Write-Host ""
	@Write-Host "This will delete all services in namespace $(NAMESPACE)..." -ForegroundColor Yellow
	@Write-Host "Press Ctrl+C to cancel or wait 5 seconds to continue..." -ForegroundColor Red
	Start-Sleep -Seconds 5
	@Write-Host ""
	kubectl delete -f services/citizen-web/k8s/ --ignore-not-found=true
	kubectl delete -f services/document-authentication-service/k8s/ --ignore-not-found=true
	kubectl delete -f services/carpeta-ciudadana-service/k8s/ --ignore-not-found=true
	kubectl delete -f services/notifications-service/k8s/ --ignore-not-found=true
	kubectl delete -f services/ciudadano-registry-service/k8s/ --ignore-not-found=true
	kubectl delete -f services/auth-service/k8s/ --ignore-not-found=true
	kubectl delete -f services/rabbitmq-service/k8s/ --ignore-not-found=true
	@Write-Host ""
	@Write-Host "All services removed!" -ForegroundColor Green
	@Write-Host ""
