# Diagramas C4 - Sistema Carpeta Ciudadana

Este documento contiene los diagramas C4 (Context, Container, Component, Code) para el sistema Carpeta Ciudadana, siguiendo la metodología de Simon Brown.

## Tabla de Contenidos
1. [C4 Level 1: System Context](#c4-level-1-system-context)
2. [C4 Level 2: Container Diagram](#c4-level-2-container-diagram)

---

## C4 Level 1: System Context

El diagrama de contexto muestra el sistema Carpeta Ciudadana y cómo interactúa con usuarios y sistemas externos.

```mermaid
flowchart LR
    %%{init: {'theme': 'neutral', "flowchart" : { "curve" : "basis" } } }%%
    %% ============================================
    %% ACTORES (Izquierda)
    %% ============================================
    subgraph actors["<b>Actores</b>"]
        ciudadano["<b>👤 Ciudadano</b><br/>Usuario final que almacena y<br/>comparte documentos personales.<br/>Interactúa mediante apps web"]
    end

    %% ============================================
    %% SISTEMA PRINCIPAL (Centro)
    %% ============================================
    subgraph operator["<b>Mi Operador</b>"]
        carpeta["<b>💼 Sistema Operador<br/>Carpeta Ciudadana</b><br/><br/>Almacena documentos digitales<br/>a perpetuidad, gestiona<br/>transferencias P2P entre<br/>operadores y permite portabilidad"]
    end

    %% ============================================
    %% SISTEMAS EXTERNOS (Derecha)
    %% ============================================
    
    subgraph gov["<b>Gobierno de Colombia</b>"]
        mintic["<b>🗂️ Centralizador MinTIC</b><br/>Registro minimalista<br/>email → operador<br/>NO almacena documentos"]
        gov_authorization["<b>🔐 Notaria</b><br/>(Mismo centralizador)<br/>Autentica documento"]
    end

    otro_operador["<b>🔄 Otros Operadores</b><br/>GovCarpeta, MiCarpeta<br/>Mismo estándar de<br/>interoperabilidad<br/>Carpetas de otros ciudadanos"]

    subgraph providers["<b>Proveedores de Servicios Externos</b>"]
        email["<b>📧 Servicio de Email</b><br/>Proveedor SMTP<br/>Notificaciones y docs<br/>a entidades sin operador"]
        cloud_service["<b>☁️ Cloud service</b><br/>Almacena documentos (S3, Google object storage, Dynamo, RDS)"]
    end

    %% ============================================
    %% RELACIONES: Actores → Sistema
    %% ============================================
    ciudadano <-->|"Registra cuenta,<br/>almacena/consulta docs,<br/>autoriza envíos<br/>(HTTPS/REST + JWT)"| carpeta

    %% ============================================
    %% RELACIONES: Sistema → Externos
    %% ============================================
    carpeta <-->|"Consulta ubicación<br/>Registra ciudadanos<br/>Valida no asociación con otro operador<br/>Actualiza portabilidad<br/>(HTTPS/REST)"| mintic
    carpeta <-->|"Autentica documento<br/>(HTTPS/REST)"| gov_authorization
    
    carpeta <-->|"Transferencias<br/>directas de docs<br/>Coordina portabilidad<br/>(HTTPS/REST)"| otro_operador
    
    carpeta <-->|"Notificaciones<br/>(HTTPS/REST)"| email
    carpeta <-->|"Persistencia Documentos<br/>(HTTPS/REST)"| cloud_service

    %% ============================================
    %% ESTILOS
    %% ============================================
    classDef actorStyle fill:#08427B,stroke:#052E56,color:#fff,stroke-width:2px
    classDef systemStyle fill:#1168BD,stroke:#0B4884,color:#fff,stroke-width:3px
    classDef externalStyle fill:#999999,stroke:#666666,color:#fff,stroke-width:2px
    classDef boundaryStyle fill:#ffffff,stroke:#444444,stroke-width:2px,stroke-dasharray:5 5

    class ciudadano,entidad,admin actorStyle
    class carpeta systemStyle
    class mintic,otro_operador,email,cloud_service,gov_authorization externalStyle
```

### Descripción del Contexto

#### Líneas de Separación (Boundaries)

El diagrama utiliza dos líneas conceptuales para organizar los elementos según las mejores prácticas de C4:

1. **Automation Line** (Línea de Automatización)
   - Separa los **actores humanos** (izquierda) del **sistema automatizado** (centro)
   - Define el límite entre interacciones manuales y procesos automatizados
   - Todo lo que cruza esta línea representa una interacción usuario-sistema

2. **Integration Line** (Línea de Integración)
   - Separa el **sistema principal** (centro) de **otros sistemas externos** (derecha)
   - Define los puntos de integración e interoperabilidad
   - Todo lo que cruza esta línea representa una integración sistema-a-sistema

#### Actores Principales (Izquierda - Automation Boundary)

- **Ciudadano**: Usuario final que almacena documentos personales (cédula, diplomas, certificados) y los comparte con entidades cuando lo necesita. Interactúa mediante aplicaciones web/móvil con autenticación multifactor.

#### Sistema Principal (Centro)

**Sistema Operador Carpeta Ciudadana**: Plataforma de gestión documental que implementa los requisitos de interoperabilidad definidos por MinTIC. Almacena documentos certificados a perpetuidad sin límite de tamaño, gestiona transferencias P2P directas entre operadores (sin pasar por MinTIC), y permite portabilidad entre operadores en máximo 72 horas.

#### Sistemas Externos (Derecha - Integration Boundary)

**1. Gobierno de Colombia**
   - **Centralizador MinTIC**: Registro minimalista que solo mantiene mapeo email → operador actual. NO almacena documentos, NO rutea información. Valida que el ciudadano no esté asociado con otro operador durante el registro. Almacenamiento estimado: 3-5 GB para todo el país (~50M ciudadanos). Responde consultas en <100ms (p95).

**2. Ecosistema de Operadores Privados**
   - **Otros Operadores**: Operadores competidores (ej: GovCarpeta, MiCarpeta) que implementan el mismo estándar de interoperabilidad. Gestionan carpetas de otros ciudadanos/entidades. Las transferencias son **P2P directas** (operador A → operador B) sin pasar por MinTIC. Soportan coordinación de portabilidad con migración completa de datos.

**3. Proveedores de Servicios Externos**
   - **Servicio de Email**: Proveedor SMTP/TLS para notificaciones a ciudadanos y entidades. También se usa para enviar documentos a entidades que no tienen operador (fallback cuando MinTIC responde "entidad sin operador").
   - **Servicios de Nube**: Usado para la persistencia de la información, por ejemplo, donde se guardan los documentos que son subidos por el usuario.

#### Flujos Clave de Información

**Transferencia de Documentos:**
1. Operador A consulta a MinTIC: "¿Dónde está ciudadano X?" → MinTIC: "Operador B"
2. Operador A transfiere documentos **DIRECTAMENTE** a Operador B (sin pasar por MinTIC)
3. Operador B confirma recepción (ACK) y notifica al ciudadano

**Portabilidad entre Operadores:**
1. Ciudadano solicita cambio de Operador A → Operador B
2. Operador A exporta TODOS los documentos + metadatos + historial
3. Operador B valida integridad, confirma recepción
4. MinTIC actualiza registro: email → Operador B
5. Proceso completo en máximo 72 horas

---

## C4 Level 2: Container Diagram

El diagrama de contenedores muestra la arquitectura interna del Sistema Operador Carpeta Ciudadana.


```mermaid
flowchart LR
    %%{init: {'theme': 'neutral', "flowchart" : { "curve" : "basis" } } }%%
    %% ============================================
    %% SISTEMA OPERADOR CARPETA CIUDADANA
    %% ============================================
    subgraph operator["<b>💼 Mi Operador - Sistema Operador Carpeta Ciudadana</b>"]
        subgraph frontend["<b>Capa de Presentación</b>"]
            web_app["💻 <b>Aplicación Web Ciudadano</b><br/>SPA para gestionar documentos"]
        end
                
        api_gateway["🚪 <b>API Gateway</b><br/>Autenticación, rate limiting, routing"]
        
        subgraph communication[" "]
            subgraph services["<b>Microservicios</b>"]
                carpeta_service["📁 <b>Carpeta Personal Service</b><br/>Gestiona carpetas de ciudadanos<br/>Genera pre-signed URLs"]
                transfer_service["🔄 <b>Transferencia Service</b><br/>Coordina transferencias P2P"]
                identity_service["👥 <b>Identidad y Registro Service</b><br/>Registro, verificación<br/>Centralizador genera email inmutable"]
                portability_service["📦 <b>Portabilidad Service</b><br/>Recepción nuevo ciudadano<br/>Usa pre-signed URLs para migración"]
                auth_service["🔐 <b>Autenticación Service</b><br/>JWT, MFA, sesiones<br/>OAuth 2.0 client credentials"]
                notification_service["🔔 <b>Notificaciones Service</b><br/>Email, SMS, push"]
                signature_service["✍️ <b>Digital Signature Service</b><br/>Coordina autenticación de docs"]
            end
            
            event_bus["⚡ <b>Event Bus</b><br/>Broker<br/>Comunicación asíncrona"]@{ shape: h-cyl}

            subgraph data["<b>Capa de Datos</b>"]
                carpeta_db[("🗄️ <b>Carpeta DB</b><br/>Metadatos de documentos")]
                identity_db[("🗄️ <b>Identity DB</b><br/>Registro ciudadanos/entidades")]
                cache[("⚡ <b>Cache</b><br/>Cache consultas Centralizador")]
            end
        end
    end

    %% ============================================
    %% SISTEMAS EXTERNOS
    %% ============================================
    subgraph externals["Sistemas externos"]
        direction TB
        subgraph gov["<b>Gobierno de Colombia</b>"]
            mintic["🗂️ <b>Centralizador MinTIC</b><br/>Registro minimalista<br/>email → operador<br/>NO almacena documentos"]
            gov_authorization["🔐 <b>Notaría</b><br/>(Mismo centralizador)<br/>Autentica documento"]
        end

        subgraph providers["<b>Proveedores de Servicios Externos</b>"]
            email_provider["📧 <b>Servicio de Email</b><br/>Proveedor SMTP<br/>Notificaciones y docs"]
            cloud_services["☁️ <b>Cloud service</b><br/>Almacena documentos (S3, Google object storage, Dynamo, RDS)"]
        end

        otro_operador["🔄 <b>Otros Operadores</b><br/>GovCarpeta, MiCarpeta<br/>Mismo estándar de interoperabilidad"]
    end

    
    %% ============================================
    %% ACTORES (Arriba)
    %% ============================================
    subgraph actors["Actores"]
        ciudadano("👤 <b>Ciudadano</b><br/>Usuario final que almacena y<br/>comparte documentos personales")
    end

    operator ~~~ externals

    %% ============================================
    %% RELACIONES: Frontend → Gateway
    %% ============================================
    web_app -->|"HTTPS/JSON<br/>JWT"| api_gateway

    %% ============================================
    %% RELACIONES: Gateway → Servicios
    %% ============================================
    api_gateway <-->|"HTTP/REST"| carpeta_service
    api_gateway <-->|"HTTP/REST"| transfer_service
    api_gateway <-->|"HTTP/REST"| portability_service
    api_gateway <-->|"HTTP/REST"| identity_service
    api_gateway <-->|"Autentica<br/>"| auth_service

    %% ============================================
    %% RELACIONES: Carpeta Service
    %% ============================================
    carpeta_service -->|"Almacena Datos de Documentos"| carpeta_db
    carpeta_service -->|"Object storage Service<br/>Pre-signed URLs"| cloud_services
    carpeta_service -->|"Publica eventos<br/>Broker"| event_bus

    %% ============================================
    %% RELACIONES: Digital Signature Service
    %% ============================================
    signature_service -->|"Consume eventos<br/>Broker"| event_bus
    signature_service -->|"Autentica documento<br/>HTTPS/REST"| gov_authorization

    %% ============================================
    %% RELACIONES: Transfer Service
    %% ============================================
    transfer_service <-->|"Consulta ubicación<br/>HTTPS/REST"| mintic
    transfer_service <-->|"Cache<br/>Redis Protocol (fallback)"| cache
    transfer_service <-->|"HTTPS/REST"| otro_operador
    transfer_service <-->|"Publica/Consume eventos<br/>Broker"| event_bus

    %% ============================================
    %% RELACIONES: Portability Service
    %% ============================================
    portability_service -->|"Actualiza operador<br/>HTTP/REST"| identity_service
    portability_service -->|"Actualiza registro<br/>HTTPS/REST"| mintic
    portability_service -->|"Coordina migración<br/>HTTPS/REST"| otro_operador
    portability_service -->|"Publica eventos<br/>Broker"| event_bus
    

    %% ============================================
    %% RELACIONES: Identity Service
    %% ============================================
    identity_service -->|"SQL"| identity_db
    identity_service -->|"Registra inicial<br/>Valida no asociación con otro operador<br/>HTTPS/REST"| mintic
    identity_service -->|"Publica eventos<br/>Broker"| event_bus

    %% ============================================
    %% RELACIONES: Auth Service
    %% ============================================
    auth_service -->|"Valida usuarios<br/>SQL"| identity_db

    %% ============================================
    %% RELACIONES: Notification Service
    %% ============================================
    notification_service -->|"Consume eventos<br/>Broker"| event_bus
    notification_service -->|"SMTP/TLS"| email_provider

    %% ============================================
    %% RELACIONES BIDIRECCIONALES
    %% ============================================
    otro_operador <-->|"Envía/Recibe Docs<br/>HTTPS/REST"| api_gateway
    otro_operador -->|"OAuth 2.0<br/>Client Credentials"| api_gateway

    %% ============================================
    %% RELACIONES: Actores → Frontend
    %% ============================================
    ciudadano -->|"HTTPS"| web_app

    %% ============================================
    %% ESTILOS
    %% ============================================
    classDef actorStyle fill:#08427B,stroke:#052E56,color:#fff,stroke-width:2px
    classDef frontendStyle fill:#63B3ED,stroke:#2C5282,color:#000,stroke-width:2px
    classDef gatewayStyle fill:#F6AD55,stroke:#C05621,color:#000,stroke-width:5px
    classDef serviceStyle fill:#68D391,stroke:#22543D,color:#000,stroke-width:5px
    classDef dataStyle fill:#B794F4,stroke:#44337A,color:#fff,stroke-width:2px
    classDef eventStyle fill:#FC8181,stroke:#742A2A,color:#fff,stroke-width:2px,width:100px
    classDef externalStyle fill:#999999,stroke:#666666,color:#fff,stroke-width:2px
    classDef systemStyle border:no-border,stroke-width:3px

    class ciudadano,entidad,admin actorStyle
    class web_app frontendStyle
    class api_gateway gatewayStyle
    class carpeta_service,carpeta_inst_service,transfer_service,portability_service,identity_service,auth_service,notification_service,signature_service serviceStyle
    class carpeta_db,identity_db,cache dataStyle
    class event_bus eventStyle
    class mintic,gov_authorization,otro_operador,email_provider,cloud_services externalStyle

    class system systemStyle

    %% ============================================
    %% ESTILOS DE LÍNEAS/ENLACES
    %% ============================================
    linkStyle 2,3,4,5,6 stroke:#F6AD55,stroke-width:2px %% API Gateway
    linkStyle 7,8,9 stroke:#68D391,stroke-width:2px %% Carpeta Service
    linkStyle 10,11 stroke:#FDB366,stroke-width:2px %% Digital Signature Service
    linkStyle 12,13,14,15 stroke:#9F7AEA,stroke-width:2px %% Transfer Service
    linkStyle 16,17,18,19 stroke:#38B2AC,stroke-width:2px %% Portability Service
    linkStyle 20,21,22 stroke:#FC8181,stroke-width:2px %% Identity Service
    linkStyle 23 stroke:#4ADE80,stroke-width:2px %% Auth Service
    linkStyle 24,25 stroke:#FBB6CE,stroke-width:2px %% Notification Service
    linkStyle 26,27 stroke:#06B6D4,stroke-width:2px %% Otro Operador Service

```

### Descripción de Contenedores

**Frontend Applications:**
- **Aplicación Web Ciudadano**: SPA para gestión de documentos personales

**Core Services (Microservicios):**
- **Carpeta Personal Service**: CRUD de documentos ciudadanos, genera pre-signed URLs para uploads directos a S3
- **Transferencia Service**: Transferencias P2P entre operadores (sin pasar por Centralizador)
- **Portabilidad Service**: Cambio de operador en 72h con migración de datos usando pre-signed URLs
- **Identidad y Registro Service**: Registro inicial, Centralizador genera email inmutable @carpetacolombia.co
- **Autenticación Service**: MFA, JWT tokens, gestión de sesiones, valida OAuth 2.0 client credentials para operadores
- **Notificaciones Service**: Envío de notificaciones multi-canal (email, SMS, push)
- **Digital Signature Service**: Consume eventos de autenticación, coordina con Notaría para validar documentos

**Data Stores:**
- **Carpeta DB**: Metadatos de documentos, historial de accesos
- **Document Storage**: Archivos binarios (S3-compatible), accesible vía pre-signed URLs
- **Identity DB**: Ciudadanos, entidades, verificaciones, credenciales OAuth 2.0 de operadores
- **Cache**: Redis para cachear consultas al Centralizador (reduce latencia y carga)

**Infrastructure:**
- **API Gateway**: Kong/Nginx para routing, autenticación JWT/OAuth 2.0, rate limiting
- **Event Bus**: Kafka/RabbitMQ para comunicación asíncrona entre servicios

### Flujos Clave Implementados

**1. Crear Perfil de Ciudadano:**
- Ciudadano solicita registro → Identity Service valida que no esté asociado con otro operador consultando al Centralizador
- Operador envía email de confirmación → Ciudadano establece contraseña
- Identity Service registra ciudadano en Centralizador (email → operador actual)

**2. Autenticar Usuario/Operador:**
- **Ciudadanos**: Auth Service valida credenciales contra Identity DB, genera JWT token (válido 15 min)
- **Operadores**: API Gateway valida OAuth 2.0 Client Credentials contra Identity DB

**3. Subir Documentos:**
- Carpeta Service genera pre-signed URL (válida 15 min)
- Ciudadano sube documento directamente a Cloud Storage
- Carpeta Service almacena metadatos en Carpeta DB

**4. Autenticar Documento:**
- Carpeta Service publica evento `DocumentoSubido` al Event Bus
- Digital Signature Service consume evento
- Digital Signature Service coordina con Notaría (Centralizador) para autenticación

**5. Transferir Perfil (Portabilidad):**
- Operador destino orquesta la transferencia (pull-based approach)
- Portability Service solicita lista de documentos al operador origen (OAuth 2.0 Bearer token)
- Operador destino genera pre-signed URLs (válidas 72h) en su Cloud Storage
- Operador origen genera pre-signed URLs temporales (válidas 1h) para descarga
- Operador destino descarga, valida checksums, y confirma integridad total
- Portability Service actualiza registro en Centralizador (email → nuevo operador)

---

## Diagramas de Secuencia - 5 Escenarios

### Escenario 1: Crear Perfil de Ciudadano

```mermaid
sequenceDiagram
    actor C as Ciudadano
    participant OP as Sistema Operador
    participant CENT as Centralizador MinTIC

    C->>OP: 1. Solicita crear perfil<br/>(cédula, datos personales)

    OP-->>C: 2. Envía correo con enlace de validación de cuenta
        C->>OP: 3. Accede al correo y genera su contraseña

    Note over OP,CENT: Validación de no asociación con otros operadores
    OP->>CENT: 3. Valida ciudadano no esté asociado con otro Operador<br/>(consulta por cédula)

    alt Ciudadano existe en otro operador
        CENT-->>OP: 4a. Sí, registrado con Operador X
        OP-->>C: 5a. Error: Ya tiene cuenta en Operador X<br/>Use portabilidad para migrar
    else Ciudadano SIN operador
        CENT-->>OP: 4b. No tiene operador

        Note over OP,CENT: Registro en Centralizador
        OP->>CENT: 6. Registra ciudadano<br/>(email → operador actual)
        CENT-->>OP: 7. Confirma registro exitoso

        OP->>OP: 8. Crea carpeta personal<br/>Almacena datos del ciudadano
        OP-->>C: 9. Perfil creado exitosamente

        Note over C: Email es inmutable y permanente
    end
```

### Escenario 2: Autenticar Usuario/Operadores

#### 2.1 Autenticación de Ciudadano

```mermaid
sequenceDiagram
    actor C as Ciudadano
    participant OP as Sistema Operador

    C->>OP: 1. Ingresa credenciales<br/>(email, contraseña)

    OP->>OP: 2. Valida credenciales<br/>contra Auth DB

    OP->>OP: 3. Genera JWT token<br/>(válido 15 min)

    OP-->>C: 4. Acceso concedido<br/>Retorna JWT token

    Note over C: Ciudadano autenticado<br/>Todas las peticiones incluyen:<br/>Authorization: Bearer JWT_TOKEN
```

#### 2.2 Autenticación entre Operadores

```mermaid
sequenceDiagram
    participant OPA as Operador A
    participant OPB as Operador B

    Note over OPA,OPB: OAuth 2.0 Client Credentials

    OPA->>OPB: 1. Solicita autenticación<br/>OAuth 2.0 Client Credentials<br/>(client_id, client_secret)

    OPB->>OPB: 2. Valida credenciales del operador

    OPB-->>OPA: 3. Emite token de acceso<br/>(válido por 15 minutos)

    Note over OPA: Operador A puede realizar<br/>transferencias usando el token

    OPA->>OPB: 4. Operaciones autenticadas<br/>Authorization: Bearer TOKEN

    Note over OPA,OPB: Token permite transferencias P2P<br/>directas entre operadores
```

### Escenario 3: Subir Documentos

```mermaid
sequenceDiagram
    participant ciudadano as Ciudadano (Navegador/App)
    participant operador as Operador
    participant cloud_srv as Cloud<br>(OS, malware scanner)

    %% --- Fase de Subida ---
    ciudadano->>operador: 1. Solicitar subida de archivo (auth, metadatos)
    
    operador->>cloud_srv: 2. Solicitar URL pre-firmada para subir archivo
    cloud_srv-->>operador: 3. Devolver URL pre-firmada
    
    operador-->>ciudadano: 4. Enviar URL pre-firmada al cliente
    
    ciudadano->>cloud_srv: 5. Subir archivo directamente usando la URL
    cloud_srv-->>ciudadano: 6. Responder con HTTP 200 OK (Éxito)

    ciudadano->>operador: 7. Notificar al servidor: "Subida completada"
    %% --- Fase de Notificación y Escaneo (Interno en la Nube) ---
    par operador to ciudadano
        operador->>ciudadano: 8. Notifica al ciudadano proceso de escanerar el archivo
    and operador to cloud_srv
        operador->>cloud_srv: 9. Disparar proceso post-subida (Escaneo de malware)
        note over cloud_srv: La nube ejecuta el flujo interno de:<br/>1. obtención de documento recien subido.<br/>2. Validación de malware.<br/>3. Mueve o elimina el archivo según el resultado.
        
        cloud_srv-->>operador: 10. Notificar al servidor el resultado del escaneo
        operador->>operador: 11. Actualiza estado del documento (malware/no malware)
        
        operador-->>ciudadano: 12. Acusar recibo y confirmar finalización
    end
```

### Escenario 4: Autenticar Documento

```mermaid
sequenceDiagram
    actor C as Ciudadano
    participant OP as Sistema Operador
    participant NOT as Notaría (Centralizador)

    C->>OP: 1. Solicita autenticación de documento<br/>(diploma universitario)

    Note over OP,NOT: Proceso de Autenticación
    OP->>NOT: 2. Envía documento para autenticación<br/>(documento + metadatos)

    NOT->>NOT: 3. Valida autenticidad del documento<br/>Verifica origen y emisor

    NOT->>NOT: 4. Genera "firma digital"<br/>con timestamp confiable

    NOT-->>OP: 5. Retorna certificado de autenticación<br/>(firma digital + cadena de confianza)

    OP->>OP: 6. Almacena certificado con el documento<br/>Marca documento como AUTENTICADO

    OP-->>C: 7. Documento autenticado exitosamente<br/>Ahora tiene validez legal

    Note over C: Documento certificado<br/>puede ser compartido con entidades<br/>con garantía de autenticidad
```

### Escenario 5: Transferir Perfil de Ciudadano (Portabilidad)

#### 5a. Portabilidad: Fase 1 - Iniciar Portabilidad y Registro

**Perspectiva: Coordinación inicial entre operadores (proceso síncrono)**

```mermaid
sequenceDiagram
    actor C as Ciudadano
    participant OPA as Operador Origen
    participant OPB as Operador Destino
    participant CENT as Centralizador

    C->>OPA: 1. Solicita cambio a Operador Destino

    OPA->>OPA: 2. Valida elegibilidad del ciudadano<br/>(sin transferencias pendientes)
    OPA->>CENT: 3. Solicita operadores disponibles para transferencia
    CENT-->>OPA: 4. Retorna operadores disponibles
    OPA-->>C: 5. Muestra operadores disponibles
    C->>C: 6. Selecciona operador
    C->>OPA: 7. Inicia proceso de transferencia

    Note over OPA,OPB: Coordinación entre operadores
    OPA->>OPB: 8. Notifica intención de transferir ciudadano<br/>(email, metadatos básicos, cantidad docs)

    OPB->>OPB: 9. Valida capacidad de recibir<br/>Crea perfil preliminar (PENDING)

    OPB-->>OPA: 10. Confirma aceptación<br/>Listo para solicitar documentos

    Note over OPA,CENT: Marca transferencia en proceso
    OPA->>CENT: 11. Marca ciudadano EN_TRANSFERENCIA<br/>(email → temporal)
    CENT-->>OPA: 12. Confirmación

    OPA->>OPA: 13. Marca ciudadano como EN_TRANSFERENCIA<br/>Genera lista de documentos a transferir

    OPA-->>C: 14. Portabilidad iniciada<br/>La transferencia de documentos comenzará

    Note over C: Fase 1 completada<br/>Fase 2 comenzará automáticamente
```

#### 5b. Portabilidad: Fase 2 - Transferencia Asíncrona de Documentos

**Perspectiva: Migración de documentos (proceso asíncrono - Destino orquesta la transferencia)**

```mermaid
sequenceDiagram
    participant OPB as Operador Destino
    participant OPA as Operador Origen (Mi operador)
    participant CENT as Centralizador
    participant cloud_srv as Cloud<br>(OS, malware scanner)
    actor C as Ciudadano

    Note over OPB: Proceso asíncrono inicia<br/>Destino orquesta la transferencia


    loop Por cada lote de documentos
        OPB->>OPA: 1. Solicita lista de documentos<br/>(OAuth 2.0 Bearer token)
        OPA-->>OPB: 2. Retorna lista completa<br/>(IDs, metadatos, checksums)

        OPB->>OPB: 3. Crea espacio de almacenamiento<br/>Genera pre-signed URLs (válidas 72h)

        OPB->>OPA: 4. Solicita lote de documentos<br/>(IDs del lote, pre-signed URLs destino)

        OPA->>cloud_srv: 5. Genera pre-signed URLs origen<br/>para descarga (válidas 1h)

        OPA-->>OPB: 6. Retorna pre-signed URLs origen

        OPB->>cloud_srv: 7. Descarga documentos usando URLs origen

        OPB->>OPB: 8. Sube a almacenamiento destino<br/>usando pre-signed URLs destino<br/>Valida checksums

        OPB->>OPB: 9. Actualiza progreso<br/>(ej: 45/100 documentos)
    end

    Note over OPB: Validación de integridad completa
    OPB->>OPB: 10. Valida cantidad y checksums<br/>de todos los documentos

    alt Transferencia exitosa
        Note over OPB: Activa el ciudadano
        OPB->>OPB: 11a. Actualiza perfil a ACTIVO

        OPB->>CENT: 12a. Registra ciudadano oficialmente<br/>(email → Operador Destino)
        CENT-->>OPB: 13a. Confirmación

        OPB->>OPA: 14a. Confirma transferencia COMPLETA<br/>(puede eliminar datos)

        
        par Mi operador al Ciudadano
            Note over OPA: Eliminación segura
            OPA->>cloud_srv: 15a. Elimina documentos del ciudadano
            OPA->>OPA: 16a. Elimina perfil del ciudadano

            OPA->>C: 17a. Notifica: Transferencia completada<br/>Tu cuenta está en Operador Destino
        and Nuevo operador al Ciudadano
            OPB->>C: 14b. Bienvenida a Operador Destino<br/>Todos tus documentos están disponibles
        end
        Note over C: Portabilidad exitosa

    else Transferencia falló
        OPB->>OPB: 11b. Marca perfil como FALLIDO<br/>Elimina documentos parciales

        OPB->>OPA: 12b. Notifica FALLO en transferencia

        OPA->>OPA: 13b. Revierte estado a ACTIVO

        OPA->>CENT: 14b. Re-registra ciudadano<br/>(email → Operador Origen)
        CENT-->>OPA: 15b. Confirmación

        OPA->>C: 16b. Transferencia falló<br/>Tu cuenta permanece aquí<br/>Puedes reintentar

        Note over C: Ciudadano permanece<br/>en operador origen
    end
```

#### 5c. Recibir Ciudadano: Perspectiva del Operador Destino

**Perspectiva: Mi operador RECIBE un ciudadano (ambas fases - Yo orquesto la transferencia)**

```mermaid
sequenceDiagram
    participant OPA as Operador Origen
    participant OPB as Mi Operador<br/>(Destino)
    participant CENT as Centralizador
    actor C as Ciudadano

    Note over OPA,OPB: FASE 1: Coordinación Inicial

    OPA->>OPB: 1. Solicita transferir ciudadano<br/>(email, metadatos, cantidad docs)

    OPB->>OPB: 2. Valida capacidad y autenticación OAuth 2.0

    OPB->>OPB: 3. Crea perfil preliminar<br/>(estado: PENDING)

    OPB-->>OPA: 4. Acepta transferencia<br/>Listo para solicitar documentos

    Note over OPB: Fase 1 completa<br/>Inicio fase asíncrona

    Note over OPA,OPB: FASE 2: Transferencia Orquestada por Destino

    OPB->>OPA: 5. Solicita lista completa de documentos<br/>(OAuth 2.0 Bearer token)
    OPA-->>OPB: 6. Retorna lista (IDs, metadatos, checksums)

    OPB->>OPB: 7. Genera pre-signed URLs destino<br/>(válidas 72h)

    loop Por cada lote de documentos
        OPB->>OPA: 8. Solicita lote de documentos<br/>(IDs, pre-signed URLs destino)

        OPA-->>OPB: 9. Retorna pre-signed URLs origen

        OPB->>OPA: 10. Descarga documentos usando URLs origen

        OPB->>OPB: 11. Sube a mi almacenamiento<br/>Valida checksums<br/>Actualiza progreso (ej: 45/100)
    end

    Note over OPB: Validación final de integridad

    OPB->>OPB: 12. Valida cantidad total y checksums

    alt Validación exitosa
        OPB->>OPB: 13a. Activa perfil del ciudadano<br/>(estado: ACTIVO)

        OPB->>CENT: 14a. Registro oficial<br/>(email → Mi Operador)
        CENT-->>OPB: 15a. Confirmación

        OPB->>OPA: 16a. Confirma recepción EXITOSA<br/>(puede eliminar datos)

        OPB->>C: 17a. Bienvenido<br/>Tu cuenta está activa con nosotros

        Note over OPB: Ciudadano activo<br/>en mi operador

    else Validación falló
        OPB->>OPB: 13b. Elimina datos parciales

        OPB->>OPA: 14b. Notifica FALLO<br/>(mantener ciudadano)

        Note over OPB: Transferencia rechazada<br/>Ciudadano permanece en origen
    end
```

---

## Decisiones de Diseño Clave

### Patrones Aplicados

1. **Adapter Pattern**:
   - **MinTIC Registry Adapter**: Adapta la API del Centralizador MinTIC a interfaces del dominio interno
   - **External Operator Adapter**: Permite integración con múltiples operadores con diferentes APIs
   - **Storage Adapter**: Abstrae el almacenamiento (S3, MinIO, Azure Blob)
   - **Digital Signature Adapter**: Adapta diferentes proveedores de firma digital

2. **Proxy Pattern**:
   - **MinTIC Caching Proxy**: Añade cache sobre el adapter para reducir latencia y carga
   - **Operator Retry Proxy**: Añade reintentos automáticos, circuit breaker y timeouts para llamadas a operadores externos

3. **Arquitectura Hexagonal (Ports & Adapters)**:
   - Lógica de negocio (Use Cases) independiente de frameworks
   - Adapters intercambiables sin afectar el core
   - Facilita testing con mocks

4. **Event-Driven Architecture**:
   - Servicios publican eventos de dominio al Event Bus
   - Desacoplamiento entre servicios (ej: Notification Service consume eventos)

### Decisiones de Escalabilidad

- **API Gateway**: Balanceo de carga, rate limiting
- **Microservicios independientes**: Escalado horizontal por servicio según demanda
- **Cache distribuido**: Redis para reducir latencia en consultas a MinTIC (99% menos llamadas)
- **Document Storage**: S3-compatible para escalabilidad infinita
- **Event Bus**: Kafka para alta throughput (~5M transferencias/día)

### Decisiones de Disponibilidad

- **Circuit Breaker**: Evita cascading failures cuando operadores externos fallan
- **Retry Logic**: Reintentos exponenciales en transferencias P2P
- **Cache Fallback**: Si MinTIC cae, se usa cache (eventual consistency)
- **Multiple Replicas**: Cada servicio con múltiples réplicas en Kubernetes

---

## Referencias

- [Análisis DDD del Sistema](./informacion_cruda/ddd_analisis/ddd__analisis.md)
- [Requisitos Funcionales](./informacion_cruda/1_req_funcionales.md)
- [Requisitos No Funcionales](./informacion_cruda/2_req_no_funcionales.md)
- [C4 Model Specification](https://c4model.com/)

