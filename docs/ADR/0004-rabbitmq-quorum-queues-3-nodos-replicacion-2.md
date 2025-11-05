# ADR-0004: Configuración de RabbitMQ con Quorum Queues (3 Nodos, Replicación Factor 2)

## Estado
**Aceptado** - 2025-11-05

## Contexto

El sistema Carpeta Ciudadana utiliza RabbitMQ como message broker central para implementar arquitectura event-driven (ver ADR-0003). Este sistema requiere alta disponibilidad y durabilidad de mensajes debido a:

1. **Escala Nacional**: ~55 millones de ciudadanos colombianos (RNF-06)
2. **Alta Disponibilidad Crítica**: 99.99% de uptime para Core Domain (RNF-01)
3. **Volumen de Transacciones**: Hasta 5 millones de transferencias de documentos al día (RNF-08)
4. **Pérdida de Datos Mínima**: RPO < 5 minutos (RNF-03)
5. **Tolerancia a Fallos**: Sistema resiliente a fallo de una región completa (RNF-04)

### Problema de Queues Clásicas

El enfoque inicial de ADR-0003 propone RabbitMQ con queues clásicas (durable), pero estas presentan limitaciones críticas:

**Limitaciones de Classic Queues:**
- ❌ **Single Point of Failure**: La queue reside en un solo nodo; si ese nodo falla, los mensajes no procesados se pierden hasta que el nodo se recupere
- ❌ **Sin Replicación Automática**: Requiere configuración manual de HA Mirroring (deprecado en RabbitMQ 3.8+)
- ❌ **Consistencia Débil**: Los mirrors pueden estar desincronizados, causando pérdida de mensajes en failover
- ❌ **Overhead de Master-Slave**: El nodo master es un cuello de botella para escrituras

**Impacto en Requisitos No Funcionales:**
- 🔴 **RNF-01 (Disponibilidad 99.99%)**: Queue clásica no tolera fallo de nodo sin pérdida de disponibilidad
- 🔴 **RNF-03 (RPO < 5 minutos)**: Potencial pérdida de mensajes en memoria al momento del fallo
- 🔴 **RNF-04 (Tolerancia a Fallos)**: No es resiliente a fallo de un nodo individual del cluster

### Quorum Queues: La Solución

Las **Quorum Queues** (introducidas en RabbitMQ 3.8+) son un tipo de queue diseñado específicamente para **alta disponibilidad y durabilidad** mediante el algoritmo de consenso **Raft**.

**Características Clave:**
- ✅ **Replicación Automática**: Los mensajes se replican en múltiples nodos del cluster
- ✅ **Consistencia Fuerte**: Usa Raft para garantizar consenso distribuido
- ✅ **Failover Automático**: Si el líder falla, Raft elige automáticamente un nuevo líder de entre los followers
- ✅ **Sin Pérdida de Mensajes**: Los mensajes solo se confirman cuando están persistidos en la mayoría de réplicas
- ✅ **Poison Message Handling**: Mejor manejo de mensajes que fallan repetidamente

**Algoritmo Raft:**
```mermaid
%%{init: {'theme': 'neutral', "flowchart" : { "curve" : "basis" } } }%%
graph TB
    subgraph "RabbitMQ Cluster - Quorum Queue (3 Nodos)"
        Leader["🔵 Nodo 1 (Leader)<br/>Acepta escrituras"]
        Follower1["⚪ Nodo 2 (Follower)<br/>Réplica sincronizada"]
        Follower2["⚪ Nodo 3 (Follower)<br/>Réplica sincronizada"]
    end
    
    Producer[Producer<br/>Spring Boot Service] -->|1. Publish mensaje| Leader
    Leader -->|2. Replica| Follower1
    Leader -->|2. Replica| Follower2
    Follower1 -.->|3. ACK| Leader
    Follower2 -.->|3. ACK| Leader
    Leader -.->|4. Confirm (mayoría alcanzada)| Producer
    
    Consumer[Consumer<br/>Document Deletion Service] -->|5. Consume| Leader
    
    style Leader fill:#4a90e2,stroke:#2e5c8a,color:#fff
    style Follower1 fill:#e8f4f8,stroke:#4a90e2
    style Follower2 fill:#e8f4f8,stroke:#4a90e2
```

