package co.edu.eafit.carpeta.ciudadana.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Documento {

    private String carpetaId;
    private String documentoId;

    private String titulo;
    private String tipoDocumento;
    private String contextoDocumento;
    private String descripcion;

    private String formatoArchivo; // PDF, JPEG, PNG, etc.
    private Long tamanoBytes;
    private String hashDocumento;
    private String urlAlmacenamiento;

    private String estadoDocumento;

    private Boolean esDescargable;
    private LocalDateTime fechaRecepcion;
    private LocalDateTime fechaUltimaModificacion;

    @DynamoDbPartitionKey
    public String getCarpetaId() {
        return carpetaId;
    }

    @DynamoDbSortKey
    public String getDocumentoId() {
        return documentoId;
    }
}
