package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.Documento;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz del repositorio para la entidad Documento
 * Define los contratos para las operaciones de persistencia
 */
public interface DocumentoRepository {

    /**
     * Guarda un documento en DynamoDB
     * @param documento El documento a guardar
     * @return El documento guardado
     */
    Documento save(Documento documento);

    /**
     * Busca un documento por carpetaId y documentoId
     * @param carpetaId El ID de la carpeta
     * @param documentoId El ID del documento
     * @return Optional con el documento encontrado o vacío
     */
    Optional<Documento> findById(String carpetaId, String documentoId);

    /**
     * Busca todos los documentos de una carpeta
     * @param carpetaId El ID de la carpeta
     * @return Lista de documentos de la carpeta
     */
    List<Documento> findByCarpetaId(String carpetaId);

    /**
     * Busca documentos por tipo
     * @param carpetaId El ID de la carpeta
     * @param tipoDocumento El tipo de documento
     * @return Lista de documentos del tipo especificado
     */
    List<Documento> findByTipoDocumento(String carpetaId, String tipoDocumento);

    /**
     * Busca documentos por estado
     * @param carpetaId El ID de la carpeta
     * @param estadoDocumento El estado del documento
     * @return Lista de documentos con el estado especificado
     */
    List<Documento> findByEstadoDocumento(String carpetaId, String estadoDocumento);

    /**
     * Busca documentos certificados
     * @param carpetaId El ID de la carpeta
     * @return Lista de documentos certificados
     */
    List<Documento> findDocumentosCertificados(String carpetaId);

    /**
     * Busca documentos temporales
     * @param carpetaId El ID de la carpeta
     * @return Lista de documentos temporales
     */
    List<Documento> findDocumentosTemporales(String carpetaId);

    /**
     * Elimina un documento
     * @param carpetaId El ID de la carpeta
     * @param documentoId El ID del documento
     */
    void deleteById(String carpetaId, String documentoId);

    /**
     * Verifica si existe un documento
     * @param carpetaId El ID de la carpeta
     * @param documentoId El ID del documento
     * @return true si existe, false en caso contrario
     */
    boolean existsById(String carpetaId, String documentoId);

    /**
     * Cuenta el número de documentos en una carpeta
     * @param carpetaId El ID de la carpeta
     * @return Número de documentos en la carpeta
     */
    long countByCarpetaId(String carpetaId);
}
