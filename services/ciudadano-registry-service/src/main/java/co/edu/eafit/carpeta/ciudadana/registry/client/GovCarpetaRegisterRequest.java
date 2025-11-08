package co.edu.eafit.carpeta.ciudadana.registry.client;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GovCarpetaRegisterRequest {
  private Long id;
  private String name;
  private String address;
  private String email;
  private String operatorId;
  private String operatorName;
}
