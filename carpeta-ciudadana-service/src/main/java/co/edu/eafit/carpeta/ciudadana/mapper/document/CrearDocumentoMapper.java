package co.edu.eafit.carpeta.ciudadana.mapper.document;

import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Mapper para operaciones de creación de documentos
 * Utiliza MapStruct para mapear entre DTOs y entidades
 */
@Mapper(componentModel = "spring")
public interface CrearDocumentoMapper {

    /**
     * Mapea un request de subir documento a una entidad Documento
     * @param request Request con los datos del documento
     * @param archivo Archivo multipart
     * @return Entidad Documento lista para persistir
     */
    @Mapping(target = "carpetaId", source = "request.carpetaId")
    @Mapping(target = "documentoId", expression = "java(generarDocumentoId())")
    @Mapping(target = "titulo", source = "request.titulo")
    @Mapping(target = "tipoDocumento", source = "request.tipoDocumento")
    @Mapping(target = "contextoDocumento", source = "request.contextoDocumento")
    @Mapping(target = "descripcion", source = "request.descripcion")
    @Mapping(target = "formatoArchivo", source = "archivo.contentType")
    @Mapping(target = "tamanoBytes", source = "archivo.size")
    @Mapping(target = "estadoDocumento", constant = "TEMPORAL")
    @Mapping(target = "esDescargable", constant = "true")
    @Mapping(target = "fechaRecepcion", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "fechaUltimaModificacion", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "hashDocumento", ignore = true) // Se calcula en el servicio
    @Mapping(target = "urlAlmacenamiento", ignore = true) // Se asigna en el servicio después de subir a MinIO
    @Mapping(target = "firmadoPor", ignore = true) // Solo para documentos certificados
    @Mapping(target = "certificadoValidez", ignore = true) // Solo para documentos certificados
    Documento toEntity(SubirDocumentoConArchivoRequest request, MultipartFile archivo);

    /**
     * Genera un ID único para el documento
     */
    @Named("generarDocumentoId")
    default String generarDocumentoId() {
        return UUID.randomUUID().toString();
    }

}
