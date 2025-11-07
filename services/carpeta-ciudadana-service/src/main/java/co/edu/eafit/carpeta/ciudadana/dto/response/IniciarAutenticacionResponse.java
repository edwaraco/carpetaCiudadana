package co.edu.eafit.carpeta.ciudadana.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Respuesta al iniciar el proceso de autenticación de un documento")
public record IniciarAutenticacionResponse(
    
    @Schema(description = "ID del documento", example = "660e8400-e29b-41d4-a716-446655440001")
    String documentoId,
    
    @Schema(description = "Título del documento", example = "Diploma Universitario")
    String titulo,
    
    @Schema(description = "Estado actual del documento", example = "EN_AUTENTICACION")
    String estadoDocumento,
    
    @Schema(description = "Fecha en que se inició la autenticación")
    LocalDateTime fechaInicioAutenticacion,
    
    @Schema(description = "URL temporal para descargar el documento", example = "http://localhost:9000/carpeta-ciudadana-docs/...")
    String urlDescarga,
    
    @Schema(description = "Minutos de validez de la URL de descarga", example = "15")
    int minutosValidez,
    
    @Schema(description = "Mensaje informativo", example = "Proceso de autenticación iniciado exitosamente")
    String mensaje
) {
    
    public static IniciarAutenticacionResponse of(
            String documentoId, 
            String titulo, 
            String estadoDocumento,
            LocalDateTime fechaInicioAutenticacion,
            String urlDescarga,
            int minutosValidez,
            String mensaje) {
        return new IniciarAutenticacionResponse(
            documentoId, 
            titulo, 
            estadoDocumento, 
            fechaInicioAutenticacion,
            urlDescarga,
            minutosValidez,
            mensaje
        );
    }
}
