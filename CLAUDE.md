# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **academic project** for an advanced architecture course (EAFIT University, Semester 1) focused on designing a national digital document management system called **"Carpeta Ciudadana"** (Citizen Folder) for Colombia.

**Core Concept**: "El ciudadano no debe ser el mensajero del estado" (Citizens should not be the state's messenger) - citizens store documents digitally once and share them electronically instead of carrying physical copies.

**System Type**: Documentation and architectural design project (not implementation)

## Project Structure (Monorepo)

```
carpeta_ciudadana/
├── docs/                         # Documentation and architectural analysis
│   ├── ADR/                      # Architecture Decision Records
│   └── informacion_cruda/        # Raw analysis and requirements
│       ├── analisis.md           # Main system analysis with sequence diagrams
│       ├── 0_inquietudes.md      # Open questions and concerns
│       ├── 1_req_funcionales.md  # Functional requirements
│       ├── 2_req_no_funcionales.md  # Non-functional requirements (QoS)
│       ├── 3_mapeo_req_no_func_vs_qos.md  # QoS mapping
│       └── ddd_analisis/         # Domain-Driven Design analysis
│           ├── ddd__analisis.md  # DDD overview with domain diagrams
│           ├── 1_lenguaje_ubicuo.md  # Ubiquitous language definitions
│           └── 2_domain-description.md  # Detailed domain descriptions
├── services/                     # Microservices and applications
│   └── README.md                 # Service organization guide
├── libs/                         # Shared libraries and code
│   └── README.md                 # Shared libraries guide
├── infrastructure/               # Infrastructure as Code (Docker, K8s, Terraform)
│   └── README.md                 # Infrastructure setup guide
└── tools/                        # Scripts and development utilities
    └── README.md                 # Tools and automation guide
```

### Top-Level Directories

- **`docs/`**: All project documentation, domain analysis, requirements, and ADRs
- **`services/`**: Microservices and applications (each service uses its own technology stack)
- **`libs/`**: Shared libraries (domain models, utilities, event schemas, API clients)
- **`infrastructure/`**: IaC configurations, Docker, Kubernetes, monitoring
- **`tools/`**: Automation scripts, generators, CI/CD utilities

## Key Architecture Concepts

### System Actors
- **Ciudadanos** (Citizens): End users storing personal documents
- **Operadores Privados** (Private Operators): Infrastructure providers (e.g., "Mi Carpeta", "GovCarpeta")
- **MinTIC Centralizador** (MinTIC Centralizer): Interoperability coordinator (minimal storage/processing)
- **Entidades Emisoras** (Issuing Entities): Organizations that produce certified documents
- **Entidades Receptoras** (Receiving Entities): Organizations that receive documents from citizens

### Core Domains (DDD)
1. **Carpeta Personal** (Personal Folder) - Citizen document storage
2. **Carpeta Institucional** (Institutional Folder) - Entity document management
3. **Transferencia de Documentos** (Document Transfer) - P2P direct transfers between operators
4. **Identidad y Registro** (Identity & Registration) - Immutable email, identity verification
5. **Gestión de Portabilidad** (Portability Management) - Operator switching (72h window)

### Supporting Domains
- **Autenticación y Autorización** (Authentication & Authorization) - MFA, JWT, permissions
- **Firma y Certificación** (Digital Signature & Certification) - X.509 signatures

### Critical Requirements
- **Scale**: ~50 million Colombian citizens
- **Availability**: "Practically total" (~99.9%+)
- **Security**: Digital signatures, confidentiality, authorization
- **Interoperability**: Multiple operators must communicate directly (not through centralizer)
- **Usability**: Accessible to low-tech-literacy population
- **Centralizer Efficiency**: Minimal transactions, storage, and data transfer to MinTIC

## Ubiquitous Language (Use These Terms)

**Correct Domain Terms**:
- Carpeta Ciudadana (Citizen Folder) - not "sistema" or "plataforma"
- Documento Certificado (Certified Document) - digitally signed by authority
- Documento Temporal (Temporary Document) - uploaded without official signature
- Emisión (Issuance) - when entity generates certified document
- Solicitud de Documentos (Document Request) - formal request from entity to citizen
- Autorización de Envío (Send Authorization) - citizen's consent to share documents
- Portabilidad (Portability) - transferring between operators
- Almacenamiento a Perpetuidad (Perpetual Storage) - unlimited storage for certified docs

**Avoid These Terms**:
- "Usuario sube un archivo al servidor" → Use "Ciudadano almacena documento en su carpeta"
- "Sistema guarda en base de datos" → Use domain-appropriate language
- "API consulta" → Use "Operador solicita ubicación al centralizador"

## Working with This Repository

### Viewing Diagrams
All architecture diagrams use **Mermaid** syntax embedded in markdown:
- `docs/informacion_cruda/analisis.md` - Main flows (registration, document reception, sending, requests)
- `docs/informacion_cruda/ddd_analisis/ddd__analisis.md` - Domain architecture and context maps

To view: Use a Mermaid-compatible markdown viewer or GitHub's built-in rendering.

### Adding Architecture Decision Records (ADRs)
When creating ADRs in `docs/ADR/`:
1. Use format: `NNNN-title-of-decision.md` (e.g., `0001-use-event-driven-architecture.md`)
2. Include: Context, Decision, Consequences, Status (Proposed/Accepted/Deprecated)
3. Reference relevant functional/non-functional requirements

### Key Open Questions
See `docs/informacion_cruda/0_inquietudes.md` for unresolved architectural questions including:
- Email generation: Who generates `@carpetacolombia.co` emails? (Operator or MinTIC?)
- Entity verification: What validation process for institutional registration?
- Availability targets: Specific uptime % (99.9%? 99.95%?)
- Authentication method: MFA requirements, biometric support?
- Digital signature standard: Which format? (ADES, XAdES, PAdES?)

### Working with Requirements
- **Functional**: `docs/informacion_cruda/1_req_funcionales.md` (RF-OP-XX format)
- **Non-functional**: `docs/informacion_cruda/2_req_no_funcionales.md` (RNF-XX format)
- When referencing requirements, use their ID codes (e.g., "This ADR addresses RNF-05.4 and RF-OP-02.1")

## Important Architectural Constraints

1. **Centralizador Minimalista**: MinTIC's centralizer only provides location registry (citizen/entity → operator), NOT document storage or routing
2. **Transferencias Directas**: Document transfers occur P2P between operators, bypassing centralizer
3. **Email Inmutable**: Citizen email addresses are permanent and cannot change
4. **Un Ciudadano, Un Operador**: Citizens can only be registered with one operator at a time
5. **Interoperabilidad Sin Restricciones Tecnológicas**: Operators choose their own technology stack
6. **Cloud Permitido**: Storage can be in cloud, even outside Colombia

## Academic Context

This is coursework for advanced architecture design. Focus on:
- Architectural patterns and tactics for quality attributes (scalability, availability, security, etc.)
- DDD bounded contexts and context mapping
- Distributed systems design (inter-operator communication)
- Quality attribute tradeoffs and architectural decisions
- Spanish language documentation (this is a Colombian government case study)

