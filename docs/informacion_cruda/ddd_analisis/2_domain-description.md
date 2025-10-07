# Descripción de Dominios - Sistema Carpeta Ciudadana

## Clasificación Estratégica de Dominios

Según Domain-Driven Design (Eric Evans), los dominios se clasifican en tres categorías según su valor estratégico:

- **CORE DOMAIN**: Lógica de negocio diferenciadora, ventaja competitiva del sistema
- **SUPPORTING DOMAIN**: Necesario para el funcionamiento pero no diferenciador
- **GENERIC SUBDOMAIN**: Funcionalidad común que podría comprarse o usar soluciones estándar

---

# CORE DOMAIN - Gestión de Documentos e Identidad

Los siguientes Bounded Contexts constituyen el núcleo diferenciador del sistema Carpeta Ciudadana. Representan la lógica de negocio única que proporciona ventaja competitiva y no puede ser fácilmente reemplazada por soluciones genéricas.

## 1. Bounded Context: Carpeta Personal

### Propósito
Gestionar el repositorio virtual personal de cada ciudadano donde almacenan a perpetuidad documentos certificados y no certificados, con garantías de seguridad equivalentes a apostillas y autenticaciones físicas.

### Responsabilidades Principales
- Crear y mantener carpetas ciudadanas únicas
- Almacenar documentos certificados sin límite de tamaño
- Gestionar documentos temporales (no certificados) con límites por usuario
- Proporcionar acceso seguro a documentos propios
- Permitir compartir documentos con terceros previa autorización
- Mantener historial completo de accesos y modificaciones
- Generar direcciones de correo permanentes e inmutables

### Modelo de Dominio

#### Aggregate Root: **CarpetaCiudadano**
```
CarpetaCiudadano
├── carpetaId: CarpetaId (UUID)
├── propietario: PropietarioCarpeta
├── emailCarpeta: EmailCarpeta (inmutable)
├── estado: EstadoCarpeta [ACTIVA, SUSPENDIDA, MIGRACIÓN]
├── operadorActual: OperadorId
├── documentos: List<Documento>
├── espacioUtilizado: EspacioAlmacenamiento
└── fechaCreacion: DateTime

Métodos de negocio:
+ agregarDocumentoCertificado(documento, firmante)
+ agregarDocumentoTemporal(documento) throws LimiteExcedidoException
+ compartirDocumentos(documentos, destinatario, autorizacion)
+ eliminarDocumentoTemporal(documentoId)
+ consultarHistorialAcceso(filtros)
```

#### Entity: **Documento**
```
Documento
├── documentoId: DocumentoId (UUID)
├── metadata: MetadataDocumento
│   ├── titulo: String
│   ├── tipo: TipoDocumento [CEDULA, DIPLOMA, ACTA_GRADO, CERTIFICADO_LABORAL, ...]
│   ├── contexto: ContextoDocumento [EDUCACION, NOTARIA, REGISTRADURIA, SALUD, ...]
│   ├── fechaEmision: DateTime
│   ├── vigencia: PeriodoVigencia
│   └── tags: List<String>
├── contenido: ContenidoDocumento
│   ├── formato: FormatoArchivo [PDF, JPEG, PNG]
│   ├── tamañoBytes: Long
│   ├── hash: HashDocumento (SHA-256)
│   └── urlAlmacenamiento: URL
├── certificacion: CertificacionDocumento?
│   ├── firmadoPor: EmisorCertificado
│   ├── firmaDigital: FirmaDigital
│   └── certificadoValidez: Certificado
├── estadoDocumento: EstadoDocumento [TEMPORAL, CERTIFICADO, REVOCADO]
└── fechaRecepcion: DateTime

Métodos de negocio:
+ validarIntegridad(): Boolean
+ verificarCertificacion(): ResultadoVerificacion
+ esDescargable(): Boolean
+ obtenerVistaPrevia(): Preview
```

#### Value Object: **PropietarioCarpeta**
```
PropietarioCarpeta (immutable)
├── cedula: Cedula
├── nombreCompleto: NombreCompleto
├── fechaNacimiento: Date
└── paisOrigen: Pais
```

#### Value Object: **EmailCarpeta**
```
EmailCarpeta (immutable)
├── direccion: String (formato: nombre.apellido.cedula@carpetacolombia.co)
└── dominio: String (carpetacolombia.co)

Regla de negocio:
- Se genera UNA SOLA VEZ al crear la carpeta
- NUNCA puede cambiarse (inmutable de por vida)
- Formato: [primer_nombre].[primer_apellido].[cedula]@carpetacolombia.co
```

#### Entity: **HistorialAcceso**
```
HistorialAcceso
├── accesoId: UUID
├── documentoId: DocumentoId
├── fechaHora: DateTime
├── tipoAcceso: TipoAcceso [LECTURA, DESCARGA, COMPARTIR]
├── actor: Actor (quien accedió)
├── ipOrigen: IPAddress
└── resultado: ResultadoAcceso [EXITOSO, DENEGADO]
```

### Eventos de Dominio que Publica

```
1. CarpetaCiudadanoCreada
   - carpetaId
   - cedula
   - emailCarpeta
   - operadorId
   - fechaCreacion

2. DocumentoCertificadoRecibido
   - carpetaId
   - documentoId
   - emisorId
   - tipoDocumento
   - contexto
   - tamañoBytes

3. DocumentoTemporalAgregado
   - carpetaId
   - documentoId
   - tipoDocumento

4. DocumentosCompartidos
   - carpetaId
   - documentoIds[]
   - destinatarioId
   - autorizacionId
   - fechaAutorizacion

5. LimiteEspacioTemporalExcedido
   - carpetaId
   - espacioUtilizado
   - espacioMaximo

6. DocumentoEliminado
   - carpetaId
   - documentoId
   - razon
```

### Eventos de Dominio que Consume

```
1. PortabilidadCompletada (de Identidad y Registro)
   → Actualizar operadorActual
   
2. DocumentoCertificado (de Firma y Certificación)
   → Actualizar estado de documento temporal a certificado
   
3. AutorizacionRevocada (de Autenticación y Autorización)
   → Invalidar permisos de acceso compartido
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Transferencia Documentos | Customer/Supplier | Solicitar envío de documentos a terceros |
| Identidad y Registro | Customer/Supplier + ACL | Obtener información del propietario (protegida con ACL) |
| Autenticación y Autorización | Customer/Supplier | Validar permisos de acceso |
| Firma y Certificación | Customer/Supplier | Certificar documentos temporales |
| Notificaciones | Published Language (Event Bus) | Notificar eventos a ciudadanos |

### Reglas de Negocio Críticas

1. **Límite de Documentos Temporales**
   - Máximo 100 documentos temporales por carpeta
   - Máximo 500 MB de espacio para documentos temporales
   - Documentos certificados: ilimitados

2. **Inmutabilidad del Email**
   - El email se genera al crear la carpeta
   - Nunca puede modificarse, incluso tras portabilidad

3. **Permanencia de Documentos Certificados**
   - Los documentos certificados NO pueden eliminarse
   - Solo pueden marcarse como "revocados" por el emisor original

4. **Integridad de Documentos**
   - Todo documento almacena un hash SHA-256
   - Verificación de integridad antes de cada descarga

5. **Trazabilidad Total**
   - Todo acceso/modificación queda registrado en HistorialAcceso
   - Auditoría completa para cumplimiento legal

---

## 2. Bounded Context: Carpeta Institucional

### Propósito
Gestionar carpetas virtuales para instituciones (públicas y privadas) que emiten y reciben documentos, permitiéndoles certificar documentos para ciudadanos y gestionar solicitudes de documentación.

### Responsabilidades Principales
- Crear y gestionar carpetas institucionales
- Emitir documentos certificados firmados digitalmente
- Recibir paquetes de documentos de ciudadanos
- Procesar solicitudes de documentos a ciudadanos
- Mantener registro de documentos emitidos y recibidos
- Integración con sistemas internos de instituciones

### Modelo de Dominio

#### Aggregate Root: **CarpetaInstitucion**
```
CarpetaInstitucion
├── institucionId: InstitucionId
├── informacion: InformacionInstitucion
│   ├── nit: NIT
│   ├── razonSocial: String
│   ├── tipoInstitucion: TipoInstitucion [PUBLICA, PRIVADA, MIXTA]
│   ├── sector: SectorInstitucion [EDUCACION, SALUD, NOTARIA, GOBIERNO, ...]
│   └── personasAutorizadas: List<PersonaAutorizada>
├── operadorAfiliado: OperadorId
├── convenioOperador: ConvenioOperador
├── documentosEmitidos: List<DocumentoEmitido>
├── documentosRecibidos: List<DocumentoRecibido>
├── solicitudesActivas: List<SolicitudDocumento>
└── fechaRegistro: DateTime

Métodos de negocio:
+ emitirDocumentoCertificado(destinatario, documento, firmante)
+ recibirPaqueteDocumentos(origen, documentos)
+ solicitarDocumentos(ciudadano, documentosRequeridos, proposito)
+ cancelarSolicitud(solicitudId, motivo)
+ consultarEstadoSolicitud(solicitudId)
```

#### Entity: **DocumentoEmitido**
```
DocumentoEmitido
├── documentoId: DocumentoId
├── destinatarioCedula: Cedula
├── tipoDocumento: TipoDocumento
├── metadata: MetadataDocumento
├── contenido: ContenidoDocumento
├── firmaInstitucional: FirmaDigital
├── certificado: Certificado
├── funcionarioEmite: FuncionarioAutorizado
├── fechaEmision: DateTime
├── estadoEntrega: EstadoEntrega [PENDIENTE, ENTREGADO, FALLIDO]
└── intentosEnvio: List<IntentoEnvio>

Métodos de negocio:
+ enviarADestinatario(): TransferenciaId
+ reintentarEnvio(): void
+ validarAutorizacionFuncionario(): Boolean
```

#### Entity: **DocumentoRecibido**
```
DocumentoRecibido
├── documentoId: DocumentoId
├── remitente: Remitente
│   ├── tipo: TipoRemitente [CIUDADANO, INSTITUCION]
│   ├── identificacion: String
│   └── nombre: String
├── contextoRecepcion: ContextoRecepcion
│   ├── solicitudRelacionada: SolicitudId?
│   ├── expediente: ExpedienteId?
│   └── proposito: String
├── documento: Documento
├── fechaRecepcion: DateTime
└── estadoProcesamiento: EstadoProcesamiento [RECIBIDO, EN_REVISION, APROBADO, RECHAZADO]
```

#### Entity: **SolicitudDocumento**
```
SolicitudDocumento (Aggregate)
├── solicitudId: SolicitudId
├── ciudadanoSolicitado: Cedula
├── documentosRequeridos: List<DocumentoRequerido>
│   └── DocumentoRequerido
│       ├── tipoDocumento: TipoDocumento
│       ├── especificaciones: Especificaciones
│       ├── obligatorio: Boolean
│       └── estadoEntrega: EstadoEntregaDocumento [PENDIENTE, ENTREGADO, RECHAZADO]
├── proposito: ProposituoSolicitud
├── fechaLimite: DateTime?
├── canalNotificacion: CanalNotificacion [EMAIL, SMS, AMBOS]
├── estadoSolicitud: EstadoSolicitud [CREADA, NOTIFICADA, EN_PROCESO, COMPLETADA, CANCELADA, VENCIDA]
├── respuestaCiudadano: RespuestaSolicitud?
└── fechaCreacion: DateTime

