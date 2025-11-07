package co.edu.eafit.carpeta.ciudadana.event;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoAutenticadoEvent {
  private String documentoId;
  private String carpetaId;
  private Integer statusCode;
  private String mensaje;
  private LocalDateTime fechaAutenticacion;
}
