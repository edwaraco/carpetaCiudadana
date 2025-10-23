package co.edu.eafit.carpeta.ciudadana.mapper.document;

import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DocumentoResponseMapper {

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

    List<DocumentoResponse> toResponseList(List<Documento> documentos);
}
