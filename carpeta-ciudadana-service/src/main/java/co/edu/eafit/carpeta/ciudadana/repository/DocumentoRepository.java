package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.Documento;

import java.util.List;
import java.util.Optional;

public interface DocumentoRepository {

    Documento save(Documento documento);

    Optional<Documento> findById(String carpetaId, String documentoId);

    List<Documento> findByCarpetaId(String carpetaId);

    List<Documento> findByTipoDocumento(String carpetaId, String tipoDocumento);

    List<Documento> findByEstadoDocumento(String carpetaId, String estadoDocumento);

    List<Documento> findDocumentosProcesados(String carpetaId);

    List<Documento> findDocumentosTemporales(String carpetaId);

    void deleteById(String carpetaId, String documentoId);

    boolean existsById(String carpetaId, String documentoId);

    long countByCarpetaId(String carpetaId);
}
