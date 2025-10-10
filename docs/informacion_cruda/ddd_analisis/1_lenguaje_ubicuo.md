## UBIQUITOUS LANGUAGE (Lenguaje Ubicuo)

Primero identifiquemos el **vocabulario del dominio** que utilizan los expertos del negocio (gobierno, ciudadanos, entidades) basándonos SOLO en el documento.

### Términos Clave del Dominio

| Término | Definición del Dominio | Sinónimos Evitar |
|---------|------------------------|------------------|
| **Carpeta Ciudadana** | Repositorio virtual personal donde se almacenan documentos del ciudadano a perpetuidad | "Sistema", "Plataforma", "Base de datos" |
| **Carpeta Institucional** | Repositorio virtual de una entidad donde almacena documentos emitidos y recibidos | "Cuenta empresarial", "Carpeta de empresa" |
| **Ciudadano** | Persona física registrada en el sistema con cédula válida | "Usuario", "Cliente", "Persona" |
| **Entidad Institucional** | Organización pública o privada (identificada por NIT) registrada en el sistema. Puede actuar con Rol Emisor, Rol Receptor, o ambos simultáneamente | "Empresa", "Institución", "Organización" |
| **Rol Emisor** | Capacidad de una entidad institucional para generar y enviar documentos certificados con firma digital | "Entidad Emisora", "Certificador" |
| **Rol Receptor** | Capacidad de una entidad institucional para solicitar y recibir documentos de ciudadanos | "Entidad Receptora", "Solicitante" |
| **Operador** | Empresa privada o pública que provee infraestructura para gestionar carpetas | "Proveedor", "Vendor", "Hosting" |
| **Centralizador** | Servicio del MinTIC que facilita interoperabilidad entre operadores | "Gateway", "Router central" |
| **Documento Certificado** | Documento firmado digitalmente por entidad avaladora | "Documento oficial", "Documento válido" |
| **Documento Temporal** | Documento subido por ciudadano sin firma de entidad | "Documento no certificado", "Documento borrador" |
| **Firma Digital** | Mecanismo criptográfico que garantiza autenticidad e integridad del documento | "Certificado digital", "Sello digital" |
| **Metadatos** | Información que describe, clasifica y contextualiza un documento | "Información del documento", "Atributos" |
| **Emisión** | Acción de una entidad de generar y enviar documento certificado a ciudadano | "Crear documento", "Publicar documento" |
| **Solicitud de Documentos** | Petición formal de una entidad para que ciudadano comparta documentos específicos | "Pedido", "Request" |
| **Autorización de Envío** | Consentimiento explícito del ciudadano para compartir documentos con entidad | "Permiso", "Aprobación" |
| **Portabilidad** | Transferencia de ciudadano/entidad de un operador a otro | "Migración", "Cambio de operador" |
| **Envío de Documento** | Transferencia de documento de una carpeta a otra | "Compartir", "Transferir" |
| **Almacenamiento a Perpetuidad** | Garantía de que documentos certificados se mantienen indefinidamente | "Permanente", "Para siempre" |
| **Servicio Premium** | Funcionalidad de pago ofrecida por operadores más allá de servicios básicos | "Servicio de pago", "Funcionalidad adicional" |
| **Interoperabilidad** | Capacidad de diferentes operadores de intercambiar documentos y datos | "Compatibilidad", "Integración" |
| **Registraduría** | Entidad del estado que valida identidad de ciudadanos | - |
| **Trámite** | Proceso administrativo para el cual se solicitan/envían documentos | "Proceso", "Gestión" |

### Frases del Lenguaje Ubicuo

Estas son frases que **deberían usarse** en conversaciones con expertos del dominio:

- "El ciudadano **autoriza el envío** de documentos a la entidad institucional"
- "La entidad institucional **con rol emisor emite un documento certificado** al ciudadano"
- "La entidad institucional **con rol receptor solicita documentos** al ciudadano para un trámite"
- "La universidad **actúa con ambos roles**: emite diplomas y recibe documentos de candidatos"
- "El operador **gestiona la carpeta** del ciudadano"
- "Los documentos certificados se **almacenan a perpetuidad**"
- "El ciudadano puede **solicitar portabilidad** a otro operador"
- "El centralizador **facilita la interoperabilidad** entre operadores"

Estas son frases que **NO deberían usarse** en conversaciones con expertos del dominio:

- "El usuario sube un archivo al servidor"
- "El sistema guarda el documento en la base de datos"
- "La empresa consulta la API para obtener datos"
