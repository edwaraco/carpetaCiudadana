#!/bin/bash
set -e

echo "Starting RabbitMQ follower node..."

# Get the leader hostname from environment variable
LEADER_HOST="${RABBITMQ_LEADER_HOST:-rabbitmq-leader}"

echo "Leader host: $LEADER_HOST"

# Iniciar RabbitMQ en background
rabbitmq-server -detached

# Esperar a que RabbitMQ esté listo
echo "Waiting for RabbitMQ to be ready..."
timeout 90 bash -c 'until rabbitmq-diagnostics -q ping; do sleep 2; done'
timeout 90 bash -c 'until rabbitmq-diagnostics -q check_port_connectivity; do sleep 2; done'

echo "RabbitMQ is ready. Joining cluster..."

# Unirse al cluster del nodo líder
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster rabbit@${LEADER_HOST}
rabbitmqctl start_app

echo "Successfully joined cluster. Node is now part of the RabbitMQ cluster."

# Verificar estado del cluster
rabbitmqctl cluster_status

# Mantener contenedor vivo
echo "Container is ready. Tailing logs..."
exec rabbitmq-server
