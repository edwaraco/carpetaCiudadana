package co.edu.eafit.carpeta.ciudadana.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.LocalDateTime;

/**
 * Entidad principal que representa la carpeta de un ciudadano
 * Basada en el Aggregate Root CarpetaCiudadano del análisis DDD
 * 
 * Simplificada para MVP - incluye solo campos esenciales para:
 * 1. Crear carpetas ciudadanas únicas
 * 2. Almacenar documentos
 * 3. Ver documentos
 * 4. Gestión de portabilidad
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class CarpetaCiudadano {

    private String carpetaId; // UUID único de la carpeta (Partition Key)

    // Datos del propietario
    private String propietarioCedula; // Cédula del ciudadano propietario
    private String propietarioNombre; // Nombre completo del propietario
    private String emailCarpeta; // Email inmutable de la carpeta (@carpetacolombia.co)

    // Estado y gestión
    private String estadoCarpeta; // ACTIVA, SUSPENDIDA, EN_TRANSFERENCIA
    private String operadorActual; // ID del operador actual (para portabilidad)

    // Métricas
    private Long espacioUtilizadoBytes; // Espacio utilizado en bytes

    // Auditoría
    private LocalDateTime fechaCreacion; // Fecha de creación de la carpeta
    private LocalDateTime fechaUltimaModificacion; // Última modificación

    @DynamoDbPartitionKey
    public String getCarpetaId() {
        return carpetaId;
    }
}
