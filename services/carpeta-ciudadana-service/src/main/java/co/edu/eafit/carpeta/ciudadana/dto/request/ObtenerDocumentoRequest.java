package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ObtenerDocumentoRequest(
    @NotBlank(message = "El ID de la carpeta es requerido") String carpetaId,
    @NotBlank(message = "El ID del documento es requerido") String documentoId) {}
