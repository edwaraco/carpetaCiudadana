package co.edu.eafit.carpeta.ciudadana.util;

import co.edu.eafit.carpeta.ciudadana.dto.response.ApiResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CrearCarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.SubirDocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Utilidad para generar respuestas HTTP de forma consistente
 * Centraliza la lógica de creación de respuestas
 */
public class ResponseUtil {

    private ResponseUtil() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * Crea una respuesta exitosa con código 200 OK
     */
    public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Crea una respuesta exitosa con código 200 OK y mensaje
     */
    public static <T> ResponseEntity<ApiResponse<T>> ok(T data, String message) {
        return ResponseEntity.ok(ApiResponse.success(data, message));
    }

    /**
     * Crea una respuesta exitosa con código 201 CREATED
     */
    public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    /**
     * Crea una respuesta exitosa con código 201 CREATED y mensaje
     */
    public static <T> ResponseEntity<ApiResponse<T>> created(T data, String message) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data, message));
    }

    /**
     * Crea una respuesta exitosa sin contenido (204 NO CONTENT)
     */
    public static <T> ResponseEntity<ApiResponse<T>> noContent() {
        return ResponseEntity.noContent().build();
    }

    /**
     * Crea una respuesta de error con código 400 BAD REQUEST
     */
    public static <T> ResponseEntity<ApiResponse<T>> badRequest(String message) {
        return ResponseEntity.badRequest().body(ApiResponse.error(message, "BAD_REQUEST"));
    }

    /**
     * Crea una respuesta de error con código 404 NOT FOUND
     */
    public static <T> ResponseEntity<ApiResponse<T>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(message, "NOT_FOUND"));
    }

    /**
     * Crea una respuesta de error con código 409 CONFLICT
     */
    public static <T> ResponseEntity<ApiResponse<T>> conflict(String message) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(message, "CONFLICT"));
    }

    /**
     * Crea una respuesta de error con código 500 INTERNAL SERVER ERROR
     */
    public static <T> ResponseEntity<ApiResponse<T>> internalError(String message) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(message, "INTERNAL_SERVER_ERROR"));
    }

    // Métodos específicos para carpetas

    /**
     * Convierte una entidad CarpetaCiudadano a CrearCarpetaResponse
     */
    public static CrearCarpetaResponse toCrearCarpetaResponse(CarpetaCiudadano carpeta) {
        return new CrearCarpetaResponse(
                carpeta.getCarpetaId(),
                carpeta.getEmailCarpeta(),
                carpeta.getEstadoCarpeta(),
                carpeta.getFechaCreacion(),
                "Carpeta creada exitosamente"
        );
    }

    /**
     * Convierte una entidad CarpetaCiudadano a CarpetaResponse
     */
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
                carpeta.getFechaUltimaModificacion()
        );
    }

    // Métodos específicos para documentos

    /**
     * Convierte una entidad Documento a SubirDocumentoResponse
     */
    public static SubirDocumentoResponse toSubirDocumentoResponse(Documento documento) {
        return new SubirDocumentoResponse(
                documento.getDocumentoId(),
                documento.getTitulo(),
                documento.getTipoDocumento(),
                documento.getEstadoDocumento(),
                documento.getTamanoBytes(),
                documento.getFechaRecepcion(),
                "Documento subido exitosamente"
        );
    }

    /**
     * Convierte una entidad Documento a DocumentoResponse
     */
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
                documento.getHashDocumento()
        );
    }

    /**
     * Convierte una lista de Documentos a DocumentoResponse
     */
    public static List<DocumentoResponse> toDocumentoResponseList(List<Documento> documentos) {
        return documentos.stream()
                .map(ResponseUtil::toDocumentoResponse)
                .collect(Collectors.toList());
    }
}

