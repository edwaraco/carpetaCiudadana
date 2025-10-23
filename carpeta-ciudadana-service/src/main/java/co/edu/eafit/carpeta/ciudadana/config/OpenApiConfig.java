package co.edu.eafit.carpeta.ciudadana.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI carpetaCiudadanaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Carpeta Ciudadana API")
                        .description("""
                                API REST para la gestión de carpetas ciudadanas y documentos digitales.
                                
                                ## Funcionalidades Principales (MVP)
                                
                                1. **Crear Carpetas Ciudadanas Únicas**: Registro de ciudadanos con email inmutable
                                2. **Almacenar Documentos**: Subir documentos temporales o certificados
                                3. **Ver Mis Documentos**: Listar y consultar documentos de la carpeta
                                4. **Integración con Firma Digital**: Soporte para documentos certificados
                                
                                ## Características Técnicas
                                
                                - **Almacenamiento**: DynamoDB + MinIO/S3
                                - **Seguridad**: Hash SHA-256 para integridad de documentos
                                - **Arquitectura**: Microservicios con DDD y Clean Architecture
                                - **Portabilidad**: Soporte para cambio de operador (72h)
                                
                                ## Convenciones de Respuesta
                                
                                Todas las respuestas siguen el formato `ApiResponse<T>`:
                                
                                ```json
                                {
                                  "success": true|false,
                                  "message": "Mensaje descriptivo",
                                  "data": { ... },
                                  "error": { ... },  // Solo en errores
                                  "timestamp": "2025-10-21T10:30:00"
                                }
                                ```
                                
                                ## Códigos de Error
                                
                                - `RESOURCE_NOT_FOUND`: Recurso no encontrado (404)
                                - `CARPETA_ALREADY_EXISTS`: Carpeta duplicada (409)
                                - `DOCUMENT_UPLOAD_ERROR`: Error subiendo archivo (500)
                                - `INVALID_REQUEST`: Validación fallida (400)
                                - `STORAGE_ERROR`: Error en almacenamiento (500)
                                - `INTERNAL_SERVER_ERROR`: Error interno (500)
                                """)
                        .version("1.0.0 (MVP)")
                        .contact(new Contact()
                                .name("Equipo Carpeta Ciudadana")
                                .email("contacto@carpetacolombia.co")
                                .url("https://carpetacolombia.co"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api/v1")
                                .description("Servidor Local de Desarrollo"),
                        new Server()
                                .url("https://api.carpetacolombia.co/api/v1")
                                .description("Servidor de Producción")
                ));
    }
}

