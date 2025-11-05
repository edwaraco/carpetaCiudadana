# ADR-0005: Ubicación de Infraestructura RabbitMQ con Arquitectura Escalable en Docker Compose

## Estado
**Aceptado** - 2025-11-05

## Contexto

El sistema Carpeta Ciudadana requiere RabbitMQ como message broker central con arquitectura Leader-Followers escalable (ADR-0004) para soportar desde 3 hasta 50+ nodos según la carga del sistema.

### Pregunta de Diseño

**¿Dónde debemos definir y desplegar la infraestructura escalable de RabbitMQ (1 Leader + N Followers): en el Docker Compose existente de desarrollo local o en un setup separado de infraestructura?**

### Opciones Identificadas

#### Opción A: Docker Compose de Desarrollo (`infrastructure/docker/docker-compose.yml`)
- Incluir RabbitMQ Leader + Followers escalables en el mismo docker-compose.yml
- Permite `docker compose up --scale rabbitmq-follower=N` para escalar
- Simplifica el desarrollo local

#### Opción B: Infraestructura Separada
- Crear `infrastructure/docker/docker-compose-rabbitmq.yml` dedicado
- Separar la infraestructura de mensajería del resto
- Requiere 2 comandos para iniciar el ambiente

#### Opción C: Kubernetes desde el Inicio
- Desplegar RabbitMQ directamente en Kubernetes usando StatefulSet o Operator
- Requiere cluster Kubernetes local (minikube, kind, k3s)
- Mayor complejidad para desarrollo inicial

### Contexto del Proyecto

**Naturaleza Académica:**
- Proyecto para curso de Arquitectura Avanzada (EAFIT Universidad)
- Enfoque en diseño arquitectónico y patrones escalables
- Equipo de 3-4 desarrolladores con experiencia variada
- Timeline: 1 semestre académico

**Estado Actual de Infraestructura:**
```
infrastructure/docker/docker-compose.yml
- MinIO (almacenamiento de documentos)
- DynamoDB Local (base de datos)
- DynamoDB Admin (interfaz web)
- Carpeta Ciudadana Service (microservicio Spring Boot)
```

**Requisitos de Desarrollo:**
1. Setup rápido con escalabilidad desde el inicio
2. Capacidad de probar con 3, 5, 10, o 50 nodos
3. Desarrollo local sin requerir conexión a internet
4. Reproducibilidad: mismo entorno para todos
5. Facilidad de testing de escalabilidad

**Requisitos de Producción (Futuros):**
1. Despliegue en Kubernetes para escalabilidad real
2. Auto-scaling basado en métricas (CPU, memoria, queue depth)
3. Alta disponibilidad multi-datacenter
4. Separación de ambientes (dev, staging, production)

### Análisis de Trade-offs

| Criterio | Docker Compose Unificado | Infraestructura Separada | Kubernetes Directo |
|----------|--------------------------|--------------------------|---------------------|
| **Simplicidad Setup** | ✅ Un comando + scale | ⚠️ Dos comandos | ❌ Complejo (K8s) |
| **Escalabilidad Local** | ✅ `--scale follower=N` | ✅ `--scale follower=N` | ✅ StatefulSet |
| **Velocidad Inicial** | ✅ ~2 minutos | ⚠️ ~5 minutos | ❌ ~15 minutos |
| **Developer Experience** | ✅ Excelente | ⚠️ Buena | ⚠️ Requiere K8s knowledge |
| **Testing Escalabilidad** | ✅ Fácil (scale up/down) | ✅ Fácil | ✅ Fácil |
| **Producción-like** | ⚠️ Limitado | ⚠️ Limitado | ✅ Idéntico a prod |
| **Costo Recursos** | ⚠️ Alto con 10+ nodos | ⚠️ Alto | ✅ Más eficiente |
| **Alineación RNF-09** | ✅ Escalable sin límite | ✅ Escalable | ✅ Escalable |

## Decisión

Incluiremos el **cluster RabbitMQ escalable (Leader + Followers)** en el Docker Compose unificado de desarrollo local (`infrastructure/docker/docker-compose.yml`).

### Fundamentos de la Decisión

