# Aplicación de Domain-Driven Design (DDD) - Arquitectura Sistema Carpeta Ciudadana

A continuación se realiza un análisis aplicando DDD al caso de estudio ["Carpeta Ciudadana"](../caso_estudio.pdf), enfocándonos **exclusivamente** en los conceptos de DDD, sin pensar aún en requisitos funcionales ni implementación.

## 1. Visión General del Sistema
```mermaid
%%{init: {'theme': 'base', "flowchart" : { "curve" : "basis" } } }%%
graph TB
    subgraph LEGEND["LEYENDA"]
        direction LR
        L1["CORE DOMAIN - Diferenciador del sistema"]
        L2["SUPPORTING DOMAIN - Necesario pero no diferenciador"]
        L3["GENERIC SUBDOMAIN - Podría comprarse/SaaS"]
        L4["INFRAESTRUCTURA - Servicios compartidos"]
    end

    subgraph METRICS["MÉTRICAS CLAVE DEL SISTEMA"]
        direction LR
        M1["<b>ESCALA</b><br/>%ciudadanos objetivo<br/> documentos<br/>? concurrentes"]
        M2["<b>PERFORMANCE</b><br/>API <200ms p95<br/>Transferencia <5s<br/>Registry <?ms"]
        M3["<b>DISPONIBILIDAD</b><br/>Core: 99.95%<br/>Support: 99.9%<br/>Generic: 99.5%"]
        M4["<b>SEGURIDAD</b><br/>MFA + AES-256<br/>Firma digital legal<br/>Auditoría 5 años"]
    end

    subgraph CORE["CORE DOMAIN - Gestión de Documentos e Identidad"]
        subgraph IDR["Identidad y Registro"]
            IDR1["<b>Aggregates:</b><br/>• RegistroCiudadano<br/>• RegistroInstitucion"]
            IDR2["<b>Responsabilidades:</b><br/>• Registro inicial único<br/>• Email inmutable<br/>• Verificación identidad<br/>• Afiliación inicial"]
            IDR3["<b>Crítico:</b> Identidad permanente"]
        end
        
        subgraph PORT["Gestión de Portabilidad"]
            PORT1["<b>Aggregate:</b><br/>ProcesoPortabilidad"]
            PORT2["<b>Responsabilidades:</b><br/>• Cambio de operador<br/>• Migración de datos<br/>• Coordinación 2 operadores<br/>• Plazo 72 horas"]
            PORT3["<b>Crítico:</b> Diferenciador único"]
        end
        
        subgraph CP["Carpeta Personal"]
            CP1["<b>Aggregate:</b> CarpetaCiudadano"]
            CP2["<b>Responsabilidades:</b><br/>• Almacenar docs certificados ∞<br/>• Docs temporales limitados<br/>• Compartir documentos<br/>• Historial de accesos<br/>• Email permanente"]
            CP3["<b>Escala:</b> 50M ciudadanos"]
        end
        
        subgraph CI["Carpeta Institucional"]
            CI1["<b>Aggregate:</b> CarpetaInstitucion"]
            CI2["<b>Responsabilidades:</b><br/>• Emitir docs certificados<br/>• Recibir documentos<br/>• Solicitar documentos<br/>• Gestionar convenios"]
            CI3["<b>Escala:</b> 5K instituciones"]
        end
        
        subgraph SH["Transferencia Documentos"]
            SH1["<b>Aggregate:</b> Transferencia"]
            SH2["<b>Responsabilidades:</b><br/>• Envío P2P directo<br/>• Tracking completo<br/>• Reintentos automáticos<br/>• Sin pasar por MinTIC"]
            SH3["<b>Escala:</b> 5M transf/día"]
        end
    end

    subgraph SUPPORT["SUPPORTING DOMAIN"]
        subgraph AUTH["Autenticación y Autorización"]
            AUTH1["<b>Aggregates:</b><br/>• SesionUsuario<br/>• AutorizacionCompartir"]
            AUTH2["<b>Responsabilidades:</b><br/>• MFA obligatorio<br/>• JWT tokens<br/>• Permisos compartir<br/>• Auditoría completa"]
        end
        
        subgraph CERT["Firma y Certificación"]
            CERT1["<b>Aggregate:</b><br/>DocumentoCertificado"]
            CERT2["<b>Responsabilidades:</b><br/>• Firma digital X.509<br/>• Validez legal<br/>• Timestamp confiable<br/>• Cadena de confianza"]
        end
    end

    subgraph INFRA["INFRAESTRUCTURA COMPARTIDA"]
        subgraph REG["Service Registry MinTIC"]
            REG1["<b>Función:</b> ciudadano/institución → operador"]
            REG2["<b>Datos:</b> Solo ubicaciones 3-5 GB"]
            REG3["<b>Performance:</b> <100ms | 10K req/s"]
        end
        
        subgraph EB["Event Bus"]
            EB1["<b>Patrón:</b> Pub/Sub"]
            EB2["<b>Tech:</b> Kafka/RabbitMQ"]
            EB3["<b>Eventos:</b> Dominio estandarizados"]
        end
        
        subgraph GW["API Gateway"]
            GW1["<b>Funciones:</b>"]
            GW2["Auth JWT • Rate Limiting<br/>Routing • TLS • DDoS<br/>Logging • Tracing"]
        end
    end

    subgraph GENERIC["GENERIC SUBDOMAIN"]
        subgraph NOT["Notificaciones"]
            NOT1["<b>Aggregate:</b> Notificacion"]
            NOT2["<b>Canales:</b><br/>Email, SMS, Push<br/>• Plantillas i18n<br/>• Preferencias usuario"]
        end
        
        subgraph PREM["Servicios Premium"]
            PREM1["<b>Aggregates:</b><br/>• SuscripcionPremium<br/>• CasoPQRS"]
            PREM2["<b>Servicios:</b><br/>Almacenamiento+<br/>PQRS empresarial<br/>APIs integración"]
        end
        
        subgraph ANAL["Analytics"]
            ANAL1["<b>Aggregates:</b><br/>• ConsultaAnalytica<br/>• VistaMaterializada"]
            ANAL2["<b>Contextos:</b><br/>EDUCACION<br/>NOTARIA<br/>REGISTRADURIA"]
        end
    end


    %% Relaciones Core - Identidad y Portabilidad
    IDR -->|autoriza creación| CP
    IDR -->|autoriza creación| CI
    PORT -->|consulta registro| IDR
    PORT -->|actualiza operador| IDR
    PORT -->|coordina migración| SH

    %% Relaciones Core - Carpetas y Transferencias
    CP -->|solicita envío| SH
    CI -->|emite docs| SH
    SH -->|entrega| CP
    SH -->|entrega| CI

    %% Relaciones Supporting
    AUTH -->|protege| CP
    AUTH -->|protege| CI
    CERT -->|certifica| CP
    CERT -->|certifica| CI

    %% Service Registry
    SH -->|consulta ubicación| REG
    IDR -->|registra inicial| REG
    PORT -->|actualiza ubicación| REG

    %% API Gateway
    GW -->|rutea| CP
    GW -->|rutea| CI
    GW -->|rutea| SH
    GW -->|rutea| IDR
    GW -->|rutea| PORT
    GW -->|autentica| AUTH

    %% Event Bus connections
    CP -.->|publica eventos| EB
    CI -.->|publica eventos| EB
    SH -.->|publica eventos| EB
    IDR -.->|publica eventos| EB
    PORT -.->|publica eventos| EB
    AUTH -.->|publica eventos| EB
    CERT -.->|publica eventos| EB
    EB -.->|consume| NOT
    EB -.->|consume| ANAL
    
    %% Premium y Analytics
    PREM -->|consume APIs| GW
    ANAL -->|lee metadatos| GW
    
    %% Styling
    classDef coreStyle fill:#bbdefb,stroke:#1565c0,stroke-width:3px,color:#000
    classDef supportStyle fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    classDef genericStyle fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px,color:#000
    classDef infraStyle fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    classDef metricsStyle fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef legendStyle fill:#fff9c4,stroke:#f9a825,stroke-width:1px,color:#000
    
    class CP,CI,SH,IDR,PORT,CP1,CP2,CP3,CI1,CI2,CI3,SH1,SH2,SH3,IDR1,IDR2,IDR3,PORT1,PORT2,PORT3 coreStyle
    class AUTH,CERT,AUTH1,AUTH2,CERT1,CERT2 supportStyle
    class NOT,PREM,ANAL,NOT1,NOT2,PREM1,PREM2,ANAL1,ANAL2 genericStyle
    class REG,EB,GW,REG1,REG2,REG3,EB1,EB2,EB3,GW1,GW2 infraStyle
    class M1,M2,M3,M4 metricsStyle
    class L1,L2,L3,L4 legendStyle
    
    style CORE fill:#e3f2fd,stroke:#1976d2,stroke-width:4px
    style SUPPORT fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style GENERIC fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    style INFRA fill:#fafafa,stroke:#424242,stroke-width:3px
    style METRICS fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    style LEGEND fill:#fffde7,stroke:#f57f17,stroke-width:2px
```

