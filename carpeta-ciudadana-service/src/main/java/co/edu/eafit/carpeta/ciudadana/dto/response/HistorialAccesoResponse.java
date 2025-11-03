package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record HistorialAccesoResponse(
    String accesoId,
    String documentoId,
    String tipoAcceso,
    String usuarioAcceso,
    LocalDateTime fechaAcceso,
    String resultadoAcceso,
    String motivoAcceso) {}
