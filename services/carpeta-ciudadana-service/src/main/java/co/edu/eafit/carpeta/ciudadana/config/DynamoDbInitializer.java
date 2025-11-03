package co.edu.eafit.carpeta.ciudadana.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.waiters.WaiterResponse;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class DynamoDbInitializer implements CommandLineRunner {

    @Autowired
    private DynamoDbClient dynamoDbClient;

    @Override
    public void run(String... args) throws Exception {
        log.info("Inicializando tablas DynamoDB...");
        
        List<String> tablas = Arrays.asList(
            "CarpetaCiudadano",
            "Documento", 
            "HistorialAcceso"
        );

        for (String tabla : tablas) {
            crearTablaSiNoExiste(tabla);
        }
        
        log.info("Inicialización de tablas DynamoDB completada");
    }

    private void crearTablaSiNoExiste(String nombreTabla) {
        try {
            // Verificar si la tabla existe
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(nombreTabla)
                    .build();
            
            dynamoDbClient.describeTable(describeRequest);
            log.info("Tabla {} ya existe", nombreTabla);
            
        } catch (ResourceNotFoundException e) {
            // La tabla no existe, crearla
            log.info("Creando tabla: {}", nombreTabla);
            
            CreateTableRequest createRequest = crearRequestTabla(nombreTabla);
            
            try {
                dynamoDbClient.createTable(createRequest);
                log.info("Tabla {} creada exitosamente", nombreTabla);
                
                // Esperar a que la tabla esté activa
                esperarTablaActiva(nombreTabla);
                
            } catch (Exception ex) {
                log.error("Error creando tabla {}: {}", nombreTabla, ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Error verificando tabla {}: {}", nombreTabla, e.getMessage());
        }
    }

    private CreateTableRequest crearRequestTabla(String nombreTabla) {
        switch (nombreTabla) {
            case "CarpetaCiudadano":
                return CreateTableRequest.builder()
                        .tableName(nombreTabla)
                        .attributeDefinitions(
                                AttributeDefinition.builder()
                                        .attributeName("carpetaId")
                                        .attributeType(ScalarAttributeType.S)
                                        .build()
                        )
                        .keySchema(
                                KeySchemaElement.builder()
                                        .attributeName("carpetaId")
                                        .keyType(KeyType.HASH)
                                        .build()
                        )
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .build();

            case "Documento":
                return CreateTableRequest.builder()
                        .tableName(nombreTabla)
                        .attributeDefinitions(
                                AttributeDefinition.builder()
                                        .attributeName("carpetaId")
                                        .attributeType(ScalarAttributeType.S)
                                        .build(),
                                AttributeDefinition.builder()
                                        .attributeName("documentoId")
                                        .attributeType(ScalarAttributeType.S)
                                        .build()
                        )
                        .keySchema(
                                KeySchemaElement.builder()
                                        .attributeName("carpetaId")
                                        .keyType(KeyType.HASH)
                                        .build(),
                                KeySchemaElement.builder()
                                        .attributeName("documentoId")
                                        .keyType(KeyType.RANGE)
                                        .build()
                        )
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .build();

            case "HistorialAcceso":
                return CreateTableRequest.builder()
                        .tableName(nombreTabla)
                        .attributeDefinitions(
                                AttributeDefinition.builder()
                                        .attributeName("carpetaId")
                                        .attributeType(ScalarAttributeType.S)
                                        .build(),
                                AttributeDefinition.builder()
                                        .attributeName("accesoId")
                                        .attributeType(ScalarAttributeType.S)
                                        .build()
                        )
                        .keySchema(
                                KeySchemaElement.builder()
                                        .attributeName("carpetaId")
                                        .keyType(KeyType.HASH)
                                        .build(),
                                KeySchemaElement.builder()
                                        .attributeName("accesoId")
                                        .keyType(KeyType.RANGE)
                                        .build()
                        )
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .build();

            default:
                throw new IllegalArgumentException("Tabla no reconocida: " + nombreTabla);
        }
    }

    private void esperarTablaActiva(String nombreTabla) {
        try {
            WaiterResponse<DescribeTableResponse> waiterResponse = 
                    dynamoDbClient.waiter().waitUntilTableExists(
                            DescribeTableRequest.builder()
                                    .tableName(nombreTabla)
                                    .build()
                    );
            
            if (waiterResponse.matched().response().isPresent()) {
                log.info("Tabla {} está activa", nombreTabla);
            }
            
        } catch (Exception e) {
            log.error("Error esperando tabla {}: {}", nombreTabla, e.getMessage());
        }
    }
}
