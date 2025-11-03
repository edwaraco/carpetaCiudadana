package co.edu.eafit.carpeta.ciudadana.registry.service.impl;

import co.edu.eafit.carpeta.ciudadana.registry.client.GovCarpetaService;
import co.edu.eafit.carpeta.ciudadana.registry.client.CarpetaCiudadanaService;
import co.edu.eafit.carpeta.ciudadana.registry.client.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.registry.client.CarpetaCiudadanaResponse;
import co.edu.eafit.carpeta.ciudadana.registry.client.GovCarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.RegistroCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ValidacionCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.AuditoriaRegistroResponse;
import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import co.edu.eafit.carpeta.ciudadana.registry.entity.AuditoriaRegistro;
import co.edu.eafit.carpeta.ciudadana.registry.exception.CiudadanoAlreadyExistsException;
import co.edu.eafit.carpeta.ciudadana.registry.exception.ResourceNotFoundException;
import co.edu.eafit.carpeta.ciudadana.registry.exception.ExternalServiceException;
import co.edu.eafit.carpeta.ciudadana.registry.repository.RegistroCiudadanoRepository;
import co.edu.eafit.carpeta.ciudadana.registry.repository.AuditoriaRegistroRepository;
import co.edu.eafit.carpeta.ciudadana.registry.service.CiudadanoRegistryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CiudadanoRegistryServiceImpl implements CiudadanoRegistryService {

    private final RegistroCiudadanoRepository registroRepository;
    private final AuditoriaRegistroRepository auditoriaRepository;
    private final GovCarpetaService govCarpetaService;
    private final CarpetaCiudadanaService carpetaCiudadanaService;

    public CiudadanoRegistryServiceImpl(RegistroCiudadanoRepository registroRepository,
                                     AuditoriaRegistroRepository auditoriaRepository,
                                     GovCarpetaService govCarpetaService,
                                     CarpetaCiudadanaService carpetaCiudadanaService) {
        this.registroRepository = registroRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.govCarpetaService = govCarpetaService;
        this.carpetaCiudadanaService = carpetaCiudadanaService;
    }

    @Override
    public ValidacionCiudadanoResponse validarCiudadano(Long cedula) {
        log.info("Validando ciudadano con cédula: {}", cedula);

        try {
            // Verificar si ya existe en nuestra base de datos
            if (registroRepository.findActiveByCedula(cedula).isPresent()) {
                log.warn("Ciudadano {} ya está registrado en nuestro sistema", cedula);
                registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.VALIDACION_CIUDADANO,
                        null, null, "Ciudadano ya registrado", 204, "Ya registrado");
                
                return ValidacionCiudadanoResponse.builder()
                        .cedula(cedula)
                        .disponible(false)
                        .mensaje("Ciudadano ya registrado en el sistema")
                        .codigoRespuesta(204)
                        .build();
            }

            // Consultar API externa de GovCarpeta
            GovCarpetaResponse response = govCarpetaService.validarCiudadano(cedula);
            
            boolean disponible = response.getCodigoRespuesta() == 200;
            String mensaje = disponible ? "Ciudadano disponible para registro" : "Ciudadano no disponible";
            
            registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.VALIDACION_CIUDADANO,
                    null, null, mensaje, response.getCodigoRespuesta(), response.getMensaje());

            return ValidacionCiudadanoResponse.builder()
                    .cedula(cedula)
                    .disponible(disponible)
                    .mensaje(mensaje)
                    .codigoRespuesta(response.getCodigoRespuesta())
                    .build();

        } catch (Exception e) {
            log.error("Error validando ciudadano {}: {}", cedula, e.getMessage(), e);
            registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.ERROR_VALIDACION,
                    null, null, "Error interno", 500, e.getMessage());
            
            return ValidacionCiudadanoResponse.builder()
                    .cedula(cedula)
                    .disponible(false)
                    .mensaje("Error interno del sistema")
                    .codigoRespuesta(500)
                    .build();
        }
    }

    @Override
    public RegistroCiudadanoResponse registrarCiudadano(RegistrarCiudadanoRequest request) {
        log.info("Registrando ciudadano con cédula: {}", request.getCedula());

        try {
            // Verificar que no esté ya registrado
            if (registroRepository.findActiveByCedula(request.getCedula()).isPresent()) {
                throw new CiudadanoAlreadyExistsException(request.getCedula());
            }

            // Registrar en GovCarpeta
            GovCarpetaResponse govResponse = govCarpetaService.registrarCiudadano(request);
            
            // Manejar respuesta 501 (ciudadano ya registrado) como caso válido
            if (govResponse.getCodigoRespuesta() == 501) {
                log.warn("Ciudadano {} ya está registrado en GovCarpeta: {}", request.getCedula(), govResponse.getMensaje());
                registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.REGISTRO_CIUDADANO,
                        request.getOperadorId(), request.getOperadorNombre(),
                        "Ciudadano ya registrado en GovCarpeta", govResponse.getCodigoRespuesta(), govResponse.getMensaje());
                
                throw new CiudadanoAlreadyExistsException(request.getCedula());
            }
            
            if (!govResponse.getExitoso()) {
                log.error("Error registrando ciudadano {} en GovCarpeta: {}", request.getCedula(), govResponse.getMensaje());
                registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.ERROR_REGISTRO,
                        request.getOperadorId(), request.getOperadorNombre(),
                        "Error en GovCarpeta", govResponse.getCodigoRespuesta(), govResponse.getMensaje());
                
                throw new ExternalServiceException("GovCarpeta", govResponse.getMensaje(), govResponse.getCodigoRespuesta());
            }

            // Crear registro local
            RegistroCiudadano registro = RegistroCiudadano.builder()
                    .cedula(request.getCedula())
                    .nombreCompleto(request.getNombreCompleto())
                    .direccion(request.getDireccion())
                    .email(request.getEmail())
                    .estado(RegistroCiudadano.EstadoRegistro.REGISTRADO)
                    .fechaRegistroGovCarpeta(LocalDateTime.now())
                    .activo(true)
                    .build();

            registro = registroRepository.save(registro);

            // Crear carpeta ciudadana
            String carpetaId = crearCarpetaCiudadana(request.getCedula());
            registro.setCarpetaId(carpetaId);
            registro = registroRepository.save(registro);

            registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.REGISTRO_CIUDADANO,
                    request.getOperadorId(), request.getOperadorNombre(),
                    "Registro exitoso", govResponse.getCodigoRespuesta(), govResponse.getMensaje());

            log.info("Ciudadano {} registrado exitosamente", request.getCedula());
            return mapToResponse(registro);

        } catch (Exception e) {
            log.error("Error registrando ciudadano {}: {}", request.getCedula(), e.getMessage(), e);
            registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.ERROR_REGISTRO,
                    request.getOperadorId(), request.getOperadorNombre(),
                    "Error interno", 500, e.getMessage());
            throw e;
        }
    }

    @Override
    public RegistroCiudadanoResponse desregistrarCiudadano(DesregistrarCiudadanoRequest request) {
        log.info("Desregistrando ciudadano con cédula: {}", request.getCedula());

        try {
            RegistroCiudadano registro = registroRepository.findActiveByCedula(request.getCedula())
                    .orElseThrow(() -> new ResourceNotFoundException("Ciudadano", "cedula", request.getCedula()));

            // Desregistrar en GovCarpeta
            GovCarpetaResponse govResponse = govCarpetaService.desregistrarCiudadano(request);
            
            if (!govResponse.getExitoso()) {
                log.error("Error desregistrando ciudadano {} en GovCarpeta: {}", request.getCedula(), govResponse.getMensaje());
                registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.ERROR_DESREGISTRO,
                        request.getOperadorId(), request.getOperadorNombre(),
                        "Error en GovCarpeta", govResponse.getCodigoRespuesta(), govResponse.getMensaje());
                
                throw new ExternalServiceException("GovCarpeta", govResponse.getMensaje(), govResponse.getCodigoRespuesta());
            }

            // Actualizar registro local
            registro.setEstado(RegistroCiudadano.EstadoRegistro.DESREGISTRADO);
            registro.setFechaDesregistro(LocalDateTime.now());
            registro.setMotivoDesregistro(request.getMotivoDesregistro());
            registro.setActivo(false);

            registro = registroRepository.save(registro);

            registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.DESREGISTRO_CIUDADANO,
                    request.getOperadorId(), request.getOperadorNombre(),
                    "Desregistro exitoso", govResponse.getCodigoRespuesta(), govResponse.getMensaje());

            log.info("Ciudadano {} desregistrado exitosamente", request.getCedula());
            return mapToResponse(registro);

        } catch (Exception e) {
            log.error("Error desregistrando ciudadano {}: {}", request.getCedula(), e.getMessage(), e);
            registrarAuditoria(request.getCedula(), AuditoriaRegistro.AccionAuditoria.ERROR_DESREGISTRO,
                    request.getOperadorId(), request.getOperadorNombre(),
                    "Error interno", 500, e.getMessage());
            throw e;
        }
    }

    @Override
    public RegistroCiudadanoResponse obtenerCiudadanoPorCedula(Long cedula) {
        return registroRepository.findActiveByCedula(cedula)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    public List<RegistroCiudadanoResponse> obtenerCiudadanosPorOperador(String operadorId) {
        return registroRepository.findByOperadorIdAndActivoTrue(operadorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditoriaRegistroResponse> obtenerHistorialAuditoria(Long cedula) {
        return auditoriaRepository.findByCedulaCiudadanoOrderByFechaAccionDesc(cedula)
                .stream()
                .map(this::mapAuditoriaToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public String crearCarpetaCiudadana(Long cedula) {
        log.info("Creando carpeta ciudadana para cédula: {}", cedula);
        
        try {
            // Buscar el registro del ciudadano para obtener su nombre
            RegistroCiudadano registro = registroRepository.findActiveByCedula(cedula)
                    .orElseThrow(() -> new ResourceNotFoundException("Ciudadano", "cedula", cedula));
            
            // Crear request para el servicio de carpeta ciudadana
            CrearCarpetaRequest request = CrearCarpetaRequest.builder()
                    .cedula(cedula.toString())
                    .nombreCompleto(registro.getNombreCompleto())
                    .operadorActual("SISTEMA_REGISTRO") // Operador por defecto
                    .build();
            
            // Llamar al servicio de carpeta ciudadana
            CarpetaCiudadanaResponse response = carpetaCiudadanaService.crearCarpeta(request);
            
            if (response == null || !response.getExitoso()) {
                log.error("Error creando carpeta ciudadana para cédula {}: {}", cedula, 
                         response != null ? response.getMensaje() : "Respuesta nula");
                registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.ERROR_REGISTRO,
                        null, null, "Error creando carpeta", 
                        response != null ? response.getCodigoRespuesta() : 500, 
                        response != null ? response.getMensaje() : "Error interno");
                
                throw new ExternalServiceException("CarpetaCiudadana", 
                         response != null ? response.getMensaje() : "Error interno", 
                         response != null ? response.getCodigoRespuesta() : 500);
            }
            
            // Extraer el carpetaId de la respuesta
            String carpetaIdStr = response.getData() != null ? response.getData().getCarpetaId() : null;
            if (carpetaIdStr == null) {
                throw new RuntimeException("No se recibió carpetaId en la respuesta");
            }
            
            registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.CREACION_CARPETA,
                    null, null, "Carpeta creada exitosamente", 
                    response.getCodigoRespuesta(), response.getMensaje());
            
            log.info("Carpeta ciudadana creada exitosamente para cédula {}: {}", cedula, carpetaIdStr);
            return carpetaIdStr;
            
        } catch (Exception e) {
            log.error("Error creando carpeta ciudadana para cédula {}: {}", cedula, e.getMessage(), e);
            registrarAuditoria(cedula, AuditoriaRegistro.AccionAuditoria.ERROR_REGISTRO,
                    null, null, "Error interno creando carpeta", 500, e.getMessage());
            throw e;
        }
    }

    private void registrarAuditoria(Long cedula, AuditoriaRegistro.AccionAuditoria accion,
                                   String operadorId, String operadorNombre,
                                   String resultado, Integer codigoRespuesta, String mensajeRespuesta) {
        
        AuditoriaRegistro auditoria = AuditoriaRegistro.builder()
                .cedulaCiudadano(cedula)
                .accion(accion)
                .operadorId(operadorId)
                .operadorNombre(operadorNombre)
                .resultado(resultado)
                .codigoRespuesta(codigoRespuesta)
                .mensajeRespuesta(mensajeRespuesta)
                .fechaAccion(LocalDateTime.now())
                .build();

        auditoriaRepository.save(auditoria);
    }

    private RegistroCiudadanoResponse mapToResponse(RegistroCiudadano registro) {
        return RegistroCiudadanoResponse.builder()
                .id(String.valueOf(registro.getCedula())) // Usar cédula como ID
                .cedula(registro.getCedula())
                .nombreCompleto(registro.getNombreCompleto())
                .direccion(registro.getDireccion())
                .email(registro.getEmail())
                .carpetaId(registro.getCarpetaId())
                .estado(registro.getEstado())
                .fechaRegistroGovCarpeta(registro.getFechaRegistroGovCarpeta())
                .fechaCreacion(registro.getFechaCreacion())
                .activo(registro.getActivo())
                .build();
    }

    private AuditoriaRegistroResponse mapAuditoriaToResponse(AuditoriaRegistro auditoria) {
        return AuditoriaRegistroResponse.builder()
                .id(auditoria.getPk()) // Usar PK como ID
                .cedulaCiudadano(auditoria.getCedulaCiudadano())
                .accion(auditoria.getAccion())
                .operadorId(auditoria.getOperadorId())
                .operadorNombre(auditoria.getOperadorNombre())
                .resultado(auditoria.getResultado())
                .codigoRespuesta(auditoria.getCodigoRespuesta())
                .mensajeRespuesta(auditoria.getMensajeRespuesta())
                .detallesAdicionales(auditoria.getDetallesAdicionales())
                .ipOrigen(auditoria.getIpOrigen())
                .userAgent(auditoria.getUserAgent())
                .fechaAccion(auditoria.getFechaAccion())
                .build();
    }
}