### Pregunta de Diseño

**¿Qué configuración de Quorum Queues (número de nodos y replication factor) debemos usar para cumplir con los requisitos de alta disponibilidad, durabilidad y eficiencia del sistema Carpeta Ciudadana?**

## Decisión

Implementaremos **RabbitMQ Quorum Queues con 3 nodos y replication factor de 2** para todas las queues críticas del Core Domain.

### Fundamentos de la Decisión

#### 1. Número de Nodos: 3

**Por qué 3 nodos:**
- ✅ **Consenso Raft**: Raft requiere mayoría (quorum) para tomar decisiones. Con 3 nodos, la mayoría es 2, permitiendo tolerar 1 fallo
- ✅ **Balance Costo-Beneficio**: Mínimo número de nodos para alta disponibilidad real sin overhead excesivo
- ✅ **Tolerancia a Fallo**: Puede perder 1 nodo y seguir operando (2 nodos = mayoría)
- ✅ **Cumple RNF-04**: Sistema resiliente a fallo de un nodo completo

**Fórmula de Tolerancia:**
```
Tolerancia a fallos = ⌊(N - 1) / 2⌋
Donde N = número de nodos

N=3 → Tolerancia = ⌊(3-1)/2⌋ = ⌊2/2⌋ = 1 nodo
N=5 → Tolerancia = ⌊(5-1)/2⌋ = ⌊4/2⌋ = 2 nodos (overhead excesivo para nuestro caso)
```

**Por qué NO más nodos:**
- ⚠️ **Overhead de Consenso**: Más nodos = más mensajes de coordinación Raft = mayor latencia
- ⚠️ **Costo Infraestructura**: 5 nodos = 67% más recursos que 3 nodos
- ⚠️ **Complejidad Operacional**: Más nodos = más superficie de fallo, más mantenimiento

#### 2. Replication Factor: 2

**Por qué replication factor 2:**
- ✅ **Durabilidad Garantizada**: Cada mensaje está persistido en 2 nodos (líder + 1 follower)
- ✅ **Balance Durabilidad-Performance**: Los mensajes se confirman cuando 2 nodos han persistido (mayoría de 3)
- ✅ **Cumple RNF-03**: RPO < 5 minutos; los mensajes no se pierden mientras 2+ nodos estén operativos
- ✅ **Eficiencia de Escritura**: Menor latencia que replication factor 3 (no necesita esperar a todos los nodos)

**Tabla Comparativa:**

| Replication Factor | Nodos Requeridos | Durabilidad | Latencia Escritura | Overhead Almacenamiento | Decisión |
|--------------------|------------------|-------------|-------------------|------------------------|----------|
| 1 (clásica)        | 1 solo nodo      | ❌ Baja     | ⚡ Muy rápida     | 1x (mínimo)            | ❌ Rechazada |
| 2                  | 2 de 3 nodos     | ✅ Alta     | ⚡ Rápida         | 2x                     | ✅ **Seleccionada** |
| 3                  | 3 de 3 nodos     | ✅ Muy Alta | ⚠️ Más lenta      | 3x (máximo)            | ⚠️ Excesiva |

**Análisis de Consenso:**
```
Cluster de 3 nodos con RF=2:
- Líder (Nodo 1): Siempre tiene el mensaje
- Follower activo (Nodo 2): Recibe réplica del líder
- Follower activo (Nodo 3): Recibe réplica del líder

Quorum de escritura = 2 (mayoría de 3)
→ Mensaje se confirma cuando Líder + 1 Follower han persistido
→ Latencia optimizada (no espera al tercer nodo)
→ Durabilidad garantizada (2 copias físicas)
```

