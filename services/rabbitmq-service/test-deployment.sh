#!/bin/bash
# Test script for RabbitMQ cluster deployment validation
# This script validates the cluster configuration without actually deploying

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} RabbitMQ Cluster Deployment Validation${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Check all required YAML files exist
echo -e "${YELLOW}[1/6] Checking required YAML files...${NC}"
FILES=(
    "00-namespace.yaml"
    "01-cluster-operator.yaml"
    "02-storage.yaml"
    "03-rabbitmq-cluster.yaml"
    "04-ingress.yaml"
    "05-queue-definitions.yaml"
)

for file in "${FILES[@]}"; do
    if [ -f "$K8S_DIR/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file missing"
        exit 1
    fi
done
echo ""

# Test 2: Validate YAML syntax
echo -e "${YELLOW}[2/6] Validating YAML syntax...${NC}"
if command -v kubectl &> /dev/null; then
    # Check if kubectl can connect to a cluster
    if kubectl cluster-info &> /dev/null; then
        for file in "${FILES[@]}"; do
            # Skip operator file (it's a reference)
            if [ "$file" = "01-cluster-operator.yaml" ]; then
                echo -e "  ${BLUE}↷${NC} $file (reference only, skipped)"
                continue
            fi
            
            if kubectl apply --dry-run=client -f "$K8S_DIR/$file" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} $file is valid"
            else
                echo -e "  ${RED}✗${NC} $file has syntax errors"
                kubectl apply --dry-run=client -f "$K8S_DIR/$file"
                exit 1
            fi
        done
    else
        echo -e "  ${YELLOW}⚠${NC} kubectl not connected to cluster, skipping validation"
        echo -e "    To enable validation, ensure: kubectl cluster-info"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} kubectl not found, skipping syntax validation"
fi
echo ""

# Test 3: Validate cluster configuration
echo -e "${YELLOW}[3/6] Validating cluster configuration...${NC}"
CLUSTER_FILE="$K8S_DIR/03-rabbitmq-cluster.yaml"

# Check replicas
if grep -q "replicas: 3" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} Replicas set to 3"
else
    echo -e "  ${RED}✗${NC} Replicas not set to 3"
    exit 1
fi

# Check image
if grep -q "image: rabbitmq:3.13-management" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} Using rabbitmq:3.13-management"
else
    echo -e "  ${RED}✗${NC} Image not set correctly"
    exit 1
fi

# Check persistence
if grep -q "storage: 10Gi" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} Storage set to 10Gi per node"
else
    echo -e "  ${RED}✗${NC} Storage not configured"
    exit 1
fi

# Check peer discovery
if grep -q "cluster_formation.peer_discovery_backend = kubernetes" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} Kubernetes peer discovery enabled"
else
    echo -e "  ${RED}✗${NC} Peer discovery not configured"
    exit 1
fi

# Check plugins
if grep -q "rabbitmq_peer_discovery_k8s" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} K8s peer discovery plugin enabled"
else
    echo -e "  ${RED}✗${NC} K8s peer discovery plugin missing"
    exit 1
fi

# Check volume mount
if grep -q "/etc/rabbitmq/definitions.json" "$CLUSTER_FILE"; then
    echo -e "  ${GREEN}✓${NC} Definitions ConfigMap mounted"
else
    echo -e "  ${RED}✗${NC} Definitions ConfigMap not mounted"
    exit 1
fi

echo ""

# Test 4: Validate queue definitions
echo -e "${YELLOW}[4/6] Validating queue definitions...${NC}"
QUEUE_FILE="$K8S_DIR/05-queue-definitions.yaml"

REQUIRED_QUEUES=(
    "document_verification_request"
    "document_verified_response"
    "test_queue"
)

for queue in "${REQUIRED_QUEUES[@]}"; do
    if grep -q "\"name\": \"$queue\"" "$QUEUE_FILE"; then
        echo -e "  ${GREEN}✓${NC} Queue '$queue' defined"
    else
        echo -e "  ${RED}✗${NC} Queue '$queue' missing"
        exit 1
    fi
    
    # Check queue type
    if grep -A 10 "\"name\": \"$queue\"" "$QUEUE_FILE" | grep -q "\"x-queue-type\": \"quorum\""; then
        echo -e "    ${GREEN}✓${NC} Type: quorum"
    else
        echo -e "    ${RED}✗${NC} Type: not quorum"
        exit 1
    fi
    
    # Check replication factor
    if grep -A 10 "\"name\": \"$queue\"" "$QUEUE_FILE" | grep -q "\"x-quorum-initial-group-size\": 3"; then
        echo -e "    ${GREEN}✓${NC} Replication factor: 3"
    else
        echo -e "    ${RED}✗${NC} Replication factor: not 3"
        exit 1
    fi
done
echo ""

# Test 5: Check Makefile
echo -e "${YELLOW}[5/6] Checking Makefile...${NC}"
MAKEFILE="$SCRIPT_DIR/Makefile"

if [ -f "$MAKEFILE" ]; then
    echo -e "  ${GREEN}✓${NC} Makefile exists"
    
    # Check for key targets
    TARGETS=(
        "help"
        "install"
        "install-operator"
        "install-cluster"
        "create-queues"
        "status"
        "credentials"
        "port-forward"
        "uninstall"
    )
    
    for target in "${TARGETS[@]}"; do
        if grep -q "^${target}:" "$MAKEFILE"; then
            echo -e "    ${GREEN}✓${NC} Target '$target' exists"
        else
            echo -e "    ${RED}✗${NC} Target '$target' missing"
            exit 1
        fi
    done
else
    echo -e "  ${RED}✗${NC} Makefile missing"
    exit 1
fi
echo ""

# Test 6: Check documentation
echo -e "${YELLOW}[6/6] Checking documentation...${NC}"
DOCS=(
    "README.md"
    "CONFIGURATION_REVIEW.md"
    "QUICK_START.md"
    "MIGRATION_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$SCRIPT_DIR/$doc" ]; then
        echo -e "  ${GREEN}✓${NC} $doc exists"
    else
        echo -e "  ${YELLOW}⚠${NC} $doc missing (optional)"
    fi
done
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All validation tests passed!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Deploy to Kubernetes cluster: make quick-start"
echo "  2. Verify cluster: make status"
echo "  3. Access Management UI: make port-forward"
echo ""
echo -e "${BLUE}For detailed information, see:${NC}"
echo "  - README.md - Installation guide"
echo "  - CONFIGURATION_REVIEW.md - Configuration details"
echo "  - QUICK_START.md - Quick start guide"
echo ""

exit 0
