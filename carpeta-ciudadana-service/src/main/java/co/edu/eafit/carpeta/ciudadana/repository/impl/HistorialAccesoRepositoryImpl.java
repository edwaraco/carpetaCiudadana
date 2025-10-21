package co.edu.eafit.carpeta.ciudadana.repository.impl;

import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;
import co.edu.eafit.carpeta.ciudadana.repository.HistorialAccesoRepository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del repositorio para la entidad HistorialAcceso usando DynamoDB
 */
@Repository
public class HistorialAccesoRepositoryImpl implements HistorialAccesoRepository {

    private final DynamoDbTable<HistorialAcceso> historialTable;

    public HistorialAccesoRepositoryImpl(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
        
        this.historialTable = enhancedClient.table("HistorialAcceso", 
                TableSchema.fromBean(HistorialAcceso.class));
    }

    /**
     * Guarda un registro de acceso en DynamoDB
     */
    public HistorialAcceso save(HistorialAcceso historialAcceso) {
        historialTable.putItem(historialAcceso);
        return historialAcceso;
    }

    /**
     * Busca el historial de accesos de una carpeta
     */
    public List<HistorialAcceso> findByCarpetaId(String carpetaId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(carpetaId)
                        .build()))
                .build();
        
        return historialTable.query(queryRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    /**
     * Busca el historial de accesos de un documento específico
     */
    public List<HistorialAcceso> findByDocumentoId(String carpetaId, String documentoId) {
        List<HistorialAcceso> historial = findByCarpetaId(carpetaId);
        return historial.stream()
                .filter(acceso -> documentoId.equals(acceso.getDocumentoId()))
                .collect(Collectors.toList());
    }

    /**
     * Busca accesos por tipo
     */
    public List<HistorialAcceso> findByTipoAcceso(String carpetaId, String tipoAcceso) {
        List<HistorialAcceso> historial = findByCarpetaId(carpetaId);
        return historial.stream()
                .filter(acceso -> tipoAcceso.equals(acceso.getTipoAcceso()))
                .collect(Collectors.toList());
    }

    /**
     * Busca accesos por usuario
     */
    public List<HistorialAcceso> findByUsuarioAcceso(String carpetaId, String usuarioAcceso) {
        List<HistorialAcceso> historial = findByCarpetaId(carpetaId);
        return historial.stream()
                .filter(acceso -> usuarioAcceso.equals(acceso.getUsuarioAcceso()))
                .collect(Collectors.toList());
    }

    /**
     * Busca accesos en un rango de fechas
     */
    public List<HistorialAcceso> findByRangoFechas(String carpetaId, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<HistorialAcceso> historial = findByCarpetaId(carpetaId);
        return historial.stream()
                .filter(acceso -> acceso.getFechaAcceso().isAfter(fechaInicio) && 
                                acceso.getFechaAcceso().isBefore(fechaFin))
                .collect(Collectors.toList());
    }

    /**
     * Cuenta el número de accesos a una carpeta
     */
    public long countByCarpetaId(String carpetaId) {
        return findByCarpetaId(carpetaId).size();
    }

    /**
     * Cuenta el número de accesos a un documento
     */
    public long countByDocumentoId(String carpetaId, String documentoId) {
        return findByDocumentoId(carpetaId, documentoId).size();
    }
}
