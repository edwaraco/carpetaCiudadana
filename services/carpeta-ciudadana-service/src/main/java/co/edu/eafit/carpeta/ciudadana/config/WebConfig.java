package co.edu.eafit.carpeta.ciudadana.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración global de CORS (Cross-Origin Resource Sharing)
 *
 * Esta configuración permite que el backend acepte peticiones desde orígenes específicos.
 * Los orígenes permitidos se configuran mediante la variable de entorno CORS_ALLOWED_ORIGINS.
 *
 * Ejemplo de uso:
 * - Desarrollo: CORS_ALLOWED_ORIGINS=http://localhost:3000
 * - Producción: CORS_ALLOWED_ORIGINS=https://carpetaciudadana.gov.co,https://app.carpetaciudadana.gov.co
 * - Docker: CORS_ALLOWED_ORIGINS=http://localhost:3000,http://citizen-web
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        String[] methods = allowedMethods.split(",");

        log.info("Configurando CORS con orígenes permitidos: {}", allowedOrigins);
        log.info("Métodos HTTP permitidos: {}", allowedMethods);

        // Usar allowedOriginPatterns en lugar de allowedOrigins para soportar:
        // - Orígenes específicos de la variable de entorno
        // - localhost con cualquier puerto (para Swagger UI y desarrollo)
        registry.addMapping("/**")
                .allowedOriginPatterns(origins)
                .allowedMethods(methods)
                .allowedHeaders(allowedHeaders.split(","))
                .allowCredentials(allowCredentials)
                .maxAge(maxAge);
    }
}

