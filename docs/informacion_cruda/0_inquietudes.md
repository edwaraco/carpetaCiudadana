## Inquietudes

### Importantes para la funcionalidad
1. **Registro de usuarios** 
    - ¿Quién genera el correo: nosotros como operador o el MinTIC centralizado?
    - ¿Cómo se garantiza la unicidad del correo entre todos los operadores?
    - ¿Quién debe de garantizar que un usuario no presente registro en más de un operador?

2. **Registro de entidades**
    - **Pregunta:** ¿Qué proceso de verificación se requiere para entidades?
    - **Pregunta:** ¿Se consulta algún registro oficial? (RUT, Cámara de Comercio, etc.)
    - **Pregunta:** ¿Las entidades también reciben correo @carpetacolombia.co o tienen formato diferente?


3. **Verificación de entidades:**
   - ¿Qué documentación debe presentar una entidad para registrarse?
   - ¿Hay consulta a algún registro oficial (Cámara de Comercio, Registro Único Tributario)?

2. **Cuentas de entidades:**
   - ¿Las entidades reciben correo @carpetacolombia.co?
   - ¿Qué formato tendría? (ej: ¿entidad.departamento@carpetacolombia.co?)

3. **Tipos de entidades:**
   - ¿Hay diferencia en funcionalidades entre entidades públicas y privadas?
   - ¿Las entidades públicas DEBEN registrarse en GovCarpeta?

4. **Permisos de entidades:**
   - ¿Qué puede hacer una entidad que un ciudadano no puede?
   - ¿Pueden las entidades firmar digitalmente documentos directamente en el sistema?

5. **Múltiples usuarios en una entidad:**
   - ¿Una entidad tiene múltiples usuarios/funcionarios que acceden a su carpeta?
   - ¿Hay gestión de roles dentro de una entidad? (ej: funcionario que solicita vs. funcionario que autoriza)

6. **Documentos de entidades:**
   - ¿Las entidades tienen documentos propios en su carpeta? (ej: RUT, certificado de existencia)
   - ¿O solo gestionan documentos de/hacia ciudadanos?

---

### Importantes para la Arquitectura

1. **Disponibilidad Cuantificada (RNF-02.1)**
   - ¿Cuál es el % de uptime objetivo? (99.9%, 99.95%, 99.99%) - Lo podemos definir nosotros
   - ¿Cuál es el tiempo máximo de recuperación aceptable (RTO)?
   - ¿Cuál es la pérdida máxima de datos aceptable (RPO)?

2. **Latencia Específica (RNF-04.2)**
   - ¿Cuál es la latencia máxima aceptable para envío de documentos?
   - ¿Cuál es el tiempo máximo para notificaciones?
   - ¿Hay diferencia entre servicios básicos y Premium?

3. **Autenticación (RNF-05.3)**
   - ¿Qué método de autenticación es obligatorio? (usuario/contraseña, 2FA, biométrico)
   - ¿Se integrará con sistemas existentes del gobierno?

4. **Firma Digital (RNF-05.4)**
   - ¿Qué estándar de firma digital se debe usar? (ADES, XAdES, PAdES)
   - ¿Quién emite los certificados digitales?

5. **Límites de Documentos No Certificados (RNF-03.2)**
   - ¿Cuál es el límite por usuario?
   - ¿Cuál es el tamaño máximo por documento no certificado?

### Importante para Diseño

6. **Volumen de Transacciones**
   - ¿Cuántos documentos se espera procesar diariamente?
   - ¿Cuál es el pico de transacciones esperado?

7. **Análisis de Datos (RF-08)**
   - ¿Qué tipo de consultas se deben soportar?
   - ¿Es análisis en tiempo real o batch?
   - ¿Qué herramientas/tecnologías prefiere el MinTIC?

8. **Formato de Documentos**
   - ¿Qué formatos de archivo se soportan? (PDF, XML, imágenes)
   - ¿Hay restricciones de tamaño por tipo?

9. **Regulación y Cumplimiento**
   - ¿Hay normativas de protección de datos específicas? (habeas data, GDPR equivalente)
   - ¿Hay requisitos de auditoría específicos?

10. **Modelo de Operadores**
    - ¿Cuántos operadores privados se esperan inicialmente?
    - ¿Hay requisitos mínimos de infraestructura para ser operador?

### Deseable para Optimización

11. **Usabilidad Cuantificada (RNF-06)**
    - ¿Hay métricas específicas de usabilidad?
    - ¿Hay estudios de usuario previos?

12. **Interoperabilidad Técnica (RNF-07)**
    - ¿Hay preferencia por protocolos específicos? (REST, SOAP, gRPC)
    - ¿Hay estándares de metadatos definidos?

13. **Servicios Premium**
    - ¿Qué otros servicios Premium se han identificado además de PQRS?
    - ¿Hay restricciones sobre lo que puede ser Premium vs. gratuito?
