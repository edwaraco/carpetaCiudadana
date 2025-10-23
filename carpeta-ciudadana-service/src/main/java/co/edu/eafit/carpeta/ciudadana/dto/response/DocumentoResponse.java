package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record DocumentoResponse(
    String documentoId,
    String titulo,
    String tipoDocumento,
    String contextoDocumento,
    String estadoDocumento,
    LocalDateTime fechaRecepcion,
    LocalDateTime fechaUltimaModificacion,
    Boolean esDescargable,
    String formatoArchivo,
    Long tamanoBytes,
    String hashDocumento
) {}
