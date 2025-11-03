package co.edu.eafit.carpeta.ciudadana.registry.controller;

import co.edu.eafit.carpeta.ciudadana.registry.dto.request.RegistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.request.DesregistrarCiudadanoRequest;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ApiResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.RegistroCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.ValidacionCiudadanoResponse;
import co.edu.eafit.carpeta.ciudadana.registry.dto.response.AuditoriaRegistroResponse;
import co.edu.eafit.carpeta.ciudadana.registry.exception.CiudadanoAlreadyExistsException;
import co.edu.eafit.carpeta.ciudadana.registry.exception.ResourceNotFoundException;
import co.edu.eafit.carpeta.ciudadana.registry.service.CiudadanoRegistryService;
import co.edu.eafit.carpeta.ciudadana.registry.util.ResponseUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/ciudadanos")
@Tag(name = "Ciudadano Registry", description = "API para gestión de registro de ciudadanos")
public class CiudadanoRegistryController {

    private final CiudadanoRegistryService ciudadanoRegistryService;

    public CiudadanoRegistryController(CiudadanoRegistryService ciudadanoRegistryService) {
        this.ciudadanoRegistryService = ciudadanoRegistryService;
    }

    @GetMapping("/validar/{cedula}")
    @Operation(
        summary = "Validar ciudadano", 
        description = "Valida si un ciudadano está disponible para registro en el sistema. " +
                      "Verifica tanto en la base de datos local como en el servicio externo GovCarpeta.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Ciudadano disponible para registro",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano disponible",
                    value = """
                        {
                          "success": true,
                          "message": "Ciudadano disponible para registro",
                          "data": {
                            "cedula": 1234567890,
                            "disponible": true,
                            "mensaje": "Ciudadano disponible para registro",
                            "codigoRespuesta": 200
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "204", 
            description = "Ciudadano ya registrado",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano ya registrado",
                    value = """
                        {
                          "success": true,
                          "message": "Ciudadano ya registrado en el sistema",
                          "data": {
                            "cedula": 1234567890,
                            "disponible": false,
                            "mensaje": "Ciudadano ya registrado en el sistema",
                            "codigoRespuesta": 204
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500", 
            description = "Error interno del servidor",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Error interno",
                    value = """
                        {
                          "success": false,
                          "message": "Error interno del sistema",
                          "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": "Ha ocurrido un error interno. Por favor, contacte al administrador."
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        )
    })
    public ResponseEntity<ApiResponse<ValidacionCiudadanoResponse>> validarCiudadano(
            @Parameter(description = "Cédula del ciudadano a validar", required = true, example = "1234567890")
            @PathVariable Long cedula) {
        
        log.info("Validando ciudadano con cédula: {}", cedula);
        
        ValidacionCiudadanoResponse response = ciudadanoRegistryService.validarCiudadano(cedula);
        
        if (response.getDisponible()) {
            return ResponseUtil.ok(response, "Ciudadano disponible para registro");
        } else {
            return ResponseUtil.ok(response, "Ciudadano ya registrado en el sistema");
        }
    }

    @PostMapping("/registrar")
    @Operation(
        summary = "Registrar ciudadano", 
        description = "Registra un nuevo ciudadano en el sistema. " +
                      "Valida que no esté registrado, lo registra en GovCarpeta, " +
                      "crea su carpeta ciudadana y mantiene auditoría completa.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201", 
            description = "Ciudadano registrado exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano registrado",
                    value = """
                        {
                          "success": true,
                          "message": "Ciudadano registrado exitosamente",
                          "data": {
                            "id": "1234567890",
                            "cedula": 1234567890,
                            "nombreCompleto": "Juan Pérez García",
                            "direccion": "Calle 123 #45-67",
                            "email": "juan.perez.garcia.1234567890@carpetacolombia.co",
                            "carpetaId": "550e8400-e29b-41d4-a716-446655440000",
                            "estado": "REGISTRADO",
                            "fechaRegistroGovCarpeta": "2025-10-21T10:30:00",
                            "fechaCreacion": "2025-10-21T10:30:00",
                            "activo": true
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "Datos de entrada inválidos",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Error de validación",
                    value = """
                        {
                          "success": false,
                          "message": "La cédula es obligatoria",
                          "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "La cédula es obligatoria",
                            "field": "cedula"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "409", 
            description = "Ciudadano ya registrado",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano duplicado",
                    value = """
                        {
                          "success": false,
                          "message": "Ya existe un ciudadano registrado con cédula: 1234567890",
                          "error": {
                            "code": "CIUDADANO_ALREADY_EXISTS",
                            "message": "Ya existe un ciudadano registrado con cédula: 1234567890",
                            "field": "cedula",
                            "rejectedValue": 1234567890
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "503", 
            description = "Servicio externo no disponible",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Servicio no disponible",
                    value = """
                        {
                          "success": false,
                          "message": "Error en servicio GovCarpeta: Servicio temporalmente no disponible",
                          "error": {
                            "code": "EXTERNAL_SERVICE_ERROR",
                            "message": "Error en servicio GovCarpeta: Servicio temporalmente no disponible"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        )
    })
    public ResponseEntity<ApiResponse<RegistroCiudadanoResponse>> registrarCiudadano(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Datos del ciudadano para registro",
                required = true,
                content = @Content(
                    schema = @Schema(implementation = RegistrarCiudadanoRequest.class),
                    examples = @ExampleObject(
                        name = "Registrar ciudadano",
                        value = """
                            {
                              "cedula": 1234567890,
                              "nombreCompleto": "Juan Pérez García",
                              "direccion": "Calle 123 #45-67"
                            }
                            """
                    )
                )
            )
            @Valid @RequestBody RegistrarCiudadanoRequest request) {
        
        log.info("Registrando ciudadano con cédula: {}", request.getCedula());
        
        RegistroCiudadanoResponse response = ciudadanoRegistryService.registrarCiudadano(request);
        return ResponseUtil.created(response, "Ciudadano registrado exitosamente");
    }

    @DeleteMapping("/desregistrar")
    @Operation(
        summary = "Desregistrar ciudadano", 
        description = "Desregistra un ciudadano del sistema. " +
                      "Notifica a GovCarpeta, actualiza el estado local y mantiene auditoría.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Ciudadano desregistrado exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano desregistrado",
                    value = """
                        {
                          "success": true,
                          "message": "Ciudadano desregistrado exitosamente",
                          "data": {
                            "id": "1234567890",
                            "cedula": 1234567890,
                            "nombreCompleto": "Juan Pérez García",
                            "direccion": "Calle 123 #45-67",
                            "email": "juan.perez.garcia.1234567890@carpetacolombia.co",
                            "carpetaId": "550e8400-e29b-41d4-a716-446655440000",
                            "estado": "DESREGISTRADO",
                            "fechaRegistroGovCarpeta": "2025-10-21T10:30:00",
                            "fechaCreacion": "2025-10-21T10:30:00",
                            "activo": false
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "Datos de entrada inválidos",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Error de validación",
                    value = """
                        {
                          "success": false,
                          "message": "La cédula es obligatoria",
                          "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "La cédula es obligatoria",
                            "field": "cedula"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", 
            description = "Ciudadano no encontrado",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Ciudadano no encontrado",
                    value = """
                        {
                          "success": false,
                          "message": "Ciudadano no encontrado con cedula: '1234567890'",
                          "error": {
                            "code": "RESOURCE_NOT_FOUND",
                            "message": "Ciudadano no encontrado con cedula: '1234567890'",
                            "field": "cedula",
                            "rejectedValue": "1234567890"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "503", 
            description = "Servicio externo no disponible",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Servicio no disponible",
                    value = """
                        {
                          "success": false,
                          "message": "Error en servicio GovCarpeta: Servicio temporalmente no disponible",
                          "error": {
                            "code": "EXTERNAL_SERVICE_ERROR",
                            "message": "Error en servicio GovCarpeta: Servicio temporalmente no disponible"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        )
    })
    public ResponseEntity<ApiResponse<RegistroCiudadanoResponse>> desregistrarCiudadano(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Datos para desregistrar ciudadano",
                required = true,
                content = @Content(
                    schema = @Schema(implementation = DesregistrarCiudadanoRequest.class),
                    examples = @ExampleObject(
                        name = "Desregistrar ciudadano",
                        value = """
                            {
                              "cedula": 1234567890,
                              "motivoDesregistro": "Solicitud del ciudadano"
                            }
                            """
                    )
                )
            )
            @Valid @RequestBody DesregistrarCiudadanoRequest request) {
        
        log.info("Desregistrando ciudadano con cédula: {}", request.getCedula());
        
        RegistroCiudadanoResponse response = ciudadanoRegistryService.desregistrarCiudadano(request);
        return ResponseUtil.ok(response, "Ciudadano desregistrado exitosamente");
    }

    @GetMapping("/{cedula}")
    @Operation(
        summary = "Obtener ciudadano", 
        description = "Obtiene información completa de un ciudadano registrado por su cédula.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Ciudadano encontrado exitosamente"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", 
            description = "Ciudadano no encontrado"
        )
    })
    public ResponseEntity<ApiResponse<RegistroCiudadanoResponse>> obtenerCiudadano(
            @Parameter(description = "Cédula del ciudadano", required = true, example = "1234567890")
            @PathVariable Long cedula) {
        
        log.info("Obteniendo ciudadano con cédula: {}", cedula);
        
        RegistroCiudadanoResponse response = ciudadanoRegistryService.obtenerCiudadanoPorCedula(cedula);
        
        if (response == null) {
            throw new ResourceNotFoundException("Ciudadano", "cedula", cedula);
        }
        
        return ResponseUtil.ok(response, "Ciudadano encontrado exitosamente");
    }

    @GetMapping
    @Operation(
        summary = "Obtener todos los ciudadanos", 
        description = "Obtiene todos los ciudadanos activos registrados en el sistema.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Lista de ciudadanos obtenida exitosamente"
        )
    })
    public ResponseEntity<ApiResponse<List<RegistroCiudadanoResponse>>> obtenerTodosCiudadanos() {
        
        log.info("Obteniendo todos los ciudadanos activos");
        
        List<RegistroCiudadanoResponse> response = ciudadanoRegistryService.obtenerTodosCiudadanos();
        
        return ResponseUtil.ok(response, "Ciudadanos obtenidos exitosamente");
    }

    @GetMapping("/{cedula}/auditoria")
    @Operation(
        summary = "Obtener historial de auditoría", 
        description = "Obtiene el historial completo de auditoría de un ciudadano, " +
                      "incluyendo todas las acciones realizadas en el sistema.",
        tags = {"Ciudadano Registry"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Historial de auditoría obtenido exitosamente"
        )
    })
    public ResponseEntity<ApiResponse<List<AuditoriaRegistroResponse>>> obtenerHistorialAuditoria(
            @Parameter(description = "Cédula del ciudadano", required = true, example = "1234567890")
            @PathVariable Long cedula) {
        
        log.info("Obteniendo historial de auditoría para ciudadano: {}", cedula);
        
        List<AuditoriaRegistroResponse> response = ciudadanoRegistryService.obtenerHistorialAuditoria(cedula);
        
        return ResponseUtil.ok(response, "Historial de auditoría obtenido exitosamente");
    }
}
