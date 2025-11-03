# Services

Directorio para todos los microservicios y aplicaciones del sistema Carpeta Ciudadana.

Cada servicio debe estar en su propio subdirectorio y puede usar la tecnología que mejor se adapte a sus necesidades (Node.js, Python, Java, Go, etc.).

## Servicios Potenciales

Basado en el análisis DDD, estos son algunos de los servicios que podrían implementarse:

### Core Domain Services
- **operador-api**: API principal del operador (gestión de carpetas, documentos, transferencias)
- **centralizador-api**: API del MinTIC (registro de ubicaciones ciudadano→operador)
- **portabilidad-service**: Servicio de gestión de portabilidad entre operadores
- **transferencia-service**: Servicio de transferencia P2P de documentos

### Supporting Services
- **auth-service**: Autenticación y autorización (JWT, MFA)
- **certification-service**: Firma digital y certificación de documentos

### Generic Services
- **notification-service**: Notificaciones (Email, SMS, Push)
- **analytics-service**: Análisis de metadatos para el Estado
- **premium-service**: Gestión de servicios premium (PQRS, etc.)

### User-Facing Applications
- **citizen-web**: Aplicación web para ciudadanos
- **web-entidad**: Aplicación web para entidades
- **mobile-app**: Aplicación móvil (futuro)

## Estructura Recomendada por Servicio

Cada servicio debería tener al menos:
```
service-name/
├── README.md           # Documentación específica del servicio
├── src/                # Código fuente
├── tests/              # Tests
└── [archivos de config según tecnología]
```

