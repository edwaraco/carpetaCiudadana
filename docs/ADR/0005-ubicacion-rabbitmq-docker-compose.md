# ADR-0005: Ubicación de Infraestructura RabbitMQ en Docker Compose

## Estado
**Aceptado** - 2025-11-05

## Contexto

El sistema Carpeta Ciudadana requiere RabbitMQ como message broker central para implementar arquitectura event-driven (ADR-0003) con Quorum Queues para alta disponibilidad (ADR-0004). 

### Pregunta de Diseño

**¿Dónde debemos definir y desplegar la infraestructura de RabbitMQ (cluster de 3 nodos): en el Docker Compose existente de desarrollo local o en un setup separado de infraestructura?**

### Opciones Identificadas

#### Opción A: Docker Compose de Desarrollo (`infrastructure/docker/docker-compose.yml`)
- Incluir RabbitMQ cluster (3 nodos) en el mismo docker-compose.yml que ya contiene MinIO, DynamoDB Local y el microservicio
- Permite iniciar toda la infraestructura con un solo comando: `docker-compose up`
- Simplifica el desarrollo local

#### Opción B: Infraestructura Separada
- Crear un nuevo docker-compose dedicado (`infrastructure/docker/docker-compose-rabbitmq.yml`)
- Crear scripts de inicialización y configuración separados
- Separar la infraestructura de mensajería del resto de servicios

#### Opción C: Kubernetes desde el Inicio
- Desplegar RabbitMQ directamente en Kubernetes usando el RabbitMQ Cluster Operator
- Requiere cluster Kubernetes local (minikube, kind, k3s)
- Mayor complejidad para desarrollo inicial

### Contexto del Proyecto

**Naturaleza Académica:**
- Proyecto para curso de Arquitectura Avanzada (EAFIT Universidad)
- Enfoque en diseño arquitectónico y patrones
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
1. Setup rápido para nuevos desarrolladores (<15 minutos)
2. Desarrollo local sin requerir conexión a internet
3. Reproducibilidad: mismo entorno para todos los desarrolladores
4. Facilidad de debugging y troubleshooting

**Requisitos de Producción (Futuros):**
1. Despliegue en Kubernetes para escalabilidad (RNF-09)
2. Alta disponibilidad real (RNF-01: 99.99%)
3. Separación de ambientes (dev, staging, production)

### Análisis de Trade-offs

| Criterio | Docker Compose Unificado | Infraestructura Separada | Kubernetes Directo |
|----------|--------------------------|--------------------------|---------------------|
| **Simplicidad Setup** | ✅ Muy simple (1 comando) | ⚠️ Requiere 2 comandos | ❌ Complejo (cluster K8s) |
| **Velocidad Inicial** | ✅ ~2 minutos | ⚠️ ~5 minutos | ❌ ~10-15 minutos |
| **Developer Experience** | ✅ Excelente | ⚠️ Buena | ⚠️ Requiere aprendizaje |
| **Facilidad de Debug** | ✅ Docker logs simples | ✅ Docker logs simples | ⚠️ kubectl logs |
| **Producción-like** | ⚠️ Limitado | ⚠️ Limitado | ✅ Idéntico a prod |
| **Escalabilidad Local** | ⚠️ Limitada (3 nodos max) | ⚠️ Limitada | ✅ Ilimitada |
| **Costo Recursos** | ⚠️ Alto (múltiples servicios) | ⚠️ Alto | ✅ Más eficiente |
| **Alineación a RNF-21** | ✅ MTTR bajo | ⚠️ MTTR medio | ⚠️ MTTR medio |

## Decisión

Incluiremos el **cluster RabbitMQ de 3 nodos en el Docker Compose unificado** de desarrollo local (`infrastructure/docker/docker-compose.yml`).

### Fundamentos de la Decisión

#### 1. Prioridad en Developer Experience

**Justificación:**
- En la fase actual del proyecto (diseño e implementación inicial), la velocidad de desarrollo es crítica
- Reducir fricción en setup permite al equipo enfocarse en arquitectura y código, no en infraestructura
- Un solo comando (`docker-compose up`) inicia TODA la infraestructura necesaria

**Impacto en Requisitos:**
- ✅ **RNF-21 (MTTR < 4 horas)**: Setup rápido facilita correcciones rápidas; un desarrollador puede recrear el ambiente completo en minutos
- ✅ **RNF-22 (Cobertura 85%)**: Ambiente de testing local completo facilita escribir y ejecutar tests

#### 2. Coherencia con Infraestructura Existente

El proyecto ya usa Docker Compose para:
- MinIO (almacenamiento)
- DynamoDB Local (base de datos)
- DynamoDB Admin (herramientas)
- Carpeta Ciudadana Service (aplicación)

**Agregar RabbitMQ al mismo archivo mantiene coherencia y simplicidad.**

#### 3. Facilita Integration Testing

