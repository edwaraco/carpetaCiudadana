package co.edu.eafit.carpeta.ciudadana.registry.service;

import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.AuditoriaRegistroResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.RegistroCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ValidacionCiudadanoResponse;
import java.util.List;

public interface CiudadanoRegistryService {

  ValidacionCiudadanoResponse validarCiudadano(Long cedula);

  RegistroCiudadanoResponse registrarCiudadano(RegistrarCiudadanoRequest request);

  RegistroCiudadanoResponse desregistrarCiudadano(DesregistrarCiudadanoRequest request);

  RegistroCiudadanoResponse obtenerCiudadanoPorCedula(Long cedula);

  List<RegistroCiudadanoResponse> obtenerTodosCiudadanos();

  List<AuditoriaRegistroResponse> obtenerHistorialAuditoria(Long cedula);

  String crearCarpetaCiudadana(Long cedula);
}
