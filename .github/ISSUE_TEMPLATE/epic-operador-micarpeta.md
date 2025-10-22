---
name: Epic - Operador Mi Carpeta
about: Implementación del sistema de gestión de carpetas ciudadanas para el operador "Mi Carpeta"
title: "[EPIC] Sistema Operador Mi Carpeta - Gestión de Carpetas Ciudadanas"
labels: epic, operador, requisitos-funcionales
assignees: ''
---

# 📋 EPIC: Sistema Operador Mi Carpeta

## Contexto del Negocio

### Visión Nacional

El sistema **Carpeta Ciudadana** es una iniciativa del gobierno colombiano que materializa el principio: *"El ciudadano NO debe ser el mensajero del Estado"*. Este sistema busca eliminar la necesidad de que los ciudadanos porten físicamente sus documentos oficiales, permitiéndoles almacenarlos digitalmente de forma segura y compartirlos electrónicamente cuando las entidades lo requieran.

### Modelo de Operación

El sistema nacional opera bajo un modelo de **múltiples operadores privados** que proveen la infraestructura de almacenamiento, similar al modelo de operadores de telefonía móvil:

- **Ciudadanos** eligen libremente un operador para almacenar sus documentos
- **Operadores Privados** (como "Mi Carpeta") proveen infraestructura y servicios
- **MinTIC Centralizador** coordina la interoperabilidad entre operadores (registro mínimo)
- **Entidades Emisoras** generan documentos certificados digitalmente
- **Entidades Receptoras** solicitan documentos a los ciudadanos

### Nuestra Organización: "Mi Carpeta"

Somos **Mi Carpeta**, uno de los operadores privados autorizados para proveer servicios de carpeta ciudadana. Debemos construir un sistema que permita a los ciudadanos colombianos:

1. Registrarse en nuestro servicio
2. Almacenar sus documentos personales de forma segura
3. Gestionar solicitudes de documentos de entidades
4. Transferirse a otro operador si así lo desean (portabilidad)

---

## 🎯 Objetivos del Producto

### Objetivo Principal

Desarrollar una **aplicación de gestión de carpetas ciudadanas** que permita a nuestros usuarios (ciudadanos colombianos) administrar sus documentos digitales y responder a solicitudes de entidades públicas y privadas de manera simple, segura y confiable.

### Objetivos Específicos

1. **Onboarding ciudadano**: Facilitar el registro y afiliación de nuevos ciudadanos al operador "Mi Carpeta"
2. **Gestión documental**: Permitir almacenar, organizar y administrar documentos certificados y temporales
3. **Atención de solicitudes**: Habilitar la respuesta a solicitudes de documentos de entidades
4. **Interoperabilidad**: Garantizar portabilidad entre operadores en cumplimiento de la regulación
5. **Experiencia de usuario**: Ofrecer una interfaz accesible para usuarios de 18 a 60 años con diferentes niveles de alfabetización digital

---

## 👥 Usuarios y Actores

### Usuario Principal: El Ciudadano

**Perfil demográfico**:
- Edad: 18-60 años
- Ubicación: Todo el territorio colombiano
- Nivel de alfabetización digital: Variado (desde básico hasta avanzado)
- Necesidad: Almacenar y compartir documentos sin necesidad de portarlos físicamente

**Tareas principales**:
- Registrarse en el sistema
- Subir documentos personales
- Recibir documentos certificados de entidades emisoras
- Responder solicitudes de documentos de entidades receptoras
- Cambiar de operador si así lo desea

### Actores Secundarios

**Entidades Emisoras**:
- Organizaciones que generan documentos certificados (ej: universidades emitiendo diplomas)
- Envían documentos directamente a la carpeta del ciudadano
- No interactúan directamente con nuestra aplicación (integración backend)

**Entidades Receptoras**:
- Organizaciones que necesitan documentos del ciudadano (ej: bancos solicitando RUT)
- Envían solicitudes formales de documentos
- No interactúan directamente con nuestra aplicación (integración backend)

