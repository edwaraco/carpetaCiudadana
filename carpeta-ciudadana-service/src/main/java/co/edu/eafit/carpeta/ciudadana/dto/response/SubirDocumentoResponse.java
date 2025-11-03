package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record SubirDocumentoResponse(
    String documentoId,
    String titulo,
    String tipoDocumento,
    String estadoDocumento,
    Long tamanoBytes,
    LocalDateTime fechaRecepcion,
    String mensaje) {}
