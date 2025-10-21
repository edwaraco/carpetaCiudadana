package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO para autenticar documento
 */
public record AutenticarDocumentoRequest(
    @NotBlank(message = "El ID de la carpeta es requerido")
    String carpetaId,
    
    @NotBlank(message = "El ID del documento es requerido")
    String documentoId,
    
    @NotBlank(message = "El funcionario solicitante es requerido")
    @Size(min = 2, max = 100, message = "El funcionario solicitante debe tener entre 2 y 100 caracteres")
    String funcionarioSolicitante,
    
    @NotBlank(message = "La entidad solicitante es requerida")
    @Size(min = 2, max = 100, message = "La entidad solicitante debe tener entre 2 y 100 caracteres")
    String entidadSolicitante
) {}
