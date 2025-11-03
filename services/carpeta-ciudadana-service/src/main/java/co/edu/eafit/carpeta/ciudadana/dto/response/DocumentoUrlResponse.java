package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record DocumentoUrlResponse(
    String documentoId,
    String titulo,
    String urlDescarga,
    LocalDateTime expiraEn,
    Integer minutosValidez,
    String mensaje
) {
    public static DocumentoUrlResponse of(String documentoId, String titulo, String urlDescarga, int minutosValidez) {
        return new DocumentoUrlResponse(
            documentoId,
            titulo,
            urlDescarga,
            LocalDateTime.now().plusMinutes(minutosValidez),
            minutosValidez,
            "URL de descarga generada exitosamente. Esta URL expirará en " + minutosValidez + " minutos."
        );
    }
}

