package co.edu.eafit.carpeta.ciudadana.registry.client;

import co.edu.eafit.carpeta.ciudadana.registry.exception.BusinessException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Component
public class CarpetaCiudadanaClient {

    private final WebClient webClient;
    private final String baseUrl;

    public CarpetaCiudadanaClient(@Value("${carpeta-ciudadana.api.base-url}") String baseUrl,
                                  @Value("${carpeta-ciudadana.api.timeout-seconds:30}") int timeoutSeconds) {
        this.baseUrl = baseUrl;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    @CircuitBreaker(name = "carpeta-ciudadana-api", fallbackMethod = "crearCarpetaFallback")
    @Retry(name = "carpeta-ciudadana-api")
    @TimeLimiter(name = "carpeta-ciudadana-api")
    public Mono<CarpetaCiudadanaResponse> crearCarpeta(CrearCarpetaRequest request) {
        log.info("Creando carpeta ciudadana para cédula: {}", request.getCedula());
        
        return webClient.post()
                .uri("/carpetas")
                .bodyValue(request)
                .retrieve()
                .toEntity(CarpetaCiudadanaResponse.class)
                .timeout(Duration.ofSeconds(30))
                .map(response -> {
                    log.info("Respuesta creación carpeta para cédula {}: {}", request.getCedula(), response.getStatusCode());
                    return response.getBody();
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error creando carpeta para cédula {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(CarpetaCiudadanaResponse.builder()
                            .codigoRespuesta(ex.getStatusCode().value())
                            .exitoso(false)
                            .mensaje(ex.getResponseBodyAsString())
                            .build());
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error inesperado creando carpeta para cédula {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(CarpetaCiudadanaResponse.builder()
                            .codigoRespuesta(500)
                            .exitoso(false)
                            .mensaje("Error interno del sistema")
                            .build());
                });
    }

    @CircuitBreaker(name = "carpeta-ciudadana-api", fallbackMethod = "buscarCarpetaPorCedulaFallback")
    @Retry(name = "carpeta-ciudadana-api")
    @TimeLimiter(name = "carpeta-ciudadana-api")
    public Mono<CarpetaCiudadanaResponse> buscarCarpetaPorCedula(String cedula) {
        log.info("Buscando carpeta por cédula: {}", cedula);
        
        return webClient.get()
                .uri("/carpetas/cedula/{cedula}", cedula)
                .retrieve()
                .toEntity(CarpetaCiudadanaResponse.class)
                .timeout(Duration.ofSeconds(30))
                .map(response -> {
                    log.info("Respuesta búsqueda carpeta por cédula {}: {}", cedula, response.getStatusCode());
                    return response.getBody();
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error buscando carpeta por cédula {}: {}", cedula, ex.getMessage());
                    return Mono.just(CarpetaCiudadanaResponse.builder()
                            .codigoRespuesta(ex.getStatusCode().value())
                            .exitoso(false)
                            .mensaje(ex.getResponseBodyAsString())
                            .build());
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error inesperado buscando carpeta por cédula {}: {}", cedula, ex.getMessage());
                    return Mono.just(CarpetaCiudadanaResponse.builder()
                            .codigoRespuesta(500)
                            .exitoso(false)
                            .mensaje("Error interno del sistema")
                            .build());
                });
    }

    // Métodos Fallback para Circuit Breaker
    public Mono<CarpetaCiudadanaResponse> crearCarpetaFallback(CrearCarpetaRequest request, Exception ex) {
        log.warn("Circuit Breaker activado para crearCarpeta. Cedula: {}, Error: {}", request.getCedula(), ex.getMessage());
        return Mono.just(CarpetaCiudadanaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio Carpeta Ciudadana temporalmente no disponible")
                .build());
    }

    public Mono<CarpetaCiudadanaResponse> buscarCarpetaPorCedulaFallback(String cedula, Exception ex) {
        log.warn("Circuit Breaker activado para buscarCarpetaPorCedula. Cedula: {}, Error: {}", cedula, ex.getMessage());
        return Mono.just(CarpetaCiudadanaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio Carpeta Ciudadana temporalmente no disponible")
                .build());
    }

    // DTOs para la comunicación con Carpeta Ciudadana
    @lombok.Data
    @lombok.Builder
    public static class CrearCarpetaRequest {
        private String cedula;
        private String nombreCompleto;
        private String operadorActual;
    }

    @lombok.Data
    @lombok.Builder
    public static class CarpetaCiudadanaResponse {
        private Integer codigoRespuesta;
        private Boolean exitoso;
        private String mensaje;
        private CarpetaData data;
        
        @lombok.Data
        @lombok.Builder
        public static class CarpetaData {
            private String carpetaId;
            private String emailCarpeta;
            private String estadoCarpeta;
            private String fechaCreacion;
        }
    }
}