Métodos de negocio:
+ notificarCiudadano(): void
+ recibirAutorizacion(autorizacion, documentos): void
+ recibirRechazo(motivo): void
+ verificarCompletitud(): Boolean
+ marcarVencida(): void
```

### Eventos de Dominio que Publica

```
1. CarpetaInstitucionCreada
   - institucionId
   - nit
   - razonSocial
   - tipoInstitucion
   - operadorId

2. DocumentoCertificadoEmitido
   - documentoId
   - institucionId
   - destinatarioCedula
   - tipoDocumento
   - firmante

3. SolicitudDocumentoCreada
   - solicitudId
   - institucionId
   - ciudadanoCedula
   - documentosRequeridos[]
   - fechaLimite

4. PaqueteDocumentosRecibido
   - institucionId
   - remitente
   - cantidadDocumentos
   - solicitudRelacionada?

5. SolicitudDocumentoCompletada
   - solicitudId
   - institucionId
   - ciudadanoCedula
   - documentosRecibidos[]
```

### Eventos de Dominio que Consume

```
1. AutorizacionEnvioOtorgada (de Autenticación y Autorización)
   → Procesar respuesta a solicitud de documentos
   
2. TransferenciaCompletada (de Transferencia Documentos)
   → Actualizar estado de documentos emitidos
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Transferencia Documentos | Customer/Supplier | Enviar documentos certificados a ciudadanos |
| Identidad y Registro | Customer/Supplier + ACL | Validar existencia de ciudadanos/instituciones |
| Firma y Certificación | Customer/Supplier | Firmar digitalmente documentos emitidos |
| Autenticación y Autorización | Customer/Supplier | Gestionar autorizaciones de funcionarios |
| Notificaciones | Published Language (Event Bus) | Notificar solicitudes a ciudadanos |

### Reglas de Negocio Críticas

1. **Emisión de Documentos Certificados**
   - Solo funcionarios autorizados pueden emitir documentos
   - Todo documento debe estar firmado digitalmente
   - Los documentos emitidos son inmutables

2. **Solicitudes de Documentos**
   - Una solicitud puede contener múltiples documentos
   - Las solicitudes pueden tener fecha límite
   - Ciudadano puede rechazar solicitud (no está obligado)

3. **Convenio con Operador**
   - La institución debe tener convenio activo con un operador
   - El convenio define servicios disponibles y tarifas

4. **Integración con Sistemas Legados**
   - APIs para integrarse con sistemas internos de instituciones
   - Webhooks para notificar eventos a sistemas externos

---

## 3. Bounded Context: Transferencia Documentos

### Propósito
Orquestar el envío directo de documentos entre operadores, garantizando entrega confiable, trazabilidad completa y mínima intervención del centralizador del MinTIC.

### Responsabilidades Principales
- Coordinar transferencias de documentos entre operadores
- Consultar ubicación de destinatarios en Service Registry
- Realizar envío directo punto a punto (no pasa por MinTIC)
- Gestionar reintentos y manejo de errores en transferencias
- Mantener tracking completo del estado de transferencias
- Soportar transferencias individuales y por lotes (paquetes)

### Modelo de Dominio

#### Aggregate Root: **Transferencia**
```
Transferencia
├── transferenciaId: TransferenciaId (UUID)
├── origen: OrigenTransferencia
│   ├── operadorId: OperadorId
│   ├── remitenteId: String (CarpetaId o InstitucionId)
│   ├── tipoRemitente: TipoActor [CIUDADANO, INSTITUCION]
│   └── contactoRemitente: Contacto
├── destino: DestinoTransferencia
│   ├── operadorId: OperadorId
│   ├── destinatarioId: String
│   ├── tipoDestinatario: TipoActor
│   └── contactoDestinatario: Contacto
├── paquete: PaqueteDocumentos
│   ├── documentos: List<DocumentoTransferencia>
│   ├── tamañoTotal: Long (bytes)
│   ├── hashPaquete: Hash
│   └── metadataPaquete: MetadataPaquete
├── configuracion: ConfiguracionTransferencia
│   ├── prioridad: Prioridad [BAJA, NORMAL, ALTA, URGENTE]
│   ├── requiereConfirmacion: Boolean
│   ├── intentosMaximos: Int
│   └── timeoutSegundos: Int
├── tracking: TrackingTransferencia
│   ├── estado: EstadoTransferencia [INICIADA, UBICANDO_DESTINO, EN_TRANSITO, ENTREGADA, FALLIDA, CANCELADA]
│   ├── intentos: List<IntentoTransferencia>
│   ├── fechaInicio: DateTime
│   ├── fechaCompletado: DateTime?
│   └── duracionMs: Long?
├── resultado: ResultadoTransferencia?
│   ├── exitosa: Boolean
│   ├── mensajeError: String?
│   ├── confirmacionDestinatario: Confirmacion?
│   └── evidencia: EvidenciaEntrega
└── contexto: ContextoTransferencia (para análisis)

Métodos de negocio:
+ iniciarTransferencia(): void
+ ubicarDestinatario(): OperadorDestino
+ enviarAOperadorDestino(): void
+ registrarIntento(resultado): void
+ marcarComoEntregada(confirmacion): void
+ marcarComoFallida(error): void
+ reintentar(): void throws MaximosIntentosException
```

#### Value Object: **DocumentoTransferencia**
```
DocumentoTransferencia (immutable)
├── documentoId: DocumentoId
├── metadata: MetadataDocumento
├── contenido: ContenidoEncriptado
│   ├── algoritmoEncripcion: AlgoritmoEncripcion
│   ├── bytesEncriptados: byte[]
│   └── claveEncripcion: ClaveEncriptada (para operador destino)
├── firma: FirmaDigital
└── checksum: Hash (para validar integridad)
```

#### Entity: **IntentoTransferencia**
```
IntentoTransferencia
├── numeroIntento: Int
├── fechaHoraIntento: DateTime
├── operadorDestino: OperadorId
├── endpointDestino: URL
├── tiempoRespuestaMs: Long?
├── resultado: ResultadoIntento [EXITOSO, TIMEOUT, ERROR_RED, ERROR_AUTENTICACION, ERROR_DESTINO]
├── codigoHTTP: Int?
├── mensajeError: String?
└── proximoIntento: DateTime?
```

#### Value Object: **PaqueteDocumentos**
```
PaqueteDocumentos (immutable)
├── paqueteId: UUID
├── documentos: List<DocumentoTransferencia>
├── cantidadDocumentos: Int
├── tamañoTotalBytes: Long
├── manifiesto: Manifiesto
│   └── lista completa de documentoIds, tipos, tamaños
└── hashPaquete: Hash (del paquete completo)
```

### Eventos de Dominio que Publica

```
1. TransferenciaIniciada
   - transferenciaId
   - origenOperadorId
   - destinatarioId
   - cantidadDocumentos
   - tamañoTotal

2. DestinatarioUbicado
   - transferenciaId
   - destinoOperadorId
   - tiempoConsulta

3. TransferenciaEnTransito
   - transferenciaId
   - numeroIntento
   - endpointDestino

4. TransferenciaCompletada
   - transferenciaId
   - duracionTotal
   - cantidadIntentos
   - confirmacionDestinatario

5. TransferenciaFallida
   - transferenciaId
   - razonFallo
   - cantidadIntentos
   - ultimoError

6. TransferenciaCancelada
   - transferenciaId
   - razonCancelacion
   - solicitadoPor
```

### Eventos de Dominio que Consume

```
(Este contexto típicamente no consume eventos, es más bien un orquestador)
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Service Registry (MinTIC) | Published Language | Consultar ubicación de destinatarios |
| Carpeta Personal | Supplier (upstream) | Recibe solicitudes de envío de ciudadanos |
| Carpeta Institucional | Supplier (upstream) | Recibe solicitudes de emisión de instituciones |
| Notificaciones | Published Language (Event Bus) | Notificar eventos de transferencias |

### Reglas de Negocio Críticas

1. **Transferencia Directa Obligatoria**
   - Las transferencias SIEMPRE son directas entre operadores
   - El centralizador MinTIC NUNCA es intermediario
   - MinTIC solo proporciona servicio de ubicación (registry)

2. **Integridad y Seguridad**
   - Todo documento se transfiere encriptado
   - Se valida checksum al recibir
   - Las firmas digitales se preservan intactas

3. **Reintentos Automáticos**
   - Hasta 3 intentos automáticos en caso de fallo temporal
   - Backoff exponencial entre intentos (1s, 5s, 15s)
   - Después de 3 fallos, requiere intervención manual

4. **Latencia Mínima**
   - Tiempo máximo de consulta al registry: 500ms
   - Tiempo máximo de transferencia (SLA): 5 segundos para <10MB
   - Monitoreo activo de latencias

5. **Trazabilidad Completa**
   - Cada intento queda registrado con timestamp
   - Tracking end-to-end de toda transferencia
   - Evidencia de entrega firmada por operador destino

---

## 4. Bounded Context: Identidad y Registro

### Propósito
Gestionar el registro único y la identidad digital permanente de ciudadanos e instituciones en el sistema. Este BC es responsable de crear la identidad digital del ciudadano (incluyendo el email inmutable) y mantener el registro maestro de afiliaciones a operadores.

### Responsabilidades Principales
- Registrar ciudadanos por primera vez con verificación de Registraduría
- Generar y asignar email de carpeta inmutable (una sola vez, para siempre)
- Registrar instituciones con verificación jurídica
- Gestionar afiliación inicial ciudadano/institución ↔ operador
- Mantener registro maestro de todos los actores del sistema
- Proporcionar servicio de "¿quién es este ciudadano?" (datos de identidad)
- Registrar la ubicación inicial en el Service Registry del MinTIC
- Mantener historial de afiliaciones (para auditoría)

**IMPORTANTE:** Este BC NO maneja portabilidad (cambio de operador). Esa responsabilidad está en el BC "Gestión de Portabilidad".

### Modelo de Dominio

#### Aggregate Root: **RegistroCiudadano**
```
RegistroCiudadano
├── ciudadanoId: CiudadanoId (UUID interno)
├── cedula: Cedula (identificador externo único)
├── datosPersonales: DatosPersonales
│   ├── nombres: String
│   ├── apellidos: String
│   ├── fechaNacimiento: Date
│   ├── lugarNacimiento: Municipio
│   └── genero: Genero
├── verificacion: VerificacionIdentidad
│   ├── verificadoPor: AutoridadVerificadora [REGISTRADURIA]
│   ├── fechaVerificacion: DateTime
│   ├── estadoVerificacion: EstadoVerificacion [PENDIENTE, VERIFICADO, RECHAZADO]
│   └── documentoReferencia: NumeroDocumento
├── afiliacionActual: Afiliacion
│   ├── operadorId: OperadorId
│   ├── nombreOperador: String
│   ├── fechaAfiliacion: DateTime
│   ├── estadoAfiliacion: EstadoAfiliacion [ACTIVA, EN_PORTABILIDAD, SUSPENDIDA]
│   └── emailCarpeta: EmailCarpeta (generado UNA SOLA VEZ, INMUTABLE)
├── historialAfiliaciones: List<AfiliacionHistorica>
└── fechaRegistro: DateTime

