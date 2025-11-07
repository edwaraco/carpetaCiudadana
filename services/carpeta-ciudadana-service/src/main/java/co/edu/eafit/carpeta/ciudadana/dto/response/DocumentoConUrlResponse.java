package co.edu.eafit.carpeta.ciudadana.dto.response;

import co.edu.eafit.carpeta.ciudadana.entity.Documento;

public record DocumentoConUrlResponse(
    Documento documento,
    String urlDescarga
) {}