**Otros Operadores**:
- Competidores que también proveen servicio de carpeta ciudadana
- Deben poder transferir ciudadanos hacia/desde nuestro operador

**MinTIC Centralizador**:
- Entidad gubernamental que coordina el registro nacional
- Mantiene únicamente el registro de qué ciudadano está con qué operador
- No almacena documentos ni participa en transferencias

---

## 📊 Alcance Funcional

### 1. Registro e Identidad del Ciudadano

#### RF-OP-01: Registro de Ciudadano en el Operador

**Como** ciudadano colombiano
**Quiero** registrarme en el operador "Mi Carpeta"
**Para** poder almacenar y gestionar mis documentos digitales

**Criterios de Aceptación**:
- El ciudadano proporciona su cédula de ciudadanía (número único)
- El ciudadano proporciona su información personal (nombre completo, fecha de nacimiento, dirección)
- El ciudadano proporciona un email personal para notificaciones
- El sistema valida que la cédula no esté registrada con otro operador (consulta a MinTIC)
- El sistema genera automáticamente un email inmutable en formato: `nombre.apellido.cedula@carpetacolombia.co`
- El sistema notifica al centralizador MinTIC sobre el nuevo registro
- El ciudadano puede tener **únicamente una carpeta activa** a la vez

**Reglas de Negocio**:
- RN-01: El email `@carpetacolombia.co` es **inmutable** (no se puede cambiar nunca)
- RN-02: Un ciudadano solo puede estar registrado con **un operador a la vez**
- RN-03: La cédula de ciudadanía es el identificador único nacional

---

### 2. Gestión de Carpeta Personal

#### RF-OP-02: Visualización de Información de Carpeta

**Como** ciudadano registrado
**Quiero** ver la información de mi carpeta personal
**Para** conocer el estado de mi cuenta y espacio utilizado

**Criterios de Aceptación**:
- El ciudadano puede ver su información personal
- El ciudadano puede ver su email inmutable de carpeta
- El ciudadano puede ver estadísticas de almacenamiento:
  - Cantidad de documentos certificados
  - Cantidad de documentos temporales
  - Espacio utilizado
  - Espacio disponible
- El ciudadano puede ver el operador actual ("Mi Carpeta")
- El ciudadano puede ver la fecha de afiliación

**Reglas de Negocio**:
- RN-04: Documentos certificados tienen almacenamiento **ilimitado** (perpetuidad)
- RN-05: Documentos temporales tienen límite de **100 documentos O 500 MB** (lo que se alcance primero)

---

### 3. Recepción de Documentos Certificados

#### RF-OP-03: Recepción de Documento Certificado de Entidad Emisora

**Como** ciudadano
**Quiero** recibir documentos certificados que las entidades emisoras generan para mí
**Para** tener mis documentos oficiales disponibles digitalmente sin necesidad de portarlos físicamente

**Criterios de Aceptación**:
- Una entidad emisora (ej: universidad) envía un documento certificado a la carpeta del ciudadano
- El sistema recibe el documento con su firma digital y metadatos
- El sistema almacena el documento en la carpeta del ciudadano
- El sistema notifica al ciudadano (email personal) sobre la recepción del documento
- El ciudadano puede visualizar el nuevo documento en su carpeta
- El documento queda marcado como "CERTIFICADO" y no puede ser eliminado por el ciudadano

**Flujo**:
1. Entidad emisora genera documento certificado (ej: diploma universitario)
2. Entidad emisora firma digitalmente el documento
3. Entidad emisora consulta al centralizador MinTIC qué operador tiene al ciudadano
4. Entidad emisora envía el documento directamente al operador del ciudadano (nosotros)
5. Nuestro sistema recibe y almacena el documento
6. Notificamos al ciudadano

