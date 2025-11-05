# RabbitMQ Quorum Cluster - Setup Validation Guide

This document provides step-by-step instructions to validate the RabbitMQ quorum cluster setup with 3 nodes and replication factor 2.

## Quick Start

```bash
# From repository root
cd infrastructure/docker

# Start all services
docker compose up -d

# Wait for cluster formation (~60 seconds)
sleep 60

# Verify cluster status
docker exec carpeta-rabbitmq-node1 rabbitmqctl cluster_status
```

## Detailed Validation Steps

### Step 1: Verify All Containers Are Running

```bash
docker compose ps
```

**Expected Output:**
- All services should show status "Up" or "Up (healthy)"
- RabbitMQ nodes should show health status "healthy" after ~60 seconds

```
NAME                        STATUS                  PORTS
carpeta-rabbitmq-node1      Up (healthy)           0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
carpeta-rabbitmq-node2      Up (healthy)           0.0.0.0:5673->5672/tcp, 0.0.0.0:15673->15672/tcp
carpeta-rabbitmq-node3      Up (healthy)           0.0.0.0:5674->5672/tcp, 0.0.0.0:15674->15672/tcp
```

### Step 2: Verify Cluster Formation

```bash
docker exec carpeta-rabbitmq-node1 rabbitmqctl cluster_status
```

**Expected Output:**
```
Cluster status of node rabbit@rabbitmq-node1 ...
Basics

Cluster name: rabbit@rabbitmq-node1

Disk Nodes

rabbit@rabbitmq-node1
rabbit@rabbitmq-node2
rabbit@rabbitmq-node3

Running Nodes

rabbit@rabbitmq-node1
rabbit@rabbitmq-node2
rabbit@rabbitmq-node3
```

**Key Validations:**
- ✅ 3 nodes listed under "Disk Nodes"
- ✅ 3 nodes listed under "Running Nodes"
- ✅ All nodes have the same cluster name

### Step 3: Verify Node Health

```bash
# Check node 1
docker exec carpeta-rabbitmq-node1 rabbitmq-diagnostics check_running

# Check node 2
docker exec carpeta-rabbitmq-node2 rabbitmq-diagnostics check_running

# Check node 3
docker exec carpeta-rabbitmq-node3 rabbitmq-diagnostics check_running
```

**Expected Output (for each):**
```
Checking if RabbitMQ is running ...
RabbitMQ is running
```

### Step 4: Access Management UI

Open browser and navigate to:

1. **Node 1**: http://localhost:15672
2. **Node 2**: http://localhost:15673
3. **Node 3**: http://localhost:15674

**Credentials:**
- Username: `admin`
- Password: `admin123`

**Verify in UI:**
1. Click "Overview" tab → Should show 3 nodes in cluster
2. Click "Admin" → "Cluster" → Should list all 3 nodes
3. Verify "Cluster name" matches across all nodes

### Step 5: Create Test Quorum Queue

```bash
# Create a test quorum queue with Spring Boot configuration style
docker exec carpeta-rabbitmq-node1 rabbitmqadmin declare queue \
  name=test.quorum.queue \
  durable=true \
  arguments='{"x-queue-type":"quorum","x-quorum-initial-group-size":3}'

# Verify queue was created
docker exec carpeta-rabbitmq-node1 rabbitmqctl list_queues name type state
```

**Expected Output:**
```
Timeout: 60.0 seconds ...
Listing queues for vhost / ...
name                    type    state
test.quorum.queue       quorum  running
```

**Verification Points:**
- ✅ Queue type is "quorum" (not "classic")
- ✅ Queue state is "running"

### Step 6: Verify Quorum Queue Replication

```bash
# Get detailed queue information
docker exec carpeta-rabbitmq-node1 rabbitmqctl list_queues name type durable arguments
```

**Expected Arguments:**
```json
{
  "x-queue-type": "quorum",
  "x-quorum-initial-group-size": 3
}
```

