# Requisitos Funcionales - Sistema Carpeta Ciudadana

**Proyecto:** Sistema Carpeta Ciudadana
**Versión:** 1.0
**Fecha:** 13 de Octubre, 2025
**Fuente:** Caso de estudio + Análisis DDD

## Introducción
Este documento define los Requisitos No Funcionales (RNF) o atributos de Calidad de Servicio (QoS) que el sistema debe cumplir para operar como un proveedor certificado del gobierno, garantizando el cumplimiento normativo y la estabilidad a escala nacional.

## Principio de Calidad
>Los RNF deben ser cuantificables, verificables y no negociables para los dominios Core y Supporting.

## Clasificación de Atributos (QoS)
Los RNF se organizan en categorías clave para Arquitecturas Avanzadas:

- Disponibilidad/Resiliencia
- Escalabilidad/Rendimiento
- Seguridad/Confidencialidad
- Mantenibilidad/Eficiencia

## Tabla de Contenidos
1. Disponibilidad y Resiliencia
2. Escalabilidad
3. Rendimiento y Latencia
4. Seguridad
5. Mantenibilidad
6. Usabilidad y Accesibilidad
7. Eficiencia (Arquitectónica)
8. Interoperabilidad

## 1. Disponibilidad y Resiliencia *

__Propósito:__ Garantizar el acceso 24/7 a documentos críticos e inmutabilidad de datos.

|  ID  |	Métrica |	Criterio de Aceptación (QoS) |	Prioridad |
|----------|----------|----------|----------|
| RNF-01 |	Disponibilidad (Uptime) |	99.99% para el Core Domain (Carpeta Personal, Transferencia, Identidad). |	Crítica |
| RNF-02 |	Tiempo de Recuperación (RTO) |	El tiempo máximo para restaurar el servicio después de una caída total debe ser menor a 60 minutos. |	Alta |
| RNF-03 |	Pérdida de Datos (RPO) |	La pérdida máxima de datos aceptada (transacciones) debe ser menor a 5 minutos. |	Crítica |
| RNF-04 |	Tolerancia a Fallos |	El sistema debe ser resiliente al fallo de una región completa (o un centro de datos principal) sin interrupción del servicio. |	Alta |
| RNF-05 |	Respaldo de Documentos |	Se debe realizar copia de seguridad diaria de todos los documentos y metadatos, con retención mínima de 5 años. |	Alta |

## 2. Escalabilidad *

__Propósito:__ Soportar la demanda masiva de la ciudadanía.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-06 |	Volumen de Usuarios |	El sistema debe diseñarse para manejar el registro y almacenamiento de datos de 55 millones de ciudadanos (100% de la población objetivo) a largo plazo. |	Alta |
| RNF-07 |	Usuarios Concurrentes | El sistema debe soportar picos de 660.000 usuarios concurrentes activos (basado en el 1% de la población total más un margen de diseño del 20%). |	Alta |
| RNF-08 |	Volumen de Transferencias |	Capacidad para gestionar picos de 5 millones de transferencias de documentos al día (un promedio de ≈1.25 transacciones por usuario activo diario). |	Alta |
| RNF-09 |	Escalado Horizontal |	Todos los componentes del Core Domain deben ser escalables horizontalmente (añadiendo nodos sin límite teórico). |	Alta |
| RNF-10 |	Almacenamiento |	La infraestructura debe proveer almacenamiento ilimitado (limitless storage) para documentos certificados. |	Crítica |

## 3. Rendimiento y Latencia

__Propósito:__ Asegurar que los procesos de Seguridad Crítica (cifrado, validación de firmas, MFA) tengan tiempo suficiente para ejecutarse, aceptando una mayor latencia.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-11 |	API Crítica (p95) |	El 95% de las respuestas de las APIs del Core Domain (Visualización, Autorización, que requieren verificación de firma/MFA) deben ser menores a 600 ms. |	Alta |
| RNF-12 |	Consulta Centralizador (p95) |	El 95% de las consultas al Service Registry del MinTIC deben ser menores a 150 ms. |	Alta |
| RNF-13 |	Tiempo de Transferencia |	La transferencia P2P de documentos debe ser menor a 8 segundos para archivos de hasta 10MB. |	Alta |
| RNF-14 |	Transacciones por Segundo |	El sistema debe ser capaz de procesar 2.000 transacciones por segundo (TPS) en la capa de persistencia de metadatos. |	Media |

## 4. Seguridad *