**Reglas de Negocio**:
- RN-06: Los documentos certificados **NO pueden ser eliminados** por el ciudadano
- RN-07: Los documentos certificados tienen **almacenamiento a perpetuidad** (sin límite)
- RN-08: Todos los documentos certificados deben tener **firma digital** de la entidad emisora

---

### 4. Carga de Documentos Temporales

#### RF-OP-04: Carga de Documento Temporal por el Ciudadano

**Como** ciudadano
**Quiero** subir documentos personales no certificados a mi carpeta
**Para** tener todos mis documentos importantes en un solo lugar

**Criterios de Aceptación**:
- El ciudadano puede seleccionar un archivo desde su dispositivo
- El sistema valida el formato del archivo (PDF, JPEG, PNG)
- El sistema valida el tamaño del archivo (máximo 10 MB por archivo)
- El sistema valida que haya espacio disponible (máximo 100 docs temporales o 500 MB total)
- El ciudadano proporciona metadatos del documento:
  - Título
  - Tipo de documento (categoría)
  - Contexto (laboral, educación, salud, etc.)
  - Etiquetas opcionales
- El sistema almacena el documento marcado como "TEMPORAL"
- El ciudadano puede eliminar documentos temporales en cualquier momento

**Reglas de Negocio**:
- RN-09: Documentos temporales tienen límite de **100 documentos O 500 MB**
- RN-10: Los documentos temporales **SÍ pueden ser eliminados** por el ciudadano
- RN-11: Formatos permitidos: PDF, JPEG, PNG
- RN-12: Tamaño máximo por archivo: 10 MB

---

### 5. Solicitudes de Documentos de Entidades

#### RF-OP-05: Recepción de Solicitud de Documentos

**Como** ciudadano
**Quiero** recibir solicitudes de documentos de entidades
**Para** saber qué organización necesita qué documentos míos

**Criterios de Aceptación**:
- El sistema recibe una solicitud de documentos de una entidad receptora
- La solicitud contiene:
  - Identificación de la entidad (NIT, razón social)
  - Propósito de la solicitud
  - Lista de documentos requeridos (cada uno marcado como obligatorio u opcional)
  - Fecha límite de respuesta (opcional)
- El sistema notifica al ciudadano sobre la nueva solicitud (email personal, notificación push)
- El ciudadano puede ver los detalles de la solicitud en su aplicación

**Flujo**:
1. Entidad receptora (ej: banco) necesita documentos del ciudadano
2. Entidad consulta al centralizador MinTIC qué operador tiene al ciudadano
3. Entidad envía solicitud formal de documentos a nuestro operador
4. Nuestro sistema recibe y registra la solicitud
5. Notificamos al ciudadano
6. Ciudadano revisa la solicitud en su aplicación

#### RF-OP-06: Autorización de Envío de Documentos

**Como** ciudadano
**Quiero** decidir si autorizo o rechazo una solicitud de documentos
**Para** tener control sobre quién accede a mi información

**Criterios de Aceptación**:
- El ciudadano puede ver la solicitud pendiente con todos sus detalles
- El ciudadano puede seleccionar documentos de su carpeta para cada requisito de la solicitud
- El sistema valida que todos los documentos **obligatorios** hayan sido seleccionados
- El ciudadano puede **autorizar** el envío:
  - Selecciona los documentos a enviar
  - Confirma la autorización
  - El sistema envía los documentos a la entidad solicitante
- El ciudadano puede **rechazar** la solicitud:
  - Proporciona una razón de rechazo
  - Confirma el rechazo
  - El sistema notifica a la entidad sobre el rechazo
- El sistema registra la decisión del ciudadano (auditoría)

**Reglas de Negocio**:
- RN-13: El ciudadano **debe** seleccionar todos los documentos marcados como **obligatorios**
- RN-14: El ciudadano puede seleccionar o no los documentos **opcionales**
- RN-15: La decisión del ciudadano (autorizar/rechazar) queda registrada para auditoría
- RN-16: Solo el ciudadano puede autorizar el envío de sus documentos (consentimiento explícito)