```yaml
# Test de integración puede iniciar TODO con Testcontainers
@Testcontainers
@SpringBootTest
public class DocumentDeletionIntegrationTest {
    
    @Container
    static DockerComposeContainer<?> environment =
        new DockerComposeContainer<>(new File("../../infrastructure/docker/docker-compose.yml"))
            .withExposedService("rabbitmq-node1", 5672)
            .withExposedService("dynamodb-local", 8000)
            .withExposedService("minio", 9000);
    
    // Tests pueden usar RabbitMQ, DynamoDB y MinIO reales
}
```

#### 4. Path to Production Claro

Aunque usaremos Docker Compose para desarrollo, mantendremos **manifiestos Kubernetes separados** para producción:

```
infrastructure/
├── docker/
│   ├── docker-compose.yml          # ✅ Desarrollo local (TODO en uno)
│   └── rabbitmq/
│       └── cluster-entrypoint.sh   # Script de clustering
├── kubernetes/
│   ├── rabbitmq/
│   │   ├── cluster-operator.yaml   # 🚀 Producción (K8s Operator)
│   │   └── rabbitmq-cluster.yaml
│   ├── dynamodb/
│   └── minio/
└── README.md
```

**Strategy de Migración:**
- **Fase 1 (Actual)**: Desarrollo en Docker Compose
- **Fase 2 (Futuro)**: Producción en Kubernetes con RabbitMQ Cluster Operator
- **Fase 3 (Opcional)**: Managed RabbitMQ (AWS MQ, CloudAMQP)

### Configuración Adoptada

#### Docker Compose Unificado

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.8'

services:
  # ==========================================
  # Almacenamiento - MinIO
  # ==========================================
  minio:
    image: minio/minio:latest
    container_name: documents-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=admin123
    command: server /data --address ":9000" --console-address ":9001"
    volumes:
      - minio-data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # ==========================================
  # Base de Datos - DynamoDB Local
  # ==========================================
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb"
    networks:
      - app-network
    volumes:
      - dynamodata:/home/dynamodblocal
    healthcheck:
      test: ["CMD", "curl", "http://localhost:8000/shell/"]
      interval: 10s
      timeout: 5s
      retries: 5

  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://dynamodb-local:8000
    networks:
      - app-network
    depends_on:
      - dynamodb-local

  # ==========================================
  # Message Broker - RabbitMQ Cluster (3 nodos)
  # ==========================================
  
  # Nodo 1 - Líder inicial
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

  # Nodo 2 - Follower
  rabbitmq-node2:
    image: rabbitmq:3.12-management
    container_name: carpeta-rabbitmq-node2
    hostname: rabbitmq-node2
    ports:
      - "5673:5672"
      - "15673:15672"
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

  # Nodo 3 - Follower
  rabbitmq-node3:
    image: rabbitmq:3.12-management
    container_name: carpeta-rabbitmq-node3
    hostname: rabbitmq-node3
    ports:
      - "5674:5672"
      - "15674:15672"
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

  # ==========================================
  # Microservicio - Carpeta Ciudadana Service
  # ==========================================
  carpeta-ciudadana-service:
    build:
      context: ../../services/carpeta-ciudadana-service
      dockerfile: Dockerfile
    container_name: carpeta-ciudadana-service
    ports:
      - "8080:8080"
    environment:
      # DynamoDB
      - AWS_DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=dummy
      - AWS_SECRET_ACCESS_KEY=dummy
      # MinIO
      - MINIO_ENDPOINT=http://minio:9000
      - MINIO_ACCESS_KEY=admin
      - MINIO_SECRET_KEY=admin123
      - MINIO_BUCKET_NAME=carpeta-ciudadana-docs
      # RabbitMQ (lista de nodos para failover)
      - SPRING_RABBITMQ_ADDRESSES=rabbitmq-node1:5672,rabbitmq-node2:5672,rabbitmq-node3:5672
      - SPRING_RABBITMQ_USERNAME=admin
      - SPRING_RABBITMQ_PASSWORD=admin123
    depends_on:
      minio:
        condition: service_healthy
      dynamodb-local:
        condition: service_healthy
      rabbitmq-node1:
        condition: service_healthy
      rabbitmq-node2:
        condition: service_healthy
      rabbitmq-node3:
        condition: service_healthy
    networks:
      - app-network

volumes:
  minio-data:
  dynamodata:
  rabbitmq-node1-data:
  rabbitmq-node2-data:
  rabbitmq-node3-data:

networks:
  app-network:
    driver: bridge
    name: carpeta-ciudadana-network
```

### Instrucciones de Uso

#### Iniciar Infraestructura Completa

```bash
# Desde la raíz del proyecto
cd infrastructure/docker

# Iniciar TODOS los servicios (una sola vez)
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo de RabbitMQ
docker-compose logs -f rabbitmq-node1 rabbitmq-node2 rabbitmq-node3
```

#### Verificar Cluster RabbitMQ

```bash
# Verificar estado del cluster
docker exec carpeta-rabbitmq-node1 rabbitmqctl cluster_status

# Debería mostrar:
# Cluster name: rabbit@rabbitmq-node1
# Running nodes: [rabbit@rabbitmq-node1, rabbit@rabbitmq-node2, rabbit@rabbitmq-node3]
# Versions: rabbit@rabbitmq-node1: 3.12.x
```

#### Acceder a Management UI

- **Nodo 1**: http://localhost:15672
- **Nodo 2**: http://localhost:15673
- **Nodo 3**: http://localhost:15674
- **Usuario**: admin
- **Contraseña**: admin123

#### Detener Infraestructura

```bash
# Detener todos los servicios
docker-compose down

