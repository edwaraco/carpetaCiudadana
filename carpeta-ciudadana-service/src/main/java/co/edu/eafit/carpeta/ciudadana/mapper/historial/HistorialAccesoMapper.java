package co.edu.eafit.carpeta.ciudadana.mapper.historial;

import co.edu.eafit.carpeta.ciudadana.dto.response.HistorialAccesoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.UUID;

/**
 * Mapper para operaciones de historial de acceso
 * Utiliza MapStruct para mapear entre DTOs y entidades
 */
@Mapper(componentModel = "spring")
public interface HistorialAccesoMapper {

    /**
     * Convierte una entidad HistorialAcceso a HistorialAccesoResponse
     * @param historial Entidad HistorialAcceso
     * @return HistorialAccesoResponse DTO
     */
    @Mapping(target = "accesoId", source = "accesoId")
    @Mapping(target = "documentoId", source = "documentoId")
    @Mapping(target = "tipoAcceso", source = "tipoAcceso")
    @Mapping(target = "usuarioAcceso", source = "usuarioAcceso")
    @Mapping(target = "fechaAcceso", source = "fechaAcceso")
    @Mapping(target = "resultadoAcceso", source = "resultadoAcceso")
    @Mapping(target = "motivoAcceso", source = "motivoAcceso")
    HistorialAccesoResponse toResponse(HistorialAcceso historial);

    /**
     * Convierte una lista de entidades HistorialAcceso a lista de HistorialAccesoResponse
     * @param historiales Lista de entidades HistorialAcceso
     * @return Lista de HistorialAccesoResponse DTOs
     */
    List<HistorialAccesoResponse> toResponseList(List<HistorialAcceso> historiales);

    /**
     * Crea una entidad HistorialAcceso para registrar un acceso
     * @param carpetaId ID de la carpeta
     * @param documentoId ID del documento
     * @param tipoAcceso Tipo de acceso
     * @param usuarioAcceso Usuario que realiza el acceso
     * @param motivoAcceso Motivo del acceso
     * @return Entidad HistorialAcceso lista para persistir
     */
    @Mapping(target = "carpetaId", source = "carpetaId")
    @Mapping(target = "accesoId", expression = "java(generarAccesoId())")
    @Mapping(target = "documentoId", source = "documentoId")
    @Mapping(target = "tipoAcceso", source = "tipoAcceso")
    @Mapping(target = "usuarioAcceso", source = "usuarioAcceso")
    @Mapping(target = "fechaAcceso", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "resultadoAcceso", constant = "EXITOSO")
    @Mapping(target = "motivoAcceso", source = "motivoAcceso")
    HistorialAcceso crearAcceso(String carpetaId, String documentoId, String tipoAcceso, 
                               String usuarioAcceso, String motivoAcceso);

    /**
     * Genera un ID único para el acceso
     */
    @Named("generarAccesoId")
    default String generarAccesoId() {
        return UUID.randomUUID().toString();
    }
}
