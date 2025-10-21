package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO para carpeta creada exitosamente
 */
public record CrearCarpetaResponse(
    String carpetaId,
    String emailCarpeta,
    String estadoCarpeta,
    LocalDateTime fechaCreacion,
    String mensaje
) {}
