package co.edu.eafit.carpeta.ciudadana.registry.service;

import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.AuditoriaRegistroResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.RegistroCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ValidacionCiudadanoResponse;
import java.util.List;

public interface CiudadanoRegistryService {

  /** Valida si un ciudadano está disponible para registro */
  ValidacionCiudadanoResponse validarCiudadano(Long cedula);

  /** Registra un nuevo ciudadano en el sistema */
  RegistroCiudadanoResponse registrarCiudadano(RegistrarCiudadanoRequest request);

  /** Desregistra un ciudadano del operador actual */
  RegistroCiudadanoResponse desregistrarCiudadano(DesregistrarCiudadanoRequest request);

  /** Obtiene un ciudadano por su cédula */
  RegistroCiudadanoResponse obtenerCiudadanoPorCedula(Long cedula);

  /** Obtiene todos los ciudadanos activos registrados */
  List<RegistroCiudadanoResponse> obtenerTodosCiudadanos();

  /** Obtiene el historial de auditoría de un ciudadano */
  List<AuditoriaRegistroResponse> obtenerHistorialAuditoria(Long cedula);

  /** Crea una carpeta ciudadana para un ciudadano registrado */
  String crearCarpetaCiudadana(Long cedula);
}