---

### 6. Portabilidad entre Operadores

#### RF-OP-07: Solicitud de Portabilidad a Otro Operador

**Como** ciudadano
**Quiero** cambiar de operador (transferir mi carpeta a otro operador)
**Para** ejercer mi derecho de libre elección de proveedor de servicios

**Criterios de Aceptación**:
- El ciudadano puede ver una lista de operadores disponibles
- El ciudadano selecciona el operador de destino
- El sistema muestra información sobre el proceso:
  - Tiempo estimado (máximo 72 horas)
  - Documentos que serán transferidos (todos: certificados + temporales)
  - Advertencia de que la carpeta quedará temporalmente no disponible
- El ciudadano confirma la solicitud de portabilidad
- El sistema inicia el proceso de portabilidad
- El ciudadano puede ver el estado del proceso en tiempo real

**Flujo de Portabilidad** (4 fases):

**Fase 1: Desafiliación**
- Nuestro sistema marca la carpeta del ciudadano como "EN PORTABILIDAD"
- Se notifica al centralizador MinTIC sobre el inicio del proceso
- La carpeta queda bloqueada para operaciones (solo lectura)

**Fase 2: Transferencia P2P**
- Nuestro sistema se comunica **directamente** con el operador de destino
- Se transfieren todos los documentos (certificados + temporales)
- Se transfiere metadata de la carpeta
- Se utiliza el API de transferencia del operador destino

**Fase 3: Afiliación**
- El operador destino registra al ciudadano en su sistema
- El operador destino notifica al centralizador MinTIC sobre la afiliación
- El centralizador actualiza el registro (ciudadano ahora pertenece al nuevo operador)

**Fase 4: Documentos en Tránsito**
- Si durante el proceso de portabilidad llegaron nuevos documentos certificados
- Estos deben ser redirigidos al nuevo operador
- El operador origen (nosotros) reenvía estos documentos al operador destino

**Criterios de Aceptación del Proceso**:
- Todo el proceso debe completarse en **máximo 72 horas**
- Se transfieren **TODOS** los documentos (certificados + temporales)
- El ciudadano puede ver el progreso en tiempo real (% completado, fase actual)
- Al finalizar, el ciudadano solo tiene carpeta en el operador destino
- Nuestra carpeta queda cerrada/archivada

**Reglas de Negocio**:
- RN-17: La portabilidad debe completarse en **máximo 72 horas**
- RN-18: La transferencia es **directa entre operadores** (P2P), MinTIC solo registra el cambio
- RN-19: Durante la portabilidad, la carpeta queda **bloqueada** (solo lectura)
- RN-20: Se transfieren **todos los documentos** sin excepción
- RN-21: El ciudadano solo puede tener **un proceso de portabilidad activo** a la vez
- RN-22: Los documentos que lleguen durante la portabilidad se envían al operador destino

---

### 7. Auditoría y Trazabilidad

#### RF-OP-08: Registro de Actividad del Ciudadano

**Como** administrador del sistema
**Quiero** que todas las operaciones críticas queden registradas
**Para** cumplir con requisitos de auditoría y seguridad

**Operaciones a Auditar**:
- Registro de ciudadano
- Inicio de sesión / autenticación
- Recepción de documento certificado
- Carga de documento temporal
- Eliminación de documento temporal
- Autorización de envío de documentos
- Rechazo de solicitud de documentos
- Inicio de portabilidad
- Completación de portabilidad

**Información a Registrar**:
- Fecha y hora exacta
- Tipo de operación
- Usuario que realizó la acción
- Resultado de la operación (exitoso/fallido)
- Detalles relevantes (ej: ID del documento, ID de la solicitud, operador destino)

