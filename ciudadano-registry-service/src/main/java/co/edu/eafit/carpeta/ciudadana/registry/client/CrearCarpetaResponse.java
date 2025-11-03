package co.edu.eafit.carpeta.ciudadana.registry.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CrearCarpetaResponse {
  private String carpetaId;
  private String emailCarpeta;
  private String estadoCarpeta;
  private String fechaCreacion;
  private String mensaje;
}
