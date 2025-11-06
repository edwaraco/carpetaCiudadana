package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ObtenerDocumentosCarpetaRequest(
    @NotBlank(message = "El ID de la carpeta es requerido")
    String carpetaId
) {}
