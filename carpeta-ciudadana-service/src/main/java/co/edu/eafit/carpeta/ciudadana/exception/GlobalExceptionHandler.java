package co.edu.eafit.carpeta.ciudadana.exception;

import co.edu.eafit.carpeta.ciudadana.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Manejador global de excepciones para toda la aplicación
 * Proporciona manejo centralizado y consistente de errores
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Maneja excepciones cuando un recurso no es encontrado
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        
        log.warn("Recurso no encontrado: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .field(ex.getFieldName())
                .rejectedValue(ex.getFieldValue())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones cuando una carpeta ya existe
     */
    @ExceptionHandler(CarpetaAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleCarpetaAlreadyExistsException(
            CarpetaAlreadyExistsException ex, WebRequest request) {
        
        log.warn("Carpeta duplicada: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("CARPETA_ALREADY_EXISTS")
                .message(ex.getMessage())
                .field("cedula")
                .rejectedValue(ex.getCedula())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones al subir documentos
     */
    @ExceptionHandler(DocumentUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleDocumentUploadException(
            DocumentUploadException ex, WebRequest request) {
        
        log.error("Error subiendo documento: {}", ex.getMessage(), ex);
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("DOCUMENT_UPLOAD_ERROR")
                .message(ex.getMessage())
                .field("carpetaId")
                .rejectedValue(ex.getCarpetaId())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones de validación de peticiones
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequestException(
            InvalidRequestException ex, WebRequest request) {
        
        log.warn("Petición inválida: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("INVALID_REQUEST")
                .message(ex.getMessage())
                .field(ex.getField())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones del sistema de almacenamiento
     */
    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageException(
            StorageException ex, WebRequest request) {
        
        log.error("Error en almacenamiento: {}", ex.getMessage(), ex);
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("STORAGE_ERROR")
                .message("Error en el sistema de almacenamiento: " + ex.getMessage())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones de validación de Bean Validation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        log.warn("Error de validación: {}", ex.getMessage());
        
        String field = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getField()
                : "unknown";
        
        String message = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "Error de validación";
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("VALIDATION_ERROR")
                .message(message)
                .field(field)
                .build();
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja excepciones cuando el archivo es demasiado grande
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, WebRequest request) {
        
        log.warn("Archivo demasiado grande: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("FILE_TOO_LARGE")
                .message("El archivo excede el tamaño máximo permitido")
                .build();
        
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        
        log.warn("Argumento ilegal: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("INVALID_ARGUMENT")
                .message(ex.getMessage())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error));
    }

    /**
     * Maneja todas las demás excepciones no específicas
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(
            Exception ex, WebRequest request) {
        
        log.error("Error interno del servidor: {}", ex.getMessage(), ex);
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("INTERNAL_SERVER_ERROR")
                .message("Ha ocurrido un error interno. Por favor, contacte al administrador.")
                .build();
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(error));
    }
}

