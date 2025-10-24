package co.edu.eafit.carpeta.ciudadana.registry.client;

import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
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

@Slf4j
@Component
public class GovCarpetaClient {

    private final WebClient webClient;
    private final String baseUrl;

    public GovCarpetaClient(@Value("${govcarpeta.api.base-url}") String baseUrl,
                           @Value("${govcarpeta.api.timeout-seconds:30}") int timeoutSeconds) {
        this.baseUrl = baseUrl;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "validarCiudadanoFallback")
    @Retry(name = "govcarpeta-api")
    @TimeLimiter(name = "govcarpeta-api")
    public Mono<GovCarpetaResponse> validarCiudadano(Long cedula) {
        log.info("Validando ciudadano con cédula: {}", cedula);
        
        return webClient.get()
                .uri("/apis/validateCitizen/{id}", cedula)
                .retrieve()
                .toEntity(String.class)
                .timeout(Duration.ofSeconds(30))
                .map(response -> {
                    log.info("Respuesta validación ciudadano {}: {}", cedula, response.getStatusCode());
                    return GovCarpetaResponse.builder()
                            .codigoRespuesta(response.getStatusCode().value())
                            .exitoso(response.getStatusCode() == HttpStatus.OK)
                            .mensaje(response.getBody())
                            .build();
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error validando ciudadano {}: {}", cedula, ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(ex.getStatusCode().value())
                            .exitoso(false)
                            .mensaje(ex.getResponseBodyAsString())
                            .build());
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error inesperado validando ciudadano {}: {}", cedula, ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(500)
                            .exitoso(false)
                            .mensaje("Error interno del sistema")
                            .build());
                });
    }

    @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "registrarCiudadanoFallback")
    @Retry(name = "govcarpeta-api")
    @TimeLimiter(name = "govcarpeta-api")
    public Mono<GovCarpetaResponse> registrarCiudadano(RegistrarCiudadanoRequest request) {
        log.info("Registrando ciudadano con cédula: {}", request.getCedula());
        
        GovCarpetaRegisterRequest govRequest = GovCarpetaRegisterRequest.builder()
                .id(request.getCedula())
                .name(request.getNombreCompleto())
                .address(request.getDireccion())
                .email(request.getEmail())
                .operatorId(request.getOperadorId())
                .operatorName(request.getOperadorNombre())
                .build();

        return webClient.post()
                .uri("/apis/registerCitizen")
                .bodyValue(govRequest)
                .retrieve()
                .toEntity(String.class)
                .timeout(Duration.ofSeconds(30))
                .map(response -> {
                    log.info("Respuesta registro ciudadano {}: {}", request.getCedula(), response.getStatusCode());
                    return GovCarpetaResponse.builder()
                            .codigoRespuesta(response.getStatusCode().value())
                            .exitoso(response.getStatusCode() == HttpStatus.CREATED)
                            .mensaje(response.getBody())
                            .build();
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error registrando ciudadano {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(ex.getStatusCode().value())
                            .exitoso(false)
                            .mensaje(ex.getResponseBodyAsString())
                            .build());
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error inesperado registrando ciudadano {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(500)
                            .exitoso(false)
                            .mensaje("Error interno del sistema")
                            .build());
                });
    }

    @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "desregistrarCiudadanoFallback")
    @Retry(name = "govcarpeta-api")
    @TimeLimiter(name = "govcarpeta-api")
    public Mono<GovCarpetaResponse> desregistrarCiudadano(DesregistrarCiudadanoRequest request) {
        log.info("Desregistrando ciudadano con cédula: {}", request.getCedula());
        
        GovCarpetaUnregisterRequest govRequest = GovCarpetaUnregisterRequest.builder()
                .id(request.getCedula())
                .operatorId(request.getOperadorId())
                .operatorName(request.getOperadorNombre())
                .build();

        return webClient.delete()
                .uri("/apis/unregisterCitizen")
                .bodyValue(govRequest)
                .retrieve()
                .toEntity(String.class)
                .timeout(Duration.ofSeconds(30))
                .map(response -> {
                    log.info("Respuesta desregistro ciudadano {}: {}", request.getCedula(), response.getStatusCode());
                    return GovCarpetaResponse.builder()
                            .codigoRespuesta(response.getStatusCode().value())
                            .exitoso(response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.NO_CONTENT)
                            .mensaje(response.getBody())
                            .build();
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error desregistrando ciudadano {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(ex.getStatusCode().value())
                            .exitoso(false)
                            .mensaje(ex.getResponseBodyAsString())
                            .build());
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error inesperado desregistrando ciudadano {}: {}", request.getCedula(), ex.getMessage());
                    return Mono.just(GovCarpetaResponse.builder()
                            .codigoRespuesta(500)
                            .exitoso(false)
                            .mensaje("Error interno del sistema")
                            .build());
                });
    }

    // Métodos Fallback para Circuit Breaker
    public Mono<GovCarpetaResponse> validarCiudadanoFallback(Long cedula, Exception ex) {
        log.warn("Circuit Breaker activado para validarCiudadano. Cedula: {}, Error: {}", cedula, ex.getMessage());
        return Mono.just(GovCarpetaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio GovCarpeta temporalmente no disponible")
                .build());
    }

    public Mono<GovCarpetaResponse> registrarCiudadanoFallback(RegistrarCiudadanoRequest request, Exception ex) {
        log.warn("Circuit Breaker activado para registrarCiudadano. Cedula: {}, Error: {}", request.getCedula(), ex.getMessage());
        return Mono.just(GovCarpetaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio GovCarpeta temporalmente no disponible")
                .build());
    }

    public Mono<GovCarpetaResponse> desregistrarCiudadanoFallback(DesregistrarCiudadanoRequest request, Exception ex) {
        log.warn("Circuit Breaker activado para desregistrarCiudadano. Cedula: {}, Error: {}", request.getCedula(), ex.getMessage());
        return Mono.just(GovCarpetaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio GovCarpeta temporalmente no disponible")
                .build());
    }

    // DTOs para la comunicación con GovCarpeta
    @lombok.Data
    @lombok.Builder
    public static class GovCarpetaRegisterRequest {
        private Long id;
        private String name;
        private String address;
        private String email;
        private String operatorId;
        private String operatorName;
    }

    @lombok.Data
    @lombok.Builder
    public static class GovCarpetaUnregisterRequest {
        private Long id;
        private String operatorId;
        private String operatorName;
    }

    @lombok.Data
    @lombok.Builder
    public static class GovCarpetaResponse {
        private Integer codigoRespuesta;
        private Boolean exitoso;
        private String mensaje;
    }
}
