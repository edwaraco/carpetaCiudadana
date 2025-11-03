package co.edu.eafit.carpeta.ciudadana.registry.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CarpetaCiudadanaService {

    private final CarpetaCiudadanaClient carpetaCiudadanaClient;

    public CarpetaCiudadanaService(CarpetaCiudadanaClient carpetaCiudadanaClient) {
        this.carpetaCiudadanaClient = carpetaCiudadanaClient;
    }

    @CircuitBreaker(name = "carpeta-ciudadana-api", fallbackMethod = "crearCarpetaFallback")
    @Retry(name = "carpeta-ciudadana-api")
    public CarpetaCiudadanaResponse crearCarpeta(CrearCarpetaRequest request) {
        log.info("Creando carpeta ciudadana para cédula: {}", request.getCedula());
        
        try {
            ResponseEntity<CarpetaCiudadanaApiResponse> response = carpetaCiudadanaClient.crearCarpeta(request);
            log.info("Respuesta creación carpeta para cédula {}: {}", request.getCedula(), response.getStatusCode());
            
            CarpetaCiudadanaApiResponse apiResponse = response.getBody();
            if (apiResponse != null && apiResponse.getSuccess() && apiResponse.getData() != null) {
                CrearCarpetaResponse carpetaData = apiResponse.getData();
                return CarpetaCiudadanaResponse.builder()
                        .codigoRespuesta(response.getStatusCode().value())
                        .exitoso(true)
                        .mensaje(apiResponse.getMessage())
                        .data(CarpetaCiudadanaResponse.CarpetaData.builder()
                                .carpetaId(carpetaData.getCarpetaId())
                                .emailCarpeta(carpetaData.getEmailCarpeta())
                                .estadoCarpeta(carpetaData.getEstadoCarpeta())
                                .fechaCreacion(carpetaData.getFechaCreacion())
                                .build())
                        .build();
            }
            return CarpetaCiudadanaResponse.builder()
                    .codigoRespuesta(response.getStatusCode().value())
                    .exitoso(false)
                    .mensaje(apiResponse != null ? apiResponse.getMessage() : "Error desconocido")
                    .build();
        } catch (Exception e) {
            log.error("Error creando carpeta para cédula {}: {}", request.getCedula(), e.getMessage());
            return CarpetaCiudadanaResponse.builder()
                    .codigoRespuesta(500)
                    .exitoso(false)
                    .mensaje("Error interno del sistema")
                    .build();
        }
    }

    @CircuitBreaker(name = "carpeta-ciudadana-api", fallbackMethod = "buscarCarpetaPorCedulaFallback")
    @Retry(name = "carpeta-ciudadana-api")
    public CarpetaCiudadanaResponse buscarCarpetaPorCedula(String cedula) {
        log.info("Buscando carpeta por cédula: {}", cedula);
        
        try {
            ResponseEntity<CarpetaCiudadanaApiResponse> response = carpetaCiudadanaClient.buscarCarpetaPorCedula(cedula);
            log.info("Respuesta búsqueda carpeta por cédula {}: {}", cedula, response.getStatusCode());
            
            CarpetaCiudadanaApiResponse apiResponse = response.getBody();
            if (apiResponse != null && apiResponse.getSuccess()) {
                return CarpetaCiudadanaResponse.builder()
                        .codigoRespuesta(response.getStatusCode().value())
                        .exitoso(true)
                        .mensaje(apiResponse.getMessage())
                        .build();
            }
            return CarpetaCiudadanaResponse.builder()
                    .codigoRespuesta(response.getStatusCode().value())
                    .exitoso(false)
                    .mensaje(apiResponse != null ? apiResponse.getMessage() : "Error desconocido")
                    .build();
        } catch (Exception e) {
            log.error("Error buscando carpeta por cédula {}: {}", cedula, e.getMessage());
            return CarpetaCiudadanaResponse.builder()
                    .codigoRespuesta(500)
                    .exitoso(false)
                    .mensaje("Error interno del sistema")
                    .build();
        }
    }

    // Métodos Fallback para Circuit Breaker
    public CarpetaCiudadanaResponse crearCarpetaFallback(CrearCarpetaRequest request, Exception ex) {
        log.warn("Circuit Breaker activado para crearCarpeta. Cedula: {}, Error: {}", request.getCedula(), ex.getMessage());
        return CarpetaCiudadanaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio Carpeta Ciudadana temporalmente no disponible")
                .build();
    }

    public CarpetaCiudadanaResponse buscarCarpetaPorCedulaFallback(String cedula, Exception ex) {
        log.warn("Circuit Breaker activado para buscarCarpetaPorCedula. Cedula: {}, Error: {}", cedula, ex.getMessage());
        return CarpetaCiudadanaResponse.builder()
                .codigoRespuesta(503)
                .exitoso(false)
                .mensaje("Servicio Carpeta Ciudadana temporalmente no disponible")
                .build();
    }
}
