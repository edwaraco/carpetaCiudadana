package co.edu.eafit.carpeta.ciudadana.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class CarpetaCiudadano {

    private String carpetaId;

    private String propietarioCedula;
    private String propietarioNombre;
    private String emailCarpeta;

    private String estadoCarpeta; // ACTIVA, SUSPENDIDA, EN_TRANSFERENCIA
    private String operadorActual; // ID del operador actual (para portabilidad)

    private Long espacioUtilizadoBytes;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaUltimaModificacion;

    @DynamoDbPartitionKey
    public String getCarpetaId() {
        return carpetaId;
    }
}
