package co.edu.eafit.carpeta.ciudadana.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request para iniciar el proceso de autenticación de un documento")
public record IniciarAutenticacionRequest(
    
    @Schema(description = "ID de la carpeta que contiene el documento", example = "550e8400-e29b-41d4-a716-446655440000")
    @NotBlank(message = "El ID de la carpeta es obligatorio")
    String carpetaId,
    
    @Schema(description = "ID del documento a autenticar", example = "660e8400-e29b-41d4-a716-446655440001")
    @NotBlank(message = "El ID del documento es obligatorio")
    String documentoId
) {}
