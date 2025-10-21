package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Interfaz del repositorio para la entidad HistorialAcceso
 * Define los contratos para las operaciones de persistencia
 */
public interface HistorialAccesoRepository {

    /**
     * Guarda un registro de acceso en DynamoDB
     * @param historialAcceso El registro de acceso a guardar
     * @return El registro de acceso guardado
     */
    HistorialAcceso save(HistorialAcceso historialAcceso);

    /**
     * Busca el historial de accesos de una carpeta
     * @param carpetaId El ID de la carpeta
     * @return Lista de accesos a la carpeta
     */
    List<HistorialAcceso> findByCarpetaId(String carpetaId);

    /**
     * Busca el historial de accesos de un documento específico
     * @param carpetaId El ID de la carpeta
     * @param documentoId El ID del documento
     * @return Lista de accesos al documento
     */
    List<HistorialAcceso> findByDocumentoId(String carpetaId, String documentoId);

    /**
     * Busca accesos por tipo
     * @param carpetaId El ID de la carpeta
     * @param tipoAcceso El tipo de acceso
     * @return Lista de accesos del tipo especificado
     */
    List<HistorialAcceso> findByTipoAcceso(String carpetaId, String tipoAcceso);

    /**
     * Busca accesos por usuario
     * @param carpetaId El ID de la carpeta
     * @param usuarioAcceso El usuario que realizó el acceso
     * @return Lista de accesos del usuario
     */
    List<HistorialAcceso> findByUsuarioAcceso(String carpetaId, String usuarioAcceso);

    /**
     * Busca accesos en un rango de fechas
     * @param carpetaId El ID de la carpeta
     * @param fechaInicio Fecha de inicio del rango
     * @param fechaFin Fecha de fin del rango
     * @return Lista de accesos en el rango de fechas
     */
    List<HistorialAcceso> findByRangoFechas(String carpetaId, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /**
     * Cuenta el número de accesos a una carpeta
     * @param carpetaId El ID de la carpeta
     * @return Número de accesos a la carpeta
     */
    long countByCarpetaId(String carpetaId);

    /**
     * Cuenta el número de accesos a un documento
     * @param carpetaId El ID de la carpeta
     * @param documentoId El ID del documento
     * @return Número de accesos al documento
     */
    long countByDocumentoId(String carpetaId, String documentoId);
}
