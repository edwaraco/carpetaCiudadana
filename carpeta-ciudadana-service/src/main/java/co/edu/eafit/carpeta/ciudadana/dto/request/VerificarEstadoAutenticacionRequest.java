package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO para verificar estado de autenticación
 */
public record VerificarEstadoAutenticacionRequest(
    @NotBlank(message = "El ID de la carpeta es requerido")
    String carpetaId,
    
    @NotBlank(message = "El ID del documento es requerido")
    String documentoId
) {}
