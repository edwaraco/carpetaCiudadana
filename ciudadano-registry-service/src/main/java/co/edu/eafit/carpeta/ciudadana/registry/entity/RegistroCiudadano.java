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
import java.util.UUID;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroCiudadano {

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    private String pk; // CIUDADANO#{cedula}

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    private String sk; // METADATA

    @DynamoDbAttribute("cedula")
    private Long cedula;

    @DynamoDbAttribute("nombreCompleto")
    private String nombreCompleto;

    @DynamoDbAttribute("direccion")
    private String direccion;

    @DynamoDbAttribute("email")
    private String email;

    @DynamoDbAttribute("operador")
    private Map<String, Object> operador; // Flexible para datos externos

    @DynamoDbAttribute("carpetaId")
    private String carpetaId;

    @DynamoDbAttribute("estado")
    private EstadoRegistro estado;

    @DynamoDbAttribute("fechaRegistroGovCarpeta")
    private LocalDateTime fechaRegistroGovCarpeta;

    @DynamoDbAttribute("fechaDesregistro")
    private LocalDateTime fechaDesregistro;

    @DynamoDbAttribute("motivoDesregistro")
    private String motivoDesregistro;

    @DynamoDbAttribute("fechaCreacion")
    private LocalDateTime fechaCreacion;

    @DynamoDbAttribute("fechaActualizacion")
    private LocalDateTime fechaActualizacion;

    @DynamoDbAttribute("activo")
    @Builder.Default
    private Boolean activo = true;

    // GSI para consultas por operador
    @DynamoDbAttribute("GSI1PK")
    private String gsi1pk; // OPERADOR#{operadorId}

    @DynamoDbAttribute("GSI1SK")
    private String gsi1sk; // CIUDADANO#{cedula}

    public enum EstadoRegistro {
        PENDIENTE_VALIDACION,
        REGISTRADO,
        DESREGISTRADO,
        ERROR_VALIDACION,
        ERROR_REGISTRO
    }
}
