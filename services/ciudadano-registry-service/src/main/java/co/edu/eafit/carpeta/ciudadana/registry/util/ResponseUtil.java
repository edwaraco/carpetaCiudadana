package co.edu.eafit.carpeta.ciudadana.registry.util;

import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ApiResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.AuditoriaRegistroResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.RegistroCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtil {

  private ResponseUtil() {
    throw new IllegalStateException("Utility class");
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
    return ResponseEntity.ok(ApiResponse.success(data));
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok(T data, String message) {
    return ResponseEntity.ok(ApiResponse.success(data, message));
  }

  public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
  }

  public static <T> ResponseEntity<ApiResponse<T>> created(T data, String message) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data, message));
  }

  public static <T> ResponseEntity<ApiResponse<T>> noContent() {
    return ResponseEntity.noContent().build();
  }

  public static <T> ResponseEntity<ApiResponse<T>> badRequest(String message) {
    return ResponseEntity.badRequest().body(ApiResponse.error(message, "BAD_REQUEST"));
  }

  public static <T> ResponseEntity<ApiResponse<T>> notFound(String message) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(message, "NOT_FOUND"));
  }

  public static <T> ResponseEntity<ApiResponse<T>> conflict(String message) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message, "CONFLICT"));
  }

  public static <T> ResponseEntity<ApiResponse<T>> internalError(String message) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(message, "INTERNAL_SERVER_ERROR"));
  }

  public static <T> ResponseEntity<ApiResponse<T>> serviceUnavailable(String message) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(ApiResponse.error(message, "SERVICE_UNAVAILABLE"));
  }

  public static RegistroCiudadanoResponse toRegistroCiudadanoResponse(RegistroCiudadano registro) {
    return RegistroCiudadanoResponse.builder()
        .id(String.valueOf(registro.getCedula()))
        .cedula(registro.getCedula())
        .nombreCompleto(registro.getNombreCompleto())
        .direccion(registro.getDireccion())
        .email(registro.getEmail())
        .carpetaId(registro.getCarpetaId())
        .estado(registro.getEstado())
        .fechaRegistroGovCarpeta(registro.getFechaRegistroGovCarpeta())
        .fechaCreacion(registro.getFechaCreacion())
        .activo(registro.getActivo())
        .build();
  }

  public static AuditoriaRegistroResponse toAuditoriaRegistroResponse(AuditoriaRegistro auditoria) {
    return AuditoriaRegistroResponse.builder()
        .id(auditoria.getPk())
        .cedulaCiudadano(auditoria.getCedulaCiudadano())
        .accion(auditoria.getAccion())
        .operadorId(auditoria.getOperadorId())
        .operadorNombre(auditoria.getOperadorNombre())
        .resultado(auditoria.getResultado())
        .codigoRespuesta(auditoria.getCodigoRespuesta())
        .mensajeRespuesta(auditoria.getMensajeRespuesta())
        .detallesAdicionales(auditoria.getDetallesAdicionales())
        .ipOrigen(auditoria.getIpOrigen())
        .userAgent(auditoria.getUserAgent())
        .fechaAccion(auditoria.getFechaAccion())
        .build();
  }

  public static List<RegistroCiudadanoResponse> toRegistroCiudadanoResponseList(
      List<RegistroCiudadano> registros) {
    return registros.stream()
        .map(ResponseUtil::toRegistroCiudadanoResponse)
        .collect(Collectors.toList());
  }

  public static List<AuditoriaRegistroResponse> toAuditoriaRegistroResponseList(
      List<AuditoriaRegistro> auditorias) {
    return auditorias.stream()
        .map(ResponseUtil::toAuditoriaRegistroResponse)
        .collect(Collectors.toList());
  }
}