### Configuración Técnica

#### Docker Compose para RabbitMQ Cluster

```yaml
version: '3.8'

services:
  # Nodo 1 - RabbitMQ Leader (inicialmente)
  rabbitmq-node1:
    image: rabbitmq:3.12-management
    container_name: carpeta-rabbitmq-node1
    hostname: rabbitmq-node1
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
      - RABBITMQ_NODE_NAME=rabbit@rabbitmq-node1
    volumes:
      - rabbitmq-node1-data:/var/lib/rabbitmq
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # Nodo 2 - RabbitMQ Follower
  rabbitmq-node2:
    image: rabbitmq:3.12-management
    container_name: carpeta-rabbitmq-node2
    hostname: rabbitmq-node2
    ports:
      - "5673:5672"   # AMQP (puerto alternativo para host)
      - "15673:15672" # Management UI (puerto alternativo)
    environment:
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
      - RABBITMQ_NODE_NAME=rabbit@rabbitmq-node2
    volumes:
      - rabbitmq-node2-data:/var/lib/rabbitmq
      - ./rabbitmq/cluster-entrypoint.sh:/usr/local/bin/cluster-entrypoint.sh
    entrypoint: ["/usr/local/bin/cluster-entrypoint.sh"]
    command: ["rabbitmq-server"]
    networks:
      - app-network
    depends_on:
      rabbitmq-node1:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # Nodo 3 - RabbitMQ Follower
  rabbitmq-node3:
    image: rabbitmq:3.12-management
    container_name: carpeta-rabbitmq-node3
    hostname: rabbitmq-node3
    ports:
      - "5674:5672"   # AMQP (puerto alternativo para host)
      - "15674:15672" # Management UI (puerto alternativo)
    environment:
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
      - RABBITMQ_NODE_NAME=rabbit@rabbitmq-node3
    volumes:
      - rabbitmq-node3-data:/var/lib/rabbitmq
      - ./rabbitmq/cluster-entrypoint.sh:/usr/local/bin/cluster-entrypoint.sh
    entrypoint: ["/usr/local/bin/cluster-entrypoint.sh"]
    command: ["rabbitmq-server"]
    networks:
      - app-network
    depends_on:
      rabbitmq-node1:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

volumes:
  rabbitmq-node1-data:
  rabbitmq-node2-data:
  rabbitmq-node3-data:

networks:
  app-network:
    driver: bridge
```

#### Script de Clustering (`cluster-entrypoint.sh`)

```bash
#!/bin/bash
set -e

# Iniciar RabbitMQ en background
rabbitmq-server -detached

# Esperar a que RabbitMQ esté listo
rabbitmq-diagnostics -q ping
rabbitmq-diagnostics -q check_port_connectivity

# Unirse al cluster del nodo 1
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster rabbit@rabbitmq-node1
rabbitmqctl start_app

# Esperar indefinidamente (mantener contenedor vivo)
tail -f /dev/null
```

#### Configuración de Quorum Queues en Spring Boot

