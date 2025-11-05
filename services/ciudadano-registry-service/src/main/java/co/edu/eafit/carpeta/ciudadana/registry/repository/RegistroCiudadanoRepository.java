package co.edu.eafit.carpeta.ciudadana.registry.repository;

import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RegistroCiudadanoRepository {

  RegistroCiudadano save(RegistroCiudadano registro);

  Optional<RegistroCiudadano> findByCedula(Long cedula);

  Optional<RegistroCiudadano> findByCedulaAndActivoTrue(Long cedula);

  List<RegistroCiudadano> findByEstado(RegistroCiudadano.EstadoRegistro estado);

  Optional<RegistroCiudadano> findActiveByCedula(Long cedula);

  List<RegistroCiudadano> findAllActive();

  List<RegistroCiudadano> findDesregistradosAntesDe(LocalDateTime fechaLimite);

  void deleteByCedula(Long cedula);
}
