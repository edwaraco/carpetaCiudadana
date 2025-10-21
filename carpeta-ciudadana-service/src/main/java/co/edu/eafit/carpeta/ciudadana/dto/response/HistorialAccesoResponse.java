package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO para historial de accesos
 * Simplificado para MVP - incluye solo campos esenciales para auditoría básica
 */
public record HistorialAccesoResponse(
    String accesoId,
    String documentoId,
    String tipoAcceso,
    String usuarioAcceso,
    LocalDateTime fechaAcceso,
    String resultadoAcceso,
    String motivoAcceso
) {}
