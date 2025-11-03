package co.edu.eafit.carpeta.ciudadana.mapper.historial;

import co.edu.eafit.carpeta.ciudadana.dto.response.HistorialAccesoResponse;
import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;
import java.util.List;
import java.util.UUID;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface HistorialAccesoMapper {

  @Mapping(target = "accesoId", source = "accesoId")
  @Mapping(target = "documentoId", source = "documentoId")
  @Mapping(target = "tipoAcceso", source = "tipoAcceso")
  @Mapping(target = "usuarioAcceso", source = "usuarioAcceso")
  @Mapping(target = "fechaAcceso", source = "fechaAcceso")
  @Mapping(target = "resultadoAcceso", source = "resultadoAcceso")
  @Mapping(target = "motivoAcceso", source = "motivoAcceso")
  HistorialAccesoResponse toResponse(HistorialAcceso historial);

  List<HistorialAccesoResponse> toResponseList(List<HistorialAcceso> historiales);

  @Mapping(target = "carpetaId", source = "carpetaId")
  @Mapping(target = "accesoId", expression = "java(generarAccesoId())")
  @Mapping(target = "documentoId", source = "documentoId")
  @Mapping(target = "tipoAcceso", source = "tipoAcceso")
  @Mapping(target = "usuarioAcceso", source = "usuarioAcceso")
  @Mapping(target = "fechaAcceso", expression = "java(java.time.LocalDateTime.now())")
  @Mapping(target = "resultadoAcceso", constant = "EXITOSO")
  @Mapping(target = "motivoAcceso", source = "motivoAcceso")
  HistorialAcceso crearAcceso(
      String carpetaId,
      String documentoId,
      String tipoAcceso,
      String usuarioAcceso,
      String motivoAcceso);

  @Named("generarAccesoId")
  default String generarAccesoId() {
    return UUID.randomUUID().toString();
  }
}
