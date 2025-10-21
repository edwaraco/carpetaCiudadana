package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO para firma digital/autenticación de documento
 */
public record FirmaDigitalResponse(
    Boolean exitoso,
    String mensaje,
    String mensajeError,
    Integer codigoRespuesta,
    String firmaDigital,
    String certificadoValidez,
    LocalDateTime fechaCertificacion,
    String entidadCertificadora
) {}
