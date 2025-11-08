package co.edu.eafit.carpeta.ciudadana.registry.repository;

import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaRegistroRepository {

  AuditoriaRegistro save(AuditoriaRegistro auditoria);

  List<AuditoriaRegistro> findByCedulaCiudadanoOrderByFechaAccionDesc(Long cedulaCiudadano);

  List<AuditoriaRegistro> findByOperadorIdOrderByFechaAccionDesc(String operadorId);

  List<AuditoriaRegistro> findByAccionOrderByFechaAccionDesc(
      AuditoriaRegistro.AccionAuditoria accion);

  List<AuditoriaRegistro> findByFechaAccionBetween(
      LocalDateTime fechaInicio, LocalDateTime fechaFin);

  List<AuditoriaRegistro> findByCedulaAndAccion(
      Long cedula, AuditoriaRegistro.AccionAuditoria accion);
}