```java
@Configuration
public class RabbitMQQuorumConfig {

    public static final String EXCHANGE_NAME = "documento.events";

    // Queues con Quorum habilitado
    public static final String DELETION_QUEUE = "documento.deletion.queue";
    public static final String MINIO_CLEANUP_QUEUE = "minio.cleanup.queue";
    public static final String METADATA_CLEANUP_QUEUE = "metadata.cleanup.queue";

    @Bean
    public TopicExchange documentoExchange() {
        return ExchangeBuilder
            .topicExchange(EXCHANGE_NAME)
            .durable(true)
            .build();
    }

    /**
     * Quorum Queue para solicitudes de eliminación.
     * - x-queue-type=quorum: Activa Quorum Queue (Raft consensus)
     * - x-quorum-initial-group-size=3: Cluster de 3 nodos
     * - x-delivery-limit=3: Después de 3 reintentos, mover a DLQ
     */
    @Bean
    public Queue deletionQueue() {
        return QueueBuilder
            .durable(DELETION_QUEUE)
            .withArgument("x-queue-type", "quorum")  // 🔑 Quorum Queue
            .withArgument("x-quorum-initial-group-size", 3)  // 🔑 3 nodos
            .withArgument("x-delivery-limit", 3)
            .withArgument("x-dead-letter-exchange", EXCHANGE_NAME)
            .withArgument("x-dead-letter-routing-key", "documento.deletion.dlq")
            .withArgument("x-message-ttl", 3600000) // 1 hora
            .build();
    }

    @Bean
    public Queue minioCleanupQueue() {
        return QueueBuilder
            .durable(MINIO_CLEANUP_QUEUE)
            .withArgument("x-queue-type", "quorum")
            .withArgument("x-quorum-initial-group-size", 3)
            .withArgument("x-delivery-limit", 3)
            .withArgument("x-dead-letter-exchange", EXCHANGE_NAME)
            .withArgument("x-dead-letter-routing-key", "minio.cleanup.dlq")
            .build();
    }

    @Bean
    public Queue metadataCleanupQueue() {
        return QueueBuilder
            .durable(METADATA_CLEANUP_QUEUE)
            .withArgument("x-queue-type", "quorum")
            .withArgument("x-quorum-initial-group-size", 3)
            .withArgument("x-delivery-limit", 3)
            .withArgument("x-dead-letter-exchange", EXCHANGE_NAME)
            .withArgument("x-dead-letter-routing-key", "metadata.cleanup.dlq")
            .build();
    }

    /**
     * Dead Letter Queue (NO necesita ser Quorum)
     * Los mensajes fallidos se almacenan aquí para revisión manual.
     */
    @Bean
    public Queue deletionDLQ() {
        return QueueBuilder.durable("documento.deletion.dlq").build();
    }

    // Bindings (idénticos a ADR-0003)
    @Bean
    public Binding deletionBinding() {
        return BindingBuilder
            .bind(deletionQueue())
            .to(documentoExchange())
            .with("documento.deletion.requested");
    }
}
```

#### Configuración de Connection Factory con Load Balancing

```java
@Configuration
public class RabbitMQConnectionConfig {

    @Value("${spring.rabbitmq.addresses}")
    private String addresses;  // "rabbitmq-node1:5672,rabbitmq-node2:5672,rabbitmq-node3:5672"

    @Value("${spring.rabbitmq.username}")
    private String username;

    @Value("${spring.rabbitmq.password}")
    private String password;

    @Bean
    public ConnectionFactory connectionFactory() {
        CachingConnectionFactory factory = new CachingConnectionFactory();
        
        // Configurar múltiples addresses para failover automático
        factory.setAddresses(addresses);
        factory.setUsername(username);
        factory.setPassword(password);
        
        // Publisher Confirms para garantizar entrega
        factory.setPublisherConfirmType(ConfirmType.CORRELATED);
        factory.setPublisherReturns(true);
        
        // Connection recovery automático
        factory.setAutomaticRecoveryEnabled(true);
        factory.setNetworkRecoveryInterval(5000);  // 5 segundos
        
        return factory;
    }
}
```

#### application-docker.yml

```yaml
spring:
  rabbitmq:
    # Lista de nodos separados por coma (failover automático)
    addresses: rabbitmq-node1:5672,rabbitmq-node2:5672,rabbitmq-node3:5672
    username: admin
    password: admin123
    
    # Publisher Confirms (garantiza que RabbitMQ recibió el mensaje)
    publisher-confirm-type: correlated
    publisher-returns: true
    
    # Template configuration
    template:
      mandatory: true  # Lanza excepción si mensaje no puede enrutarse
      
    # Listener configuration
    listener:
      simple:
        acknowledge-mode: manual  # ACK manual para control fino
        prefetch: 10  # Procesar max 10 mensajes concurrentemente
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000ms
          multiplier: 2.0
          max-interval: 10000ms
```

