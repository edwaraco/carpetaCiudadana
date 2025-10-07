# Requisitos Funcionales - Sistema Carpeta Ciudadana

**Proyecto:** Sistema Carpeta Ciudadana
**Versión:** 2.0
**Fecha:** 06 de Octubre, 2025
**Fuente:** Caso de estudio + Análisis DDD

---

## Introducción

Este documento define los requisitos funcionales del sistema Carpeta Ciudadana organizados según los **Bounded Contexts** identificados en el análisis Domain-Driven Design (DDD). Esta estructura refleja la arquitectura del dominio y facilita la trazabilidad entre requisitos y componentes del sistema.

### Principio Fundamental
> "El ciudadano no debe ser el mensajero del estado"

### Clasificación de Requisitos

Los requisitos se organizan según la clasificación estratégica de dominios:

- **[CORE]** - Core Domain: Diferenciador del sistema
- **[SUPPORT]** - Supporting Domain: Necesario pero no diferenciador
- **[GENERIC]** - Generic Subdomain: Funcionalidad común

---

## Tabla de Contenidos

### CORE DOMAIN
1. [Carpeta Personal](#1-carpeta-personal-core)
2. [Carpeta Institucional](#2-carpeta-institucional-core)
3. [Transferencia de Documentos](#3-transferencia-de-documentos-core)
4. [Identidad y Registro](#4-identidad-y-registro-core)
5. [Gestión de Portabilidad](#5-gestión-de-portabilidad-core)

### SUPPORTING DOMAIN
6. [Autenticación y Autorización](#6-autenticación-y-autorización-support)
7. [Firma y Certificación](#7-firma-y-certificación-support)

### GENERIC SUBDOMAIN
8. [Notificaciones](#8-notificaciones-generic)
9. [Servicios Premium](#9-servicios-premium-generic)
10. [Analytics](#10-analytics-generic)

### INFRAESTRUCTURA
11. [Service Registry MinTIC](#11-service-registry-mintic-infra)

---

## CORE DOMAIN - Gestión de Documentos e Identidad

---

## 1. Carpeta Personal [CORE]

**Bounded Context:** Carpeta Personal
**Aggregate Root:** CarpetaCiudadano
**Propósito:** Gestionar el repositorio virtual personal de cada ciudadano

### RF-CP-01: Creación de Carpeta Ciudadana

**Prioridad:** Alta
**Actores:** Ciudadano, Operador

**Descripción:**
El sistema debe crear una carpeta personal única para cada ciudadano registrado.

**Criterios de Aceptación:**
- El sistema debe asignar un identificador único (UUID) a cada carpeta
- La carpeta debe asociarse al propietario mediante su cédula validada
- El sistema debe asignar un email permanente con formato: `{nombre}{inicial}.{apellido}{inicial}.{secuencial}@carpetacolombia.co`
- El email **NUNCA** puede ser modificado después de la creación
- El sistema debe establecer el operador actual al momento de creación
- La carpeta debe crearse en estado ACTIVA

**Fuente:** Caso de estudio página 1 - "se inscribe ante el operador Mi Carpeta"

---

### RF-CP-02: Almacenamiento de Documentos Certificados

**Prioridad:** Alta
**Actores:** Ciudadano, Entidad Emisora, Operador

**Descripción:**
El sistema debe almacenar documentos certificados (firmados digitalmente) a perpetuidad sin límite de tamaño.

**Criterios de Aceptación:**
- El sistema debe aceptar documentos firmados digitalmente
- NO debe existir límite de tamaño para documentos certificados
- El sistema debe almacenar documentos a perpetuidad
- El sistema debe almacenar los metadatos asociados (clasificación, identificación, contexto, entidad avaladora, fechas)
- El sistema debe preservar la firma digital junto con el documento
- El sistema debe calcular y almacenar el hash SHA-256 del documento
- El sistema debe asignar UUID único a cada documento

**Tipos de documentos certificados:**
- Documentos de identidad (Registraduría)
- Diplomas y actas de grado (Instituciones educativas)
- Certificaciones de alergias
- Escrituras
- Declaraciones de renta
- Información de participación en sociedades

**Fuente:** Caso de estudio página 3 - "se espera que todos los documentos certificados puedan mantenerse sin importar su tamaño"

---

### RF-CP-03: Almacenamiento de Documentos Temporales

**Prioridad:** Alta
**Actores:** Ciudadano

**Descripción:**
El sistema debe permitir almacenar documentos temporales (no certificados) con límites por usuario.

**Criterios de Aceptación:**
- El sistema debe establecer un límite de documentos temporales por usuario
- El sistema debe distinguir claramente entre documentos certificados y temporales
- El sistema debe permitir al ciudadano subir documentos sin firma digital
- El sistema debe informar al usuario sobre su cuota disponible
- El sistema debe permitir eliminar documentos temporales
- Los documentos temporales deben marcarse como estado TEMPORAL

**Fuente:** Caso de estudio página 3 - "La cantidad de documentos no certificados estará limitada por usuario"

---

### RF-CP-04: Recepción Automática de Documentos por Email

**Prioridad:** Alta
**Actores:** Operador, Remitente Externo

**Descripción:**
Los documentos enviados al email del ciudadano deben aparecer automáticamente en su carpeta.

**Criterios de Aceptación:**
- El sistema debe procesar documentos enviados a `{usuario}@carpetacolombia.co`
- Los documentos recibidos deben aparecer automáticamente en la carpeta
- El sistema debe extraer y almacenar metadatos del documento
- El sistema debe validar firmas digitales si existen
- El sistema debe generar notificación de documento recibido

**Fuente:** Caso de estudio página 1 - "todos los documentos que se le envíen a esa dirección aparecerán en la carpeta"

---

### RF-CP-05: Visualización y Descarga de Documentos

**Prioridad:** Alta
**Actores:** Ciudadano

**Descripción:**
Los ciudadanos deben poder visualizar y descargar sus documentos.

**Criterios de Aceptación:**
- El sistema debe permitir visualizar documentos sin descargarlos (vista previa)
- El sistema debe permitir descargar documentos individuales
- Los documentos descargados deben mantener su firma digital
- El sistema debe soportar formatos: PDF, JPEG, PNG
- El sistema debe validar la integridad del documento antes de descarga (verificación de hash)

**Fuente:** Caso de estudio página 2 - "Andrés podrá descargarlos para imprimirlos, o dejarlos allí para su archivo a perpetuidad"

---

### RF-CP-06: Compartir Documentos con Entidades

**Prioridad:** Alta
**Actores:** Ciudadano, Entidad Receptora

**Descripción:**
Los ciudadanos deben poder armar paquetes de documentos para enviar a entidades.

**Criterios de Aceptación:**
- El sistema debe permitir seleccionar múltiples documentos
- El sistema debe permitir "armar un paquete de documentación"
- El sistema debe identificar si la entidad destinataria tiene operador
- Si la entidad tiene operador: enviar a su carpeta institucional
- Si la entidad NO tiene operador: enviar por correo electrónico
- Los documentos enviados deben mantener su firma digital
- El sistema debe registrar la compartición en el historial

**Fuente:** Caso de estudio página 2 - "Andrés puede armar un paquete de documentación para enviárselo a la entidad"

---

### RF-CP-07: Historial de Accesos

**Prioridad:** Media
**Actores:** Ciudadano

**Descripción:**
El sistema debe mantener un historial completo de accesos a los documentos del ciudadano.

**Criterios de Aceptación:**
- El sistema debe registrar cada acceso a documentos
- El historial debe incluir: quién accedió, cuándo, qué documento, tipo de acción
- El ciudadano debe poder consultar su historial de accesos
- El historial debe ser inmutable (no puede modificarse)
- El sistema debe almacenar el historial por al menos 5 años

**Fuente:** DDD análisis - Aggregate CarpetaCiudadano incluye "Historial Accesos"

---

### RF-CP-08: Gestión de Metadatos

**Prioridad:** Alta
**Actores:** Operador, Entidad Emisora

**Descripción:**
El sistema debe almacenar y gestionar metadatos detallados para cada documento.

**Criterios de Aceptación:**
- El sistema debe almacenar los siguientes metadatos:
  - **Clasificación:** Tipo de documento (CEDULA, DIPLOMA, ACTA_GRADO, etc.)
  - **Identificación:** Título, número de documento
  - **Contexto:** EDUCACION, NOTARIA, REGISTRADURIA, SALUD, etc.
  - **Entidad avaladora:** Quién certifica el documento
  - **Fechas:** Emisión, vigencia, recepción
  - **Tags:** Etiquetas adicionales para búsqueda
- El sistema debe permitir búsqueda por metadatos
- Los metadatos deben enviarse junto con el documento en transferencias

**Fuente:** Caso de estudio página 2 - "los metadatos asociados, los cuales permiten clasificarlo, identificarlo, contextualizarlo"

---

## 2. Carpeta Institucional [CORE]

**Bounded Context:** Carpeta Institucional
**Aggregate Root:** CarpetaInstitucion
**Propósito:** Gestionar repositorios virtuales de entidades públicas y privadas

### RF-CI-01: Creación de Carpeta Institucional

**Prioridad:** Alta
**Actores:** Entidad, Operador

**Descripción:**
El sistema debe crear carpetas institucionales para entidades públicas y privadas.

**Criterios de Aceptación:**
- El sistema debe crear carpetas para entidades públicas (MEN, Registraduría, Embajadas)
- El sistema debe crear carpetas para entidades privadas (empresas)
- La carpeta debe tener identificador único (UUID)
- El sistema debe registrar el tipo de institución
- El sistema debe establecer el operador actual
- El sistema debe permitir convenios con operadores (ej: MEN con GovCarpeta)

**Fuente:** Caso de estudio página 2 - "El MEN tiene un convenio con un operador de carpeta llamado GovCarpeta"

---

### RF-CI-02: Emisión de Documentos Certificados

**Prioridad:** Alta
**Actores:** Entidad Emisora, Operador

**Descripción:**
Las entidades deben poder generar y enviar documentos certificados a ciudadanos.

**Criterios de Aceptación:**
- El sistema debe permitir a entidades crear documentos firmados digitalmente
- El sistema debe asociar los metadatos correspondientes
- El sistema debe iniciar la transferencia al ciudadano destinatario
- El sistema debe registrar el documento en la carpeta institucional (como emitido)
- La firma digital debe cumplir estándares legales

**Fuente:** Caso de estudio página 2 - "procederá a subir los documentos firmados digitalmente para que le sean entregados a Andrés"

---

### RF-CI-03: Recepción de Documentos desde Ciudadanos

**Prioridad:** Alta
**Actores:** Entidad Receptora, Ciudadano

**Descripción:**
Las entidades deben poder recibir documentos enviados por ciudadanos.

**Criterios de Aceptación:**
- El sistema debe almacenar documentos recibidos en la carpeta institucional
- El sistema debe validar firmas digitales de documentos recibidos
- El sistema debe asociar documentos recibidos al caso/trámite correspondiente
- El sistema debe notificar a la entidad de documentos recibidos
- El sistema debe permitir visualización y descarga de documentos recibidos

**Fuente:** Caso de estudio página 2 - "los documentos le llegarán a través de su operador y le aparecerán en su carpeta institucional"

---

### RF-CI-04: Solicitud de Documentos a Ciudadanos

**Prioridad:** Alta
**Actores:** Entidad, Funcionario, Ciudadano

**Descripción:**
Las entidades deben poder solicitar documentos específicos a ciudadanos.

**Criterios de Aceptación:**
- El sistema debe permitir crear una petición de documentos dirigida a un ciudadano
- La petición debe especificar lista de documentos requeridos
- El sistema debe enviar la solicitud al operador del ciudadano
- El sistema debe rastrear el estado de la solicitud (PENDIENTE, PARCIAL, COMPLETA)
- El sistema debe permitir asociar solicitudes a casos/trámites

**Ejemplo de solicitud:**
- Cédula
- Pasaporte
- Carta laboral
- Extractos bancarios

**Fuente:** Caso de estudio página 2-3 - "registró una petición de documentos dirigida a Andrés"

---

### RF-CI-05: Gestión Multi-usuario

**Prioridad:** Media
**Actores:** Entidad, Funcionarios

**Descripción:**
Las entidades deben poder tener múltiples funcionarios con diferentes roles.

**Criterios de Aceptación:**
- El sistema debe permitir múltiples usuarios por entidad
- El sistema debe soportar roles diferenciados (ej: consulta, solicitud, emisión)
- El sistema debe mantener trazabilidad de qué funcionario realizó cada acción
- El sistema debe permitir gestión de permisos por rol

**Fuente:** DDD análisis - Carpeta Institucional requiere gestión de múltiples funcionarios

---

## 3. Transferencia de Documentos [CORE]

**Bounded Context:** Transferencia de Documentos
**Aggregate Root:** Transferencia
**Propósito:** Gestionar envío P2P de documentos entre operadores

### RF-TD-01: Transferencia Directa entre Operadores

**Prioridad:** Alta
**Actores:** Operador Origen, Operador Destino, MinTIC

**Descripción:**
El sistema debe realizar transferencias directas de documentos entre operadores sin pasar por el centralizador.

**Criterios de Aceptación:**
- El sistema debe consultar al centralizador MinTIC **solo** para ubicar el operador destino
- La transferencia de documentos debe ser **DIRECTA** entre operadores (P2P)
- Los documentos **NO** deben pasar por el centralizador MinTIC
- El sistema debe transferir documentos junto con sus metadatos
- El sistema debe transferir firmas digitales completas
- El sistema debe generar ID único de transferencia (tracking)

**Flujo:**
1. Operador origen consulta a MinTIC: "¿Dónde está ciudadano X?"
2. MinTIC responde: "Operador Y"
3. Operador origen transfiere documentos DIRECTAMENTE a Operador Y
4. NO pasa por centralizador

**Fuente:** Caso de estudio página 2 - "La transferencia se debe hacer directamente, sin pasar por el centralizador"

---

### RF-TD-02: Tracking de Transferencias

**Prioridad:** Alta
**Actores:** Operador, Ciudadano

**Descripción:**
El sistema debe proporcionar seguimiento completo de transferencias de documentos.

**Criterios de Aceptación:**
- El sistema debe asignar ID único de tracking a cada transferencia
- El sistema debe registrar estados: INICIADA, EN_TRANSITO, ENTREGADA, FALLIDA
- El sistema debe permitir consultar el estado de una transferencia
- El sistema debe implementar reintentos automáticos en caso de fallo
- El sistema debe notificar al destinatario cuando la transferencia se complete

**Fuente:** DDD análisis - Aggregate Transferencia incluye "Tracking completo"

---

### RF-TD-03: Envío a Entidades sin Operador

**Prioridad:** Alta
**Actores:** Operador, Entidad sin Carpeta

**Descripción:**
El sistema debe poder enviar documentos a entidades que no tienen operador.

**Criterios de Aceptación:**
- El sistema debe consultar al centralizador si la entidad tiene operador
- Si NO tiene operador: enviar documentos por correo electrónico tradicional
- Los documentos enviados por email deben mantener firma digital
- El sistema debe enviar metadatos en formato legible
- El sistema debe generar comprobante de envío

**Fuente:** Caso de estudio página 2 - "de lo contrario, le llegarán por correo electrónico"

---

### RF-TD-04: Garantías de Entrega

**Prioridad:** Alta
**Actores:** Operador Origen, Operador Destino

**Descripción:**
El sistema debe garantizar la entrega confiable de documentos.

**Criterios de Aceptación:**
- El sistema debe implementar confirmación de recepción (ACK)
- El sistema debe implementar reintentos automáticos (máximo 3 intentos)
- El sistema debe validar integridad mediante hash antes y después de transferencia
- El sistema debe mantener timeout configurado por tipo de transferencia
- El sistema debe notificar al origen si la transferencia falla definitivamente

**Fuente:** DDD análisis - Transferencia incluye "Reintentos automáticos"

---

## 4. Identidad y Registro [CORE]

**Bounded Context:** Identidad y Registro
**Aggregate Root:** RegistroCiudadano, RegistroInstitucion
**Propósito:** Gestionar identidad permanente y registro inicial

### RF-IR-01: Registro Inicial de Ciudadano

**Prioridad:** Alta
**Actores:** Ciudadano, Operador, Registraduría, MinTIC

**Descripción:**
El sistema debe registrar nuevos ciudadanos verificando su identidad con la Registraduría.

**Criterios de Aceptación:**
- El sistema debe realizar procedimiento de verificación de identidad
- El sistema debe consultar a la Registraduría Nacional para validar cédula
- El sistema debe recibir documento de identidad firmado por Registraduría
- El sistema debe informar a MinTIC sobre el nuevo registro
- MinTIC debe asignar email permanente único
- El sistema debe crear la carpeta del ciudadano
- El sistema debe subir cédula firmada como primer documento
- El sistema debe verificar que el ciudadano NO esté ya registrado en otro operador

**Fuente:** Caso de estudio página 1 - "El operador primero realiza un procedimiento de verificación y una consulta a la Registraduría"

---

### RF-IR-02: Generación de Email Permanente

**Prioridad:** Alta
**Actores:** MinTIC, Operador

**Descripción:**
El sistema debe generar un email único e inmutable para cada ciudadano.

**Criterios de Aceptación:**
- El formato debe ser: `{nombre}{inicial}.{apellido}{inicial}.{secuencial}@carpetacolombia.co`
- El email debe ser único en todo el sistema nacional
- El email **NUNCA** puede cambiar después de la primera asignación
- El email debe funcionar independientemente del operador actual
- MinTIC debe mantener el registro email → operador actual

**Ejemplo:**
- Andrés Ricardo Zapata Pérez → `andresr.zapatap.20168@carpetacolombia.co`

**Fuente:** Caso de estudio página 1 - "la cuenta de correo generada para cada ciudadano no puede ser cambiada después de la primera vez"

---

### RF-IR-03: Registro de Entidades

**Prioridad:** Alta
**Actores:** Entidad, Operador, MinTIC

**Descripción:**
El sistema debe registrar entidades públicas y privadas.

**Criterios de Aceptación:**
- El sistema debe validar identidad de la entidad (RUT, Cámara de Comercio)
- El sistema debe diferenciar entre entidades públicas y privadas
- El sistema debe informar a MinTIC sobre el nuevo registro
- El sistema debe crear carpeta institucional
- El sistema debe establecer convenios con operadores si aplica

**Fuente:** Caso de estudio - implícito por MEN, Embajadas, empresas privadas

---

### RF-IR-04: Restricción Un Ciudadano - Un Operador

**Prioridad:** Alta
**Actores:** Ciudadano, Operador, MinTIC

**Descripción:**
El sistema debe garantizar que un ciudadano solo esté registrado ante un operador a la vez.

**Criterios de Aceptación:**
- MinTIC debe mantener registro único: ciudadano → operador actual
- El sistema debe rechazar intentos de registro duplicado
- El sistema debe validar registro único antes de aceptar nuevo ciudadano
- Solo se permite cambio mediante proceso de portabilidad formal

**Fuente:** Caso de estudio página 1 - "Un ciudadano sólo puede estar registrado ante un operador a la vez"

---

## 5. Gestión de Portabilidad [CORE]

**Bounded Context:** Gestión de Portabilidad
**Aggregate Root:** ProcesoPortabilidad
**Propósito:** Gestionar cambio de operador manteniendo identidad permanente

### RF-PO-01: Solicitud de Portabilidad

**Prioridad:** Alta
**Actores:** Ciudadano, Operador Actual, Operador Destino

**Descripción:**
Los ciudadanos deben poder solicitar transferencia a otro operador.

**Criterios de Aceptación:**
- El sistema debe permitir al ciudadano iniciar proceso de portabilidad
- El sistema debe validar identidad del ciudadano
- El sistema debe verificar que el operador destino esté activo
- El sistema debe crear un ProcesoPortabilidad con estado INICIADO
- El sistema debe establecer plazo máximo de 72 horas

**Fuente:** Caso de estudio página 1 - "puede solicitar la transferencia de un operador a otro"

---

### RF-PO-02: Migración Completa de Datos

**Prioridad:** Alta
**Actores:** Operador Origen, Operador Destino, MinTIC

**Descripción:**
El sistema debe transferir todos los datos del ciudadano al nuevo operador.

**Criterios de Aceptación:**
- El sistema debe exportar TODOS los documentos (certificados y temporales)
- El sistema debe exportar TODOS los metadatos
- El sistema debe exportar historial de accesos completo
- El sistema debe validar integridad de todos los documentos transferidos
- El sistema debe garantizar que NO se pierdan documentos
- El proceso debe completarse en máximo 72 horas
- El sistema debe coordinar con MinTIC la actualización del registro

**Fuente:** DDD análisis - ProcesoPortabilidad incluye "Migración de datos" con "Plazo 72h"

---

### RF-PO-03: Preservación del Email durante Portabilidad

**Prioridad:** Alta
**Actores:** MinTIC, Operador Origen, Operador Destino

**Descripción:**
El email del ciudadano debe permanecer constante durante y después de la portabilidad.

**Criterios de Aceptación:**
- El email NO debe cambiar durante la portabilidad
- MinTIC debe actualizar registro: email → nuevo operador
- Los documentos enviados al email durante portabilidad NO deben perderse
- El enrutamiento de emails debe actualizarse automáticamente

**Fuente:** Caso de estudio página 1 - "la cuenta de correo generada para cada ciudadano no puede ser cambiada"

---

### RF-PO-04: Coordinación entre Operadores

**Prioridad:** Alta
**Actores:** Operador Origen, Operador Destino, MinTIC

**Descripción:**
El sistema debe coordinar la portabilidad entre operadores origen y destino.

**Criterios de Aceptación:**
- El sistema debe implementar protocolo de coordinación P2P
- Operador origen debe preparar paquete de migración
- Operador destino debe confirmar recepción
- Operador destino debe validar integridad de datos recibidos
- MinTIC debe actualizar registro solo después de confirmación
- Operador origen debe mantener datos por 30 días adicionales (backup)

**Fuente:** DDD análisis - ProcesoPortabilidad incluye "Coordinación 2 operadores"

---

### RF-PO-05: Gestión de Documentos en Tránsito

**Prioridad:** Alta
**Actores:** Operador Origen, Operador Destino, MinTIC

**Descripción:**
El sistema debe manejar documentos que llegan durante el proceso de portabilidad.

**Criterios de Aceptación:**
- Los documentos enviados durante portabilidad deben encolarse
- Una vez completada la portabilidad, documentos deben entregarse al nuevo operador
- NO debe haber pérdida de documentos durante la transición
- El sistema debe notificar al ciudadano si hay documentos pendientes de entrega

**Fuente:** DDD análisis - "Impacto de portabilidad en documentos en tránsito"

---

## SUPPORTING DOMAIN

---

## 6. Autenticación y Autorización [SUPPORT]

**Bounded Context:** Autenticación y Autorización
**Aggregate Root:** SesionUsuario, AutorizacionCompartir
**Propósito:** Proteger acceso a carpetas y documentos

### RF-AA-01: Autenticación de Ciudadanos

**Prioridad:** Alta
**Actores:** Ciudadano, Operador

**Descripción:**
El sistema debe implementar autenticación sólida para acceso a carpetas.

**Criterios de Aceptación:**
- El sistema debe implementar autenticación multi-factor (MFA)
- El sistema debe soportar autenticación biométrica (opcional)
- El sistema debe generar tokens JWT con expiración
- El sistema debe invalidar sesiones después de inactividad
- El sistema debe registrar todos los intentos de autenticación (exitosos y fallidos)

**Fuente:** Caso de estudio página 3 - "debe haber un mecanismo sólido de autenticación"

---

### RF-AA-02: Autorización de Compartición

**Prioridad:** Alta
**Actores:** Ciudadano, Entidad

**Descripción:**
El ciudadano debe autorizar explícitamente el envío de documentos.

**Criterios de Aceptación:**
- El sistema debe requerir autorización explícita del ciudadano
- El sistema debe permitir autorización selectiva (elegir qué documentos)
- El sistema debe permitir rechazar solicitudes
- El sistema debe registrar todas las autorizaciones en auditoría
- La autorización debe tener vigencia temporal configurable

**Fuente:** Caso de estudio página 3 - "entró a su carpeta para autorizar el envío de los documentos solicitados"

---

### RF-AA-03: Control de Acceso Granular

**Prioridad:** Alta
**Actores:** Sistema, Ciudadano, Entidad

**Descripción:**
El sistema debe implementar control de acceso complejo para evitar accesos no autorizados.

**Criterios de Aceptación:**
- El sistema debe implementar permisos a nivel de documento
- Solo el propietario puede ver sus documentos por defecto
- Entidades solo pueden ver documentos explícitamente compartidos
- El sistema debe implementar time-based access (acceso temporal)
- El sistema debe implementar purpose-based access (acceso por propósito específico)
- El sistema debe prevenir modificaciones no autorizadas

**Fuente:** Caso de estudio página 3 - "debe haber complejos sistemas de autorización para evitar que las personas no autorizadas vean o modifiquen los documentos"

---

### RF-AA-04: Auditoría de Seguridad

**Prioridad:** Alta
**Actores:** Operador, Auditor

**Descripción:**
El sistema debe mantener logs de auditoría de todas las operaciones de seguridad.

**Criterios de Aceptación:**
- El sistema debe registrar todos los accesos a documentos
- El sistema debe registrar todas las autorizaciones otorgadas/revocadas
- El sistema debe registrar todos los cambios de permisos
- Los logs deben ser inmutables
- Los logs deben conservarse por mínimo 5 años

**Fuente:** Caso de estudio - implícito por requisitos de seguridad

---

## 7. Firma y Certificación [SUPPORT]

**Bounded Context:** Firma y Certificación
**Aggregate Root:** DocumentoCertificado
**Propósito:** Garantizar autenticidad legal de documentos

### RF-FC-01: Firma Digital de Documentos

**Prioridad:** Alta
**Actores:** Entidad Emisora, Operador

**Descripción:**
El sistema debe soportar firma digital con validez legal.

**Criterios de Aceptación:**
- El sistema debe soportar firmas digitales X.509
- El sistema debe soportar estándares: XAdES, PAdES
- La firma debe incluir timestamp confiable
- El sistema debe mantener cadena de confianza completa
- La firma debe tener validez legal en Colombia

**Fuente:** Caso de estudio página 2 - "los documentos electrónicos están firmados para que su autenticidad no pueda ser discutida"

---

### RF-FC-02: Validación de Firmas Digitales

**Prioridad:** Alta
**Actores:** Operador, Sistema

**Descripción:**
El sistema debe validar firmas digitales de documentos recibidos.

**Criterios de Aceptación:**
- El sistema debe verificar cadena de certificados
- El sistema debe verificar que el certificado no esté revocado
- El sistema debe verificar timestamp de firma
- El sistema debe verificar integridad del documento (hash)
- El sistema debe generar resultado de verificación detallado

**Fuente:** Caso de estudio página 2 - "autenticidad no pueda ser discutida"

---

### RF-FC-03: Certificados de Entidades Emisoras

**Prioridad:** Alta
**Actores:** Entidad Emisora, Autoridad Certificadora

**Descripción:**
El sistema debe gestionar certificados de entidades autorizadas a emitir documentos.

**Criterios de Aceptación:**
- El sistema debe mantener registro de entidades certificadas
- El sistema debe validar certificados contra autoridad certificadora reconocida
- El sistema debe soportar renovación de certificados
- El sistema debe notificar cuando certificados estén próximos a vencer
- El sistema debe mantener histórico de certificados

**Fuente:** Caso de estudio - implícito por firma digital legal

---

## GENERIC SUBDOMAIN

---

## 8. Notificaciones [GENERIC]

**Bounded Context:** Notificaciones
**Aggregate Root:** Notificacion
**Propósito:** Comunicar eventos a usuarios

### RF-NO-01: Notificación de Documentos Recibidos

**Prioridad:** Alta
**Actores:** Ciudadano, Operador

**Descripción:**
El sistema debe notificar al ciudadano cuando recibe documentos.

**Criterios de Aceptación:**
- El sistema debe enviar notificación por email
- El sistema debe enviar notificación push a app móvil (si disponible)
- La notificación debe incluir: remitente, tipo de documento, fecha
- La notificación debe incluir enlace directo a la carpeta
- El sistema debe soportar preferencias de notificación del usuario

**Fuente:** Caso de estudio página 2 - "Andrés recibirá una notificación por correo electrónico"

---

### RF-NO-02: Notificación de Solicitudes de Documentos

**Prioridad:** Alta
**Actores:** Ciudadano, Operador

**Descripción:**
El sistema debe notificar al ciudadano cuando recibe solicitudes de documentos.

**Criterios de Aceptación:**
- El sistema debe enviar notificación por SMS
- El sistema debe enviar notificación por Email
- La notificación debe incluir: entidad solicitante, lista de documentos, plazo
- El sistema debe permitir respuesta directa desde la notificación
- Las notificaciones deben ser multi-idioma

**Fuente:** Caso de estudio página 2-3 - "Andrés recibió a través de un SMS y de un email la notificación de la solicitud"

---

### RF-NO-03: Notificaciones de Portabilidad

**Prioridad:** Media
**Actores:** Ciudadano, Operador

**Descripción:**
El sistema debe notificar sobre el proceso de portabilidad.

**Criterios de Aceptación:**
- El sistema debe notificar inicio de portabilidad
- El sistema debe notificar progreso de migración
- El sistema debe notificar finalización exitosa
- El sistema debe notificar si hay problemas en la portabilidad

**Fuente:** DDD análisis - Proceso de portabilidad requiere comunicación con ciudadano

---

## 9. Servicios Premium [GENERIC]

**Bounded Context:** Servicios Premium
**Aggregate Root:** SuscripcionPremium, CasoPQRS
**Propósito:** Servicios opcionales de pago

### RF-PR-01: Modelo de Servicios Básicos vs Premium

**Prioridad:** Media
**Actores:** Operador, Ciudadano, Empresa

**Descripción:**
El operador debe ofrecer servicios básicos gratuitos y servicios Premium de pago.

**Criterios de Aceptación:**
- **Servicios básicos gratuitos (obligatorios):**
  - Almacenamiento ilimitado de documentos certificados
  - Recepción y envío de documentos
  - Compartición de documentos
  - Portabilidad entre operadores
- **Servicios Premium (opcionales de pago):**
  - Almacenamiento extendido de documentos temporales
  - APIs de integración empresarial
  - Servicios especializados (PQRS, workflows personalizados)

**Fuente:** Caso de estudio página 1 - "servicios básicos gratuitos" y "servicios 'Premium' por los cuales podrá cobrar"

---

### RF-PR-02: Gestión de PQRS Empresarial

**Prioridad:** Baja
**Actores:** Empresa, Operador Premium, Ciudadano

**Descripción:**
Servicio Premium para gestión de casos PQRS empresariales.

**Criterios de Aceptación:**
- El sistema debe permitir a empresas crear casos de soporte
- El sistema debe permitir solicitar documentos a clientes (cualquier operador)
- El sistema debe integrar documentos al caso PQRS
- El sistema debe generar workflows de aprobación
- Este servicio debe generar cobro al usuario empresarial

**Ejemplo:** Operador de TV/Internet solicita documentos para PQRS

**Fuente:** Caso de estudio página 3 - "servicio Premium ofrecido por el operador PQCarpeta"

---

## 10. Analytics [GENERIC]

**Bounded Context:** Analytics
**Aggregate Root:** ConsultaAnalytica, VistaMaterializada
**Propósito:** Análisis de metadatos para el Estado

### RF-AN-01: Análisis de Metadatos (No Contenido)

**Prioridad:** Media
**Actores:** Estado, Analista, Sistema

**Descripción:**
El sistema debe permitir análisis de metadatos sin acceder al contenido de documentos.

**Criterios de Aceptación:**
- El sistema debe permitir consultas sobre metadatos agregados
- El sistema **NO** debe exponer contenido de documentos
- El sistema debe garantizar privacidad (anonimización)
- El análisis debe enfocarse en 3 contextos iniciales:
  - **Notarías:** Tendencias en escrituras, transacciones
  - **Educación:** Niveles educativos, instituciones, distribución geográfica
  - **Registraduría:** Información demográfica

**Ejemplo de pregunta:**
- "¿Cuántos ciudadanos entre 25-35 años tienen título universitario en Bogotá?"
- Respuesta basada en: edad (metadata), ubicación (metadata), tipo documento DIPLOMA (metadata)

**Fuente:** Caso de estudio página 3 - "a partir del análisis de los metadatos asociados a los documentos"

---

### RF-AN-02: Vistas Materializadas por Contexto

**Prioridad:** Media
**Actores:** Sistema, Analista

**Descripción:**
El sistema debe generar vistas materializadas por contexto para análisis eficiente.

**Criterios de Aceptación:**
- El sistema debe crear vistas materializadas para cada contexto (EDUCACION, NOTARIA, REGISTRADURIA)
- Las vistas deben actualizarse periódicamente (batch nocturno)
- Las vistas solo deben contener metadatos agregados y anonimizados
- El sistema debe soportar consultas OLAP sobre las vistas

**Fuente:** DDD análisis - Analytics incluye "VistaMaterializada" por contexto

---

## INFRAESTRUCTURA

---

## 11. Service Registry MinTIC [INFRA]

**Bounded Context:** Infraestructura Compartida
**Componente:** Service Registry
**Propósito:** Registro minimalista de ubicaciones

### RF-SR-01: Registro de Ubicación Ciudadano → Operador

**Prioridad:** Alta
**Actores:** MinTIC, Operador

**Descripción:**
MinTIC debe mantener registro de qué ciudadano está con qué operador.

**Criterios de Aceptación:**
- El registro debe mapear: email ciudadano → operador actual
- El registro debe actualizarse en cada registro inicial
- El registro debe actualizarse en cada portabilidad
- El registro debe responder consultas en < 100ms (p95)
- El registro **NO** debe almacenar documentos
- El registro **NO** debe almacenar metadatos
- Almacenamiento estimado: 3-5 GB para todo el país

**Fuente:** Caso de estudio página 2 - "A través del centralizador del Min TIC, el sistema de GovCarpeta ubicará el operador al que está afiliado Andrés"

---

### RF-SR-02: Registro de Ubicación Entidad → Operador

**Prioridad:** Alta
**Actores:** MinTIC, Operador

**Descripción:**
MinTIC debe mantener registro de qué entidad está con qué operador.

**Criterios de Aceptación:**
- El registro debe mapear: identificador entidad → operador actual
- El registro debe permitir consultas por NIT, nombre, tipo
- El registro debe indicar si la entidad NO tiene operador

**Fuente:** Caso de estudio página 2 - verificar ubicación de entidades

---

### RF-SR-03: Minimización de Transacciones al Centralizador

**Prioridad:** Alta
**Actores:** Operador, MinTIC

**Descripción:**
Los operadores deben minimizar consultas al centralizador.

**Criterios de Aceptación:**
- Los operadores deben implementar caché de ubicaciones
- El caché debe tener TTL configurable (ej: 24 horas)
- Los operadores deben usar caché local antes de consultar centralizador
- Solo consultar centralizador si caché expiró o no existe entrada
- Los operadores deben implementar invalidación de caché en portabilidad

**Fuente:** Caso de estudio página 4 - "el centralizador del Ministerio debe manejar la mínima cantidad de transacciones"

---

### RF-SR-04: Minimización de Datos Transferidos

**Prioridad:** Alta
**Actores:** Operador, MinTIC

**Descripción:**
Los operadores deben minimizar la cantidad de datos enviados al centralizador.

**Criterios de Aceptación:**
- Solo enviar identificador ciudadano/entidad en consultas
- Solo recibir identificador operador en respuestas
- NO enviar documentos al centralizador
- NO enviar metadatos al centralizador
- Usar protocolos eficientes (gRPC, Protocol Buffers)

**Fuente:** Caso de estudio página 4 - "minimicen la cantidad de datos que tengan que transferirse entre los operadores y el centralizador"

---

## Requisitos No Funcionales Derivados

### RNF-01: Escalabilidad

**Fuente:** Caso de estudio página 3

**Criterios:**
- El sistema debe soportar ~50 millones de ciudadanos
- El sistema debe soportar crecimiento progresivo de documentos
- Volumen estimado: 5 millones de transferencias/día
- Concurrencia: 100K usuarios simultáneos

---

### RNF-02: Disponibilidad

**Fuente:** Caso de estudio página 3

**Criterios:**
- **Core Domain:** 99.95% uptime
- **Supporting Domain:** 99.9% uptime
- **Generic Subdomain:** 99.5% uptime
- RTO (Recovery Time Objective): < 1 hora
- RPO (Recovery Point Objective): < 15 minutos

---

### RNF-03: Rendimiento

**Fuente:** Caso de estudio página 3

**Criterios:**
- **NO es tiempo real**
- API response time: < 200ms (p95)
- Transferencia documentos: < 5s para docs < 10MB
- Consulta Registry MinTIC: < 100ms (p95)
- Latencia "tan baja como sea posible" sin sacrificar otros atributos

---

### RNF-04: Seguridad

**Fuente:** Caso de estudio página 3

**Criterios:**
- Autenticación MFA obligatoria
- Encriptación en tránsito (TLS 1.3)
- Encriptación en reposo (AES-256)
- Firma digital con validez legal
- Auditoría completa de accesos (5 años)
- Confidencialidad garantizada
- Control de acceso granular

---

### RNF-05: Usabilidad

**Fuente:** Caso de estudio página 4

**Criterios:**
- Interfaz simple para población con baja apropiación tecnológica
- Máxima prioridad en diseño de UX
- Soporte multi-dispositivo (web, móvil)
- Accesibilidad WCAG 2.1 nivel AA
- Multi-idioma (Español, lenguas indígenas principales)

---

### RNF-06: Interoperabilidad

**Fuente:** Caso de estudio página 4

**Criterios:**
- Sin restricciones tecnológicas para operadores
- APIs estándar REST/gRPC
- Esquemas de metadatos estandarizados (JSON Schema)
- Event schemas estandarizados
- Almacenamiento cloud permitido (incluso fuera del país)

---

## Matriz de Trazabilidad

| Bounded Context | Requisitos Funcionales | Prioridad | Fuente Caso Estudio |
|-----------------|------------------------|-----------|---------------------|
| Carpeta Personal | RF-CP-01 a RF-CP-08 | Alta | Páginas 1-2 |
| Carpeta Institucional | RF-CI-01 a RF-CI-05 | Alta | Página 2 |
| Transferencia Documentos | RF-TD-01 a RF-TD-04 | Alta | Página 2 |
| Identidad y Registro | RF-IR-01 a RF-IR-04 | Alta | Página 1 |
| Gestión Portabilidad | RF-PO-01 a RF-PO-05 | Alta | Páginas 1, 3 |
| Autenticación y Autorización | RF-AA-01 a RF-AA-04 | Alta | Página 3 |
| Firma y Certificación | RF-FC-01 a RF-FC-03 | Alta | Página 2 |
| Notificaciones | RF-NO-01 a RF-NO-03 | Alta/Media | Páginas 2-3 |
| Servicios Premium | RF-PR-01 a RF-PR-02 | Media/Baja | Páginas 1, 3 |
| Analytics | RF-AN-01 a RF-AN-02 | Media | Página 3 |
| Service Registry | RF-SR-01 a RF-SR-04 | Alta | Páginas 2, 4 |

---

## Resumen

**Total de Requisitos Funcionales:** 49
**Requisitos No Funcionales:** 6

**Distribución por Dominio:**
- **Core Domain:** 28 requisitos (57%)
- **Supporting Domain:** 7 requisitos (14%)
- **Generic Subdomain:** 10 requisitos (20%)
- **Infraestructura:** 4 requisitos (8%)

**Distribución por Prioridad:**
- **Alta:** 39 requisitos (80%)
- **Media:** 8 requisitos (16%)
- **Baja:** 2 requisitos (4%)

---

**Documento generado a partir de:**
- Caso de Estudio - Carpeta Ciudadana (PDF)
- Análisis Domain-Driven Design
- Lenguaje Ubicuo del Dominio

