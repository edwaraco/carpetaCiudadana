package co.edu.eafit.carpeta.ciudadana.dto.response;

import java.util.List;

public record ListaDocumentosResponse(
    String carpetaId,
    List<DocumentoResponse> documentos,
    Integer totalDocumentos,
    String mensaje
) {}
