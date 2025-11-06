package co.edu.eafit.carpeta.ciudadana.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Respuesta paginada de documentos usando cursor-based pagination
 * Compatible con patrón "Load More" del frontend
 */
@Schema(description = "Respuesta paginada de documentos con cursor para navegación")
public record DocumentosPaginadosResponse(

    @Schema(
        description = "Lista de documentos en la página actual",
        example = "[...]"
    )
    List<DocumentoResponse> items,

    @Schema(
        description = "Cursor para obtener la siguiente página (null si no hay más páginas)",
        example = "eyJkb2N1bWVudG9JZCI6ImFiYzEyMyIsImZlY2hhIjoiMjAyNS0xMC0yMSJ9",
        nullable = true
    )
    String nextCursor,

    @Schema(
        description = "Indica si hay más documentos disponibles",
        example = "true"
    )
    boolean hasMore
) {

    /**
     * Constructor para última página (sin más documentos)
     */
    public static DocumentosPaginadosResponse lastPage(List<DocumentoResponse> items) {
        return new DocumentosPaginadosResponse(items, null, false);
    }

    /**
     * Constructor para página intermedia (hay más documentos)
     */
    public static DocumentosPaginadosResponse withMore(List<DocumentoResponse> items, String nextCursor) {
        return new DocumentosPaginadosResponse(items, nextCursor, true);
    }
}

