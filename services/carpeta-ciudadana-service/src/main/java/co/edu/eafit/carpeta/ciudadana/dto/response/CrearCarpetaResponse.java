package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.time.LocalDateTime;

public record CrearCarpetaResponse(
    String carpetaId,
    String emailCarpeta,
    String estadoCarpeta,
    LocalDateTime fechaCreacion,
    String mensaje) {}