## Consecuencias

### Positivas

- ✅ **RNF-01 (Disponibilidad 99.99%)**: Cluster puede perder 1 nodo sin interrupción de servicio
- ✅ **RNF-03 (RPO < 5 minutos)**: Mensajes replicados en 2 nodos; sin pérdida en fallo de 1 nodo
- ✅ **RNF-04 (Tolerancia a Fallos)**: Sistema resiliente a fallo de un nodo completo del cluster
- ✅ **RNF-09 (Escalado Horizontal)**: Puede agregar más consumers para aumentar throughput
- ✅ **Consistencia Fuerte**: Raft garantiza que todos los nodos tienen la misma vista de los mensajes
- ✅ **Failover Automático**: Elección de nuevo líder en <5 segundos sin intervención manual
- ✅ **Poison Message Handling**: Quorum queues rastrean delivery counts a nivel de cluster (no se resetea en failover)
- ✅ **Simplicidad Operacional**: No requiere configuración de HA Mirroring (deprecado)

### Negativas

- ⚠️ **Overhead de Replicación**: ~20-30% más latencia vs classic queue (consenso Raft)
- ⚠️ **Consumo de Disco**: 2x almacenamiento (replication factor 2)
- ⚠️ **Consumo de Memoria**: Más RAM requerida para mantener Raft log en cada nodo
- ⚠️ **Complejidad de Cluster**: 3 nodos requieren más recursos y coordinación que 1 nodo
- ⚠️ **Incompatibilidad con Features Antiguas**: No soporta priority queues ni message TTL a nivel individual

### Riesgos

- 🔴 **Split Brain**: Si la red se particiona, podría haber 2 sub-clusters
    - **Mitigación**: Raft previene split brain; solo el cluster con mayoría (2+ nodos) puede aceptar escrituras

- 🔴 **Pérdida de 2+ Nodos Simultáneos**: Si fallan 2 o más nodos, el cluster se vuelve read-only
    - **Mitigación**: Monitoreo proactivo con alertas, backups automáticos de queues

- 🔴 **Performance Degradation con Nodos Lentos**: Un nodo lento puede afectar consenso
    - **Mitigación**: Monitorear latencia de replicación, usar hardware homogéneo

- 🔴 **Disco Lleno en un Nodo**: RabbitMQ bloquea publishers si un nodo no tiene espacio
    - **Mitigación**: Alertas de uso de disco > 80%, configurar disk free limit

## Alternativas Consideradas

### Opción 1: Classic Queues con HA Mirroring (Deprecado)
- **Rechazo**: Deprecado en RabbitMQ 3.8+, menor consistencia, más complejo de configurar

### Opción 2: Quorum Queues con 5 Nodos y RF=3
- **Rechazo**: Overhead excesivo de consenso Raft, mayor costo de infraestructura, latencia más alta

### Opción 3: Streams de RabbitMQ
- **Rechazo**: Diseñados para persistencia a largo plazo (log-based), no para queues de trabajo con ACK

### Opción 4: Migrar a Apache Kafka
- **Rechazo**: Overkill para este caso de uso; RabbitMQ Quorum Queues son suficientes y más simples

## Métricas y Monitoreo

### Métricas Clave de Cluster

```java
@Component
public class RabbitMQClusterMetrics {

    private final MeterRegistry meterRegistry;
    private final RestTemplate restTemplate;

    @Scheduled(fixedDelay = 60000)  // Cada 1 minuto
    public void captureClusterMetrics() {
        // Nodos activos en el cluster
        meterRegistry.gauge("rabbitmq.cluster.nodes.active", getActiveNodesCount());
        
        // Estado de quorum por queue
        meterRegistry.gauge("rabbitmq.quorum.members.online", 
            () -> getQuorumMembersOnline("documento.deletion.queue"));
        
        // Mensajes no confirmados (unacked)
        meterRegistry.gauge("rabbitmq.queue.messages.unacked",
            () -> getUnackedMessages("documento.deletion.queue"));
    }
}
```

