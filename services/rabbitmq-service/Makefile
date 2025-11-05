# Makefile for RabbitMQ Service Management
# Simplifies kubectl commands for RabbitMQ Cluster operations

# Variables
NAMESPACE := carpeta-ciudadana
OPERATOR_NAMESPACE := rabbitmq-system
CLUSTER_NAME := carpeta-rabbitmq
KUBECTL := kubectl

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)RabbitMQ Service - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""

##@ Installation

.PHONY: install
install: install-operator install-cluster ## Install complete RabbitMQ setup (operator + cluster)

.PHONY: install-operator
install-operator: ## Install RabbitMQ Cluster Operator
	@echo "$(BLUE)Installing RabbitMQ Cluster Operator...$(NC)"
	$(KUBECTL) apply -f k8s/00-namespace.yaml
	$(KUBECTL) apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml
	@echo "$(GREEN)Operator installed. Waiting for it to be ready...$(NC)"
	$(KUBECTL) wait --for=condition=ready pod -l app.kubernetes.io/name=rabbitmq-cluster-operator -n $(OPERATOR_NAMESPACE) --timeout=120s
	@echo "$(GREEN)✓ Operator is ready$(NC)"

.PHONY: install-cluster
install-cluster: ## Install RabbitMQ cluster (3 nodes)
	@echo "$(BLUE)Installing RabbitMQ cluster...$(NC)"
	$(KUBECTL) apply -f k8s/02-storage.yaml
	$(KUBECTL) apply -f k8s/03-rabbitmq-cluster.yaml
	$(KUBECTL) apply -f k8s/04-ingress.yaml
	@echo "$(GREEN)Cluster resources created. Waiting for pods...$(NC)"
	@echo "$(YELLOW)This may take 2-3 minutes...$(NC)"
	$(KUBECTL) wait --for=condition=ready pod -l app.kubernetes.io/name=$(CLUSTER_NAME) -n $(NAMESPACE) --timeout=300s
	@echo "$(GREEN)✓ Cluster is ready$(NC)"

.PHONY: create-queues
create-queues: ## Create required quorum queues (document_verification_request, document_verified_response, test_queue)
	@echo "$(BLUE)Creating quorum queues...$(NC)"
	@$(MAKE) create-queue QUEUE_NAME=document_verification_request
	@$(MAKE) create-queue QUEUE_NAME=document_verified_response
	@$(MAKE) create-queue QUEUE_NAME=test_queue
	@echo "$(GREEN)✓ All queues created$(NC)"

.PHONY: create-queue
create-queue: ## Create a single quorum queue (use QUEUE_NAME=<name>)
	@if [ -z "$(QUEUE_NAME)" ]; then \
		echo "$(RED)Error: QUEUE_NAME not specified$(NC)"; \
		echo "Usage: make create-queue QUEUE_NAME=my_queue"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating queue: $(QUEUE_NAME)$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- \
		rabbitmqadmin declare queue \
		name=$(QUEUE_NAME) \
		durable=true \
		arguments='{"x-queue-type":"quorum","x-quorum-initial-group-size":3,"x-delivery-limit":3}'
	@echo "$(GREEN)✓ Queue $(QUEUE_NAME) created$(NC)"

##@ Status & Monitoring

.PHONY: status
status: ## Show overall cluster status
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE) RabbitMQ Cluster Status$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Cluster Resource:$(NC)"
	@$(KUBECTL) get rabbitmqclusters -n $(NAMESPACE)
	@echo ""
	@echo "$(YELLOW)Pods:$(NC)"
	@$(KUBECTL) get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(CLUSTER_NAME)
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@$(KUBECTL) get svc -n $(NAMESPACE) -l app.kubernetes.io/name=$(CLUSTER_NAME)
	@echo ""
	@echo "$(YELLOW)PersistentVolumeClaims:$(NC)"
	@$(KUBECTL) get pvc -n $(NAMESPACE)

.PHONY: cluster-status
cluster-status: ## Show RabbitMQ cluster internal status
	@echo "$(BLUE)RabbitMQ Cluster Internal Status:$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- rabbitmqctl cluster_status

.PHONY: list-queues
list-queues: ## List all queues with type and members
	@echo "$(BLUE)Queues:$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- \
		rabbitmqctl list_queues name type members state

.PHONY: list-nodes
list-nodes: ## List all cluster nodes
	@echo "$(BLUE)Cluster Nodes:$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- rabbitmqctl list_nodes

