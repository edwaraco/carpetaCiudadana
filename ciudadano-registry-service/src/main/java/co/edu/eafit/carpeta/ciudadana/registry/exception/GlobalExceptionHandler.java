package co.edu.eafit.carpeta.ciudadana.registry.exception;

import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

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

    @ExceptionHandler(CiudadanoAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleCiudadanoAlreadyExistsException(
            CiudadanoAlreadyExistsException ex, WebRequest request) {
        
        log.warn("Ciudadano duplicado: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("CIUDADANO_ALREADY_EXISTS")
                .message(ex.getMessage())
                .field("cedula")
                .rejectedValue(ex.getCedula())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(error));
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleExternalServiceException(
            ExternalServiceException ex, WebRequest request) {
        
        log.error("Error en servicio externo: {}", ex.getMessage(), ex);
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("EXTERNAL_SERVICE_ERROR")
                .message(ex.getMessage())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error(error));
    }

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

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException ex, WebRequest request) {
        
        log.warn("Error de negocio: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("BUSINESS_ERROR")
                .message(ex.getMessage())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error));
    }

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

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalStateException(
            IllegalStateException ex, WebRequest request) {
        
        log.warn("Estado ilegal: {}", ex.getMessage());
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("INVALID_STATE")
                .message(ex.getMessage())
                .build();
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        
        log.error("Error de runtime: {}", ex.getMessage(), ex);
        
        ApiResponse.ErrorDetails error = ApiResponse.ErrorDetails.builder()
                .code("RUNTIME_ERROR")
                .message("Ha ocurrido un error interno. Por favor, contacte al administrador.")
                .build();
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(error));
    }

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