### Alertas Críticas

1. **Cluster con <3 nodos activos**: Indica pérdida de un nodo
2. **Quorum Queue con <2 members online**: Sin replicación, riesgo de pérdida de datos
3. **Raft election timeout**: Indica problemas de red o latencia entre nodos
4. **Disk usage >85% en cualquier nodo**: Riesgo de bloqueo de publishers

## Validación y Testing

### Test de Failover

```bash
# 1. Publicar 1000 mensajes
for i in {1..1000}; do
  curl -u admin:admin123 -X POST http://localhost:15672/api/exchanges/%2F/documento.events/publish \
    -H "Content-Type: application/json" \
    -d '{"routing_key":"documento.deletion.requested","payload":"test message '$i'"}'
done

# 2. Detener nodo líder
docker stop carpeta-rabbitmq-node1

# 3. Verificar elección de nuevo líder (<5 segundos)
docker exec carpeta-rabbitmq-node2 rabbitmqctl cluster_status

# 4. Verificar que NO se perdieron mensajes
# (Los consumers deben poder seguir consumiendo)
```

### Test de Recuperación

```bash
# 1. Detener nodo
docker stop carpeta-rabbitmq-node2

# 2. Esperar 30 segundos
sleep 30

# 3. Reiniciar nodo
docker start carpeta-rabbitmq-node2

# 4. Verificar re-sincronización automática
docker exec carpeta-rabbitmq-node2 rabbitmqctl list_queues name type state
```

## Implementación Faseada

### Fase 1: Configuración de Cluster (Semana 1)
- [x] Actualizar docker-compose.yml con 3 nodos
- [x] Crear script de clustering (`cluster-entrypoint.sh`)
- [x] Validar formación de cluster con `rabbitmqctl cluster_status`

### Fase 2: Migración a Quorum Queues (Semana 2)
- [ ] Actualizar RabbitMQConfig con `x-queue-type=quorum`
- [ ] Actualizar ConnectionFactory con múltiples addresses
- [ ] Testing de failover automático

### Fase 3: Monitoreo y Observabilidad (Semana 3)
- [ ] Implementar métricas de cluster
- [ ] Configurar alertas para nodos down
- [ ] Dashboard Grafana con métricas de Raft

### Fase 4: Producción (Semana 4)
- [ ] Load testing con 10K mensajes/segundo
- [ ] Chaos engineering (kill nodos aleatoriamente)
- [ ] Documentación operacional completa

## Referencias

- [RabbitMQ Quorum Queues](https://www.rabbitmq.com/quorum-queues.html)
- [Raft Consensus Algorithm](https://raft.github.io/)
- [RabbitMQ Clustering Guide](https://www.rabbitmq.com/clustering.html)
- [Spring AMQP - Quorum Queues](https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html)
- ADR-0003: Eliminación de Documentos con Arquitectura Event-Driven usando RabbitMQ
- RNF-01, RNF-03, RNF-04, RNF-06, RNF-08, RNF-09: Requisitos no funcionales

## Notas Adicionales

1. **Erlang Cookie**: Usar el mismo cookie (`RABBITMQ_ERLANG_COOKIE`) en todos los nodos para permitir clustering
2. **Hostnames Estables**: Los nodos deben tener hostnames DNS resolvibles para clustering
3. **Network Latency**: Quorum queues son sensibles a latencia de red; mantener nodos en la misma región
4. **Backup Strategy**: Considerar snapshots periódicos de `/var/lib/rabbitmq` para disaster recovery
5. **Upgrade Path**: Actualizar RabbitMQ nodo por nodo para mantener disponibilidad durante upgrades

---

**Fecha**: 2025-11-05  
**Autores**: Equipo Carpeta Ciudadana  
**Revisores**: Pendiente