**Reglas de Negocio**:
- RN-23: Los registros de auditoría **NO pueden ser modificados ni eliminados**
- RN-24: Los registros deben conservarse por **mínimo 5 años**

---

## 🔒 Requisitos No Funcionales Críticos

> **Nota**: Los detalles técnicos de cómo cumplir estos requisitos se definirán en ADRs posteriores

### Seguridad
- **RNF-01**: Los documentos certificados deben incluir firma digital de la entidad emisora
- **RNF-02**: La comunicación entre operadores debe ser segura y autenticada
- **RNF-03**: El acceso a documentos requiere autenticación del ciudadano
- **RNF-04**: Se debe implementar autorización granular (el ciudadano controla quién ve qué)

### Escalabilidad
- **RNF-05**: El sistema debe soportar **~50 millones de ciudadanos colombianos**
- **RNF-06**: Debe soportar picos de carga en fechas límite de procesos (ej: matrículas universitarias)

### Disponibilidad
- **RNF-07**: El sistema debe estar disponible **prácticamente todo el tiempo** (~99.9%+)
- **RNF-08**: Las caídas de servicio deben minimizarse especialmente en horarios hábiles

### Interoperabilidad
- **RNF-09**: Debe comunicarse con otros operadores sin importar su tecnología
- **RNF-10**: Debe integrarse con el centralizador MinTIC para registro de ciudadanos
- **RNF-11**: La transferencia de documentos debe ser **directa** entre operadores (no pasa por MinTIC)

### Usabilidad
- **RNF-12**: La interfaz debe ser accesible para usuarios con **diferente nivel de alfabetización digital**
- **RNF-13**: Debe ser compatible con dispositivos móviles (responsive)
- **RNF-14**: Los procesos críticos (ej: autorizar solicitud) deben ser simples y claros

### Eficiencia del Centralizador
- **RNF-15**: Minimizar transacciones con MinTIC (solo registro, consultas de ubicación, portabilidad)
- **RNF-16**: **NO** transferir documentos a través de MinTIC (transferencias P2P entre operadores)

---

## 📐 Restricciones y Limitaciones

### Regulatorias
- El email `@carpetacolombia.co` es **inmutable por regulación**
- Un ciudadano **solo puede estar con un operador a la vez**
- La portabilidad es un **derecho del ciudadano** (debe ser garantizada)
- Los documentos certificados tienen **almacenamiento a perpetuidad**

### Técnicas
- Formatos de documento: PDF, JPEG, PNG
- Tamaño máximo por archivo: 10 MB
- Límite de documentos temporales: 100 documentos o 500 MB

### De Negocio
- Competimos con otros operadores (GovCarpeta, Digital Folder Pro, etc.)
- Dependemos del centralizador MinTIC para registro de ciudadanos
- Debemos integrarnos con múltiples entidades emisoras y receptoras

---

## 🎨 Experiencia de Usuario Esperada

### Flujo de Registro (Onboarding)
1. Ciudadano ingresa a nuestra aplicación
2. Selecciona "Registrarme"
3. Completa formulario con información personal
4. Sistema genera email inmutable
5. Ciudadano recibe confirmación y puede iniciar sesión

### Flujo de Gestión de Documentos
1. Ciudadano inicia sesión
2. Ve dashboard con:
   - Documentos certificados (X documentos)
   - Documentos temporales (Y documentos, Z MB usados de 500 MB)
   - Solicitudes pendientes (N solicitudes)
3. Puede navegar a:
   - "Mis Documentos" (ver, descargar, eliminar temporales)
   - "Subir Documento" (upload de temporales)
   - "Solicitudes" (responder solicitudes de entidades)

### Flujo de Respuesta a Solicitud
1. Ciudadano recibe notificación de nueva solicitud
2. Ingresa a sección "Solicitudes"
3. Ve detalles de la solicitud:
   - Quién solicita (Universidad Nacional)
   - Para qué (proceso de admisión)
   - Qué documentos (Diploma de bachillerato, Cédula)
   - Fecha límite