#### 1. Prioridad en Developer Experience + Scalability Testing

**Justificación:**
- Un solo comando inicia toda la infraestructura: `docker compose up -d`
- Escalar es trivial: `docker compose up -d --scale rabbitmq-follower=10`
- Los desarrolladores pueden probar escalabilidad sin configuración adicional
- Facilita validar que el sistema funciona con 3, 5, 10, 50 nodos

**Impacto en Requisitos:**
- ✅ **RNF-09 (Escalado Horizontal)**: Developers pueden probar escalabilidad localmente
- ✅ **RNF-21 (MTTR < 4 horas)**: Setup rápido facilita fixes rápidos
- ✅ **RNF-22 (Cobertura 85%)**: Ambiente completo para integration tests

#### 2. Coherencia con Infraestructura Existente

El proyecto ya usa Docker Compose para toda la infraestructura de desarrollo:
- MinIO (almacenamiento)
- DynamoDB Local (base de datos)
- DynamoDB Admin (herramientas)
- Carpeta Ciudadana Service (aplicación)

**Agregar RabbitMQ al mismo archivo mantiene coherencia y simplicidad.**

#### 3. Facilita Testing de Escalabilidad

```yaml
# Test de integración puede probar diferentes tamaños de cluster
@Testcontainers
@SpringBootTest
public class RabbitMQScalabilityTest {
    
    @Container
    static DockerComposeContainer<?> environment =
        new DockerComposeContainer<>(new File("../../infrastructure/docker/docker-compose.yml"))
            .withScaledService("rabbitmq-follower", 10)  // 10 followers
            .withExposedService("rabbitmq-leader", 5672);
    
    @Test
    public void testClusterWith10Nodes() {
        // Test que cluster funciona con 10 nodos
    }
}
```

#### 4. Path to Production Claro

Aunque usaremos Docker Compose para desarrollo, mantendremos **manifiestos Kubernetes separados** para producción:

```
infrastructure/
├── docker/
│   ├── docker-compose.yml          # ✅ Desarrollo local (ESCALABLE)
│   └── rabbitmq/
│       └── cluster-entrypoint.sh   # Script de clustering
├── kubernetes/
│   ├── rabbitmq/
│   │   ├── statefulset.yaml        # 🚀 Producción (K8s StatefulSet)
│   │   └── rabbitmq-cluster.yaml   # RabbitMQ Cluster Operator
│   ├── dynamodb/
│   └── minio/
└── README.md
```

**Strategy de Migración:**
- **Fase 1 (Actual)**: Desarrollo en Docker Compose con escalabilidad
- **Fase 2 (Futuro)**: Producción en Kubernetes con StatefulSet
- **Fase 3 (Opcional)**: Managed RabbitMQ (AWS MQ, CloudAMQP) con auto-scaling

### Configuración Adoptada

#### Docker Compose Unificado y Escalable

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.8'

services:
  # ... otros servicios (MinIO, DynamoDB, etc.) ...

  # ==========================================
  # RabbitMQ Leader - Nodo principal del cluster
  # ==========================================
  rabbitmq-leader:
    image: rabbitmq:3.12-management
    container_name: rabbitmq-leader
    hostname: rabbitmq-leader
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
      - RABBITMQ_NODE_NAME=rabbit@rabbitmq-leader
    volumes:
      - rabbitmq-leader-data:/var/lib/rabbitmq
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s

  # ==========================================
  # RabbitMQ Followers - Nodos escalables (1 → N)
  # ==========================================
  rabbitmq-follower:
    image: rabbitmq:3.12-management
    hostname: rabbitmq-follower
    environment:
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
      - RABBITMQ_LEADER_HOST=rabbitmq-leader
    volumes:
      - ./rabbitmq/cluster-entrypoint.sh:/usr/local/bin/cluster-entrypoint.sh:ro
    entrypoint: ["/usr/local/bin/cluster-entrypoint.sh"]
    networks:
      - app-network
    depends_on:
      rabbitmq-leader:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      replicas: 4  # Default: 4 followers (escalable con --scale)

  # Carpeta Ciudadana Service conecta al Leader
  carpeta-ciudadana-service:
    # ...
    environment:
      - SPRING_RABBITMQ_HOST=rabbitmq-leader
      - SPRING_RABBITMQ_PORT=5672
      - SPRING_RABBITMQ_USERNAME=admin
      - SPRING_RABBITMQ_PASSWORD=admin123
    depends_on:
      rabbitmq-leader:
        condition: service_healthy