Métodos de negocio:
+ registrar(cedula, operadorSeleccionado): RegistroCiudadano
+ verificarConRegistraduria(): ResultadoVerificacion
+ generarEmailInmutable(): EmailCarpeta
+ registrarEnServiceRegistry(): void
+ suspenderAfiliacion(motivo): void
+ marcarEnPortabilidad(): void (llamado por BC Portabilidad)
+ actualizarOperadorTrasPortabilidad(nuevoOperador): void (llamado por BC Portabilidad)
```

#### Aggregate Root: **RegistroInstitucion**
```
RegistroInstitucion
├── institucionId: InstitucionId (UUID interno)
├── nit: NIT (identificador externo único)
├── datosInstitucionales: DatosInstitucionales
│   ├── razonSocial: String
│   ├── nombreComercial: String?
│   ├── tipoInstitucion: TipoInstitucion
│   ├── sector: SectorInstitucion
│   ├── representanteLegal: PersonaNatural
│   └── contacto: ContactoInstitucional
├── verificacion: VerificacionJuridica
│   ├── verificadoPor: AutoridadVerificadora [CAMARA_COMERCIO, SUPERINTENDENCIA]
│   ├── estadoVerificacion: EstadoVerificacion
│   └── certificadoExistencia: DocumentoReferencia
├── afiliacionActual: Afiliacion
├── convenioActivo: ConvenioOperador
│   ├── tipoConvenio: TipoConvenio [BASICO, PREMIUM, PERSONALIZADO]
│   ├── serviciosIncluidos: List<ServicioIncluido>
│   ├── vigencia: PeriodoVigencia
│   └── condicionesComerciales: CondicionesComerciales
├── historialAfiliaciones: List<AfiliacionHistorica>
└── fechaRegistro: DateTime

Métodos de negocio:
+ registrar(nit, operadorSeleccionado): RegistroInstitucion
+ verificarExistenciaJuridica(): ResultadoVerificacion
+ establecerConvenio(convenio): void
+ renovarConvenio(): void
+ marcarEnPortabilidad(): void
+ actualizarOperadorTrasPortabilidad(nuevoOperador): void
```

#### Value Object: **EmailCarpeta**
```
EmailCarpeta (immutable - CRÍTICO)
├── direccion: String (formato: nombre.apellido.cedula@carpetacolombia.co)
└── dominio: String (carpetacolombia.co)

Regla de negocio CRÍTICA:
- Se genera UNA SOLA VEZ al crear el registro
- NUNCA puede cambiarse (inmutable de por vida)
- Sobrevive a todas las portabilidades
- Formato: [primer_nombre].[primer_apellido].[cedula]@carpetacolombia.co
- Es la identidad permanente del ciudadano en el sistema
```

#### Value Object: **Afiliacion**
```
Afiliacion (immutable)
├── operadorId: OperadorId
├── nombreOperador: String
├── fechaAfiliacion: DateTime
├── emailCarpeta: EmailCarpeta (solo para ciudadanos)
└── estadoAfiliacion: EstadoAfiliacion
```

### Eventos de Dominio que Publica

```
1. CiudadanoRegistrado
   - ciudadanoId
   - cedula
   - nombresCompletos
   - operadorId
   - emailCarpeta (IMPORTANTE: primera y única vez)
   - fechaRegistro

2. InstitucionRegistrada
   - institucionId
   - nit
   - razonSocial
   - operadorId
   - tipoInstitucion
   - fechaRegistro

3. VerificacionIdentidadCompletada
   - ciudadanoId/institucionId
   - resultado
   - verificadoPor
   - fechaVerificacion

4. AfiliacionSuspendida
   - actorId
   - tipoActor
   - motivoSuspension
   - fechaSuspension

5. EstadoAfiliacionActualizado
   - actorId
   - estadoAnterior
   - estadoNuevo
   - motivo
```

### Eventos de Dominio que Consume

```
1. PortabilidadIniciada (de Gestión de Portabilidad)
   → Marcar registro como EN_PORTABILIDAD

2. PortabilidadCompletada (de Gestión de Portabilidad)
   → Actualizar operadorActual y agregar al historial

3. PortabilidadFallida (de Gestión de Portabilidad)
   → Revertir estado a ACTIVA

4. CarpetaCiudadanoCreada (de Carpeta Personal)
   → Validar que ciudadano esté registrado

5. CarpetaInstitucionCreada (de Carpeta Institucional)
   → Validar que institución esté registrada
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Service Registry (MinTIC) | Published Language | Registrar ubicaciones iniciales |
| Gestión de Portabilidad | Supplier (upstream) | Proporciona datos de registro, recibe actualizaciones |
| Carpeta Personal | Supplier (upstream) | Proporciona datos del ciudadano para crear carpeta |
| Carpeta Institucional | Supplier (upstream) | Proporciona datos de institución |

### Reglas de Negocio Críticas

1. **Unicidad de Registro**
   - Una cédula = Un solo registro ciudadano (ÚNICO en todo el sistema)
   - Un NIT = Un solo registro institución (ÚNICO en todo el sistema)
   - No puede haber duplicados bajo ninguna circunstancia
   - El sistema debe validar unicidad antes de crear

2. **Verificación Obligatoria**
   - Ciudadano: verificación con Registraduría ANTES de registro
   - Institución: verificación jurídica ANTES de registro
   - Sin verificación exitosa, NO hay registro
   - La verificación es un prerequisito no negociable

3. **Inmutabilidad del Email (CRÍTICO)**
   - El email se genera UNA SOLA VEZ al crear el registro
   - NUNCA cambia, incluso después de múltiples portabilidades
   - Es la identidad permanente del ciudadano
   - Garantiza continuidad de comunicaciones para siempre
   - **No puede ser cambiado por nadie: ni ciudadano, ni operador, ni MinTIC**

4. **Afiliación Exclusiva**
   - Un ciudadano solo puede estar afiliado a UN operador a la vez
   - Una institución solo puede tener convenio con UN operador a la vez
   - Durante portabilidad, estado cambia a "EN_PORTABILIDAD"

5. **Separación de Responsabilidades**
   - Este BC NO maneja cambios de operador (portabilidad)
   - Solo registra la afiliación inicial
   - La portabilidad es responsabilidad del BC "Gestión de Portabilidad"

6. **Registro en Service Registry**
   - Todo registro debe actualizarse en el Service Registry de MinTIC
   - El registry es sincronizado inmediatamente tras registro exitoso
   - Si falla el registro en MinTIC, hacer rollback del registro local

---

## 5. Bounded Context: Gestión de Portabilidad

### Propósito
Orquestar el proceso completo de cambio de operador (portabilidad) para ciudadanos e instituciones, garantizando migración exitosa de datos, continuidad del servicio, y cumplimiento del plazo legal de 72 horas. Este es un proceso crítico y diferenciador del sistema.

### Responsabilidades Principales
- Iniciar y orquestar procesos de portabilidad
- Coordinar entre operador origen y operador destino
- Gestionar migración de documentos entre operadores
- Actualizar el Service Registry del MinTIC tras portabilidad exitosa
- Garantizar cumplimiento del plazo de 72 horas (requisito legal)
- Manejar rollback en caso de fallo durante migración
- Mantener trazabilidad completa del proceso
- Validar integridad de datos migrados
- Notificar a todas las partes involucradas

**DIFERENCIA CON IDENTIDAD Y REGISTRO:**
- Identidad = Crear identidad digital (registro inicial)
- Portabilidad = Migrar identidad digital entre operadores

### Modelo de Dominio

#### Aggregate Root (Proceso): **ProcesoPortabilidad**
```
ProcesoPortabilidad (Process Aggregate)
├── portabilidadId: PortabilidadId
├── actorId: String (CiudadanoId o InstitucionId)
├── tipoActor: TipoActor [CIUDADANO, INSTITUCION]
├── operadorOrigen: OperadorId (NUNCA null - debe existir)
├── operadorDestino: OperadorId
├── motivacion: MotivoPortabilidad
├── solicitante: Solicitante
│   ├── tipo: TipoSolicitante [CIUDADANO, INSTITUCION, OPERADOR]
│   ├── fechaSolicitud: DateTime
│   └── consentimientoExplicito: Boolean
├── fases: List<FasePortabilidad>
│   └── FasePortabilidad
│       ├── nombre: NombreFase [SOLICITUD, VALIDACION, MIGRACION_DATOS, ACTUALIZACION_REGISTRY, CONFIRMACION]
│       ├── estado: EstadoFase [PENDIENTE, EN_PROCESO, COMPLETADA, FALLIDA]
│       ├── fechaInicio: DateTime?
│       ├── fechaFin: DateTime?
│       ├── responsable: ActorResponsable (cual operador)
│       └── resultado: ResultadoFase?
├── estadoGeneral: EstadoPortabilidad [INICIADA, EN_PROGRESO, COMPLETADA, CANCELADA, FALLIDA]
├── migracionDatos: MigracionDatos
│   ├── documentosAMigrar: List<DocumentoId>
│   ├── documentosMigrados: List<DocumentoId>
│   ├── documentosFallidos: List<DocumentoFallido>
│   ├── tamañoTotalMB: Decimal
│   ├── progreso: ProgresoMigracion
│   └── validacionIntegridad: ResultadoValidacion
├── coordinacion: CoordinacionOperadores
│   ├── notificacionOperadorOrigen: NotificacionEnviada
│   ├── acuseReciboOrigen: AcuseRecibo?
│   ├── notificacionOperadorDestino: NotificacionEnviada
│   ├── acuseReciboDestino: AcuseRecibo?
│   └── comunicaciones: List<Comunicacion>
├── plazos: ControlPlazos
│   ├── fechaSolicitud: DateTime
│   ├── plazoMaximo: DateTime (72 horas desde solicitud)
│   ├── fechaCompletado: DateTime?
│   ├── duracionReal: Duration?
│   └── alertasVencimiento: List<Alerta>
├── rollback: InformacionRollback?
│   ├── razonRollback: String
│   ├── faseEnFallo: NombreFase
│   ├── fechaRollback: DateTime
│   └── datosRestaurados: Boolean
└── auditoriaPortabilidad: AuditoriaPortabilidad
    ├── eventos: List<EventoAuditoria>
    └── evidencias: List<Evidencia>

Métodos de negocio:
+ iniciar(ciudadano, operadorDestino, motivacion): ProcesoPortabilidad
+ validarPrecondiciones(): ResultadoValidacion
+ notificarOperadores(): void
+ iniciarMigracion(): void
+ validarIntegridadDatos(): ResultadoValidacion
+ actualizarRegistry(): void
+ completar(): void
+ cancelar(motivo): void
+ rollback(razon): void
+ verificarPlazo(): EstadoPlazo [DENTRO_PLAZO, PROXIMO_VENCER, VENCIDO]
+ avanzarFase(fase): void
```

#### Entity: **FasePortabilidad**
```
FasePortabilidad
├── faseId: UUID
├── nombre: NombreFase
├── descripcion: String
├── ordenEjecucion: Int
├── estado: EstadoFase
├── responsable: ActorResponsable [OPERADOR_ORIGEN, OPERADOR_DESTINO, MINTIC]
├── accionesPendientes: List<AccionPendiente>
├── accionesCompletadas: List<AccionCompletada>
├── fechaInicio: DateTime?
├── fechaFin: DateTime?
├── duracion: Duration?
├── intentos: Int
├── resultado: ResultadoFase?
└── logs: List<LogFase>

Métodos:
+ iniciar(): void
+ completar(resultado): void
+ fallar(error): void
+ reintentar(): void
```

