package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO para información de carpeta ciudadana
 */
public record CarpetaResponse(
    String carpetaId,
    String propietarioCedula,
    String propietarioNombre,
    String emailCarpeta,
    String estadoCarpeta,
    String operadorActual,
    Long espacioUtilizadoBytes,
    LocalDateTime fechaCreacion,
    LocalDateTime fechaUltimaModificacion
) {}
