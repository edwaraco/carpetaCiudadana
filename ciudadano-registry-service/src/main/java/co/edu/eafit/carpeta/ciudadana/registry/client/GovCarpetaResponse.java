package co.edu.eafit.carpeta.ciudadana.registry.client;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GovCarpetaResponse {
    private Integer codigoRespuesta;
    private Boolean exitoso;
    private String mensaje;
}
