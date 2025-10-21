package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO para URL de descarga de documento
 */
public record UrlDescargaResponse(
    String documentoId,
    String urlDescarga,
    LocalDateTime fechaExpiracion,
    String mensaje
) {}