## 2. Context Map y Relaciones entre Dominios
```mermaid
%%{init: {'theme': 'base', "flowchart" : { "curve" : "basis" } } }%%

graph LR
    subgraph "SISTEMA CARPETA CIUDADANA"
        
        subgraph CORE["CORE DOMAIN - Gestión de Documentos e Identidad"]
            direction TB
            
            subgraph BC1["BC: Carpeta Personal"]
                CP_AGG[/"Carpeta Ciudadano<br/>(Aggregate)"/]
                CP_ENT["Documento<br/>Historial Accesos"]
                CP_VO["Email Carpeta<br/>Metadata"]
            end
            
            subgraph BC2["BC: Carpeta Institucional"]
                CI_AGG[/"Carpeta Institución<br/>(Aggregate)"/]
                CI_ENT["Documento Emitido<br/>Documento Recibido<br/>Solicitud Documento"]
                CI_VO["Tipo Institución<br/>Convenio Operador"]
            end
            
            subgraph BC3["BC: Transferencia Documentos"]
                TD_AGG[/"Transferencia<br/>(Aggregate)"/]
                TD_ENT["Paquete Documentos<br/>Destinatario"]
                TD_VO["Estado Transferencia<br/>Tracking ID"]
            end
            
            subgraph BC4["BC: Identidad y Registro"]
                ID_AGG[/"Registro Ciudadano<br/>(Aggregate)"/]
                ID_ENT["Registro Institución<br/>Verificación Identidad"]
                ID_VO["Email Inmutable<br/>Afiliación Inicial"]
            end
            
            subgraph BC5["BC: Gestión de Portabilidad"]
                PORT_AGG[/"Proceso Portabilidad<br/>(Aggregate)"/]
                PORT_ENT["Fase Portabilidad<br/>Migración Datos"]
                PORT_VO["Control Plazos 72h<br/>Coordinación Operadores"]
            end
        end
        
        subgraph SUPPORT["SUPPORTING DOMAIN"]
            
            subgraph BC6["BC: Autenticación y Autorización"]
                AUTH_AGG[/"Sesión Usuario<br/>(Aggregate)"/]
                AUTH_ENT["Token Acceso<br/>Autorización Compartir"]
                AUTH_VO["Permisos<br/>Ámbito Acceso"]
            end
            
            subgraph BC7["BC: Firma y Certificación"]
                CERT_AGG[/"Documento Certificado<br/>(Aggregate)"/]
                CERT_ENT["Firma Digital<br/>Certificado Validez"]
                CERT_VO["Emisor Certificado<br/>Timestamp Firma"]
            end
        end
        
        subgraph GENERIC["GENERIC SUBDOMAIN"]
            
            subgraph BC8["BC: Notificaciones"]
                NOT_AGG[/"Notificación<br/>(Aggregate)"/]
                NOT_ENT["Canal Envío<br/>Plantilla"]
                NOT_VO["Tipo Notificación<br/>Destinatario"]
            end
            
            subgraph BC9["BC: Servicios Premium"]
                PREM_AGG[/"Suscripción Premium<br/>(Aggregate)"/]
                PREM_ENT["Servicio Contratado<br/>Caso PQRS"]
                PREM_VO["Plan Premium<br/>Facturación"]
            end
            
            subgraph BC10["BC: Analytics"]
                ANAL_AGG[/"Consulta Agregada<br/>(Aggregate)"/]
                ANAL_ENT["Vista Materializada<br/>Reporte"]
                ANAL_VO["Contexto Análisis<br/>Período Temporal"]
            end
        end
        
        subgraph INFRA["CAPA DE INFRAESTRUCTURA"]
            
            subgraph SVC1["Service Registry MinTIC"]
                REG["Registro Ubicación<br/>---<br/>ciudadano → operador<br/>institución → operador"]
            end
            
            subgraph SVC2["Event Bus"]
                EVT["Eventos de Dominio<br/>---<br/>CarpetaCreada<br/>DocumentoRecibido<br/>TransferenciaCompletada<br/>PortabilidadIniciada<br/>PortabilidadCompletada<br/>AutorizacionOtorgada"]
            end
            
            subgraph SVC3["API Gateway"]
                GW["Gateway APIs<br/>---<br/>Autenticación<br/>Rate Limiting<br/>Routing"]
            end
        end
    end
    
    %% Core Domain Relationships
    BC1 -->|solicita transferencia| BC3
    BC2 -->|inicia transferencia| BC3
    BC3 -->|consulta ubicación| REG
    BC3 -->|entrega a| BC1
    BC3 -->|entrega a| BC2
    
    %% Identidad y Portabilidad (relación crítica)
    BC4 -->|registra ubicación inicial| REG
    BC4 -->|autoriza creación| BC1
    BC4 -->|autoriza creación| BC2
    BC5 -->|consulta registro| BC4
    BC5 -->|actualiza operador| BC4
    BC5 -->|actualiza ubicación| REG
    BC5 -->|coordina migración| BC3
    
    %% Supporting Domain Relationships
    BC6 -->|protege acceso a| BC1
    BC6 -->|protege acceso a| BC2
    BC7 -->|certifica documentos en| BC1
    BC7 -->|certifica documentos en| BC2
    
    %% Event-Driven Communication
    BC1 -.->|publica eventos| EVT
    BC2 -.->|publica eventos| EVT
    BC3 -.->|publica eventos| EVT
    BC4 -.->|publica eventos| EVT
    BC5 -.->|publica eventos| EVT
    BC6 -.->|publica eventos| EVT
    BC7 -.->|publica eventos| EVT
    EVT -.->|consume eventos| BC8
    EVT -.->|consume eventos| BC10
    
    %% Generic Subdomain Relationships
    BC9 -->|consume APIs vía| GW
    BC10 -->|lee metadatos vía| GW
    
    %% API Gateway
    GW -->|rutea a| BC1
    GW -->|rutea a| BC2
    GW -->|rutea a| BC3
    GW -->|rutea a| BC4
    GW -->|rutea a| BC5
    GW -->|autentica con| BC6
    
    %% Anti-Corruption Layers (ACL)
    BC1 -.-|ACL| BC4
    BC2 -.-|ACL| BC4
    BC5 -.-|ACL| BC4
    
    %% Styling
    style CORE fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style SUPPORT fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style GENERIC fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style INFRA fill:#e0e0e0,stroke:#424242,stroke-width:2px
    
    style BC1 fill:#bbdefb
    style BC2 fill:#bbdefb
    style BC3 fill:#bbdefb
    style BC4 fill:#bbdefb
    style BC5 fill:#bbdefb
    style BC6 fill:#ffe0b2
    style BC7 fill:#ffe0b2
    style BC8 fill:#e1bee7
    style BC9 fill:#e1bee7
    style BC10 fill:#e1bee7
```

## 3. Descripción Detallada de Cada Dominio
- Visualiza [Lenguaje Ubicuo](./1_lenguaje_ubicuo.md) para entender el dialecto usado en este dominio.
- Visualiza [Descripción del dominio](./2_domain-description.md) para tener una visión completa de entidades, agregados
