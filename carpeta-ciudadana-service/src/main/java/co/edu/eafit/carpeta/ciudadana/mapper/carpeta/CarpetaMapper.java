package co.edu.eafit.carpeta.ciudadana.mapper.carpeta;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.CrearCarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface CarpetaMapper {

    @Mapping(target = "carpetaId", expression = "java(generarCarpetaId())")
    @Mapping(target = "propietarioCedula", source = "cedula")
    @Mapping(target = "propietarioNombre", source = "nombreCompleto")
    @Mapping(target = "emailCarpeta", source = "emailCarpeta")
    @Mapping(target = "estadoCarpeta", constant = "ACTIVA")
    @Mapping(target = "operadorActual", source = "operadorActual")
    @Mapping(target = "espacioUtilizadoBytes", constant = "0L")
    @Mapping(target = "fechaCreacion", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "fechaUltimaModificacion", expression = "java(java.time.LocalDateTime.now())")
    CarpetaCiudadano toEntity(CrearCarpetaRequest request);

    @Mapping(target = "carpetaId", source = "carpeta.carpetaId")
    @Mapping(target = "emailCarpeta", source = "carpeta.emailCarpeta")
    @Mapping(target = "estadoCarpeta", source = "carpeta.estadoCarpeta")
    @Mapping(target = "fechaCreacion", source = "carpeta.fechaCreacion")
    @Mapping(target = "mensaje", source = "mensaje")
    CrearCarpetaResponse toCrearResponse(CarpetaCiudadano carpeta, String mensaje);

    @Mapping(target = "carpetaId", source = "carpetaId")
    @Mapping(target = "propietarioCedula", source = "propietarioCedula")
    @Mapping(target = "propietarioNombre", source = "propietarioNombre")
    @Mapping(target = "emailCarpeta", source = "emailCarpeta")
    @Mapping(target = "estadoCarpeta", source = "estadoCarpeta")
    @Mapping(target = "operadorActual", source = "operadorActual")
    @Mapping(target = "espacioUtilizadoBytes", source = "espacioUtilizadoBytes")
    @Mapping(target = "fechaCreacion", source = "fechaCreacion")
    @Mapping(target = "fechaUltimaModificacion", source = "fechaUltimaModificacion")
    CarpetaResponse toResponse(CarpetaCiudadano carpeta);

    @Named("generarCarpetaId")
    default String generarCarpetaId() {
        return UUID.randomUUID().toString();
    }
}
