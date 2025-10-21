package co.edu.eafit.carpeta.ciudadana.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDateTime;

/**
 * Entidad para el historial de accesos a documentos
 * Permite auditoría y seguimiento de accesos
 * 
 * Simplificada para MVP - incluye solo campos esenciales para:
 * 1. Auditoría básica de accesos
 * 2. Trazabilidad de operaciones
 * 3. Cumplimiento de requisitos legales mínimos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class HistorialAcceso {

    // Claves de DynamoDB
    private String carpetaId; // ID de la carpeta (Partition Key)
    private String accesoId; // UUID único del acceso (Sort Key - incluye timestamp para ordenación)

    // Información del acceso
    private String documentoId; // ID del documento accedido (puede ser null para accesos a carpeta)
    private String tipoAcceso; // SUBIDA, CONSULTA, DESCARGA, COMPARTIR, MODIFICACION, ELIMINACION
    private String usuarioAcceso; // Usuario/Sistema que realizó el acceso
    
    // Resultado y contexto
    private LocalDateTime fechaAcceso; // Fecha y hora del acceso
    private String resultadoAcceso; // EXITOSO, FALLIDO, DENEGADO
    private String motivoAcceso; // Motivo/descripción del acceso

    @DynamoDbPartitionKey
    public String getCarpetaId() {
        return carpetaId;
    }

    @DynamoDbSortKey
    public String getAccesoId() {
        return accesoId;
    }
}

