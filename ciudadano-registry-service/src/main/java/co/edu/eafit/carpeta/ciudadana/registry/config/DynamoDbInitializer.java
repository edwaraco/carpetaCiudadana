package co.edu.eafit.carpeta.ciudadana.registry.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.List;

@Slf4j
@Component
public class DynamoDbInitializer implements CommandLineRunner {

    @Autowired
    private DynamoDbClient dynamoDbClient;

    @Override
    public void run(String... args) throws Exception {
        log.info("Inicializando tablas de DynamoDB...");
        
        createTableIfNotExists("RegistroCiudadano", "PK", "SK");
        createTableIfNotExists("AuditoriaRegistro", "PK", "SK");
        
        log.info("Inicialización de DynamoDB completada");
    }

    private void createTableIfNotExists(String tableName, String partitionKey, String sortKey) {
        try {
            // Verificar si la tabla ya existe
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(tableName)
                    .build();
            
            dynamoDbClient.describeTable(describeRequest);
            log.info("Tabla {} ya existe", tableName);
            
        } catch (ResourceNotFoundException e) {
            // La tabla no existe, crearla
            log.info("Creando tabla {}...", tableName);
            
            CreateTableRequest createRequest = CreateTableRequest.builder()
                    .tableName(tableName)
                    .billingMode(BillingMode.PAY_PER_REQUEST)
                    .attributeDefinitions(
                            AttributeDefinition.builder()
                                    .attributeName(partitionKey)
                                    .attributeType(ScalarAttributeType.S)
                                    .build(),
                            AttributeDefinition.builder()
                                    .attributeName(sortKey)
                                    .attributeType(ScalarAttributeType.S)
                                    .build()
                    )
                    .keySchema(
                            KeySchemaElement.builder()
                                    .attributeName(partitionKey)
                                    .keyType(KeyType.HASH)
                                    .build(),
                            KeySchemaElement.builder()
                                    .attributeName(sortKey)
                                    .keyType(KeyType.RANGE)
                                    .build()
                    )
                    .build();

            // Crear GSI para RegistroCiudadano
            if ("RegistroCiudadano".equals(tableName)) {
                createRequest = createRequest.toBuilder()
                        .globalSecondaryIndexes(
                                GlobalSecondaryIndex.builder()
                                        .indexName("GSI1")
                                        .keySchema(
                                                KeySchemaElement.builder()
                                                        .attributeName("GSI1PK")
                                                        .keyType(KeyType.HASH)
                                                        .build(),
                                                KeySchemaElement.builder()
                                                        .attributeName("GSI1SK")
                                                        .keyType(KeyType.RANGE)
                                                        .build()
                                        )
                                        .projection(Projection.builder()
                                                .projectionType(ProjectionType.ALL)
                                                .build())
                                        .build()
                        )
                        .attributeDefinitions(
                                AttributeDefinition.builder()
                                        .attributeName(partitionKey)
                                        .attributeType(ScalarAttributeType.S)
                                        .build(),
                                AttributeDefinition.builder()
                                        .attributeName(sortKey)
                                        .attributeType(ScalarAttributeType.S)
                                        .build(),
                                AttributeDefinition.builder()
                                        .attributeName("GSI1PK")
                                        .attributeType(ScalarAttributeType.S)
                                        .build(),
                                AttributeDefinition.builder()
                                        .attributeName("GSI1SK")
                                        .attributeType(ScalarAttributeType.S)
                                        .build()
                        )
                        .build();
            }

            try {
                dynamoDbClient.createTable(createRequest);
                log.info("Tabla {} creada exitosamente", tableName);
                
                // Esperar a que la tabla esté activa
                waitForTableToBeActive(tableName);
                
            } catch (ResourceInUseException ex) {
                log.info("Tabla {} ya existe (creada por otro proceso)", tableName);
            }
        } catch (Exception e) {
            log.error("Error creando tabla {}: {}", tableName, e.getMessage());
            throw new RuntimeException("Error inicializando DynamoDB", e);
        }
    }

    private void waitForTableToBeActive(String tableName) {
        try {
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(tableName)
                    .build();
            
            boolean isActive = false;
            int attempts = 0;
            int maxAttempts = 30; // 30 segundos máximo
            
            while (!isActive && attempts < maxAttempts) {
                DescribeTableResponse response = dynamoDbClient.describeTable(describeRequest);
                TableStatus status = response.table().tableStatus();
                
                if (status == TableStatus.ACTIVE) {
                    isActive = true;
                    log.info("Tabla {} está activa", tableName);
                } else {
                    log.info("Esperando que la tabla {} esté activa. Estado actual: {}", tableName, status);
                    Thread.sleep(1000); // Esperar 1 segundo
                    attempts++;
                }
            }
            
            if (!isActive) {
                log.warn("La tabla {} no se activó en el tiempo esperado", tableName);
            }
            
        } catch (Exception e) {
            log.error("Error esperando que la tabla {} esté activa: {}", tableName, e.getMessage());
        }
    }
}
