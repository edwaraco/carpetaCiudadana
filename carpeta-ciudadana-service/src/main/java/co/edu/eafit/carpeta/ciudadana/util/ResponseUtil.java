package co.edu.eafit.carpeta.ciudadana.util;

import co.edu.eafit.carpeta.ciudadana.dto.response.ApiResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CrearCarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.SubirDocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
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

  public static CrearCarpetaResponse toCrearCarpetaResponse(CarpetaCiudadano carpeta) {
    return new CrearCarpetaResponse(
        carpeta.getCarpetaId(),
        carpeta.getEmailCarpeta(),
        carpeta.getEstadoCarpeta(),
        carpeta.getFechaCreacion(),
        "Carpeta creada exitosamente");
  }

  public static CarpetaResponse toCarpetaResponse(CarpetaCiudadano carpeta) {
    return new CarpetaResponse(
        carpeta.getCarpetaId(),
        carpeta.getPropietarioCedula(),
        carpeta.getPropietarioNombre(),
        carpeta.getEmailCarpeta(),
        carpeta.getEstadoCarpeta(),
        carpeta.getOperadorActual(),
        carpeta.getEspacioUtilizadoBytes(),
        carpeta.getFechaCreacion(),
        carpeta.getFechaUltimaModificacion());
  }

  public static SubirDocumentoResponse toSubirDocumentoResponse(Documento documento) {
    return new SubirDocumentoResponse(
        documento.getDocumentoId(),
        documento.getTitulo(),
        documento.getTipoDocumento(),
        documento.getEstadoDocumento(),
        documento.getTamanoBytes(),
        documento.getFechaRecepcion(),
        "Documento subido exitosamente");
  }

  public static DocumentoResponse toDocumentoResponse(Documento documento) {
    return new DocumentoResponse(
        documento.getDocumentoId(),
        documento.getTitulo(),
        documento.getTipoDocumento(),
        documento.getContextoDocumento(),
        documento.getEstadoDocumento(),
        documento.getFechaRecepcion(),
        documento.getFechaUltimaModificacion(),
        documento.getEsDescargable(),
        documento.getFormatoArchivo(),
        documento.getTamanoBytes(),
        documento.getHashDocumento());
  }

  public static List<DocumentoResponse> toDocumentoResponseList(List<Documento> documentos) {
    return documentos.stream().map(ResponseUtil::toDocumentoResponse).collect(Collectors.toList());
  }
}
