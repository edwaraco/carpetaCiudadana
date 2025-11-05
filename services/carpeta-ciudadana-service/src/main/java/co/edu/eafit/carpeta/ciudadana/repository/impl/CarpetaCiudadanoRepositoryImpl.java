package co.edu.eafit.carpeta.ciudadana.repository.impl;

import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.repository.CarpetaCiudadanoRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@Repository
public class CarpetaCiudadanoRepositoryImpl implements CarpetaCiudadanoRepository {

  private final DynamoDbTable<CarpetaCiudadano> carpetaTable;

  public CarpetaCiudadanoRepositoryImpl(DynamoDbClient dynamoDbClient) {
    DynamoDbEnhancedClient enhancedClient =
        DynamoDbEnhancedClient.builder().dynamoDbClient(dynamoDbClient).build();

    this.carpetaTable =
        enhancedClient.table("CarpetaCiudadano", TableSchema.fromBean(CarpetaCiudadano.class));
  }

  public CarpetaCiudadano save(CarpetaCiudadano carpeta) {
    carpetaTable.putItem(carpeta);
    return carpeta;
  }

  public Optional<CarpetaCiudadano> findById(String carpetaId) {
    Key key = Key.builder().partitionValue(carpetaId).build();

    CarpetaCiudadano carpeta = carpetaTable.getItem(key);
    return Optional.ofNullable(carpeta);
  }

  public Optional<CarpetaCiudadano> findByPropietarioCedula(String cedula) {
    QueryEnhancedRequest queryRequest =
        QueryEnhancedRequest.builder()
            .queryConditional(
                QueryConditional.keyEqualTo(Key.builder().partitionValue(cedula).build()))
            .build();

    List<CarpetaCiudadano> carpetas =
        carpetaTable.query(queryRequest).items().stream().collect(Collectors.toList());

    return carpetas.isEmpty() ? Optional.empty() : Optional.of(carpetas.get(0));
  }

  public Optional<CarpetaCiudadano> findByEmailCarpeta(String emailCarpeta) {
    QueryEnhancedRequest queryRequest =
        QueryEnhancedRequest.builder()
            .queryConditional(
                QueryConditional.keyEqualTo(Key.builder().partitionValue(emailCarpeta).build()))
            .build();

    List<CarpetaCiudadano> carpetas =
        carpetaTable.query(queryRequest).items().stream().collect(Collectors.toList());

    return carpetas.isEmpty() ? Optional.empty() : Optional.of(carpetas.get(0));
  }

  public void deleteById(String carpetaId) {
    Key key = Key.builder().partitionValue(carpetaId).build();

    carpetaTable.deleteItem(key);
  }

  public boolean existsById(String carpetaId) {
    return findById(carpetaId).isPresent();
  }
}