.PHONY: logs
logs: ## Show logs from all RabbitMQ pods
	$(KUBECTL) logs -n $(NAMESPACE) -l app.kubernetes.io/name=$(CLUSTER_NAME) --tail=100 -f

.PHONY: logs-pod
logs-pod: ## Show logs from a specific pod (use POD_ID=0,1,2)
	@if [ -z "$(POD_ID)" ]; then POD_ID=0; fi; \
	$(KUBECTL) logs -n $(NAMESPACE) $(CLUSTER_NAME)-server-$$POD_ID -f

##@ Access & Credentials

.PHONY: credentials
credentials: ## Get RabbitMQ admin credentials
	@echo "$(BLUE)RabbitMQ Admin Credentials:$(NC)"
	@echo "$(YELLOW)Username:$(NC) $$($(KUBECTL) get secret $(CLUSTER_NAME)-default-user -n $(NAMESPACE) -o jsonpath='{.data.username}' | base64 -d)"
	@echo "$(YELLOW)Password:$(NC) $$($(KUBECTL) get secret $(CLUSTER_NAME)-default-user -n $(NAMESPACE) -o jsonpath='{.data.password}' | base64 -d)"

.PHONY: port-forward
port-forward: ## Port-forward AMQP (5672) and Management UI (15672)
	@echo "$(GREEN)Port-forwarding RabbitMQ services...$(NC)"
	@echo "$(YELLOW)AMQP:        localhost:5672$(NC)"
	@echo "$(YELLOW)Management:  localhost:15672$(NC)"
	@echo "$(YELLOW)Prometheus:  localhost:15692$(NC)"
	@echo ""
	@echo "$(BLUE)Press Ctrl+C to stop$(NC)"
	$(KUBECTL) port-forward -n $(NAMESPACE) svc/$(CLUSTER_NAME) 5672:5672 15672:15672 15692:15692

.PHONY: management-ui
management-ui: ## Open Management UI in browser (requires port-forward)
	@echo "$(BLUE)Opening Management UI...$(NC)"
	@echo "$(YELLOW)If port-forward is not running, run: make port-forward$(NC)"
	@sleep 2
	@open http://localhost:15672 || xdg-open http://localhost:15672 || echo "$(YELLOW)Open http://localhost:15672 in your browser$(NC)"

##@ Scaling & Configuration

.PHONY: scale
scale: ## Scale cluster (use REPLICAS=<number>)
	@if [ -z "$(REPLICAS)" ]; then \
		echo "$(RED)Error: REPLICAS not specified$(NC)"; \
		echo "Usage: make scale REPLICAS=5"; \
		exit 1; \
	fi
	@echo "$(BLUE)Scaling cluster to $(REPLICAS) replicas...$(NC)"
	$(KUBECTL) patch rabbitmqcluster $(CLUSTER_NAME) -n $(NAMESPACE) \
		--type merge -p '{"spec":{"replicas":$(REPLICAS)}}'
	@echo "$(GREEN)Cluster scaled. Waiting for pods...$(NC)"
	$(KUBECTL) wait --for=condition=ready pod -l app.kubernetes.io/name=$(CLUSTER_NAME) -n $(NAMESPACE) --timeout=300s

.PHONY: configure-operator
configure-operator: ## Configure operator environment variables
	@echo "$(BLUE)Configuring operator...$(NC)"
	@echo "$(YELLOW)This will open the operator deployment for editing$(NC)"
	@echo "$(YELLOW)Add environment variables as needed:$(NC)"
	@echo "  - OPERATOR_SCOPE_NAMESPACE: carpeta-ciudadana"
	@echo "  - DEFAULT_RABBITMQ_IMAGE: rabbitmq:3.13-management"
	@echo ""
	$(KUBECTL) -n $(OPERATOR_NAMESPACE) edit deployment rabbitmq-cluster-operator

##@ Testing & Debugging

.PHONY: test-connection
test-connection: ## Test connection to RabbitMQ cluster
	@echo "$(BLUE)Testing connection...$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- rabbitmq-diagnostics ping

.PHONY: test-queues
test-queues: ## Test queues with producer/consumer scripts
	@echo "$(BLUE)Testing queues with Python scripts...$(NC)"
	@echo "$(YELLOW)Make sure port-forward is running: make port-forward$(NC)"
	@echo ""
	cd ../../tools/rabbitmq-tester && \
	python3 producer.py --count 1 --queue document_verification_request && \
	python3 consumer.py --queue document_verification_request