#### Value Object: **MigracionDatos**
```
MigracionDatos
├── documentosAMigrar: List<DocumentoId>
├── tamañoTotalMB: Decimal
├── progreso: ProgresoMigracion
│   ├── documentosCompletados: Int
│   ├── documentosPendientes: Int
│   ├── porcentajeCompletado: Decimal
│   └── tiempoEstimadoRestante: Duration?
├── validaciones: List<ValidacionIntegridad>
│   └── ValidacionIntegridad
│       ├── documentoId: DocumentoId
│       ├── hashOriginal: Hash
│       ├── hashDestino: Hash
│       ├── integridadVerificada: Boolean
│       └── fechaValidacion: DateTime
└── errores: List<ErrorMigracion>
```

### Eventos de Dominio que Publica

```
1. PortabilidadIniciada
   - portabilidadId
   - actorId
   - tipoActor
   - operadorOrigen
   - operadorDestino
   - fechaSolicitud
   - plazoMaximo

2. FasePortabilidadCompletada
   - portabilidadId
   - nombreFase
   - duracion
   - resultado

3. MigracionDatosIniciada
   - portabilidadId
   - cantidadDocumentos
   - tamañoTotal

4. DocumentoMigrado
   - portabilidadId
   - documentoId
   - validado
   - integridad

5. PortabilidadCompletada
   - portabilidadId
   - actorId
   - operadorNuevo
   - documentosMigrados
   - duracionProceso
   - dentroDelPlazo

6. PortabilidadFallida
   - portabilidadId
   - actorId
   - motivo
   - faseEnFallo
   - rollbackRealizado

7. PortabilidadCancelada
   - portabilidadId
   - motivoCancelacion
   - solicitadoPor
   - fechaCancelacion

8. AlertaVencimientoPlazo
   - portabilidadId
   - horasRestantes
   - estado
```

### Eventos de Dominio que Consume

```
1. CiudadanoRegistrado (de Identidad y Registro)
   → Validar que ciudadano existe antes de iniciar portabilidad

2. DocumentoCertificadoRecibido (de Carpeta Personal)
   → Incluir en lista de documentos a migrar

3. TransferenciaCompletada (de Transferencia Documentos)
   → Confirmar que documento fue migrado exitosamente
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Identidad y Registro | Customer/Supplier | Obtiene datos del registro, actualiza operador tras portabilidad |
| Service Registry (MinTIC) | Published Language | Actualiza ubicación tras portabilidad exitosa |
| Carpeta Personal | Customer/Supplier | Coordina migración de documentos |
| Carpeta Institucional | Customer/Supplier | Coordina migración de documentos institucionales |
| Transferencia Documentos | Customer/Supplier | Usa servicio de transferencia para migrar documentos |
| Notificaciones | Published Language (Event Bus) | Notifica eventos del proceso |

### Reglas de Negocio Críticas

1. **Proceso de Portabilidad NO es Registro**
   - Precondición: El ciudadano/institución DEBE existir previamente
   - Si no existe registro, lanzar error (no crear registro automáticamente)
   - La portabilidad solo cambia el operador, no crea identidad

2. **Plazo Legal de 72 Horas**
   - Tiempo máximo desde solicitud hasta completado: 72 horas
   - Debe ser atómico: o se completa todo o se hace rollback
   - Sistema debe alertar a 60h, 66h, y 71h si no está completo
   - Si excede 72h sin completar, marcar como fallida y notificar autoridades

3. **Coordinación Obligatoria con Ambos Operadores**
   - Operador origen DEBE cooperar en migración de datos (requisito legal)
   - Operador destino debe confirmar recepción de todos los datos
   - Ambos deben firmar digitalmente la completitud de la migración
   - Si operador origen no coopera, escalar a MinTIC

4. **Integridad de Datos Garantizada**
   - Todo documento debe validar hash antes y después de migración
   - Si hay discrepancia de integridad, detener proceso y hacer rollback
   - Validación de firma digital debe mantenerse tras migración
   - Metadatos deben transferirse íntegramente

5. **Continuidad del Servicio**
   - Ciudadano mantiene servicio durante migración (máximo 72h)
   - Email de carpeta NO cambia (inmutable)
   - Documentos certificados NO se pierden
   - Durante migración, ciudadano puede ver documentos pero no modificar

6. **Rollback Automático en Fallo**
   - Si cualquier fase crítica falla, iniciar rollback automático
   - Restaurar estado en operador origen
   - Notificar a ciudadano sobre fallo
   - Permitir reintento después de 24 horas

7. **Auditoría Completa**
   - Cada acción del proceso debe quedar registrada
   - Evidencia digital de consentimiento del ciudadano
   - Trazabilidad end-to-end para auditorías regulatorias
   - Retención de logs: 7 años mínimo

8. **Actualización del Service Registry como Fase Final**
   - SOLO actualizar registry cuando migración esté 100% completa
   - Si falla actualización de registry, hacer rollback de TODO
   - El registry es la source of truth, debe ser consistente
   - Validar que actualización fue exitosa antes de notificar completitud

---

# SUPPORTING DOMAIN

## 6. Bounded Context: Autenticación y AutorizaciónadorId
   - tipoInstitucion

3. PortabilidadIniciada
   - portabilidadId
   - actorId
   - tipoActor
   - operadorOrigen
   - operadorDestino
   - fechaSolicitud

4. PortabilidadCompletada
   - portabilidadId
   - actorId
   - operadorNuevo
   - documentosMigrados
   - duracionProceso

5. PortabilidadFallida
   - portabilidadId
   - actorId
   - motivo
   - faseEnFallo

6. AfiliacionActualizada
   - actorId
   - tipoActor
   - operadorAnterior
   - operadorNuevo
   - razonCambio

7. UbicacionConsultada
   - actorId
   - tipoActor
   - operadorActual
   - consultadoPor (para analytics)
```

### Eventos de Dominio que Consume

```
1. CarpetaCiudadanoCreada (de Carpeta Personal)
   → Validar que ciudadano esté registrado y afiliado
   
2. CarpetaInstitucionCreada (de Carpeta Institucional)
   → Validar que institución esté registrada y tenga convenio
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Service Registry (MinTIC) | Published Language | Actualizar ubicaciones tras portabilidad |
| Carpeta Personal | Supplier (upstream) | Proporciona datos de ciudadano |
| Carpeta Institucional | Supplier (upstream) | Proporciona datos de institución |
| Transferencia Documentos | Supplier (upstream) | Informa cambios de operador |

### Reglas de Negocio Críticas

1. **Unicidad de Registro**
   - Una cédula = Un solo registro ciudadano
   - Un NIT = Un solo registro institución
   - No puede haber duplicados

2. **Afiliación Exclusiva**
   - Un ciudadano solo puede estar afiliado a UN operador a la vez
   - Una institución solo puede tener convenio con UN operador a la vez
   - Durante portabilidad, estado cambia a "EN_PORTABILIDAD"

3. **Inmutabilidad del Email**
   - El email se genera una sola vez al primer registro
   - Nunca cambia, incluso después de múltiples portabilidades
   - Garantiza continuidad de comunicaciones

4. **Proceso de Portabilidad**
   - Máximo 72 horas para completar
   - Debe ser atómico: o se completa todo o se hace rollback
   - El operador origen DEBE cooperar en migración de datos
   - Ciudadano/institución mantiene servicio durante migración

5. **Verificación Obligatoria**
   - Ciudadano: verificación con Registraduría antes de registro
   - Institución: verificación jurídica antes de registro
   - Sin verificación exitosa, no hay afiliación a operador

---

## 5. Bounded Context: Autenticación y Autorización

### Propósito
Gestionar la autenticación de usuarios (ciudadanos, funcionarios institucionales, administradores de operadores) y controlar autorizaciones para compartir documentos, garantizando seguridad y trazabilidad completa.

### Responsabilidades Principales
- Autenticar usuarios mediante múltiples factores
- Gestionar sesiones y tokens de acceso
- Controlar autorizaciones para compartir documentos
- Validar permisos de acceso a carpetas y documentos
- Mantener registro de auditoría de todos los accesos
- Gestionar políticas de autorización (RBAC/ABAC)
- Detectar actividades sospechosas y bloquear accesos

### Modelo de Dominio

#### Aggregate Root: **SesionUsuario**
```
SesionUsuario
├── sesionId: SesionId (UUID)
├── usuario: Usuario
│   ├── usuarioId: UsuarioId
│   ├── tipo: TipoUsuario [CIUDADANO, FUNCIONARIO_INSTITUCION, ADMIN_OPERADOR]
│   ├── identificacion: String (cedula, email, etc.)
│   └── carpetaAsociada: CarpetaId?
├── autenticacion: DatosAutenticacion
│   ├── metodo: MetodoAutenticacion [PASSWORD, OTP, BIOMETRICO, TOKEN_HARDWARE]
│   ├── factores: List<FactorAutenticacion>
│   ├── nivelSeguridad: NivelSeguridad [BASICO, MEDIO, ALTO]
│   └── fechaAutenticacion: DateTime
├── token: TokenAcceso
│   ├── accessToken: JWT
│   ├── refreshToken: JWT
│   ├── tipoToken: TipoToken [BEARER]
│   ├── scopes: List<Scope>
│   ├── fechaEmision: DateTime
│   ├── fechaExpiracion: DateTime
│   └── rotado: Boolean
├── contextoSesion: ContextoSesion
│   ├── ipOrigen: IPAddress
│   ├── userAgent: String
│   ├── dispositivo: InfoDispositivo
│   ├── ubicacionGeografica: Ubicacion?
│   └── operadorSesion: OperadorId
├── estado: EstadoSesion [ACTIVA, EXPIRADA, REVOCADA, BLOQUEADA]
├── actividad: List<ActividadSesion>
└── fechaUltimaActividad: DateTime

Métodos de negocio:
+ validarToken(): ResultadoValidacion
+ renovarToken(): TokenAcceso
+ revocar(motivo): void
+ registrarActividad(accion, recurso): void
+ detectarAnomalias(): List<Anomalia>
+ verificarScope(scopeRequerido): Boolean
```

#### Aggregate Root: **AutorizacionCompartir**
```
AutorizacionCompartir
├── autorizacionId: AutorizacionId (UUID)
├── propietario: PropietarioDocumentos
│   ├── carpetaId: CarpetaId
│   ├── cedula: Cedula
│   └── nombreCompleto: String
├── destinatario: DestinatarioAutorizacion
│   ├── tipo: TipoDestinatario [INSTITUCION, CIUDADANO, SISTEMA_EXTERNO]
│   ├── identificacion: String
│   ├── nombre: String
│   └── carpetaId: CarpetaId? (si es ciudadano)
├── documentosAutorizados: List<DocumentoAutorizado>
│   └── DocumentoAutorizado
│       ├── documentoId: DocumentoId
│       ├── tipoDocumento: TipoDocumento
│       ├── permisos: PermisosDocumento [SOLO_LECTURA, DESCARGA, COMPARTIR]
│       └── metadataDocumento: MetadataResumen
├── alcance: AlcanceAutorizacion
│   ├── proposito: ProposituoCompartir
│   ├── justificacion: String
│   ├── contextoDominio: ContextoDominio? (EDUCACION, EMPLEO, VISA, etc.)
│   └── requiereNotificacion: Boolean
├── vigencia: VigenciaAutorizacion
│   ├── fechaOtorgamiento: DateTime
│   ├── fechaInicio: DateTime
│   ├── fechaExpiracion: DateTime?
│   ├── limiteCantidadAccesos: Int?
│   └── accesosRealizados: Int
├── estado: EstadoAutorizacion [PENDIENTE, ACTIVA, USADA, EXPIRADA, REVOCADA]
├── evidencia: EvidenciaAutorizacion
│   ├── consentimientoExplicito: Boolean
│   ├── firmaConsentimiento: FirmaDigital?
│   ├── registroInteraccion: RegistroInteraccion
│   └── capturasPantalla: List<EvidenciaVisual>
├── usos: List<UsoAutorizacion>
│   └── UsoAutorizacion
│       ├── fechaUso: DateTime
│       ├── accionRealizada: AccionRealizada
│       ├── documentosAccedidos: List<DocumentoId>
│       └── ipOrigen: IPAddress
└── auditoriaAutorizacion: AuditoriaAutorizacion

