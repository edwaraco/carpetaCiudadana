package co.edu.eafit.carpeta.ciudadana.mapper.document;

import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper para operaciones de respuesta de documentos
 * Convierte entidades Documento a DTOs de respuesta
 */
@Mapper(componentModel = "spring")
public interface DocumentoResponseMapper {

    /**
     * Convierte una entidad Documento a DocumentoResponse
     * @param documento Entidad Documento
     * @return DocumentoResponse DTO
     */
    @Mapping(target = "documentoId", source = "documentoId")
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "tipoDocumento", source = "tipoDocumento")
    @Mapping(target = "contextoDocumento", source = "contextoDocumento")
    @Mapping(target = "estadoDocumento", source = "estadoDocumento")
    @Mapping(target = "fechaRecepcion", source = "fechaRecepcion")
    @Mapping(target = "fechaUltimaModificacion", source = "fechaUltimaModificacion")
    @Mapping(target = "esDescargable", source = "esDescargable")
    @Mapping(target = "formatoArchivo", source = "formatoArchivo")
    @Mapping(target = "tamanoBytes", source = "tamanoBytes")
    @Mapping(target = "hashDocumento", source = "hashDocumento")
    DocumentoResponse toResponse(Documento documento);

    /**
     * Convierte una lista de entidades Documento a lista de DocumentoResponse
     * @param documentos Lista de entidades Documento
     * @return Lista de DocumentoResponse DTOs
     */
    List<DocumentoResponse> toResponseList(List<Documento> documentos);
}
