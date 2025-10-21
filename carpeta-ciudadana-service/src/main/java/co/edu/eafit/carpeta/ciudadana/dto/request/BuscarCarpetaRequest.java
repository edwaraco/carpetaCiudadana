package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO para buscar una carpeta por cédula
 */
public record BuscarCarpetaRequest(
    @NotBlank(message = "La cédula es requerida")
    @Size(min = 6, max = 12, message = "La cédula debe tener entre 6 y 12 caracteres")
    String cedula
) {}
