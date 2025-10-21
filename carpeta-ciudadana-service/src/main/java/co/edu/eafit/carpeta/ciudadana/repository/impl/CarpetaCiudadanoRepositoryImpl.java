package co.edu.eafit.carpeta.ciudadana.repository.impl;

import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.repository.CarpetaCiudadanoRepository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del repositorio para la entidad CarpetaCiudadano usando DynamoDB
 */
@Repository
public class CarpetaCiudadanoRepositoryImpl implements CarpetaCiudadanoRepository {

    private final DynamoDbTable<CarpetaCiudadano> carpetaTable;

    public CarpetaCiudadanoRepositoryImpl(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
        
        this.carpetaTable = enhancedClient.table("CarpetaCiudadano", 
                TableSchema.fromBean(CarpetaCiudadano.class));
    }

    /**
     * Guarda una carpeta ciudadano en DynamoDB
     */
    public CarpetaCiudadano save(CarpetaCiudadano carpeta) {
        carpetaTable.putItem(carpeta);
        return carpeta;
    }

    /**
     * Busca una carpeta por su ID
     */
    public Optional<CarpetaCiudadano> findById(String carpetaId) {
        Key key = Key.builder()
                .partitionValue(carpetaId)
                .build();
        
        CarpetaCiudadano carpeta = carpetaTable.getItem(key);
        return Optional.ofNullable(carpeta);
    }

    /**
     * Busca una carpeta por la cédula del propietario
     */
    public Optional<CarpetaCiudadano> findByPropietarioCedula(String cedula) {
        // En DynamoDB necesitamos un GSI para buscar por cédula
        // Por ahora implementamos una búsqueda secuencial (no recomendado para producción)
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(cedula)
                        .build()))
                .build();
        
        List<CarpetaCiudadano> carpetas = carpetaTable.query(queryRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
        
        return carpetas.isEmpty() ? Optional.empty() : Optional.of(carpetas.get(0));
    }

    /**
     * Busca una carpeta por el email de la carpeta
     */
    public Optional<CarpetaCiudadano> findByEmailCarpeta(String emailCarpeta) {
        // Similar al método anterior, necesitaríamos un GSI
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(emailCarpeta)
                        .build()))
                .build();
        
        List<CarpetaCiudadano> carpetas = carpetaTable.query(queryRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
        
        return carpetas.isEmpty() ? Optional.empty() : Optional.of(carpetas.get(0));
    }

    /**
     * Elimina una carpeta por su ID
     */
    public void deleteById(String carpetaId) {
        Key key = Key.builder()
                .partitionValue(carpetaId)
                .build();
        
        carpetaTable.deleteItem(key);
    }

    /**
     * Verifica si existe una carpeta con el ID dado
     */
    public boolean existsById(String carpetaId) {
        return findById(carpetaId).isPresent();
    }
}