### Step 7: Test Publishing and Consuming

```bash
# Publish test message
docker exec carpeta-rabbitmq-node1 rabbitmqadmin publish \
  exchange=amq.default \
  routing_key=test.quorum.queue \
  payload="Test message from node 1"

# Verify message was queued
docker exec carpeta-rabbitmq-node1 rabbitmqctl list_queues name messages
```

**Expected Output:**
```
test.quorum.queue    1
```

```bash
# Consume message
docker exec carpeta-rabbitmq-node1 rabbitmqadmin get queue=test.quorum.queue
```

**Expected Output:**
```
+-------------+----------+---------------+---------------+
| routing_key | exchange | message_count |    payload    |
+-------------+----------+---------------+---------------+
| test.quorum.queue | (AMQP default) | 0     | Test message from node 1 |
+-------------+----------+---------------+---------------+
```

### Step 8: Failover Test (Leader Election)

**Simulate node failure:**

```bash
# 1. Identify current leader
docker exec carpeta-rabbitmq-node1 rabbitmqctl list_queues name leader

# 2. Stop the leader node (assuming it's node1)
docker stop carpeta-rabbitmq-node1

# 3. Wait 5 seconds for leader election
sleep 5

# 4. Verify new leader was elected
docker exec carpeta-rabbitmq-node2 rabbitmqctl list_queues name leader

# 5. Verify cluster still operational
docker exec carpeta-rabbitmq-node2 rabbitmqctl cluster_status

# 6. Restart stopped node
docker start carpeta-rabbitmq-node1

# 7. Wait for re-sync
sleep 10

# 8. Verify node rejoined cluster
docker exec carpeta-rabbitmq-node1 rabbitmqctl cluster_status
```

**Expected Behavior:**
- ✅ New leader elected within 5 seconds
- ✅ Cluster continues operating with 2 nodes
- ✅ Stopped node rejoins cluster automatically when restarted
- ✅ No message loss

### Step 9: Verify Spring Boot Integration

Check that the Spring Boot service has RabbitMQ connection:

```bash
# Check environment variables
docker compose exec carpeta-ciudadana-service env | grep RABBITMQ
```

**Expected Output:**
```
SPRING_RABBITMQ_ADDRESSES=rabbitmq-node1:5672,rabbitmq-node2:5672,rabbitmq-node3:5672
SPRING_RABBITMQ_USERNAME=admin
SPRING_RABBITMQ_PASSWORD=admin123
```

**Test connection from Spring Boot service:**
```bash
# Check logs for RabbitMQ connection success
docker compose logs carpeta-ciudadana-service | grep -i rabbit
```

**Expected Log Lines:**
```
Successfully connected to RabbitMQ
Created connection to: [rabbitmq-node1:5672, rabbitmq-node2:5672, rabbitmq-node3:5672]
```

### Step 10: Verify Persistence

```bash
# Stop all services
docker compose down

# Start services again
docker compose up -d

# Wait for cluster formation
sleep 60

# Verify cluster still intact
docker exec carpeta-rabbitmq-node1 rabbitmqctl cluster_status

# Verify test queue still exists
docker exec carpeta-rabbitmq-node1 rabbitmqctl list_queues name type
```

**Expected Behavior:**
- ✅ Cluster reforms automatically with same nodes
- ✅ Quorum queues still exist after restart
- ✅ Messages persisted if any were left in queues

## Troubleshooting

### Issue: Nodes Not Joining Cluster

**Symptoms:**
```bash
docker exec carpeta-rabbitmq-node2 rabbitmqctl cluster_status
# Only shows rabbit@rabbitmq-node2
```

**Solution:**
```bash
# Check logs for errors
docker compose logs rabbitmq-node2

# Common issues:
# 1. Erlang cookie mismatch
# 2. Node 1 not healthy yet
# 3. Network connectivity

# Manual reset and rejoin:
docker compose restart rabbitmq-node2 rabbitmq-node3
```

