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
 * Entidad que representa un documento en la carpeta del ciudadano
 * Basada en la Entity Documento del análisis DDD
 * 
 * Simplificada para MVP - incluye solo campos esenciales para:
 * 1. Almacenar documentos (firmados o no)
 * 2. Ver mis documentos
 * 3. Integración básica con firma digital
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Documento {

    // Claves de DynamoDB
    private String carpetaId; // ID de la carpeta propietaria (Partition Key)
    private String documentoId; // UUID único del documento (Sort Key)

    // Metadatos básicos del documento
    private String titulo; // Título del documento
    private String tipoDocumento; // CEDULA, DIPLOMA, ACTA_GRADO, CERTIFICADO_LABORAL, etc.
    private String contextoDocumento; // EDUCACION, NOTARIA, REGISTRADURIA, SALUD, etc.
    private String descripcion; // Descripción opcional del documento

    // Contenido del documento (almacenamiento)
    private String formatoArchivo; // PDF, JPEG, PNG, etc.
    private Long tamanoBytes; // Tamaño en bytes
    private String hashDocumento; // SHA-256 del contenido (para integridad)
    private String urlAlmacenamiento; // Ruta/URL en MinIO/S3

    // Estado y certificación (simplificado para MVP)
    private String estadoDocumento; // TEMPORAL, CERTIFICADO, REVOCADO
    private String firmadoPor; // Entidad que firmó (opcional - para documentos certificados)
    private String certificadoValidez; // ID/referencia del certificado (opcional)

    // Control y auditoría
    private Boolean esDescargable; // Si el documento puede ser descargado
    private LocalDateTime fechaRecepcion; // Fecha de recepción en el sistema
    private LocalDateTime fechaUltimaModificacion; // Última modificación

    @DynamoDbPartitionKey
    public String getCarpetaId() {
        return carpetaId;
    }

    @DynamoDbSortKey
    public String getDocumentoId() {
        return documentoId;
    }
}