Métodos de negocio:
+ validarVigencia(): Boolean
+ registrarUso(accion, documentos): void
+ revocar(motivoRevocacion): void
+ verificarPermiso(documentoId, permisoRequerido): Boolean
+ extenderVigencia(nuevaFecha): void throws AutorizacionNoExtendibleException
+ notificarPropietario(evento): void
```

#### Entity: **PoliticaAcceso**
```
PoliticaAcceso
├── politicaId: PoliticaId
├── nombre: String
├── descripcion: String
├── alcance: AlcancePolitica [GLOBAL, OPERADOR, CARPETA_ESPECIFICA]
├── sujeto: SujetoPolitica
│   ├── tipoSujeto: TipoSujeto [USUARIO, ROL, GRUPO]
│   ├── identificadorSujeto: String
│   └── atributosSujeto: Map<String, Any> (para ABAC)
├── recurso: RecursoPolitica
│   ├── tipoRecurso: TipoRecurso [CARPETA, DOCUMENTO, API_ENDPOINT]
│   ├── identificadorRecurso: String?
│   └── atributosRecurso: Map<String, Any> (para ABAC)
├── permisos: List<Permiso>
│   └── Permiso
│       ├── accion: Accion [LEER, ESCRIBIR, ELIMINAR, COMPARTIR, ADMINISTRAR]
│       ├── condiciones: List<Condicion>
│       └── efecto: EfectoPermiso [PERMITIR, DENEGAR]
├── prioridad: Int (para resolver conflictos)
├── activa: Boolean
└── vigencia: PeriodoVigencia?

Métodos de negocio:
+ evaluar(contextoAcceso): ResultadoEvaluacion
+ aplicaA(sujeto, recurso): Boolean
```

#### Value Object: **TokenAcceso**
```
TokenAcceso (immutable)
├── accessToken: JWT
│   └── Claims:
│       ├── sub: UsuarioId
│       ├── iss: "carpetacolombia.co"
│       ├── aud: OperadorId
│       ├── exp: Timestamp
│       ├── iat: Timestamp
│       ├── scopes: List<String>
│       ├── carpetaId: CarpetaId?
│       └── nivel_seguridad: String
├── refreshToken: JWT (para renovación)
├── tipoToken: "Bearer"
├── expiresIn: Int (segundos)
└── scopes: List<Scope>

Scopes disponibles:
- carpeta:read (leer documentos propios)
- carpeta:write (agregar documentos propios)
- carpeta:share (compartir documentos propios)
- documentos:emit (instituciones: emitir documentos)
- documentos:request (instituciones: solicitar documentos)
- admin:users (administrar usuarios)
- admin:operator (administrar operador)
```

### Eventos de Dominio que Publica

```
1. UsuarioAutenticado
   - usuarioId
   - tipoUsuario
   - metodoAutenticacion
   - nivelSeguridad
   - ipOrigen
   - timestamp

2. AutorizacionCompartirOtorgada
   - autorizacionId
   - propietarioCarpetaId
   - destinatarioId
   - documentosAutorizados[]
   - proposito
   - vigenciaHasta

3. AutorizacionCompartirRevocada
   - autorizacionId
   - propietarioCarpetaId
   - motivoRevocacion
   - revocadoPor

4. AccesoDocumentoDenegado
   - usuarioId
   - carpetaId
   - documentoId
   - motivoDenegacion
   - ipOrigen

5. ActividadSospechosaDetectada
   - sesionId
   - usuarioId
   - tipoAnomalia
   - detallesAnomalia
   - nivelRiesgo

6. TokenRevocado
   - tokenId
   - usuarioId
   - motivoRevocacion

7. SesionExpirada
   - sesionId
   - usuarioId
   - tiempoInactividad
```

### Eventos de Dominio que Consume

```
1. DocumentosCompartidos (de Carpeta Personal)
   → Validar que existe autorización activa
   
2. SolicitudDocumentoCreada (de Carpeta Institucional)
   → Crear autorización pendiente para ciudadano

3. PortabilidadCompletada (de Identidad y Registro)
   → Actualizar asociación usuario-operador en sesiones activas
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Carpeta Personal | Supplier (upstream) | Proteger acceso a carpetas ciudadanas |
| Carpeta Institucional | Supplier (upstream) | Proteger acceso a carpetas institucionales |
| Identidad y Registro | Customer/Supplier | Validar identidad de usuarios |
| Transferencia Documentos | Supplier (upstream) | Validar autorizaciones en transferencias |

### Reglas de Negocio Críticas

1. **Autenticación Multi-Factor Obligatoria**
   - Acciones sensibles requieren MFA: compartir documentos, cambiar operador
   - Instituciones: obligatorio autenticación de alto nivel
   - Ciudadanos: MFA recomendado, obligatorio para documentos críticos

2. **Principio de Mínimo Privilegio**
   - Usuarios solo tienen permisos estrictamente necesarios
   - Permisos se evalúan en cada acceso (no caching de permisos)
   - Denegación por defecto (whitelist, no blacklist)

3. **Consentimiento Explícito**
   - Toda autorización de compartir requiere acción explícita del propietario
   - No hay "autorizaciones implícitas"
   - Ciudadano puede revocar autorizaciones en cualquier momento

4. **Trazabilidad Total**
   - Todo acceso queda registrado con timestamp, IP, acción realizada
   - Logs de auditoría inmutables (append-only)
   - Retención de logs: mínimo 5 años

5. **Detección de Anomalías**
   - Accesos desde IPs inusuales
   - Múltiples intentos fallidos
   - Acceso fuera de horarios habituales
   - Descarga masiva de documentos
   - Bloqueo automático ante actividad sospechosa

6. **Vigencia de Autorizaciones**
   - Autorizaciones con tiempo de vida limitado (máximo 1 año)
   - Re-autenticación periódica (cada 30 días para alto riesgo)
   - Expiración automática de autorizaciones no usadas en 90 días

---

## 7. Bounded Context: Firma y Certificación

### Propósito
Proporcionar servicios de firma digital y certificación de documentos, garantizando autenticidad, integridad y no repudio de documentos emitidos por instituciones, con validez legal equivalente a firmas manuscritas.

### Responsabilidades Principales
- Firmar digitalmente documentos emitidos por instituciones
- Certificar validez y autenticidad de documentos
- Validar firmas digitales existentes
- Gestionar certificados digitales de instituciones
- Mantener cadena de confianza con autoridades certificadoras
- Proporcionar timestamps confiables (sellado de tiempo)
- Gestionar revocación de certificados

### Modelo de Dominio

#### Aggregate Root: **DocumentoCertificado**
```
DocumentoCertificado
├── certificadoId: CertificadoId (UUID)
├── documentoOriginal: ReferenciaDocumento
│   ├── documentoId: DocumentoId
│   ├── hashOriginal: Hash (SHA-256)
│   ├── tamañoBytes: Long
│   └── formato: FormatoArchivo
├── emisor: EmisorCertificado
│   ├── tipo: TipoEmisor [INSTITUCION, AUTORIDAD_CERTIFICADORA]
│   ├── identificacion: String (NIT, RUT)
│   ├── nombre: String
│   ├── certificadoEmisor: CertificadoDigital
│   └── autorizadoPor: AutorizacionEmision
├── firmaDigital: FirmaDigital
│   ├── algoritmo: AlgoritmoFirma [RSA-SHA256, ECDSA-SHA256]
│   ├── firmaBytes: byte[]
│   ├── funcionarioFirmante: FuncionarioAutorizado?
│   └── timestampFirma: TimestampConfiable
├── certificado: CertificadoDigital
│   ├── version: VersionCertificado
│   ├── serialNumber: String
│   ├── issuer: AutoridadCertificadora
│   ├── subject: SujetoCertificado
│   ├── validezDesde: DateTime
│   ├── validezHasta: DateTime
│   ├── publicKey: PublicKey
│   └── extensiones: List<Extension>
├── cadenaConfianza: CadenaConfianza
│   ├── certificadoRaiz: CertificadoAC
│   ├── certificadosIntermedios: List<CertificadoAC>
│   └── validacionCadena: ResultadoValidacion
├── metadata: MetadataCertificacion
│   ├── proposito: PropsitoCertificacion
│   ├── normativaAplicable: List<NormaLegal>
│   ├── nivelCertificacion: NivelCertificacion [BASICO, MEDIO, ALTO]
│   └── contextoEmision: ContextoEmision
├── estado: EstadoCertificado [ACTIVO, REVOCADO, EXPIRADO, SUSPENDIDO]
├── revocacion: InfoRevocacion?
│   ├── fechaRevocacion: DateTime
│   ├── motivoRevocacion: MotivoRevocacion
│   ├── revocadoPor: AutoridadRevocante
│   └── publicadoEnCRL: Boolean
├── validaciones: List<ValidacionCertificado>
└── fechaCertificacion: DateTime

Métodos de negocio:
+ firmarDocumento(documento, privateKey, funcionario): FirmaDigital
+ validarFirma(): ResultadoValidacion
+ validarCadenaConfianza(): ResultadoValidacion
+ revocar(motivo, autoridad): void
+ verificarVigencia(): Boolean
+ generarPruebaExistencia(): PruebaExistencia (para blockchain)
```

#### Entity: **CertificadoDigital**
```
CertificadoDigital
├── certificadoId: String (UUID)
├── version: Int (X.509 v3)
├── serialNumber: String (único por AC)
├── algoritmoFirma: AlgoritmoFirma
├── issuer: DistinguishedName
│   ├── CN: Common Name
│   ├── O: Organization
│   ├── OU: Organizational Unit
│   ├── C: Country
│   └── otros atributos X.500
├── subject: DistinguishedName
├── validez: PeriodoValidez
│   ├── notBefore: DateTime
│   ├── notAfter: DateTime
│   └── vigenciaEnDias: Int
├── clavePublica: ClavePublica
│   ├── algoritmo: AlgoritmoClavePublica [RSA-2048, RSA-4096, ECC-P256]
│   ├── claveBytes: byte[]
│   └── fingerprint: String
├── extensiones: List<ExtensionCertificado>
│   ├── KeyUsage (uso de clave)
│   ├── ExtendedKeyUsage (propósitos específicos)
│   ├── SubjectAlternativeName (nombres alternativos)
│   ├── CRLDistributionPoints (puntos de distribución CRL)
│   ├── AuthorityInformationAccess (OCSP, CA Issuers)
│   └── otras extensiones X.509
├── firmaAC: FirmaAutoridadCertificadora
└── estado: EstadoCertificado

Métodos de negocio:
+ validar(): ResultadoValidacion
+ verificarVigencia(): Boolean
+ esRaiz(): Boolean
+ perteneceACadena(certificadoRaiz): Boolean
+ obtenerCRL(): CRL
+ consultarOCSP(): RespuestaOCSP
```

