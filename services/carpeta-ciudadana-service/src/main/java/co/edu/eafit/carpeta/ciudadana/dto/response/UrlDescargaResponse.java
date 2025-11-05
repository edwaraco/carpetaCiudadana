package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record UrlDescargaResponse(
    String documentoId, String urlDescarga, LocalDateTime fechaExpiracion, String mensaje) {}
