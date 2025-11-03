package co.edu.eafit.carpeta.ciudadana.registry.repository.impl;

import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import co.edu.eafit.carpeta.ciudadana.registry.repository.RegistroCiudadanoRepository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class RegistroCiudadanoRepositoryImpl implements RegistroCiudadanoRepository {

    private final DynamoDbTable<RegistroCiudadano> registroTable;

    public RegistroCiudadanoRepositoryImpl(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
        
        this.registroTable = enhancedClient.table("RegistroCiudadano", 
                TableSchema.fromBean(RegistroCiudadano.class));
    }

    @Override
    public RegistroCiudadano save(RegistroCiudadano registro) {
        // Generar PK y SK si no existen
        if (registro.getPk() == null) {
            registro.setPk("CIUDADANO#" + registro.getCedula());
        }
        if (registro.getSk() == null) {
            registro.setSk("METADATA");
        }
        
        // Generar GSI keys para consultas por operador
        if (registro.getOperadorId() != null) {
            registro.setGsi1pk("OPERADOR#" + registro.getOperadorId());
            registro.setGsi1sk("CIUDADANO#" + registro.getCedula());
        }
        
        // Timestamps
        if (registro.getFechaCreacion() == null) {
            registro.setFechaCreacion(LocalDateTime.now());
        }
        registro.setFechaActualizacion(LocalDateTime.now());
        
        registroTable.putItem(registro);
        return registro;
    }

    @Override
    public Optional<RegistroCiudadano> findByCedula(Long cedula) {
        Key key = Key.builder()
                .partitionValue("CIUDADANO#" + cedula)
                .sortValue("METADATA")
                .build();
        
        RegistroCiudadano registro = registroTable.getItem(key);
        return Optional.ofNullable(registro);
    }

    @Override
    public Optional<RegistroCiudadano> findByCedulaAndActivoTrue(Long cedula) {
        Optional<RegistroCiudadano> registro = findByCedula(cedula);
        return registro.filter(r -> Boolean.TRUE.equals(r.getActivo()));
    }

    @Override
    public List<RegistroCiudadano> findByOperadorIdAndActivoTrue(String operadorId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue("OPERADOR#" + operadorId)
                        .build()))
                .build();
        
        return registroTable.index("GSI1")
                .query(queryRequest)
                .stream()
                .flatMap(page -> page.items().stream())
                .filter(r -> Boolean.TRUE.equals(r.getActivo()))
                .collect(Collectors.toList());
    }

    @Override
    public List<RegistroCiudadano> findByEstado(RegistroCiudadano.EstadoRegistro estado) {
        // Para consultas por estado necesitaríamos un GSI adicional
        // Por ahora hacemos scan (no recomendado para producción)
        return registroTable.scan()
                .items()
                .stream()
                .filter(r -> estado.equals(r.getEstado()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RegistroCiudadano> findActiveByCedula(Long cedula) {
        return findByCedulaAndActivoTrue(cedula);
    }

    @Override
    public Long countByOperadorId(String operadorId) {
        return (long) findByOperadorIdAndActivoTrue(operadorId).size();
    }

    @Override
    public List<RegistroCiudadano> findDesregistradosAntesDe(LocalDateTime fechaLimite) {
        return registroTable.scan()
                .items()
                .stream()
                .filter(r -> r.getFechaDesregistro() != null && 
                           r.getFechaDesregistro().isBefore(fechaLimite))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByCedula(Long cedula) {
        Key key = Key.builder()
                .partitionValue("CIUDADANO#" + cedula)
                .sortValue("METADATA")
                .build();
        
        registroTable.deleteItem(key);
    }
}