# Detener Y eliminar volúmenes (data loss!)
docker-compose down -v
```

## Consecuencias

### Positivas

- ✅ **Setup Simplificado**: Un solo comando inicia toda la infraestructura
- ✅ **Experiencia de Desarrollo Consistente**: Todos los desarrolladores usan el mismo entorno
- ✅ **Facilita Testing**: Testcontainers puede levantar todo el stack
- ✅ **Coherencia Arquitectónica**: Toda la infraestructura de desarrollo en un solo lugar
- ✅ **Onboarding Rápido**: Nuevos desarrolladores productivos en <15 minutos
- ✅ **Debugging Simplificado**: Docker logs + Docker Desktop UI para troubleshooting

### Negativas

- ⚠️ **Consumo de Recursos Local**: 3 nodos RabbitMQ + MinIO + DynamoDB puede ser pesado
    - **Mitigación**: Documentar requisitos mínimos (16GB RAM, 4 cores)
    - **Alternativa**: Perfil "light" con 1 solo nodo RabbitMQ para desarrollo de features no relacionadas con HA

- ⚠️ **No es Idéntico a Producción**: Docker Compose != Kubernetes
    - **Mitigación**: Mantener manifiestos K8s actualizados, CI/CD tests en ambiente staging con K8s

- ⚠️ **Limitaciones de Escalabilidad**: No puede simular 100 nodos
    - **Aceptable**: Para desarrollo local, 3 nodos son suficientes para validar HA

### Riesgos

- 🔴 **Divergencia Desarrollo-Producción**: Configuraciones pueden diferir
    - **Mitigación**: 
        - Usar variables de entorno para configuraciones específicas de ambiente
        - CI/CD pipeline valida configuraciones contra producción
        - Documentar diferencias explícitamente en README

- 🔴 **Overhead de Mantenimiento**: Mantener 2 configuraciones (Docker Compose + K8s)
    - **Mitigación**: 
        - Automatizar generación de manifiestos K8s desde Docker Compose (Kompose)
        - Considerar Skaffold para sincronizar desarrollo local con K8s

## Alternativas Rechazadas

### Por qué NO Infraestructura Separada

```
infrastructure/
├── docker/
│   ├── docker-compose-base.yml    # MinIO + DynamoDB
│   └── docker-compose-rabbitmq.yml # RabbitMQ Cluster
```

**Razones del Rechazo:**
- Requiere ejecutar 2 comandos: `docker-compose -f base.yml up` + `docker-compose -f rabbitmq.yml up`
- Mayor fricción en desarrollo: más pasos = más errores
- No aporta beneficio real; RabbitMQ es dependencia core del sistema

### Por qué NO Kubernetes Directo

**Razones del Rechazo:**
- Steeper learning curve para desarrolladores sin experiencia en K8s
- Requiere cluster local (minikube, kind) = más recursos + complejidad
- Overkill para desarrollo inicial; K8s es para producción
- Debugging más complejo (`kubectl logs`, `kubectl exec`)

**Cuándo Considerar:**
- Cuando el equipo tenga >6 meses de experiencia con K8s
- Cuando las features específicas de K8s sean necesarias (Operators, StatefulSets avanzados)
- Para ambientes staging/pre-production que simulen producción real

## Migración Futura a Kubernetes

Cuando el proyecto madure y esté listo para producción:

### Opción 1: RabbitMQ Cluster Operator (Recomendado)

```yaml
# infrastructure/kubernetes/rabbitmq/rabbitmq-cluster.yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: carpeta-rabbitmq
spec:
  replicas: 3
  rabbitmq:
    additionalConfig: |
      cluster_formation.peer_discovery_backend = rabbit_peer_discovery_k8s
      cluster_formation.k8s.host = kubernetes.default.svc.cluster.local
      cluster_formation.k8s.address_type = hostname
  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  persistence:
    storage: 20Gi
    storageClassName: fast-ssd
```

### Opción 2: Managed RabbitMQ

- **AWS Amazon MQ**: Managed RabbitMQ en AWS
- **CloudAMQP**: RabbitMQ as a Service
- **Google Cloud Pub/Sub**: Alternativa managed (no RabbitMQ pero compatible AMQP)

## Referencias

- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [Testcontainers](https://www.testcontainers.org/)
- [RabbitMQ Cluster Operator](https://github.com/rabbitmq/cluster-operator)
- [Kompose: Kubernetes + Compose](https://kompose.io/)
- ADR-0003: Eliminación de Documentos con Arquitectura Event-Driven usando RabbitMQ
- ADR-0004: Configuración de RabbitMQ con Quorum Queues (3 Nodos, Replicación Factor 2)
- RNF-21, RNF-22: Requisitos no funcionales de mantenibilidad

---

**Fecha**: 2025-11-05  
**Autores**: Equipo Carpeta Ciudadana  
**Revisores**: Pendiente
