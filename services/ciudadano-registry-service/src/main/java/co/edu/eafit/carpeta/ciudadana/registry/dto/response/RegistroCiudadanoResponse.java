package co.edu.eafit.carpeta.ciudadana.registry.dto.response;

import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistroCiudadanoResponse {

  private String id;
  private Long cedula;
  private String nombreCompleto;
  private String direccion;
  private String email;
  private String carpetaId;
  private RegistroCiudadano.EstadoRegistro estado;
  private LocalDateTime fechaRegistroGovCarpeta;
  private LocalDateTime fechaCreacion;
  private Boolean activo;
}
