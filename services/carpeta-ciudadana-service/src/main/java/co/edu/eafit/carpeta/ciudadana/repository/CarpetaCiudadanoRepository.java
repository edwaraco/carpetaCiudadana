package co.edu.eafit.carpeta.ciudadana.repository;

import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;

import java.util.Optional;

public interface CarpetaCiudadanoRepository {

    CarpetaCiudadano save(CarpetaCiudadano carpeta);

    Optional<CarpetaCiudadano> findById(String carpetaId);

    Optional<CarpetaCiudadano> findByPropietarioCedula(String cedula);

    Optional<CarpetaCiudadano> findByEmailCarpeta(String emailCarpeta);

    void deleteById(String carpetaId);

    boolean existsById(String carpetaId);
}