4. Selecciona documentos de su carpeta para cada requisito
5. Autoriza o rechaza
6. Sistema procesa y notifica a la entidad

### Flujo de Portabilidad
1. Ciudadano decide cambiar de operador
2. Va a sección "Portabilidad"
3. Ve lista de operadores disponibles
4. Selecciona operador destino (ej: GovCarpeta)
5. Lee información del proceso (72 horas, todos los docs se transfieren)
6. Confirma portabilidad
7. Ve progreso en tiempo real:
   - Fase 1: Desafiliación ✓
   - Fase 2: Transferencia (60% completado)
   - Fase 3: Afiliación (pendiente)
   - Fase 4: Docs en tránsito (pendiente)
8. Recibe notificación al completarse
9. Ahora su carpeta está con GovCarpeta

---

## 🎯 Criterios de Éxito

### Métricas de Negocio
- **Adopción**: Alcanzar X millones de ciudadanos registrados en el primer año
- **Retención**: Tasa de portabilidad saliente < 10% mensual
- **Satisfacción**: NPS (Net Promoter Score) > 50
- **Conversión**: % de solicitudes completadas > 80%

### Métricas Operacionales
- **Tiempo de registro**: < 5 minutos promedio
- **Tiempo de carga de documento**: < 30 segundos (archivo de 5MB)
- **Tiempo de respuesta a solicitud**: < 2 minutos promedio
- **Tiempo de portabilidad**: < 72 horas (máximo regulatorio)
- **Disponibilidad del sistema**: > 99.9%

### Métricas de Usabilidad
- **Tasa de abandono en registro**: < 20%
- **Tasa de errores en formularios**: < 5%
- **Soporte al cliente**: < 10 tickets por 1000 usuarios activos mensuales

---

## 🚧 Fuera de Alcance (Out of Scope)

Lo siguiente **NO** está incluido en este epic:

- ❌ Desarrollo del centralizador MinTIC (responsabilidad del gobierno)
- ❌ Integración con entidades emisoras (cada entidad tiene su propio proyecto)
- ❌ Integración con entidades receptoras (cada entidad tiene su propio proyecto)
- ❌ Desarrollo de aplicaciones de otros operadores
- ❌ Generación de documentos certificados (responsabilidad de entidades emisoras)
- ❌ Validación de autenticidad de documentos físicos (responsabilidad de entidades emisoras)
- ❌ Pago de servicios (el servicio base es gratuito por regulación)
- ❌ Firma digital por parte del ciudadano (solo recibimos documentos ya firmados)

---

## 📅 Entregables Esperados

### Fase 1: MVP - Funcionalidad Básica
- [ ] Registro de ciudadanos
- [ ] Autenticación de ciudadanos
- [ ] Visualización de carpeta personal
- [ ] Carga de documentos temporales
- [ ] Visualización de documentos
- [ ] Eliminación de documentos temporales

### Fase 2: Interoperabilidad
- [ ] Recepción de documentos certificados de entidades
- [ ] Recepción de solicitudes de documentos
- [ ] Autorización/rechazo de solicitudes
- [ ] Envío de documentos a entidades

### Fase 3: Portabilidad
- [ ] Consulta de operadores disponibles
- [ ] Inicio de proceso de portabilidad
- [ ] Transferencia P2P de documentos
- [ ] Seguimiento de progreso de portabilidad
- [ ] Manejo de documentos en tránsito

### Fase 4: Auditoría y Cumplimiento
- [ ] Sistema de registro de auditoría
- [ ] Reportes de actividad
- [ ] Panel de administración
- [ ] Cumplimiento de requisitos regulatorios

---

## 🔗 Documentación de Referencia

