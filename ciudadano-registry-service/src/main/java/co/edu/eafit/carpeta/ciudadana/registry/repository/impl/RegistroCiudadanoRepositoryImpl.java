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
        // Asegurar que SK esté configurado
        if (registro.getSk() == null) {
            registro.setSk("#");
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
                .partitionValue(cedula)
                .sortValue("#")
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
    public List<RegistroCiudadano> findAllActive() {
        return registroTable.scan()
                .items()
                .stream()
                .filter(r -> Boolean.TRUE.equals(r.getActivo()))
                .collect(Collectors.toList());
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
                .partitionValue(cedula)
                .sortValue("#")
                .build();
        
        registroTable.deleteItem(key);
    }
}
