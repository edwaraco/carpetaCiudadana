package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO para obtener documentos de carpeta
 */
public record ObtenerDocumentosCarpetaRequest(
    @NotBlank(message = "El ID de la carpeta es requerido")
    String carpetaId
) {}
