package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;

import java.time.LocalDateTime;
import java.util.List;

public interface HistorialAccesoRepository {

    HistorialAcceso save(HistorialAcceso historialAcceso);

    List<HistorialAcceso> findByCarpetaId(String carpetaId);

    List<HistorialAcceso> findByDocumentoId(String carpetaId, String documentoId);

    List<HistorialAcceso> findByTipoAcceso(String carpetaId, String tipoAcceso);

    List<HistorialAcceso> findByUsuarioAcceso(String carpetaId, String usuarioAcceso);

    List<HistorialAcceso> findByRangoFechas(String carpetaId, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    long countByCarpetaId(String carpetaId);

    long countByDocumentoId(String carpetaId, String documentoId);
}