### Issue: Erlang Cookie Mismatch

**Symptoms:**
```
ERROR: Could not join cluster of rabbit@rabbitmq-node1 - authentication failed
```

**Solution:**
Verify all nodes have the same `RABBITMQ_ERLANG_COOKIE`:
```bash
docker compose config | grep ERLANG_COOKIE
```

All should show: `SWQOKODSQALRPCLNMEQG`

### Issue: Port Already in Use

**Symptoms:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5672: bind: address already in use
```

**Solution:**
```bash
# Find process using port
sudo lsof -i :5672
# or
sudo netstat -tulpn | grep 5672

# Stop conflicting process or change port in docker-compose.yml
```

### Issue: Cluster Formation Timeout

**Symptoms:**
Nodes 2 and 3 fail health checks after 60 seconds

**Solution:**
```bash
# Increase start_period in docker-compose.yml
# Change from 60s to 90s or 120s

# Or manually form cluster:
docker exec carpeta-rabbitmq-node2 rabbitmqctl stop_app
docker exec carpeta-rabbitmq-node2 rabbitmqctl reset
docker exec carpeta-rabbitmq-node2 rabbitmqctl join_cluster rabbit@rabbitmq-node1
docker exec carpeta-rabbitmq-node2 rabbitmqctl start_app
```

## Performance Validation

### Metrics to Monitor

1. **Queue Performance**
   - Message publish rate: Should support >1000 msg/s per queue
   - Consumer rate: Should support >500 msg/s per consumer
   - Latency: p95 < 50ms for publish confirm

2. **Cluster Health**
   - Memory usage: Each node < 2GB RAM under normal load
   - Disk usage: Each node < 10GB for typical workload
   - Network: Replication latency < 10ms between nodes

3. **Raft Consensus**
   - Leader election time: < 5 seconds
   - Commit latency: < 20ms for message replication

### Load Testing

```bash
# Install rabbitmq-perf-test
docker pull pivotalrabbitmq/perf-test:latest

# Run load test against cluster
docker run --rm -it --network carpeta-ciudadana-network \
  pivotalrabbitmq/perf-test:latest \
  --uri amqp://admin:admin123@rabbitmq-node1:5672 \
  --queue test.load.queue \
  --producers 10 \
  --consumers 10 \
  --rate 100 \
  --time 60 \
  --queue-args x-queue-type=quorum

# Expected Results:
# - Publish rate: ~1000 msg/s
# - Consume rate: ~900 msg/s (slightly lower due to acknowledgments)
# - Latency p95: < 100ms
```

## Cleanup

```bash
# Stop all services
docker compose down

# Remove all data (⚠️ DANGER: Data loss!)
docker compose down -v

# Remove only RabbitMQ data
docker volume rm \
  carpeta-rabbitmq-node1-data \
  carpeta-rabbitmq-node2-data \
  carpeta-rabbitmq-node3-data
```

## Success Criteria Checklist

Use this checklist to verify successful setup:

- [ ] All 3 RabbitMQ containers running and healthy
- [ ] Cluster status shows 3 running nodes
- [ ] All nodes show in Management UI
- [ ] Test quorum queue created successfully
- [ ] Messages can be published and consumed
- [ ] Failover test passed (leader re-election)
- [ ] Stopped node rejoins cluster automatically
- [ ] Spring Boot service connects to cluster
- [ ] Persistence verified after restart
- [ ] No errors in container logs

## References

- [ADR-0004: RabbitMQ Quorum Queues](../../docs/ADR/0004-rabbitmq-quorum-queues-3-nodos-replicacion-2.md)
- [ADR-0005: RabbitMQ Infrastructure Location](../../docs/ADR/0005-ubicacion-rabbitmq-docker-compose.md)
- [RabbitMQ Quorum Queues Documentation](https://www.rabbitmq.com/quorum-queues.html)
- [RabbitMQ Clustering Guide](https://www.rabbitmq.com/clustering.html)