#### Value Object: **FirmaDigital**
```
FirmaDigital (immutable)
├── firmaId: UUID
├── algoritmo: AlgoritmoFirma
├── firmaBytes: byte[] (firma encriptada con clave privada)
├── hashDocumento: Hash (del documento original)
├── timestampConfiable: TimestampConfiable
│   ├── fechaHora: DateTime (de TSA - Time Stamping Authority)
│   ├── tsaId: String
│   ├── firmaTimestamp: byte[]
│   └── certificadoTSA: CertificadoDigital
├── funcionarioFirmante: FuncionarioAutorizado?
│   ├── nombre: String
│   ├── cargo: String
│   ├── cedula: Cedula
│   └── autorizacionFirma: AutorizacionFirma
└── contextoFirma: ContextoFirma
    ├── ubicacionFirma: Ubicacion?
    ├── dispositivoFirma: InfoDispositivo
    └── factorAutenticacion: FactorAutenticacion

Métodos de validación:
+ verificar(clavePublica, documentoOriginal): Boolean
+ verificarTimestamp(): Boolean
+ verificarIntegridad(): Boolean
```

#### Entity: **ValidacionCertificado**
```
ValidacionCertificado
├── validacionId: UUID
├── fechaValidacion: DateTime
├── tipoValidacion: TipoValidacion [FIRMA, CADENA_CONFIANZA, VIGENCIA, REVOCACION]
├── resultado: ResultadoValidacion [VALIDO, INVALIDO, REVOCADO, EXPIRADO, NO_CONFIABLE]
├── detalles: DetallesValidacion
│   ├── mensajes: List<MensajeValidacion>
│   ├── warnings: List<Warning>
│   └── errores: List<Error>
├── verificaciones: VerificacionesRealizadas
│   ├── firmaVerificada: Boolean
│   ├── cadenaVerificada: Boolean
│   ├── vigenciaVerificada: Boolean
│   ├── revocacionVerificada: Boolean (CRL o OCSP)
│   └── timestampVerificado: Boolean
├── validadoPor: ValidadorId
└── evidencia: EvidenciaValidacion
```

### Eventos de Dominio que Publica

```
1. DocumentoCertificado
   - certificadoId
   - documentoId
   - emisorId
   - tipoDocumento
   - nivelCertificacion
   - timestampCertificacion

2. FirmaDigitalAplicada
   - firmaId
   - documentoId
   - algoritmoFirma
   - funcionarioFirmante
   - timestampFirma

3. CertificadoValidado
   - certificadoId
   - resultado
   - tipoValidacion
   - fechaValidacion

4. CertificadoRevocado
   - certificadoId
   - motivoRevocacion
   - fechaRevocacion
   - revocadoPor

5. CertificadoProximoAExpirar
   - certificadoId
   - institucionId
   - diasRestantes
   - fechaExpiracion

6. ErrorCertificacion
   - documentoId
   - emisorId
   - tipoError
   - detallesError
```

### Eventos de Dominio que Consume

```
1. DocumentoCertificadoEmitido (de Carpeta Institucional)
   → Procesar solicitud de firma y certificación
   
2. DocumentoTemporalAgregado (de Carpeta Personal)
   → Si el ciudadano solicita certificación posterior (uso futuro)
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Carpeta Personal | Supplier (upstream) | Certificar documentos en carpetas ciudadanas |
| Carpeta Institucional | Supplier (upstream) | Firmar documentos emitidos por instituciones |
| Transferencia Documentos | Supplier (upstream) | Preservar firmas en transferencias |

### Reglas de Negocio Críticas

1. **Validez Legal**
   - Las firmas digitales tienen la misma validez que firmas manuscritas
   - Cumplimiento con Ley 527 de 1999 (Colombia) - Comercio Electrónico
   - Cumplimiento con eIDAS (si aplica para transacciones internacionales)

2. **Cadena de Confianza**
   - Toda firma debe poder rastrearse hasta una AC raíz confiable
   - Certificados deben ser emitidos por ACs reconocidas
   - Validación de CRL (Certificate Revocation List) u OCSP obligatoria

3. **No Repudio**
   - La firma garantiza que el firmante no puede negar haber firmado
   - Timestamp confiable de TSA independiente
   - Evidencia forense suficiente para procesos legales

4. **Integridad Garantizada**
   - Cualquier modificación del documento invalida la firma
   - Hash SHA-256 mínimo (o superior)
   - Verificación de integridad antes de validar firma

5. **Gestión de Certificados**
   - Renovación automática antes de expiración (notificación 30 días antes)
   - Revocación inmediata en caso de compromiso de clave privada
   - Publicación de revocaciones en CRL/OCSP en menos de 1 hora

6. **Algoritmos Criptográficos**
   - Solo algoritmos aprobados: RSA-2048+, ECDSA P-256+
   - Deprecación gradual de algoritmos obsoletos (ej: SHA-1)
   - Actualización periódica según recomendaciones NIST

---

# GENERIC SUBDOMAIN

## 8. Bounded Context: Notificaciones

### Propósito
Gestionar el envío de notificaciones multicanal (email, SMS, push) a ciudadanos e instituciones sobre eventos relevantes del sistema, garantizando entrega confiable y preferencias de usuario.

### Responsabilidades Principales
- Escuchar eventos de dominio del sistema
- Generar notificaciones personalizadas según preferencias de usuario
- Enviar notificaciones por múltiples canales (email, SMS, push notification)
- Gestionar preferencias y suscripciones de notificaciones
- Reintentar envíos fallidos con estrategia de backoff
- Proporcionar tracking de estado de notificaciones
- Plantillas de notificaciones localizadas

### Modelo de Dominio

#### Aggregate Root: **Notificacion**
```
Notificacion
├── notificacionId: NotificacionId (UUID)
├── destinatario: Destinatario
│   ├── tipo: TipoDestinatario [CIUDADANO, FUNCIONARIO, ADMIN_OPERADOR]
│   ├── identificacion: String
│   ├── carpetaId: CarpetaId?
│   └── preferenciasNotificacion: PreferenciasNotificacion
├── evento: EventoOrigen
│   ├── tipoEvento: TipoEvento
│   ├── eventoId: UUID
│   ├── fechaEvento: DateTime
│   └── contextoDominio: String (BC origen)
├── contenido: ContenidoNotificacion
│   ├── asunto: String
│   ├── cuerpo: String (HTML o texto plano)
│   ├── resumen: String (para SMS/push)
│   ├── plantillaId: PlantillaId
│   ├── parametros: Map<String, Any> (para renderizar plantilla)
│   └── idioma: Idioma
├── canales: List<CanalNotificacion>
│   └── CanalNotificacion
│       ├── tipo: TipoCanal [EMAIL, SMS, PUSH, IN_APP]
│       ├── destino: String (email, teléfono, deviceToken)
│       ├── prioridad: Prioridad
│       ├── intentos: List<IntentoEnvio>
│       └── estado: EstadoCanal [PENDIENTE, ENVIADO, FALLIDO, NO_DISPONIBLE]
├── prioridad: PrioridadNotificacion [BAJA, NORMAL, ALTA, URGENTE]
├── programacion: ProgramacionNotificacion?
│   ├── enviarEn: DateTime? (envío programado)
│   ├── agrupable: Boolean (puede agruparse con otras)
│   └── ventanaEnvio: VentanaEnvio? (ej: solo horario laboral)
├── estado: EstadoNotificacion [PENDIENTE, PROCESANDO, ENVIADA, FALLIDA, CANCELADA]
├── metadata: MetadataNotificacion
│   ├── categoria: CategoriaNotificacion [SEGURIDAD, DOCUMENTO, SOLICITUD, SISTEMA]
│   ├── accionable: Boolean
│   ├── enlacesAccion: List<EnlaceAccion>
│   └── vencimiento: DateTime? (para notificaciones temporales)
├── tracking: TrackingNotificacion
│   ├── enviadaEn: DateTime?
│   ├── leidaEn: DateTime?
│   ├── interactuadaEn: DateTime?
│   └── dispositivoInteraccion: InfoDispositivo?
├── fechaCreacion: DateTime
└── intentosRealizados: Int

Métodos de negocio:
+ enviar(): void
+ reintentar(): void throws MaximosIntentosException
+ marcarComoLeida(): void
+ cancelar(motivo): void
+ agruparCon(otrasNotificaciones): NotificacionAgrupada
```

#### Value Object: **PreferenciasNotificacion**
```
PreferenciasNotificacion (immutable)
├── canalesPreferidos: List<TipoCanal>
├── horarioPreferido: HorarioPreferido?
│   ├── horaInicio: Time (ej: 08:00)
│   ├── horaFin: Time (ej: 20:00)
│   └── diasSemana: List<DiaSemana>
├── frecuencia: FrecuenciaNotificacion [INMEDIATA, DIARIA, SEMANAL]
├── suscripciones: SuscripcionesEventos
│   ├── documentosRecibidos: Boolean
│   ├── solicitudesDocumentos: Boolean
│   ├── transferenciasCompletadas: Boolean
│   ├── seguridadAlertas: Boolean
│   ├── actualizacionesSistema: Boolean
│   └── promocionesOperador: Boolean
├── idiomaPreferido: Idioma
└── formatoContenido: FormatoContenido [HTML, TEXTO_PLANO]
```

#### Entity: **PlantillaNotificacion**
```
PlantillaNotificacion
├── plantillaId: PlantillaId
├── nombre: String
├── descripcion: String
├── eventoTrigger: TipoEvento
├── versiones: List<VersionPlantilla>
│   └── VersionPlantilla
│       ├── version: Int
│       ├── idioma: Idioma
│       ├── asunto: StringTemplate
│       ├── cuerpoEmail: HTMLTemplate
│       ├── cuerpoSMS: StringTemplate (máx 160 caracteres)
│       ├── cuerpoPush: StringTemplate (máx 100 caracteres)
│       ├── parametrosRequeridos: List<String>
│       ├── fechaCreacion: DateTime
│       └── activa: Boolean
├── categoria: CategoriaNotificacion
├── prioridadDefault: PrioridadNotificacion
└── canalesAplicables: List<TipoCanal>

Métodos de negocio:
+ renderizar(parametros, idioma, canal): ContenidoNotificacion
+ validarParametros(parametros): ResultadoValidacion
+ crearNuevaVersion(plantilla): VersionPlantilla
```

#### Entity: **IntentoEnvio**
```
IntentoEnvio
├── intentoId: UUID
├── numeroIntento: Int
├── canal: TipoCanal
├── fechaHoraIntento: DateTime
├── proveedorUsado: ProveedorNotificacion [SENDGRID, TWILIO, FIREBASE, etc.]
├── resultado: ResultadoEnvio
│   ├── exitoso: Boolean
│   ├── codigoRespuesta: String?
│   ├── mensajeRespuesta: String?
│   └── idProveedorExterno: String? (message ID del proveedor)
├── tiempoRespuesta: Duration
├── costoEnvio: Money?
└── proximoIntento: DateTime? (si falló)
```

### Eventos de Dominio que Publica

```
1. NotificacionEnviada
   - notificacionId
   - destinatarioId
   - canal
   - eventoOrigen
   - fechaEnvio