volumes:
  minio-data:
  dynamodata:
  rabbitmq-leader-data:  # Solo Leader tiene volume nombrado

networks:
  app-network:
    driver: bridge
```

### Instrucciones de Uso

#### Iniciar Infraestructura con Configuración Default

```bash
# Desde la raíz del proyecto
cd infrastructure/docker

# Iniciar con configuración default (1 Leader + 4 Followers = 5 nodos)
docker compose up -d

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs solo de RabbitMQ
docker compose logs -f rabbitmq-leader rabbitmq-follower
```

#### Escalar el Cluster Dinámicamente

```bash
# Escalar a 3 nodos (1 Leader + 2 Followers) - ambiente de desarrollo
docker compose up -d --scale rabbitmq-follower=2

# Escalar a 10 nodos (1 Leader + 9 Followers) - testing
docker compose up -d --scale rabbitmq-follower=9

# Escalar a 50 nodos (1 Leader + 49 Followers) - stress testing
docker compose up -d --scale rabbitmq-follower=49

# Reducir a 5 nodos
docker compose up -d --scale rabbitmq-follower=4
```

#### Verificar Cluster Escalado

```bash
# Verificar número de nodos en el cluster
docker exec rabbitmq-leader rabbitmqctl cluster_status

# Listar todos los contenedores RabbitMQ activos
docker compose ps | grep rabbitmq

# Verificar salud de todos los nodos
docker compose ps rabbitmq-leader rabbitmq-follower
```

#### Acceder a Management UI

- **Leader**: http://localhost:15672
- **Usuario**: admin
- **Contraseña**: admin123

En la UI, verifica en **Admin → Cluster** el número dinámico de nodos.

#### Detener Infraestructura

```bash
# Detener todos los servicios (preserva datos)
docker compose down

# Detener Y eliminar volúmenes (⚠️ data loss!)
docker compose down -v
```

## Consecuencias

### Positivas

- ✅ **Setup Simplificado**: Un comando inicia toda la infraestructura
- ✅ **Escalabilidad Inmediata**: `--scale follower=N` sin editar configs
- ✅ **Testing de Escalabilidad**: Probar con 3, 10, 50 nodos localmente
- ✅ **Coherencia Arquitectónica**: Todo en un solo docker-compose.yml
- ✅ **Onboarding Rápido**: Nuevos developers productivos en <15 minutos
- ✅ **Debugging Simplificado**: Docker logs + Docker Desktop UI
- ✅ **RNF-09 Compliance**: Escalado horizontal sin límite teórico

### Negativas

- ⚠️ **Consumo de Recursos**: 10+ nodos RabbitMQ pueden requerir 16GB+ RAM
    - **Mitigación**: 
        - Documentar requisitos: 8GB RAM para 5 nodos, 16GB para 10+
        - Escalar solo cuando sea necesario testar escalabilidad
        - Perfil "light" con 2 followers para desarrollo de features no-HA

- ⚠️ **No es Idéntico a Producción**: Docker Compose != Kubernetes
    - **Mitigación**: 
        - Mantener manifiestos K8s actualizados en paralelo
        - CI/CD tests en ambiente staging con K8s real
        - Documentar diferencias explícitamente

- ⚠️ **Limitaciones de Networking**: Followers no exponen puertos individuales
    - **Aceptable**: Solo Leader necesita puerto expuesto para conexiones externas
    - **Workaround**: Para debugging, usar `docker exec` en cada follower

### Riesgos

- 🔴 **Divergencia Desarrollo-Producción**: Configuraciones pueden diferir
    - **Mitigación**: 
        - Usar variables de entorno consistentes
        - CI/CD pipeline valida configuraciones
        - Scripts de migración documentados

- 🔴 **Overhead de Mantenimiento**: Mantener 2 configuraciones (Docker Compose + K8s)
    - **Mitigación**: 
        - Automatizar con Kompose: `kompose convert -f docker-compose.yml`
        - Considerar Helm charts para K8s deployment
        - Tilt.dev para desarrollo local con K8s

## Alternativas Rechazadas

### Por qué NO Infraestructura Separada

```
infrastructure/
├── docker/
│   ├── docker-compose-base.yml       # MinIO + DynamoDB
│   └── docker-compose-rabbitmq.yml   # RabbitMQ Cluster
```

**Razones del Rechazo:**
- Requiere 2 comandos: `docker compose -f base.yml up` + `docker compose -f rabbitmq.yml up`
- Mayor fricción: más pasos = más errores
- RabbitMQ es dependencia core; no hay beneficio de separarlo
- Testing de integración más complejo (2 compose files)

### Por qué NO Kubernetes Directo

**Razones del Rechazo:**
- Steeper learning curve para developers sin experiencia K8s
- Requiere cluster local: minikube/kind = más recursos + complejidad
- Overkill para desarrollo inicial
- Debugging más complejo: `kubectl logs`, `kubectl exec`

**Cuándo Considerar:**
- Para ambientes staging/pre-production (simulan producción)
- Cuando equipo tenga >6 meses experiencia con K8s
- Cuando features específicas de K8s sean necesarias (Operators, auto-scaling)

## Migración Futura a Kubernetes

### Opción 1: StatefulSet Manual

```yaml
# infrastructure/kubernetes/rabbitmq/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
spec:
  serviceName: rabbitmq
  replicas: 5  # Escalable: kubectl scale statefulset rabbitmq --replicas=10
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3.12-management
        env:
        - name: RABBITMQ_ERLANG_COOKIE
          value: SWQOKODSQALRPCLNMEQG
