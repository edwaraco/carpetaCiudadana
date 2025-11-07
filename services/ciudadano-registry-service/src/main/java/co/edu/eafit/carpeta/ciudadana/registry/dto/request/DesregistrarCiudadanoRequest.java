package co.edu.eafit.carpeta.ciudadana.registry.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DesregistrarCiudadanoRequest {

  @NotNull(message = "La cédula es obligatoria") @Positive(message = "La cédula debe ser un número positivo") private Long cedula;

  private String motivoDesregistro;
}
