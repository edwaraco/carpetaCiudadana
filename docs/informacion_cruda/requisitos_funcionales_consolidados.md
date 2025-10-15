# Requisitos Funcionales Consolidados - Sistema Carpeta Ciudadana

### Principio Fundamental

> "El ciudadano no debe ser el mensajero del estado"

### Casos de Uso Principales

Este documento se enfoca en los siguientes casos de uso críticos:

1. **Crear Ciudadano** - Registro inicial usando APIs de MinTIC (`/apis/registerCitizen`, `/apis/validateCitizen`)
2. **Autenticación de Usuarios** - Login básico con JWT
3. **Subir Documentos** - Almacenamiento de documentos certificados y temporales
4. **Autenticar/Firmar Documentos** - Autenticación usando `/apis/authenticateDocument` de MinTIC
5. **Transferencia de Operador** - Portabilidad usando APIs de MinTIC (`/apis/getOperators`, `/apis/registerTransferEndPoint`)

---

## Tabla de Contenidos

1. [Crear Ciudadano](#1-crear-ciudadano)
2. [Autenticación de Usuarios](#2-autenticación-de-usuarios)
3. [Subir Documentos](#3-subir-documentos)
4. [Autenticar/Firmar Documentos](#4-autenticarfirmar-documentos)
5. [Transferencia de Operador](#5-transferencia-de-operador)

---

## 1. Crear Ciudadano

**Bounded Context:** Identidad y Registro  
**Aggregate Root:** RegistroCiudadano  
**Propósito:** Gestionar el registro inicial y creación de carpeta personal

### FR-CU-01: Registro Inicial de Ciudadano

**Como** ciudadano colombiano  
**Quiero** registrarme en el sistema  
**Para** obtener mi carpeta ciudadana y ID único permanente

**Criterios de Aceptación:**

- ✅ El sistema debe validar que el ciudadano no esté registrado usando `/apis/validateCitizen/{id}`
- ✅ El sistema debe registrar al ciudadano usando `/apis/registerCitizen` con:
  - `id`: Identificación del ciudadano (número)
  - `name`: Nombre completo del ciudadano
  - `address`: Dirección del ciudadano
  - `email`: Email del ciudadano
  - `operatorId`: ID del operador actual
  - `operatorName`: Nombre del operador
- ✅ El sistema debe crear la carpeta del ciudadano con identificador único (UUID interno)
- ✅ El sistema debe manejar respuesta 201 (éxito) o 501 (ya registrado)
- ✅ El sistema debe mantener registro de auditoría del proceso

**Ejemplo de registro:**

```json
{
  "id": 1234567890,
  "name": "Carlos Andres Caro",
  "address": "Cra 54 # 45 -67",
  "email": "caro@mymail.com",
  "operatorId": "65ca0a00d833e984e2608756",
  "operatorName": "Operador Ciudadano"
}
```

**Fuente:** Swagger MinTIC - `/apis/registerCitizen`

---

### FR-CU-02: Validación de Ciudadano Existente

**Como** operador  
**Quiero** validar si un ciudadano ya está registrado en el sistema  
**Para** evitar registros duplicados

**Criterios de Aceptación:**

- ✅ El sistema debe consultar `/apis/validateCitizen/{id}` con la identificación del ciudadano
- ✅ El sistema debe manejar respuesta 200 (ciudadano disponible) o 204 (ya registrado)
- ✅ El sistema debe manejar errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe registrar el resultado de la validación
- ✅ El sistema debe proceder con el registro solo si el ciudadano está disponible

**Fuente:** Swagger MinTIC - `/apis/validateCitizen/{id}`

---

### FR-CU-03: Desregistro de Ciudadano

**Como** operador  
**Quiero** desregistrar un ciudadano de mi operador  
**Para** permitir transferencia a otro operador

**Criterios de Aceptación:**

- ✅ El sistema debe usar `/apis/unregisterCitizen` con:
  - `id`: Identificación del ciudadano
  - `operatorId`: ID del operador actual
  - `operatorName`: Nombre del operador
- ✅ El sistema debe manejar respuesta 201 (desregistrado exitosamente) o 204 (sin contenido)
- ✅ El sistema debe manejar errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe mantener backup de datos por 30 días adicionales
- ✅ El sistema debe registrar el proceso de desregistro en auditoría

**Ejemplo de desregistro:**

```json
{
  "id": 1234567890,
  "operatorId": "65ca0a00d833e984e2608756",
  "operatorName": "Operador Ciudadano"
}
```

**Fuente:** Swagger MinTIC - `/apis/unregisterCitizen`

---

## 2. Autenticación de Usuarios

**Bounded Context:** Autenticación y Autorización  
**Aggregate Root:** SesionUsuario  
**Propósito:** Proteger acceso seguro al sistema

### FR-AU-01: Autenticación de Ciudadanos

**Como** ciudadano  
**Quiero** autenticarme de forma segura  
**Para** acceder a mi carpeta personal

**Criterios de Aceptación:**

- ✅ El sistema debe implementar autenticación básica con usuario y contraseña
- ✅ El sistema debe generar tokens JWT con expiración
- ✅ El sistema debe invalidar sesiones después de inactividad
- ✅ El sistema debe registrar todos los intentos de autenticación (exitosos y fallidos)
- ✅ El sistema debe requerir re-autenticación para acciones sensibles
- ✅ El sistema debe validar credenciales contra base de datos local

**Fuente:** Caso de estudio página 3 - "debe haber un mecanismo sólido de autenticación"

---

### FR-AU-02: Autenticación de Funcionarios Institucionales ****

**Como** funcionario de entidad institucional  
**Quiero** autenticarme con credenciales institucionales  
**Para** acceder a la carpeta institucional

**Criterios de Aceptación:**

- ✅ El sistema debe implementar autenticación básica con usuario y contraseña
- ✅ El sistema debe validar que el funcionario esté autorizado por la entidad
- ✅ El sistema debe generar tokens JWT con expiración
- ✅ El sistema debe mantener trazabilidad de qué funcionario realizó cada acción
- ✅ El sistema debe soportar roles diferenciados (consulta, solicitud, emisión)
- ✅ El sistema debe permitir gestión de permisos por rol
- ✅ El sistema debe mantener auditoría de cambios de permisos

**Fuente:** DDD análisis - Carpeta Institucional requiere gestión de múltiples funcionarios

---

### FR-AU-03: Control de Acceso Granular

**Como** sistema  
**Quiero** implementar control de acceso complejo  
**Para** evitar accesos no autorizados

**Criterios de Aceptación:**

- ✅ El sistema debe implementar permisos a nivel de documento
- ✅ Solo el propietario puede ver sus documentos por defecto
- ✅ Entidades solo pueden ver documentos explícitamente compartidos
- ✅ El sistema debe implementar time-based access (acceso temporal)
- ✅ El sistema debe implementar purpose-based access (acceso por propósito específico)
- ✅ El sistema debe prevenir modificaciones no autorizadas
- ✅ El sistema debe implementar principio de menor privilegio

**Fuente:** Caso de estudio página 3 - "debe haber complejos sistemas de autorización para evitar que las personas no autorizadas vean o modifiquen los documentos"

---

### FR-AU-04: Auditoría de Seguridad

**Como** operador  
**Quiero** mantener logs de auditoría de todas las operaciones de seguridad  
**Para** cumplir con requisitos regulatorios

**Criterios de Aceptación:**

- ✅ El sistema debe registrar todos los accesos a documentos
- ✅ El sistema debe registrar todas las autorizaciones otorgadas/revocadas
- ✅ El sistema debe registrar todos los cambios de permisos
- ✅ Los logs deben ser inmutables
- ✅ Los logs deben conservarse por mínimo 5 años
- ✅ El sistema debe permitir consulta de logs por período y usuario
- ✅ El sistema debe generar reportes de auditoría

**Fuente:** Caso de estudio - implícito por requisitos de seguridad

---

## 3. Subir Documentos

**Bounded Context:** Carpeta Personal  
**Aggregate Root:** CarpetaCiudadano  
**Propósito:** Gestionar almacenamiento de documentos certificados y temporales

### FR-SD-01: Almacenamiento de Documentos Certificados

**Como** ciudadano  
**Quiero** almacenar documentos certificados (firmados digitalmente)  
**Para** mantenerlos a perpetuidad sin límite de tamaño

**Criterios de Aceptación:**

- ✅ El sistema debe aceptar documentos firmados digitalmente
- ✅ NO debe existir límite de tamaño para documentos certificados
- ✅ El sistema debe almacenar los metadatos asociados:
  - Clasificación: Tipo de documento (CEDULA, DIPLOMA, ACTA_GRADO, etc.)
  - Identificación: Título, número de documento
  - Contexto: EDUCACION, NOTARIA, REGISTRADURIA, SALUD, etc.
  - Entidad avaladora: Quién certifica el documento
  - Fechas: Emisión, vigencia, recepción
  - Tags: Etiquetas adicionales para búsqueda
- ✅ El sistema debe preservar la firma digital junto con el documento
- ✅ El sistema debe calcular y almacenar el hash SHA-256 del documento
- ✅ El sistema debe asignar UUID único a cada documento
- ✅ El sistema debe validar la integridad del documento antes de almacenar

**Tipos de documentos certificados:**

- Documentos de identidad (Registraduría)
- Diplomas y actas de grado (Instituciones educativas)
- Certificaciones de alergias
- Escrituras
- Declaraciones de renta
- Información de participación en sociedades

**Fuente:** Caso de estudio página 3 - "se espera que todos los documentos certificados puedan mantenerse sin importar su tamaño"

---

### FR-SD-02: Almacenamiento de Documentos Temporales ****

**Como** ciudadano  
**Quiero** almacenar documentos temporales (no certificados)  
**Para** tener un espacio limitado para documentos personales

**Criterios de Aceptación:**

- ✅ El sistema debe establecer un límite de documentos temporales por usuario (máximo 100 documentos)
- ✅ El sistema debe establecer un límite de espacio (máximo 500 MB para documentos temporales)
- ✅ El sistema debe distinguir claramente entre documentos certificados y temporales
- ✅ El sistema debe permitir al ciudadano subir documentos sin firma digital
- ✅ El sistema debe informar al usuario sobre su cuota disponible en tiempo real
- ✅ El sistema debe permitir eliminar documentos temporales
- ✅ Los documentos temporales deben marcarse como estado TEMPORAL
- ✅ El sistema debe notificar cuando se alcance el 80% y 100% del límite

**Fuente:** Caso de estudio página 3 - "La cantidad de documentos no certificados estará limitada por usuario"

---

### FR-SD-03: Recepción de Documentos por Ciudadano

**Como** ciudadano  
**Quiero** recibir documentos en mi carpeta o por email  
**Para** acceder a documentos enviados por entidades

**Criterios de Aceptación:**

- ✅ **Si el ciudadano está registrado en un operador:**
  - Los documentos deben transferirse P2P entre operadores
  - Los documentos deben aparecer automáticamente en la carpeta del ciudadano
- ✅ **Si el ciudadano NO está registrado en ningún operador:**
  - Los documentos deben enviarse por correo electrónico tradicional
  - El sistema debe usar el email del ciudadano registrado en MinTIC
- ✅ El sistema debe consultar MinTIC para determinar si el ciudadano tiene operador
- ✅ El sistema debe extraer y almacenar metadatos del documento
- ✅ El sistema debe generar notificación de documento recibido
- ✅ El sistema debe mantener el documento en cola si la carpeta está en proceso de portabilidad
- ✅ El sistema debe rechazar documentos de remitentes no autorizados

**Flujo de decisión:**

1. Entidad quiere enviar documento a ciudadano
2. Sistema consulta MinTIC: "¿Ciudadano X tiene operador?"
3. **Si SÍ:** Transferencia P2P operador → operador → carpeta ciudadano
4. **Si NO:** Envío por email tradicional

**Fuente:** Caso de estudio página 2 - "de lo contrario, le llegarán por correo electrónico"

---

### FR-SD-04: Visualización y Descarga de Documentos

**Como** ciudadano  
**Quiero** visualizar y descargar mis documentos  
**Para** acceder a ellos cuando los necesite

**Criterios de Aceptación:**

- ✅ El sistema debe permitir visualizar documentos sin descargarlos (vista previa)
- ✅ El sistema debe permitir descargar documentos individuales
- ✅ Los documentos descargados deben mantener su firma digital
- ✅ El sistema debe soportar formatos: PDF, JPEG, PNG
- ✅ El sistema debe validar la integridad del documento antes de descarga (verificación de hash)
- ✅ El sistema debe registrar cada acceso en el historial de accesos
- ✅ El sistema debe generar URLs pre-firmadas con expiración para descargas seguras

**Fuente:** Caso de estudio página 2 - "Andrés podrá descargarlos para imprimirlos, o dejarlos allí para su archivo a perpetuidad"

---

## 4. Autenticar/Firmar Documentos

**Bounded Context:** Firma y Certificación  
**Aggregate Root:** DocumentoCertificado  
**Propósito:** Garantizar autenticidad legal de documentos

### FR-AF-01: Autenticación de Documentos

**Como** entidad institucional  
**Quiero** autenticar documentos usando el servicio de MinTIC  
**Para** garantizar su autenticidad legal

**Criterios de Aceptación:**

- ✅ El sistema debe usar `/apis/authenticateDocument` con:
  - `idCitizen`: Identificación del ciudadano destinatario
  - `UrlDocument`: URL del documento a autenticar (ej: S3)
  - `documentTitle`: Título del documento
- ✅ El sistema debe manejar respuesta 200 con mensaje de confirmación
- ✅ El sistema debe manejar errores 204 (sin contenido), 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe mantener trazabilidad de qué funcionario solicitó la autenticación
- ✅ El sistema debe almacenar documentos autenticados con metadatos de autenticación
- ✅ El sistema debe registrar el proceso de autenticación en auditoría

**Ejemplo de autenticación:**

```json
{
  "idCitizen": 1234567890,
  "UrlDocument": "https://bucket.s3.amazonaws.com/documento.pdf?AWSAccessKeyId=...",
  "documentTitle": "Diploma Grado"
}
```

**Fuente:** Swagger MinTIC - `/apis/authenticateDocument`

---

## 5. Transferencia de Operador

**Bounded Context:** Gestión de Portabilidad  
**Aggregate Root:** ProcesoPortabilidad  
**Propósito:** Gestionar cambio de operador manteniendo identidad permanente

### FR-TO-01: Consulta de Operadores Disponibles

**Como** operador  
**Quiero** consultar la lista de operadores disponibles  
**Para** facilitar transferencias de ciudadanos

**Criterios de Aceptación:**

- ✅ El sistema debe usar `/apis/getOperators` para obtener lista de operadores
- ✅ El sistema debe manejar respuesta 200 con array de operadores:
  - `OperatorId`: ID del operador
  - `operatorName`: Nombre del operador
  - `transferAPIURL`: URL para transferencias
- ✅ El sistema debe manejar errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe cachear la lista de operadores para optimizar rendimiento
- ✅ El sistema debe actualizar cache periódicamente

**Ejemplo de respuesta:**

```json
[
  {
    "OperatorId": "65ca0a00d833e984e2608756",
    "operatorName": "Operador 123",
    "transferAPIURL": "http://mioperador.com/api/transferCitizen"
  }
]
```

**Fuente:** Swagger MinTIC - `/apis/getOperators`

---

### FR-TO-02: Registro de Endpoints de Transferencia

**Como** operador  
**Quiero** registrar mis endpoints para recibir transferencias  
**Para** permitir transferencias P2P entre operadores

**Criterios de Aceptación:**

- ✅ El sistema debe usar `/apis/registerTransferEndPoint` con:
  - `idOperator`: ID del operador
  - `endPoint`: URL para recibir transferencias
  - `endPointConfirm`: URL para confirmar transferencias (opcional)
- ✅ El sistema debe manejar respuesta 201 (actualizado exitosamente)
- ✅ El sistema debe manejar errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe registrar endpoints en formato estándar
- ✅ El sistema debe mantener actualizados los endpoints de transferencia

**Ejemplo de registro:**

```json
{
  "idOperator": "65ca0a00d833e984e2608756",
  "endPoint": "http://mioperador.com/api/transferCitizen",
  "endPointConfirm": "http://mioperador.com/api/transferCitizenConfirm"
}
```

**Fuente:** Swagger MinTIC - `/apis/registerTransferEndPoint`

---

### FR-TO-03: Envío a Ciudadanos sin Operador ***

**Como** operador  
**Quiero** enviar documentos a ciudadanos que no tienen operador  
**Para** garantizar entrega universal

**Criterios de Aceptación:**

- ✅ El sistema debe consultar MinTIC para determinar si el ciudadano tiene operador
- ✅ **Si el ciudadano NO tiene operador:** enviar documentos por correo electrónico tradicional
- ✅ **Si el ciudadano SÍ tiene operador:** transferencia P2P directa
- ✅ Los documentos enviados por email deben mantener firma digital
- ✅ El sistema debe enviar metadatos en formato legible
- ✅ El sistema debe generar comprobante de envío
- ✅ El sistema debe usar plantillas de email profesionales
- ✅ El sistema debe permitir configuración de remitente por operador

**Flujo de decisión:**

1. Operador quiere enviar documento a ciudadano
2. Consulta MinTIC: "¿Ciudadano X tiene operador?"
3. **Si SÍ:** Transferencia P2P directa
4. **Si NO:** Envío por email tradicional

**Fuente:** Caso de estudio página 2 - "de lo contrario, le llegarán por correo electrónico"

---

### FR-TO-04: Proceso de Transferencia de Ciudadano

**Como** operador origen  
**Quiero** transferir un ciudadano a otro operador  
**Para** completar la portabilidad

**Criterios de Aceptación:**

- ✅ El sistema debe desregistrar al ciudadano usando `/apis/unregisterCitizen`
- ✅ El sistema debe transferir datos directamente al operador destino usando su `transferAPIURL`
- ✅ El sistema debe registrar al ciudadano en el operador destino usando `/apis/registerCitizen`
- ✅ El sistema debe exportar TODOS los documentos (certificados y temporales)
- ✅ El sistema debe exportar TODOS los metadatos
- ✅ El sistema debe validar integridad de todos los documentos transferidos

**Flujo de transferencia:**

1. Desregistrar ciudadano del operador origen
2. Transferir datos P2P al operador destino
3. Registrar ciudadano en operador destino

**Fuente:** Swagger MinTIC - combinación de endpoints de registro/desregistro

---

### FR-TO-05: Registro de Operador

**Como** operador  
**Quiero** registrarme en el sistema MinTIC  
**Para** poder operar en el ecosistema de carpeta ciudadana

**Criterios de Aceptación:**

- ✅ El sistema debe usar `/apis/registerOperator` con:
  - `nameOperator`: Nombre del operador
  - `adress`: Dirección del operador
  - `contactMail`: Email de contacto
  - `participants`: Array de nombres de participantes del equipo
- ✅ El sistema debe manejar respuesta 201 con ID del operador generado
- ✅ El sistema debe manejar errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ El sistema debe almacenar el ID del operador para futuras operaciones

**Ejemplo de registro:**

```json
{
  "nameOperator": "Operador 123",
  "adress": "Cra 34 # 35 -67",
  "contactMail": "info@operador123.com",
  "participants": ["Nombre 1", "Nombre 2", "Nombre 3"]
}
```

**Fuente:** Swagger MinTIC - `/apis/registerOperator`

---

### FR-TO-06: Gestión de Documentos en Tránsito ****

**Como** operador origen  
**Quiero** manejar documentos que llegan durante la portabilidad  
**Para** evitar pérdida de información

**Criterios de Aceptación:**

- ✅ Los documentos enviados durante portabilidad deben encolarse
- ✅ Una vez completada la portabilidad, documentos deben entregarse al nuevo operador
- ✅ NO debe haber pérdida de documentos durante la transición
- ✅ El sistema debe notificar al ciudadano si hay documentos pendientes de entrega
- ✅ El sistema debe mantener cola temporal durante portabilidad
- ✅ El sistema debe validar entrega de documentos pendientes

**Fuente:** DDD análisis - "Impacto de portabilidad en documentos en tránsito"