.PHONY: exec
exec: ## Execute shell in RabbitMQ pod (use POD_ID=0,1,2)
	@if [ -z "$(POD_ID)" ]; then POD_ID=0; fi; \
	$(KUBECTL) exec -it -n $(NAMESPACE) $(CLUSTER_NAME)-server-$$POD_ID -- /bin/bash

.PHONY: describe
describe: ## Describe RabbitMQ cluster resource
	$(KUBECTL) describe rabbitmqcluster $(CLUSTER_NAME) -n $(NAMESPACE)

.PHONY: events
events: ## Show events from namespace
	$(KUBECTL) get events -n $(NAMESPACE) --sort-by='.lastTimestamp'

##@ Export & Import

.PHONY: export-definitions
export-definitions: ## Export queue/exchange definitions
	@echo "$(BLUE)Exporting definitions...$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- \
		rabbitmqadmin export /tmp/definitions.json
	$(KUBECTL) cp $(NAMESPACE)/$(CLUSTER_NAME)-server-0:/tmp/definitions.json ./definitions.json
	@echo "$(GREEN)✓ Definitions exported to definitions.json$(NC)"

.PHONY: import-definitions
import-definitions: ## Import queue/exchange definitions (requires definitions.json)
	@if [ ! -f definitions.json ]; then \
		echo "$(RED)Error: definitions.json not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Importing definitions...$(NC)"
	$(KUBECTL) cp ./definitions.json $(NAMESPACE)/$(CLUSTER_NAME)-server-0:/tmp/definitions.json
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- \
		rabbitmqadmin import /tmp/definitions.json
	@echo "$(GREEN)✓ Definitions imported$(NC)"

##@ Cleanup

.PHONY: delete-queue
delete-queue: ## Delete a queue (use QUEUE_NAME=<name>)
	@if [ -z "$(QUEUE_NAME)" ]; then \
		echo "$(RED)Error: QUEUE_NAME not specified$(NC)"; \
		echo "Usage: make delete-queue QUEUE_NAME=my_queue"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Deleting queue: $(QUEUE_NAME)$(NC)"
	$(KUBECTL) exec -n $(NAMESPACE) $(CLUSTER_NAME)-server-0 -- \
		rabbitmqctl delete_queue $(QUEUE_NAME)

.PHONY: uninstall
uninstall: ## Remove RabbitMQ cluster (keeps operator)
	@echo "$(YELLOW)Uninstalling RabbitMQ cluster...$(NC)"
	$(KUBECTL) delete -f k8s/04-ingress.yaml --ignore-not-found
	$(KUBECTL) delete -f k8s/03-rabbitmq-cluster.yaml --ignore-not-found
	@echo "$(YELLOW)Waiting for pods to terminate...$(NC)"
	@$(KUBECTL) wait --for=delete pod -l app.kubernetes.io/name=$(CLUSTER_NAME) -n $(NAMESPACE) --timeout=120s || true
	@echo "$(GREEN)✓ Cluster uninstalled$(NC)"

.PHONY: uninstall-all
uninstall-all: uninstall ## Remove everything including operator and namespaces
	@echo "$(YELLOW)Uninstalling operator...$(NC)"
	$(KUBECTL) delete -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml --ignore-not-found
	$(KUBECTL) delete -f k8s/02-storage.yaml --ignore-not-found
	$(KUBECTL) delete -f k8s/00-namespace.yaml --ignore-not-found
	@echo "$(GREEN)✓ Complete uninstall finished$(NC)"

.PHONY: clean-pvcs
clean-pvcs: ## Delete all PVCs (WARNING: data loss!)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds...$(NC)"
	@sleep 5
	$(KUBECTL) delete pvc -n $(NAMESPACE) -l app.kubernetes.io/name=$(CLUSTER_NAME)

##@ Quick Start

.PHONY: quick-start
quick-start: install create-queues credentials ## Quick start: install everything and show credentials
	@echo ""
	@echo "$(GREEN)✓ RabbitMQ cluster is ready!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Run 'make port-forward' to access services"
	@echo "  2. Open Management UI: make management-ui"
	@echo "  3. Check status: make status"
	@echo ""

.DEFAULT_GOAL := help
