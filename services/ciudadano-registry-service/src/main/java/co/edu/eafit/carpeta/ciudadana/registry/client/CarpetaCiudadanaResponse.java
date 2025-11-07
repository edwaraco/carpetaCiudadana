package co.edu.eafit.carpeta.ciudadana.registry.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarpetaCiudadanaResponse {
  private Integer codigoRespuesta;
  private Boolean exitoso;
  private String mensaje;
  private CarpetaData data;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CarpetaData {
    private String carpetaId;
    private String emailCarpeta;
    private String estadoCarpeta;
    private String fechaCreacion;
  }
}
