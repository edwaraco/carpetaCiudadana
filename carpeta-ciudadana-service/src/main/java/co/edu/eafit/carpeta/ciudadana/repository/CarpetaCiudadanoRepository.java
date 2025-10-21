package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;

import java.util.Optional;

/**
 * Interfaz del repositorio para la entidad CarpetaCiudadano
 * Define los contratos para las operaciones de persistencia
 */
public interface CarpetaCiudadanoRepository {

    /**
     * Guarda una carpeta ciudadano en DynamoDB
     * @param carpeta La carpeta a guardar
     * @return La carpeta guardada
     */
    CarpetaCiudadano save(CarpetaCiudadano carpeta);

    /**
     * Busca una carpeta por su ID
     * @param carpetaId El ID de la carpeta
     * @return Optional con la carpeta encontrada o vacío
     */
    Optional<CarpetaCiudadano> findById(String carpetaId);

    /**
     * Busca una carpeta por la cédula del propietario
     * @param cedula La cédula del propietario
     * @return Optional con la carpeta encontrada o vacío
     */
    Optional<CarpetaCiudadano> findByPropietarioCedula(String cedula);

    /**
     * Busca una carpeta por el email de la carpeta
     * @param emailCarpeta El email de la carpeta
     * @return Optional con la carpeta encontrada o vacío
     */
    Optional<CarpetaCiudadano> findByEmailCarpeta(String emailCarpeta);

    /**
     * Elimina una carpeta por su ID
     * @param carpetaId El ID de la carpeta a eliminar
     */
    void deleteById(String carpetaId);

    /**
     * Verifica si existe una carpeta con el ID dado
     * @param carpetaId El ID de la carpeta
     * @return true si existe, false en caso contrario
     */
    boolean existsById(String carpetaId);
}
