package co.edu.eafit.carpeta.ciudadana.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
