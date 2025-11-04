package co.edu.eafit.carpeta.ciudadana.repository.impl;

import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import co.edu.eafit.carpeta.ciudadana.repository.DocumentoRepository;
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

@Repository
public class DocumentoRepositoryImpl implements DocumentoRepository {

    private final DynamoDbTable<Documento> documentoTable;

    public DocumentoRepositoryImpl(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
        
        this.documentoTable = enhancedClient.table("Documento", 
                TableSchema.fromBean(Documento.class));
    }

    public Documento save(Documento documento) {
        documentoTable.putItem(documento);
        return documento;
    }

    public Optional<Documento> findById(String carpetaId, String documentoId) {
        Key key = Key.builder()
                .partitionValue(carpetaId)
                .sortValue(documentoId)
                .build();
        
        Documento documento = documentoTable.getItem(key);
        return Optional.ofNullable(documento);
    }

    public List<Documento> findByCarpetaId(String carpetaId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(carpetaId)
                        .build()))
                .build();

        return documentoTable.query(queryRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public List<Documento> findByCarpetaIdPaginated(String carpetaId, String lastDocumentoId, int pageSize) {
        QueryEnhancedRequest.Builder queryBuilder = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(carpetaId)
                        .build()))
                .limit(pageSize + 1); // Fetch pageSize + 1 to detect if there are more pages

        // Apply exclusive start key if provided (continuation cursor)
        QueryEnhancedRequest queryRequest = applyExclusiveStartKey(queryBuilder, carpetaId, lastDocumentoId)
                .build();

        return documentoTable.query(queryRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    /**
     * Aplica el exclusiveStartKey al query builder si lastDocumentoId está presente
     * Esto permite continuar la paginación desde donde quedó la página anterior
     */
    private QueryEnhancedRequest.Builder applyExclusiveStartKey(
            QueryEnhancedRequest.Builder queryBuilder,
            String carpetaId,
            String lastDocumentoId) {

        if (lastDocumentoId != null && !lastDocumentoId.trim().isEmpty()) {
            Documento lastDocument = new Documento();
            lastDocument.setCarpetaId(carpetaId);
            lastDocument.setDocumentoId(lastDocumentoId);

            return queryBuilder.exclusiveStartKey(
                documentoTable.tableSchema().itemToMap(lastDocument, true)
            );
        }

        return queryBuilder;
    }

    public List<Documento> findByTipoDocumento(String carpetaId, String tipoDocumento) {
        List<Documento> documentos = findByCarpetaId(carpetaId);
        return documentos.stream()
                .filter(doc -> tipoDocumento.equals(doc.getTipoDocumento()))
                .collect(Collectors.toList());
    }

    public List<Documento> findByEstadoDocumento(String carpetaId, String estadoDocumento) {
        List<Documento> documentos = findByCarpetaId(carpetaId);
        return documentos.stream()
                .filter(doc -> estadoDocumento.equals(doc.getEstadoDocumento()))
                .collect(Collectors.toList());
    }

    public List<Documento> findDocumentosProcesados(String carpetaId) {
        return findByEstadoDocumento(carpetaId, "PROCESADO");
    }

    public List<Documento> findDocumentosTemporales(String carpetaId) {
        return findByEstadoDocumento(carpetaId, "TEMPORAL");
    }

    public void deleteById(String carpetaId, String documentoId) {
        Key key = Key.builder()
                .partitionValue(carpetaId)
                .sortValue(documentoId)
                .build();
        
        documentoTable.deleteItem(key);
    }

    public boolean existsById(String carpetaId, String documentoId) {
        return findById(carpetaId, documentoId).isPresent();
    }

    public long countByCarpetaId(String carpetaId) {
        return findByCarpetaId(carpetaId).size();
    }
}
