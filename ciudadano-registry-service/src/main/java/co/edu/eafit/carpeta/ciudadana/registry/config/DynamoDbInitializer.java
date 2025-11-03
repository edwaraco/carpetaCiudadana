package co.edu.eafit.carpeta.ciudadana.registry.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

@Slf4j
@Component
public class DynamoDbInitializer implements CommandLineRunner {

  @Autowired private DynamoDbClient dynamoDbClient;

  @Override
  public void run(String... args) throws Exception {
    log.info("Inicializando tablas de DynamoDB...");

    createRegistroCiudadanoTable();
    createAuditoriaRegistroTable();

    log.info("Inicialización de DynamoDB completada");
  }

  private void createRegistroCiudadanoTable() {
    String tableName = "RegistroCiudadano";
    try {
      // Verificar si la tabla ya existe
      DescribeTableRequest describeRequest =
          DescribeTableRequest.builder().tableName(tableName).build();

      dynamoDbClient.describeTable(describeRequest);
      log.info("Tabla {} ya existe", tableName);

    } catch (ResourceNotFoundException e) {
      // La tabla no existe, crearla
      log.info("Creando tabla {}...", tableName);

      CreateTableRequest createRequest =
          CreateTableRequest.builder()
              .tableName(tableName)
              .billingMode(BillingMode.PAY_PER_REQUEST)
              .attributeDefinitions(
                  AttributeDefinition.builder()
                      .attributeName("cedula")
                      .attributeType(ScalarAttributeType.N)
                      .build(),
                  AttributeDefinition.builder()
                      .attributeName("SK")
                      .attributeType(ScalarAttributeType.S)
                      .build())
              .keySchema(
                  KeySchemaElement.builder().attributeName("cedula").keyType(KeyType.HASH).build(),
                  KeySchemaElement.builder().attributeName("SK").keyType(KeyType.RANGE).build())
              .build();

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

  private void createAuditoriaRegistroTable() {
    String tableName = "AuditoriaRegistro";
    try {
      // Verificar si la tabla ya existe
      DescribeTableRequest describeRequest =
          DescribeTableRequest.builder().tableName(tableName).build();

      dynamoDbClient.describeTable(describeRequest);
      log.info("Tabla {} ya existe", tableName);

    } catch (ResourceNotFoundException e) {
      // La tabla no existe, crearla
      log.info("Creando tabla {}...", tableName);

      CreateTableRequest createRequest =
          CreateTableRequest.builder()
              .tableName(tableName)
              .billingMode(BillingMode.PAY_PER_REQUEST)
              .attributeDefinitions(
                  AttributeDefinition.builder()
                      .attributeName("PK")
                      .attributeType(ScalarAttributeType.S)
                      .build(),
                  AttributeDefinition.builder()
                      .attributeName("SK")
                      .attributeType(ScalarAttributeType.S)
                      .build())
              .keySchema(
                  KeySchemaElement.builder().attributeName("PK").keyType(KeyType.HASH).build(),
                  KeySchemaElement.builder().attributeName("SK").keyType(KeyType.RANGE).build())
              .build();

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
      DescribeTableRequest describeRequest =
          DescribeTableRequest.builder().tableName(tableName).build();

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