```

### Opción 2: RabbitMQ Cluster Operator (Recomendado)

```yaml
# infrastructure/kubernetes/rabbitmq/rabbitmq-cluster.yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: carpeta-rabbitmq
spec:
  replicas: 5
  rabbitmq:
    additionalConfig: |
      cluster_formation.peer_discovery_backend = rabbit_peer_discovery_k8s
  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
  persistence:
    storage: 20Gi
  
  # Auto-scaling basado en queue depth
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 50
    targetQueueDepth: 1000
```

### Opción 3: Managed RabbitMQ (Cloud)

- **AWS Amazon MQ**: Managed RabbitMQ en AWS con auto-scaling
- **CloudAMQP**: RabbitMQ as a Service con planes escalables
- **Google Cloud Pub/Sub**: Alternativa managed (no RabbitMQ pero compatible)

## Testing de Escalabilidad

### Test Suite para Diferentes Tamaños de Cluster

```java
@SpringBootTest
public class RabbitMQScalabilityTests {

    @Test
    public void testCluster3Nodes() {
        // docker compose up -d --scale rabbitmq-follower=2
        // Verificar funcionalidad básica con 3 nodos
    }

    @Test
    public void testCluster10Nodes() {
        // docker compose up -d --scale rabbitmq-follower=9
        // Verificar balanceo de carga con 10 nodos
    }

    @Test
    public void testCluster50Nodes() {
        // docker compose up -d --scale rabbitmq-follower=49
        // Stress test: 10K msg/s en cluster de 50 nodos
    }
}
```

## Referencias

- [Docker Compose Scale](https://docs.docker.com/compose/compose-file/deploy/#replicas)
- [Docker Compose Production Best Practices](https://docs.docker.com/compose/production/)
- [Testcontainers](https://www.testcontainers.org/)
- [RabbitMQ Cluster Operator](https://github.com/rabbitmq/cluster-operator)
- [Kompose: Kubernetes + Compose](https://kompose.io/)
- [Helm Charts for RabbitMQ](https://github.com/bitnami/charts/tree/main/bitnami/rabbitmq)
- ADR-0003: Eliminación de Documentos Event-Driven
- ADR-0004: RabbitMQ Quorum Queues con Arquitectura Leader-Followers
- RNF-09, RNF-21, RNF-22: Requisitos no funcionales

---

**Fecha**: 2025-11-05  
**Autores**: Equipo Carpeta Ciudadana  
**Revisores**: Pendiente
