package co.edu.eafit.carpeta.ciudadana.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class HistorialAcceso {

  private String carpetaId;
  private String accesoId;

  private String documentoId;
  private String tipoAcceso;
  private String usuarioAcceso;

  private LocalDateTime fechaAcceso;
  private String resultadoAcceso;
  private String motivoAcceso;

  @DynamoDbPartitionKey
  public String getCarpetaId() {
    return carpetaId;
  }

  @DynamoDbSortKey
  public String getAccesoId() {
    return accesoId;
  }
}
