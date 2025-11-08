package co.edu.eafit.carpeta.ciudadana.registry.client;

import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class GovCarpetaService {

  private final GovCarpetaClient govCarpetaClient;

  public GovCarpetaService(GovCarpetaClient govCarpetaClient) {
    this.govCarpetaClient = govCarpetaClient;
  }

  @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "validarCiudadanoFallback")
  @Retry(name = "govcarpeta-api")
  public GovCarpetaResponse validarCiudadano(Long cedula) {
    log.info("Validando ciudadano con cédula: {}", cedula);

    try {
      ResponseEntity<String> response = govCarpetaClient.validarCiudadano(cedula);
      log.info("Respuesta validación ciudadano {}: {}", cedula, response.getStatusCode());

      // 204 = No Content = Ciudadano NO registrado (disponible)
      // 200 = OK = Ciudadano YA registrado
      boolean exitoso = response.getStatusCode() == HttpStatus.NO_CONTENT 
                     || response.getStatusCode() == HttpStatus.OK;

      return GovCarpetaResponse.builder()
          .codigoRespuesta(response.getStatusCode().value())
          .exitoso(exitoso)
          .mensaje(response.getBody())
          .build();
    } catch (Exception e) {
      log.error("Error validando ciudadano {}: {}", cedula, e.getMessage());
      return GovCarpetaResponse.builder()
          .codigoRespuesta(500)
          .exitoso(false)
          .mensaje("Error interno del sistema")
          .build();
    }
  }

  @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "registrarCiudadanoFallback")
  @Retry(name = "govcarpeta-api")
  public GovCarpetaResponse registrarCiudadano(RegistrarCiudadanoRequest request) {
    log.info("Registrando ciudadano con cédula: {}", request.getCedula());

    String emailGenerado =
        generarEmailCarpeta(request.getNombreCompleto(), request.getCedula().toString());

    GovCarpetaRegisterRequest govRequest =
        GovCarpetaRegisterRequest.builder()
            .id(request.getCedula())
            .name(request.getNombreCompleto())
            .address(request.getDireccion())
            .email(emailGenerado)
            .operatorId("SISTEMA_REGISTRO")
            .operatorName("Sistema de Registro")
            .build();

    try {
      ResponseEntity<String> response = govCarpetaClient.registrarCiudadano(govRequest);
      log.info(
          "Respuesta registro ciudadano {}: {}", request.getCedula(), response.getStatusCode());

      return GovCarpetaResponse.builder()
          .codigoRespuesta(response.getStatusCode().value())
          .exitoso(response.getStatusCode() == HttpStatus.CREATED)
          .mensaje(response.getBody())
          .build();
    } catch (Exception e) {
      log.error("Error registrando ciudadano {}: {}", request.getCedula(), e.getMessage());
      return GovCarpetaResponse.builder()
          .codigoRespuesta(500)
          .exitoso(false)
          .mensaje("Error interno del sistema")
          .build();
    }
  }

  @CircuitBreaker(name = "govcarpeta-api", fallbackMethod = "desregistrarCiudadanoFallback")
  @Retry(name = "govcarpeta-api")
  public GovCarpetaResponse desregistrarCiudadano(DesregistrarCiudadanoRequest request) {
    log.info("Desregistrando ciudadano con cédula: {}", request.getCedula());

    GovCarpetaUnregisterRequest govRequest =
        GovCarpetaUnregisterRequest.builder()
            .id(request.getCedula())
            .operatorId("SISTEMA_REGISTRO")
            .operatorName("Sistema de Registro")
            .build();

    try {
      ResponseEntity<String> response = govCarpetaClient.desregistrarCiudadano(govRequest);
      log.info(
          "Respuesta desregistro ciudadano {}: {}", request.getCedula(), response.getStatusCode());

      return GovCarpetaResponse.builder()
          .codigoRespuesta(response.getStatusCode().value())
          .exitoso(
              response.getStatusCode() == HttpStatus.OK
                  || response.getStatusCode() == HttpStatus.CREATED
                  || response.getStatusCode() == HttpStatus.NO_CONTENT)
          .mensaje(response.getBody())
          .build();
    } catch (Exception e) {
      log.error("Error desregistrando ciudadano {}: {}", request.getCedula(), e.getMessage());
      return GovCarpetaResponse.builder()
          .codigoRespuesta(500)
          .exitoso(false)
          .mensaje("Error interno del sistema")
          .build();
    }
  }

  // Métodos Fallback para Circuit Breaker
  public GovCarpetaResponse validarCiudadanoFallback(Long cedula, Exception ex) {
    log.warn(
        "Circuit Breaker activado para validarCiudadano. Cedula: {}, Error: {}",
        cedula,
        ex.getMessage());
    return GovCarpetaResponse.builder()
        .codigoRespuesta(503)
        .exitoso(false)
        .mensaje("Servicio GovCarpeta temporalmente no disponible")
        .build();
  }

  public GovCarpetaResponse registrarCiudadanoFallback(
      RegistrarCiudadanoRequest request, Exception ex) {
    log.warn(
        "Circuit Breaker activado para registrarCiudadano. Cedula: {}, Error: {}",
        request.getCedula(),
        ex.getMessage());
    return GovCarpetaResponse.builder()
        .codigoRespuesta(503)
        .exitoso(false)
        .mensaje("Servicio GovCarpeta temporalmente no disponible")
        .build();
  }

  public GovCarpetaResponse desregistrarCiudadanoFallback(
      DesregistrarCiudadanoRequest request, Exception ex) {
    log.warn(
        "Circuit Breaker activado para desregistrarCiudadano. Cedula: {}, Error: {}",
        request.getCedula(),
        ex.getMessage());
    return GovCarpetaResponse.builder()
        .codigoRespuesta(503)
        .exitoso(false)
        .mensaje("Servicio GovCarpeta temporalmente no disponible")
        .build();
  }

  private String generarEmailCarpeta(String nombreCompleto, String cedula) {
    String nombreNormalizado =
        nombreCompleto.toLowerCase().replaceAll("\\s+", ".").replaceAll("[^a-z0-9.]", "");

    return String.format("%s.%s@carpetacolombia.co", nombreNormalizado, cedula);
  }
}
