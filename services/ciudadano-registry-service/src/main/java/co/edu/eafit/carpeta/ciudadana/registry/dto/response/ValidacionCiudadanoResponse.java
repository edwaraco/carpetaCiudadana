package co.edu.eafit.carpeta.ciudadana.registry.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValidacionCiudadanoResponse {

  private Long cedula;
  private Boolean disponible;
  private String mensaje;
  private Integer codigoRespuesta;
}