### Documentos del Proyecto
- `docs/informacion_cruda/1_req_funcionales.md` - Requisitos funcionales consolidados
- `docs/informacion_cruda/2_req_no_funcionales.md` - Requisitos no funcionales (QoS)
- `docs/informacion_cruda/analisis.md` - Análisis del sistema con diagramas de secuencia
- `docs/informacion_cruda/ddd_analisis/ddd__analisis.md` - Análisis DDD con bounded contexts

### Conceptos Clave
- **Carpeta Ciudadana**: Sistema nacional de gestión de documentos digitales
- **Operador**: Proveedor privado de infraestructura (nosotros somos "Mi Carpeta")
- **Centralizador MinTIC**: Coordinador nacional, NO almacena documentos
- **Portabilidad**: Derecho del ciudadano a cambiar de operador
- **Email Inmutable**: Email `@carpetacolombia.co` que nunca cambia
- **Documento Certificado**: Documento con firma digital de entidad oficial
- **Documento Temporal**: Documento cargado por el ciudadano sin certificación
- **Transferencia P2P**: Transferencia directa entre operadores, sin pasar por MinTIC

---

## 💼 Stakeholders

### Internos
- **Equipo de Desarrollo**: Implementará la solución
- **Equipo de UX/UI**: Diseñará la experiencia de usuario
- **Equipo de QA**: Validará la calidad del producto
- **Gerencia de Producto**: Define prioridades y roadmap
- **Equipo Legal**: Valida cumplimiento regulatorio

### Externos
- **Ciudadanos**: Usuarios finales del sistema
- **MinTIC**: Ente regulador y centralizador
- **Entidades Emisoras**: Universidades, Registraduría, DIAN, etc.
- **Entidades Receptoras**: Bancos, empresas, universidades, etc.
- **Operadores Competidores**: GovCarpeta, Digital Folder Pro, etc.

---

## ❓ Preguntas Abiertas (Para Resolver)

1. **Email inmutable**: ¿Quién genera el email `@carpetacolombia.co`? ¿El operador o MinTIC?
2. **Verificación de entidades**: ¿Qué proceso de verificación existe para entidades emisoras/receptoras?
3. **MFA**: ¿Es obligatorio el segundo factor de autenticación? ¿Biométrico? ¿OTP?
4. **Estándar de firma digital**: ¿Qué estándar usamos? (AdES, XAdES, PAdES)
5. **SLA de portabilidad**: ¿Qué pasa si no completamos en 72 horas? ¿Penalidades?
6. **Disponibilidad objetivo**: ¿Cuál es el % exacto requerido? ¿99.9%? ¿99.95%?
7. **Almacenamiento en la nube**: ¿Está permitido? ¿Puede ser fuera de Colombia?
8. **Precio del servicio**: ¿Hay un servicio premium? ¿O todo es gratuito?

---

## 🏁 Definición de Done

Este epic se considerará **completo** cuando:

- [x] Todos los requisitos funcionales estén implementados
- [x] Los ciudadanos puedan registrarse, autenticarse y gestionar documentos
- [x] Los ciudadanos puedan recibir documentos certificados de entidades
- [x] Los ciudadanos puedan responder solicitudes de documentos
- [x] Los ciudadanos puedan realizar portabilidad a otros operadores
- [x] Se cumplan los requisitos no funcionales de seguridad, disponibilidad y escalabilidad
- [x] La aplicación sea accesible y usable para el público objetivo
- [x] Exista documentación completa para usuarios y administradores
- [x] Se hayan realizado pruebas de integración con MinTIC (o simulador)
- [x] Se haya validado el cumplimiento regulatorio

---

**Prioridad**: 🔴 **CRÍTICA** (Proyecto estratégico nacional)
**Esfuerzo Estimado**: Epic de gran escala (6-12 meses)
**Equipo**: Multi-disciplinario (Frontend, Backend, DevOps, UX/UI, QA, Legal)

---

**Creado por**: Product Management - Mi Carpeta
**Fecha**: 2025-01-21
**Versión**: 1.0

