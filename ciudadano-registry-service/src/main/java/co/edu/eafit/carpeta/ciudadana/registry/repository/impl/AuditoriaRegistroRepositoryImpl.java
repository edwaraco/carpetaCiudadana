package co.edu.eafit.carpeta.ciudadana.registry.repository.impl;

import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import co.edu.eafit.carpeta.ciudadana.registry.repository.AuditoriaRegistroRepository;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class AuditoriaRegistroRepositoryImpl implements AuditoriaRegistroRepository {

    private final DynamoDbTable<AuditoriaRegistro> auditoriaTable;

    public AuditoriaRegistroRepositoryImpl(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
        
        this.auditoriaTable = enhancedClient.table("AuditoriaRegistro", 
                TableSchema.fromBean(AuditoriaRegistro.class));
    }

    @Override
    public AuditoriaRegistro save(AuditoriaRegistro auditoria) {
        // Generar PK y SK si no existen
        if (auditoria.getPk() == null) {
            auditoria.setPk("CIUDADANO#" + auditoria.getCedulaCiudadano());
        }
        if (auditoria.getSk() == null) {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"));
            auditoria.setSk("AUDITORIA#" + timestamp + "#" + UUID.randomUUID());
        }
        
        auditoriaTable.putItem(auditoria);
        return auditoria;
    }

    @Override
    public List<AuditoriaRegistro> findByCedulaCiudadanoOrderByFechaAccionDesc(Long cedulaCiudadano) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue("CIUDADANO#" + cedulaCiudadano)
                        .build()))
                .scanIndexForward(false) // Orden descendente
                .build();
        
        return auditoriaTable.query(queryRequest)
                .items()
                .stream()
                .filter(a -> a.getSk().startsWith("AUDITORIA#"))
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditoriaRegistro> findByOperadorIdOrderByFechaAccionDesc(String operadorId) {
        // Necesitaríamos un GSI para consultas por operador
        // Por ahora hacemos scan (no recomendado para producción)
        return auditoriaTable.scan()
                .items()
                .stream()
                .filter(a -> a.getOperador() != null && 
                           operadorId.equals(a.getOperador().get("id")))
                .sorted((a1, a2) -> a2.getFechaAccion().compareTo(a1.getFechaAccion()))
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditoriaRegistro> findByAccionOrderByFechaAccionDesc(AuditoriaRegistro.AccionAuditoria accion) {
        return auditoriaTable.scan()
                .items()
                .stream()
                .filter(a -> accion.equals(a.getAccion()))
                .sorted((a1, a2) -> a2.getFechaAccion().compareTo(a1.getFechaAccion()))
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditoriaRegistro> findByFechaAccionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return auditoriaTable.scan()
                .items()
                .stream()
                .filter(a -> a.getFechaAccion() != null &&
                           !a.getFechaAccion().isBefore(fechaInicio) &&
                           !a.getFechaAccion().isAfter(fechaFin))
                .sorted((a1, a2) -> a2.getFechaAccion().compareTo(a1.getFechaAccion()))
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditoriaRegistro> findByCedulaAndAccion(Long cedula, AuditoriaRegistro.AccionAuditoria accion) {
        return findByCedulaCiudadanoOrderByFechaAccionDesc(cedula)
                .stream()
                .filter(a -> accion.equals(a.getAccion()))
                .collect(Collectors.toList());
    }
}
