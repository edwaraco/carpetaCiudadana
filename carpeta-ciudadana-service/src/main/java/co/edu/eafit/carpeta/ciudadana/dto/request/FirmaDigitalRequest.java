package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO para solicitar autenticación/firma digital de un documento
 * Basado en la API de MinTIC /apis/authenticateDocument
 */
public record FirmaDigitalRequest(
    @NotBlank(message = "El ID del ciudadano es requerido")
    @Size(min = 1, max = 50, message = "El ID del ciudadano debe tener entre 1 y 50 caracteres")
    String idCitizen,
    
    @NotBlank(message = "La URL del documento es requerida")
    @Size(max = 500, message = "La URL del documento no puede exceder 500 caracteres")
    String urlDocument,
    
    @NotBlank(message = "El título del documento es requerido")
    @Size(min = 2, max = 200, message = "El título del documento debe tener entre 2 y 200 caracteres")
    String documentTitle,
    
    @Size(max = 100, message = "El funcionario solicitante no puede exceder 100 caracteres")
    String funcionarioSolicitante,
    
    @Size(max = 100, message = "La entidad solicitante no puede exceder 100 caracteres")
    String entidadSolicitante,
    
    @Size(max = 500, message = "El motivo de autenticación no puede exceder 500 caracteres")
    String motivoAutenticacion
) {}
