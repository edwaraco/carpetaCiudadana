package co.edu.eafit.carpeta.ciudadana.registry.client;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GovCarpetaUnregisterRequest {
  private Long id;
  private String operatorId;
  private String operatorName;
}