2. NotificacionFallida
   - notificacionId
   - destinatarioId
   - canal
   - motivoFallo
   - intentosRealizados

3. NotificacionLeida
   - notificacionId
   - destinatarioId
   - fechaLectura
   - dispositivoLectura

4. PreferenciasActualizadas
   - usuarioId
   - preferenciasAnteriores
   - preferenciasNuevas
```

### Eventos de Dominio que Consume

**Consume TODOS los eventos relevantes del sistema:**

```
De Carpeta Personal:
- DocumentoCertificadoRecibido → "Has recibido un nuevo documento certificado"
- DocumentosCompartidos → "Has compartido documentos con [destinatario]"

De Carpeta Institucional:
- SolicitudDocumentoCreada → "La institución [X] te ha solicitado documentos"
- DocumentoCertificadoEmitido → "Has emitido un documento certificado a [ciudadano]"

De Transferencia Documentos:
- TransferenciaCompletada → "Tus documentos fueron entregados exitosamente"
- TransferenciaFallida → "Error al enviar documentos, se reintentará automáticamente"

De Identidad y Registro:
- PortabilidadIniciada → "Tu proceso de cambio de operador ha iniciado"
- PortabilidadCompletada → "Tu cambio de operador se completó exitosamente"

De Autenticación y Autorización:
- ActividadSospechosaDetectada → "ALERTA: Actividad inusual en tu cuenta desde [IP]"
- AutorizacionCompartirRevocada → "Una autorización ha sido revocada"

De Firma y Certificación:
- CertificadoProximoAExpirar → "El certificado de tu institución expira en [días] días"
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Todos los BCs | Conformist | Consume eventos de todos los contextos |
| Event Bus | Published Language | Escucha eventos estandarizados |

### Reglas de Negocio Críticas

1. **Respeto a Preferencias**
   - Solo enviar por canales preferidos del usuario
   - Respetar horarios preferidos (excepto notificaciones urgentes de seguridad)
   - Permitir desuscripción de categorías no críticas

2. **Gestión de Errores y Reintentos**
   - Email: hasta 3 reintentos con backoff exponencial (5min, 30min, 2h)
   - SMS: hasta 2 reintentos (5min, 1h)
   - Push: hasta 2 reintentos (1min, 10min)
   - Después de max intentos, marcar como fallida y registrar

3. **Prioridades**
   - URGENTE: envío inmediato, ignora horarios preferidos (seguridad)
   - ALTA: envío en <5 minutos
   - NORMAL: envío en <30 minutos
   - BAJA: puede agruparse, envío en horario preferido

4. **Agrupación de Notificaciones**
   - Notificaciones de baja prioridad pueden agruparse
   - Máximo: enviar resumen diario o semanal según preferencias
   - No agrupar notificaciones de seguridad

5. **Canales por Tipo de Evento**
   - Seguridad: email + SMS siempre (ignora preferencias)
   - Solicitudes documentos: email + SMS + push
   - Actualizaciones sistema: solo email
   - Documentos recibidos: según preferencias

6. **Localización**
   - Soporte para español (es-CO, es-ES, es-MX)
   - Inglés (en-US)
   - Plantillas traducidas profesionalmente
   - Formato de fecha/hora según región

---

## 9. Bounded Context: Servicios Premium

### Propósito
Gestionar servicios de valor agregado ofrecidos por operadores más allá de los servicios básicos gratuitos, incluyendo gestión de PQRS, almacenamiento adicional, servicios de consultoría, y otros servicios comerciales.

### Responsabilidades Principales
- Gestionar catálogo de servicios premium por operador
- Controlar suscripciones de clientes a servicios premium
- Gestionar casos de PQRS (Peticiones, Quejas, Reclamos, Sugerencias)
- Solicitar documentos a ciudadanos en nombre de terceros (PQRS)
- Facturación y cobro de servicios premium
- Métricas y analytics de uso de servicios premium
- Integración con sistemas externos de clientes corporativos

### Modelo de Dominio

#### Aggregate Root: **SuscripcionPremium**
```
SuscripcionPremium
├── suscripcionId: SuscripcionId (UUID)
├── cliente: ClientePremium
│   ├── tipo: TipoCliente [CIUDADANO, INSTITUCION, EMPRESA_TERCERA]
│   ├── identificacion: String
│   ├── nombre: String
│   ├── contacto: Contacto
│   └── carpetaAsociada: CarpetaId? (si tiene)
├── operador: OperadorId
├── plan: PlanPremium
│   ├── planId: PlanId
│   ├── nombre: String
│   ├── descripcion: String
│   ├── serviciosIncluidos: List<ServicioPremium>
│   ├── limites: LimitesServicio
│   │   ├── almacenamientoAdicionalGB: Int?
│   │   ├── solicitudesDocumentosMes: Int?
│   │   ├── casosPQRSMes: Int?
│   │   ├── usuariosAdicionales: Int?
│   │   └── integracionesAPI: Int?
│   ├── precio: PrecioPlan
│   │   ├── montoBase: Money
│   │   ├── moneda: Currency
│   │   ├── frecuenciaCobro: FrecuenciaCobro [MENSUAL, TRIMESTRAL, ANUAL]
│   │   └── preciosPorConsumo: Map<ServicioPremium, Tarifa>
│   └── sla: AcuerdoNivelServicio
├── vigencia: VigenciaSuscripcion
│   ├── fechaInicio: DateTime
│   ├── fechaFin: DateTime?
│   ├── renovacionAutomatica: Boolean
│   └── periodoNotificacion: Int (días antes de expirar)
├── estado: EstadoSuscripcion [ACTIVA, SUSPENDIDA, CANCELADA, EXPIRADA, PRUEBA]
├── uso: UsoServicios
│   ├── periodoActual: PeriodoFacturacion
│   ├── consumoPorServicio: Map<ServicioPremium, ConsumoServicio>
│   ├── limitesAlcanzados: List<LimiteAlcanzado>
│   └── facturasGeneradas: List<FacturaId>
├── configuracion: ConfiguracionSuscripcion
│   ├── webhooksActivos: List<WebhookConfig>
│   ├── notificacionesPersonalizadas: Boolean
│   ├── brandingPersonalizado: BrandingConfig?
│   └── integracionesSistemas: List<IntegracionExterna>
└── fechaCreacion: DateTime

Métodos de negocio:
+ activar(): void
+ suspender(motivo): void
+ cancelar(motivo, fechaEfectiva): void
+ renovar(): void
+ agregarServicio(servicio): void throws LimitePlanException
+ registrarUso(servicio, cantidad): void throws LimiteExcedidoException
+ generarFactura(periodo): Factura
+ verificarLimite(servicio): Boolean
```

#### Aggregate Root: **CasoPQRS**
```
CasoPQRS
├── casoId: CasoId (UUID)
├── cliente: ClienteEmpresa
│   ├── empresaId: String
│   ├── razonSocial: String
│   ├── nit: NIT
│   ├── suscripcionId: SuscripcionId
│   └── operadorGestor: OperadorId
├── ciudadanoAfectado: CiudadanoAfectado
│   ├── cedula: Cedula
│   ├── nombres: String
│   ├── contacto: Contacto
│   └── carpetaId: CarpetaId?
├── tipoPQRS: TipoPQRS [PETICION, QUEJA, RECLAMO, SUGERENCIA]
├── categoria: CategoriaPQRS
│   ├── categoriaGeneral: String (Facturación, Servicio, Técnico, etc.)
│   ├── subcategoria: String?
│   └── palabrasClave: List<String>
├── descripcion: DescripcionCaso
│   ├── asunto: String
│   ├── detalle: String
│   ├── fechaHechos: DateTime?
│   └── canales: List<CanalReporte> [WEB, TELEFONO, EMAIL, PRESENCIAL]
├── documentacionRequerida: SolicitudDocumentos
│   ├── documentosRequeridos: List<DocumentoRequerido>
│   ├── estadoSolicitud: EstadoSolicitudDocs [PENDIENTE, SOLICITADA, RECIBIDA, RECHAZADA]
│   ├── autorizacionCiudadano: AutorizacionId?
│   └── documentosRecibidos: List<DocumentoId>
├── gestion: GestionCaso
│   ├── asignadoA: AgenteSoporte?
│   ├── prioridad: PrioridadCaso [BAJA, MEDIA, ALTA, CRITICA]
│   ├── sla: SLACaso
│   │   ├── tiempoRespuestaMax: Duration
│   │   ├── tiempoResolucionMax: Duration
│   │   ├── fechaLimiteRespuesta: DateTime
│   │   └── fechaLimiteResolucion: DateTime
│   ├── historialAcciones: List<AccionCaso>
│   ├── notasInternas: List<NotaInterna>
│   └── comunicacionesCiudadano: List<Comunicacion>
├── estado: EstadoCaso [NUEVO, EN_REVISION, ESPERANDO_DOCS, EN_GESTION, RESUELTO, CERRADO, REABIERTO]
├── resolucion: ResolucionCaso?
│   ├── tipoResolucion: TipoResolucion
│   ├── descripcion: String
│   ├── fechaResolucion: DateTime
│   ├── resueltoP or: AgenteSoporte
│   └── satisfaccionCiudadano: CalificacionSatisfaccion?
├── metricas: MetricasCaso
│   ├── tiempoRespuesta: Duration?
│   ├── tiempoResolucion: Duration?
│   ├── reabierto: Boolean
│   └── numeroInteracciones: Int
├── fechaCreacion: DateTime
└── fechaUltimaActualizacion: DateTime

Métodos de negocio:
+ solicitarDocumentos(documentos): SolicitudDocumentos
+ recibirAutorizacionCiudadano(autorizacion, documentos): void
+ asignarAgente(agente): void
+ cambiarPrioridad(nuevaPrioridad, justificacion): void
+ agregarNota(nota, autor): void
+ comunicarConCiudadano(mensaje, canal): void
+ resolver(resolucion): void
+ cerrar(): void throws CasoNoResueltoException
+ reabrir(motivo): void
+ verificarSLA(): EstadoSLA
```

#### Entity: **ServicioPremium**
```
ServicioPremium
├── servicioId: ServicioId
├── nombre: String
├── descripcion: String
├── tipo: TipoServicio [ALMACENAMIENTO, PQRS, CONSULTORIA, API_INTEGRACION, ANALISIS_DATOS, SOPORTE_PRIORITARIO]
├── caracteristicas: List<CaracteristicaServicio>
├── precioBase: Money?
├── modeloPrecio: ModeloPrecio
│   ├── tipo: TipoModelo [FLAT_RATE, POR_USO, HIBRIDO]
│   ├── unidadCobro: UnidadCobro? (GB, solicitud, hora, etc.)
│   └── tarifas: List<Tarifa>
├── disponibilidad: DisponibilidadServicio
│   ├── operadoresOfrecen: List<OperadorId>
│   ├── regiones: List<Region>
│   └── requisitosPrevios: List<Requisito>
└── metadataServicio: MetadataServicio
```

