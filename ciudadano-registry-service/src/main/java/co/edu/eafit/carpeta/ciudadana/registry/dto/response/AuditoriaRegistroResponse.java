package co.edu.eafit.carpeta.ciudadana.registry.dto.response;

import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

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
