package co.edu.eafit.carpeta.ciudadana.mapper.document;

import co.edu.eafit.carpeta.ciudadana.dto.response.SubirDocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubirDocumentoMapper {

    @Mapping(target = "documentoId", source = "documento.documentoId")
    @Mapping(target = "titulo", source = "documento.titulo")
    @Mapping(target = "tipoDocumento", source = "documento.tipoDocumento")
    @Mapping(target = "estadoDocumento", source = "documento.estadoDocumento")
    @Mapping(target = "tamanoBytes", source = "documento.tamanoBytes")
    @Mapping(target = "fechaRecepcion", source = "documento.fechaRecepcion")
    @Mapping(target = "mensaje", source = "mensaje")
    SubirDocumentoResponse toResponse(Documento documento, String mensaje);

    @Mapping(target = "documentoId", source = "documentoId")
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "tipoDocumento", source = "tipoDocumento")
    @Mapping(target = "estadoDocumento", source = "estadoDocumento")
    @Mapping(target = "tamanoBytes", source = "tamanoBytes")
    @Mapping(target = "fechaRecepcion", source = "fechaRecepcion")
    @Mapping(target = "mensaje", constant = "Documento subido exitosamente")
    SubirDocumentoResponse toResponse(Documento documento);
}
