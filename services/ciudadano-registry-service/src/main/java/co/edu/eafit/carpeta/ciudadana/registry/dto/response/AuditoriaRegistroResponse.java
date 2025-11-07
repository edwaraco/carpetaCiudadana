package co.edu.eafit.carpeta.ciudadana.registry.dto.response;

import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditoriaRegistroResponse {

  private String id;
  private Long cedulaCiudadano;
  private AuditoriaRegistro.AccionAuditoria accion;
  private String operadorId;
  private String operadorNombre;
  private String resultado;
  private Integer codigoRespuesta;
  private String mensajeRespuesta;
  private String detallesAdicionales;
  private String ipOrigen;
  private String userAgent;
  private LocalDateTime fechaAccion;
}
