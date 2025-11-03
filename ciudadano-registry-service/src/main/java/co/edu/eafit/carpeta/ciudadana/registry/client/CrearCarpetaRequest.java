package co.edu.eafit.carpeta.ciudadana.registry.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearCarpetaRequest {
    private String cedula;
    private String nombreCompleto;
    private String operadorActual;
}
