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
public class DocumentoSubidoEvent {
  private String documentoId;
  private String carpetaId;
  private String propietarioCedula;
  private String tipoDocumento;
  private String nombreArchivo;
  private Long tamanioBytes;
  private String hashDocumento;
  private LocalDateTime fechaSubida;
}