#### Value Object: **ConsumoServicio**
```
ConsumoServicio (por periodo)
├── servicio: ServicioPremium
├── periodo: PeriodoFacturacion
├── cantidad: Decimal (unidades consumidas)
├── unidad: UnidadMedida
├── costoPorUnidad: Money
├── costoTotal: Money
├── detalleConsumo: List<RegistroConsumo>
│   └── RegistroConsumo
│       ├── fecha: DateTime
│       ├── cantidad: Decimal
│       ├── usuario: UsuarioId?
│       ├── recursoUsado: String?
│       └── metadataConsumo: Map<String, Any>
└── limiteAsignado: Decimal?
```

### Eventos de Dominio que Publica

```
1. SuscripcionPremiumCreada
   - suscripcionId
   - clienteId
   - operadorId
   - planId
   - fechaInicio

2. SuscripcionPremiumCancelada
   - suscripcionId
   - clienteId
   - motivoCancelacion
   - fechaEfectiva

3. LimiteServicioAlcanzado
   - suscripcionId
   - servicio
   - limiteAsignado
   - consumoActual

4. CasoPQRSCreado
   - casoId
   - empresaId
   - ciudadanoCedula
   - tipoPQRS
   - prioridad

5. DocumentosSolicitadosPQRS
   - casoId
   - ciudadanoCedula
   - documentosRequeridos[]
   - fechaLimite

6. CasoPQRSResuelto
   - casoId
   - tipoResolucion
   - tiempoResolucion
   - satisfaccionCiudadano

7. SLAViolado
   - casoId
   - tipoViolacion (respuesta/resolución)
   - tiempoLimite
   - tiempoReal
```

### Eventos de Dominio que Consume

```
1. AutorizacionCompartirOtorgada (de Autenticación y Autorización)
   → Asociar documentos autorizados con caso PQRS
   
2. DocumentosCompartidos (de Carpeta Personal)
   → Recibir documentos solicitados para caso PQRS

3. SuscripcionPremiumExpirada (evento interno temporizador)
   → Suspender servicios premium automáticamente
```

### Relaciones con Otros Contextos

| Contexto | Tipo de Relación | Propósito |
|----------|------------------|-----------|
| Carpeta Personal | Customer/Supplier | Solicitar documentos a ciudadanos para PQRS |
| Autenticación y Autorización | Customer/Supplier | Gestionar autorizaciones de documentos |
| API Gateway | Published Language | Exponer APIs públicas de servicios |
| Analytics | Supplier (upstream) | Proporcionar datos de uso de servicios |

### Reglas de Negocio Críticas

1. **Servicios Básicos vs Premium**
   - Servicios básicos SIEMPRE gratuitos (crear carpeta, recibir documentos certificados, almacenamiento ilimitado de certificados)
   - Servicios premium opcionales y pagos por operador
   - Ciudadano puede usar servicios básicos sin suscripción premium

2. **Gestión de PQRS**
   - Empresas terceras pueden gestionar PQRS de sus clientes
   - Ciudadano NO está obligado a autorizar documentos (es voluntario)
   - Caso PQRS puede progresar sin documentos si ciudadano rechaza
   - SLA debe cumplirse: tiempo respuesta (24h-72h), tiempo resolución (5-15 días)

3. **Límites y Consumo**
   - Límites se reinician por periodo de facturación
   - Consumo se mide en tiempo real
   - Notificación al 80% y 100% del límite
   - Bloqueo suave: advertencia; Bloqueo duro: no permite más uso

4. **Facturación**
   - Facturación automática al fin de periodo
   - Prorrateo en caso de cambio de plan mid-periodo
   - Gracia de 5 días para pago antes de suspensión
   - Cancelación solo al fin de periodo (no reembolsos)

5. **Prioridad de Casos**
   - CRITICA: afecta servicio actual, SLA 4 horas
   - ALTA: impacto significativo, SLA 24 horas
   - MEDIA: impacto moderado, SLA 72 horas
   - BAJA: consulta general, SLA 5 días

---

## 9. Bounded Context: Analytics (Análisis de Datos)

### Propósito
Proporcionar capacidades de análisis y generación de insights a partir de los metadatos de documentos almacenados en el sistema, permitiendo al Estado conocer mejor a los ciudadanos y generar estadísticas en contextos específicos (Educación, Notarías, Registraduría).

### Responsabilidades Principales
- Leer y agregar metadatos de documentos (NO contenido)
- Generar consultas analíticas por contexto (Educación, Notarías, Registraduría)
- Crear vistas materializadas para consultas frecuentes
- Generar reportes estadísticos para entidades del Estado
- Proporcionar dashboards y visualizaciones
- Respetar privacidad (solo metadatos agregados, nunca datos personales individuales)
- Cumplir con RGPD y leyes de protección de datos

### Modelo de Dominio

#### Aggregate Root: **ConsultaAnalytica**
```
ConsultaAnalytica
├── consultaId: ConsultaId (UUID)
├── solicitante: SolicitanteConsulta
│   ├── tipo: TipoSolicitante [MINISTERIO, SUPERINTENDENCIA, INVESTIGADOR_AUTORIZADO]
│   ├── entidadId: String
│   ├── nombreEntidad: String
│   └── autorizacionConsulta: AutorizacionConsulta
├── parametros: ParametrosConsulta
│   ├── contexto: ContextoDominio [EDUCACION, NOTARIA, REGISTRADURIA, SALUD, ...]
│   ├── periodo: PeriodoTemporal
│   │   ├── fechaInicio: Date
│   │   └── fechaFin: Date
│   ├── alcanceGeografico: AlcanceGeografico?
│   │   ├── nivel: NivelGeografico [NACIONAL, DEPARTAMENTO, MUNICIPIO]
│   │   └── identificadores: List<String>
│   ├── dimensiones: List<Dimension>
│   │   └── Dimension [TIPO_DOCUMENTO, EMISOR, RANGO_EDAD, GENERO, UBICACION, ...]
│   ├── metricas: List<Metrica>
│   │   └── Metrica [CANTIDAD, PORCENTAJE, PROMEDIO, TENDENCIA, ...]
│   └── filtros: Map<String, FiltroValor>
├── query: QueryGenerado
│   ├── tipo: TipoQuery [AGREGACION, TENDENCIA, DISTRIBUCION, COMPARACION]
│   ├── sqlGenerado: String (para auditoría)
│   ├── fuentesDatos: List<FuenteDatos>
│   └── complejidadEstimada: ComplejidadQuery
├── ejecucion: EjecucionConsulta
│   ├── estado: EstadoEjecucion [PENDIENTE, EJECUTANDO, COMPLETADA, FALLIDA]
│   ├── fechaInicio: DateTime
│   ├── fechaFin: DateTime?
│   ├── duracionMs: Long?
│   └── registrosProcesados: Long?
├── resultado: ResultadoConsulta?
│   ├── datos: DatosAgregados
│   │   ├── filas: List<FilaResultado>
│   │   ├── totales: TotalesAgregados
│   │   └── formatoSalida: FormatoResultado [JSON, CSV, EXCEL, PDF]
│   ├── visualizacion: ConfigVisualizacion?
│   │   ├── tipoGrafico: TipoGrafico [BARRAS, LINEAS, PIE, MAPA_CALOR, ...]
│   │   ├── configuracion: Map<String, Any>
│   │   └── urlVisualizacion: URL?
│   ├── metadataResultado: MetadataResultado
│   │   ├── cantidadRegistros: Int
│   │   ├── anonimizado: Boolean
│   │   ├── nivel Agregacion: NivelAgregacion
│   │   └── advertencias: List<Advertencia>
│   └── firmaDatos: FirmaDigital (para integridad)
├── privacidad: ConfiguracionPrivacidad
│   ├── anonimizacionAplicada: Boolean
│   ├── umbralMinimo: Int (mínimo registros para mostrar dato)
│   ├── camposExcluidos: List<String>
│   └── tecnicasAnonimizacion: List<TecnicaAnonimizacion>
├── audito ria: AuditoriaConsulta
│   ├── usuarioEjecutor: UsuarioId
│   ├── proposito: ProposituoConsulta
│   ├── baseLegal: BaseLegalConsulta
│   └── aprobaciones: List<Aprobacion>
└── fechaSolicitud: DateTime

Métodos de negocio:
+ validarAutorizacion(): ResultadoValidacion
+ ejecutar(): ResultadoConsulta
+ exportar(formato): ArchivoExportado
+ compartirResultado(destinatarios): void
+ anonimizar(resultado): ResultadoAnonimizado
```

#### Entity: **VistaMaterializada**
```
VistaMaterializada
├── vistaId: VistaId
├── nombre: String
├── descripcion: String
├── contexto: ContextoDominio
├── definicion: DefinicionVista
│   ├── query: String (SQL de la vista)
│   ├── fuentesDatos: List<TablaOrigen>
│   ├── agregaciones: List<Agregacion>
│   └── indices: List<Indice>
├── programacion: ProgramacionActualizacion
│   ├── frecuencia: FrecuenciaActualizacion [TIEMPO_REAL, HORARIA, DIARIA, SEMANAL]
│   ├── horarioEjecucion: Cron?
│   └── dependencias: List<VistaMaterializadaId>
├── estado: EstadoVista [ACTIVA, DESACTUALIZADA, EN_ACTUALIZACION, INACTIVA]
├── ultimaActualizacion: InfoActualizacion
│   ├── fecha: DateTime
│   ├── duracion: Duration
│   ├── registrosActualizados: Long
│   └── exitosa: Boolean
├── metricas: MetricasVista
│   ├── tamanhoMB: Decimal
│   ├── frecuenciaUso: Int (consultas/día)
│   ├── tiempoPromedioConsulta: Duration
│   └── ultimaConsulta: DateTime?
└── retencion: PoliticaRetencion
    ├── periodoRetencionDias: Int
    └── estrategiaLimpieza: EstrategiaLimpieza

Métodos de negocio:
+ actualizar(): ResultadoActualizacion
+ consultar(filtros): ResultadoConsulta
+ verificarFrescura(): Boolean
+ eliminarDatosAntiguos(): void
```

#### Value Object: **DatosAgregados**
```
DatosAgregados (immutable)
├── dimensiones: List<String> (campos de agrupación)
├── metricas: List<String> (campos calculados)
├── filas: List<FilaResultado>
│   └── FilaResultado
│       ├── claves: Map<String, Any> (valores de dimensiones)
│       ├── valores: Map<String, Numeric> (valores de métricas)
│       └── metadata: Map<String, Any>
├── totales: Map<String, Numeric>
├── subtotales: List<Subtotal>? (si hay sub-agrupaciones)
└── anotaciones: List<Anotacion> (explicaciones de datos anómalos)
```

### Eventos de Dominio que Publica

```
1. ConsultaAnaliticaEjecutada
   - consultaId
   - solicitante
   - contexto
   - cantidadRegistros
   - duracion

2. VistaMaterializadaActualizada
   - vistaId
   - fechaActualizacion
   - registrosActualizados
   - exitosa

3. ResultadoCompartido
   - consultaId
   - destinatarios
   - formatoCompartido

4. ViolacionPrivacidadDetectada
   - consultaId
   - tipoViolacion
   - detalles
```

### Eventos de Dominio que Consume

```
1. DocumentoCertificadoRecibido (de Carpeta Personal)
   → Actualizar metadatos para análisis

2. DocumentoCertificadoEmitido (de Carpeta Institucional)
   → Agregar a estadísticas de emisores

3. TransferenciaCompletada (de