__Propósito:__ Reforzar los aspectos de confidencialidad, autorización compleja y mecanismo de autenticación sólido elevándolos a estándares de "No Negociable" y endureciendo las métricas.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-15 |	Cifrado en Reposo |	Todos los documentos y metadatos deben ser cifrados en reposo usando AES-256 o superior. |	Crítica |
| RNF-16 |	Cifrado en Tránsito |	Toda la comunicación externa e interna debe usar TLS 1.3 o superior. |	Crítica |
| RNF-17 |	Autenticación |	La autenticación del ciudadano debe ser Multi-Factor Obligatoria (MFA) usando al menos un factor biométrico o certificado digital, con sesiones limitadas a 15 minutos de inactividad. |	No Negociable |
| RNF-18 |	Auditoría (Inmutabilidad) |	El historial de accesos y el log de auditoría de seguridad deben ser inmutables y conservarse por mínimo 5 años. |	Crítica |
| RNF-19 |	Cumplimiento Legal |	El sistema debe ser certificado bajo la norma ISO 27001, cumplir con Habeas Data y someterse a pruebas de penetración externas trimestrales. |	No Negociable |
| RNF-20 |	Autorización (Granular) |	El control de acceso debe ser granular a nivel de documento y basarse en el consentimiento explícito. La revocación de permisos debe ser inmediata. |	Crítica |

## 5. Mantenibilidad

__Propósito:__ Facilitar la evolución y el soporte de la plataforma a largo plazo.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-21 |	Tiempo Medio de Reparación (MTTR) |	El tiempo promedio para desplegar una corrección de un error crítico (bug) en producción debe ser menor a 4 horas. |	Alta |
| RNF-22 |	Cobertura de Pruebas |	El código del Core Domain debe tener una cobertura de pruebas unitarias superior al 85%. |	Media |
| RNF-23 |	Modificabilidad |	La adición de un nuevo tipo de documento debe requerir la modificación de menos de 3 componentes principales. |	Media |
| RNF-24 |	Documentación |	La documentación arquitectónica (ADR, C4 Model) debe mantenerse sincronizada al 100% con la implementación. |	Media |

## 6. Usabilidad y Accesibilidad

__Propósito:__ Democratizar el acceso a los servicios digitales.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-25 |	Adopción (Tasa de Éxito) |	El 90% de los usuarios que inicien un flujo principal (ej. compartir documento) deben completarlo sin contactar soporte. |	Alta |
| RNF-26 |	Tiempo de Tarea |	El tiempo promedio para completar la tarea principal (Autorización de Envío) debe ser menor a 30 segundos. |	Alta |
| RNF-27 |	Accesibilidad |	Las interfaz gráfica debe cumplir con las Pautas de Accesibilidad para el Contenido Web WCAG 2.1 Nivel AA. |	Media |

## 7. Eficiencia (Arquitectónica)

__Propósito:__ Cumplir con la restricción de diseño del Centralizador MinTIC.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-28 |	Ratio de Consultas |	El 95% de las consultas de ubicación deben ser resueltas por el caché local del operador (solo el 5% o menos debe ir al Centralizador MinTIC). |	Alta |
| RNF-29 |	Volumen de Datos a MinTIC |	La transferencia de datos hacia y desde el Centralizador MinTIC (Registry) debe limitarse a metadatos de ubicación/identificación (máximo 1KB por transacción). |	Crítica |
| RNF-30 |	Transferencia de Documentos |	El 0% del contenido de documentos o metadatos completos debe pasar por la infraestructura del Centralizador MinTIC. |	Crítica |

## 8. Interoperabilidad

__Propósito:__ Asegurar la comunicación fluida y la compatibilidad de datos entre múltiples operadores.

| ID | Métrica | Criterio de Aceptación (QoS)  |	Prioridad |
|----------|----------|----------|----------|
| RNF-31 |	Estándares de Comunicación |	Las APIs de comunicación entre operadores deben usar protocolos estandarizados (RESTful con JSON o gRPC con Protocol Buffers). |	Alta |
| RNF-32 |	Estandarización de Datos |	Los esquemas de metadatos (Clasificación, Identificación) y los formatos de eventos deben estar estandarizados bajo un esquema común (JSON Schema o Avro). |	Alta |
| RNF-33 |	Migración (Portabilidad) |	El proceso de migración de datos de un ciudadano entre dos operadores debe tener una tasa de éxito del 99.9% en la transferencia de documentos y metadatos. |	Alta |
