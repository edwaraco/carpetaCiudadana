package co.edu.eafit.carpeta.ciudadana.registry.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

import java.time.LocalDateTime;
import java.util.Map;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaRegistro {

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    private String pk; // CIUDADANO#{cedula}

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    private String sk; // AUDITORIA#{fecha}#{uuid}

    @DynamoDbAttribute("cedulaCiudadano")
    private Long cedulaCiudadano;

    @DynamoDbAttribute("accion")
    private AccionAuditoria accion;

    @DynamoDbAttribute("operador")
    private Map<String, Object> operador; // Flexible para datos externos

    @DynamoDbAttribute("resultado")
    private String resultado;

    @DynamoDbAttribute("codigoRespuesta")
    private Integer codigoRespuesta;

    @DynamoDbAttribute("mensajeRespuesta")
    private String mensajeRespuesta;

    @DynamoDbAttribute("detallesAdicionales")
    private String detallesAdicionales;

    @DynamoDbAttribute("ipOrigen")
    private String ipOrigen;

    @DynamoDbAttribute("userAgent")
    private String userAgent;

    @DynamoDbAttribute("fechaAccion")
    private LocalDateTime fechaAccion;

    public enum AccionAuditoria {
        VALIDACION_CIUDADANO,
        REGISTRO_CIUDADANO,
        DESREGISTRO_CIUDADANO,
        CREACION_CARPETA,
        ERROR_VALIDACION,
        ERROR_REGISTRO,
        ERROR_DESREGISTRO
    }
}
