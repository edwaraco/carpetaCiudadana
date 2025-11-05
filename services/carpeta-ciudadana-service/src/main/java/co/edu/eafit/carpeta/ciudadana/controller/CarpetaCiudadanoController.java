package co.edu.eafit.carpeta.ciudadana.controller;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentosCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.BuscarCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.ApiResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CrearCarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentosPaginadosResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoUrlResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.SubirDocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.CarpetaResponse;
import co.edu.eafit.carpeta.ciudadana.exception.ResourceNotFoundException;
import co.edu.eafit.carpeta.ciudadana.service.CarpetaCiudadanoService;
import co.edu.eafit.carpeta.ciudadana.util.ResponseUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/carpetas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(
    name = "Carpeta Ciudadana", 
    description = "API para gestión de carpetas ciudadanas y documentos. " +
                  "Permite crear carpetas únicas, almacenar documentos (firmados o no), " +
                  "visualizar documentos y gestionar el ciclo de vida de la carpeta ciudadana."
)
public class CarpetaCiudadanoController {

    private final CarpetaCiudadanoService carpetaService;

    @Operation(
        summary = "Crear carpeta ciudadana",
        description = "Crea una carpeta ciudadana única para un ciudadano. " +
                      "Genera automáticamente un email inmutable en el dominio @carpetacolombia.co. " +
                      "Solo se permite una carpeta por ciudadano (validado por cédula).",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201",
            description = "Carpeta creada exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Carpeta creada",
                    value = """
                        {
                          "success": true,
                          "message": "Carpeta creada exitosamente",
                          "data": {
                            "carpetaId": "550e8400-e29b-41d4-a716-446655440000",
                            "emailCarpeta": "juan.perez.1234567890@carpetacolombia.co",
                            "estadoCarpeta": "ACTIVA",
                            "fechaCreacion": "2025-10-21T10:30:00",
                            "mensaje": "Carpeta creada exitosamente"
                          },
                          "timestamp": "2025-10-21T10:30:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Datos de entrada inválidos o validación fallida",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Error de validación",
                    value = """
                        {
                          "success": false,
                          "message": "Campo 'cedula' inválido: La cédula debe contener entre 6 y 12 dígitos",
                          "error": {
                            "code": "INVALID_REQUEST",
                            "message": "Campo 'cedula' inválido: La cédula debe contener entre 6 y 12 dígitos",
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
            description = "Ya existe una carpeta para este ciudadano",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Carpeta duplicada",
                    value = """
                        {
                          "success": false,
                          "message": "Ya existe una carpeta para el ciudadano con cédula: 1234567890",
                          "error": {
                            "code": "CARPETA_ALREADY_EXISTS",
                            "message": "Ya existe una carpeta para el ciudadano con cédula: 1234567890",
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
                          "message": "Ha ocurrido un error interno. Por favor, contacte al administrador.",
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
    @PostMapping
    public ResponseEntity<ApiResponse<CrearCarpetaResponse>> crearCarpeta(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Datos del ciudadano para crear la carpeta",
                required = true,
                content = @Content(
                    schema = @Schema(implementation = CrearCarpetaRequest.class),
                    examples = @ExampleObject(
                        name = "Crear carpeta",
                        value = """
                            {
                              "cedula": "1234567890",
                              "nombreCompleto": "Juan Pérez García",
                              "operadorActual": "MI_OPERADOR"
                            }
                            """
                    )
                )
            )
            @RequestBody CrearCarpetaRequest request) {
        
        log.info("Creando carpeta para ciudadano con cédula: {}", request.cedula());

        var carpeta = carpetaService.crearCarpeta(request);
        var response = ResponseUtil.toCrearCarpetaResponse(carpeta);
        
        return ResponseUtil.created(response, "Carpeta creada exitosamente");
    }

    /**
     * Buscar carpeta por ID
     */
    @Operation(
        summary = "Buscar carpeta por ID",
        description = "Obtiene la información completa de una carpeta ciudadana utilizando su ID único.",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Carpeta encontrada exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Carpeta encontrada",
                    value = """
                        {
                          "success": true,
                          "data": {
                            "carpetaId": "550e8400-e29b-41d4-a716-446655440000",
                            "propietarioCedula": "1234567890",
                            "propietarioNombre": "Juan Pérez García",
                            "emailCarpeta": "juan.perez.1234567890@carpetacolombia.co",
                            "estadoCarpeta": "ACTIVA",
                            "operadorActual": "MI_OPERADOR",
                            "espacioUtilizadoBytes": 15728640,
                            "fechaCreacion": "2025-10-21T10:30:00",
                            "fechaUltimaModificacion": "2025-10-21T14:45:00"
                          },
                          "timestamp": "2025-10-21T15:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "Carpeta no encontrada",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Carpeta no encontrada",
                    value = """
                        {
                          "success": false,
                          "message": "Carpeta no encontrado con carpetaId: '550e8400-e29b-41d4-a716-446655440000'",
                          "error": {
                            "code": "RESOURCE_NOT_FOUND",
                            "message": "Carpeta no encontrado con carpetaId: '550e8400-e29b-41d4-a716-446655440000'",
                            "field": "carpetaId",
                            "rejectedValue": "550e8400-e29b-41d4-a716-446655440000"
                          },
                          "timestamp": "2025-10-21T15:00:00"
                        }
                        """
                )
            )
        )
    })
    @GetMapping("/{carpetaId}")
    public ResponseEntity<ApiResponse<CarpetaResponse>> buscarCarpetaPorId(
            @Parameter(
                description = "ID único de la carpeta ciudadana (UUID)",
                required = true,
                example = "550e8400-e29b-41d4-a716-446655440000"
            )
            @PathVariable String carpetaId) {
        
        log.info("Buscando carpeta con ID: {}", carpetaId);

        return carpetaService.buscarCarpetaPorId(carpetaId)
                .map(ResponseUtil::toCarpetaResponse)
                .map(ResponseUtil::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId));
    }

    /**
     * Buscar carpeta por cédula del propietario
     */
    @Operation(
        summary = "Buscar carpeta por cédula",
        description = "Obtiene la información de una carpeta ciudadana utilizando la cédula del propietario. " +
                      "Útil para verificar si un ciudadano ya tiene carpeta creada.",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Carpeta encontrada exitosamente"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "No existe carpeta para esta cédula"
        )
    })
    @GetMapping("/cedula/{cedula}")
    public ResponseEntity<ApiResponse<CarpetaResponse>> buscarCarpetaPorCedula(
            @Parameter(
                description = "Cédula del ciudadano propietario de la carpeta",
                required = true,
                example = "1234567890"
            )
            @PathVariable String cedula) {
        
        log.info("Buscando carpeta con cédula: {}", cedula);

            BuscarCarpetaRequest request = new BuscarCarpetaRequest(cedula);
        
        return carpetaService.buscarCarpetaPorCedula(request)
                .map(ResponseUtil::toCarpetaResponse)
                .map(ResponseUtil::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "cedula", cedula));
    }

    /**
     * 2. Almacenar documentos (firmados o no)
     */
    @Operation(
        summary = "Subir documento a carpeta",
        description = "Almacena un documento en la carpeta ciudadana. " +
                      "El documento puede ser temporal o certificado. " +
                      "Se calcula automáticamente el hash SHA-256 y se almacena en MinIO/S3. " +
                      "Tipos de documento: CEDULA, DIPLOMA, ACTA_GRADO, PROCESADO_LABORAL, etc. " +
                      "Contextos: EDUCACION, NOTARIA, REGISTRADURIA, SALUD, etc.",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201",
            description = "Documento subido exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Documento subido",
                    value = """
                        {
                          "success": true,
                          "message": "Documento subido exitosamente",
                          "data": {
                            "documentoId": "660e8400-e29b-41d4-a716-446655440001",
                            "titulo": "Diploma Universitario",
                            "tipoDocumento": "DIPLOMA",
                            "estadoDocumento": "TEMPORAL",
                            "tamanoBytes": 2048000,
                            "fechaRecepcion": "2025-10-21T16:00:00",
                            "mensaje": "Documento subido exitosamente"
                          },
                          "timestamp": "2025-10-21T16:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Archivo inválido o parámetros incorrectos",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = @ExampleObject(
                    value = """
                        {
                          "success": false,
                          "message": "El archivo excede el tamaño máximo permitido",
                          "error": {
                            "code": "FILE_TOO_LARGE",
                            "message": "El archivo excede el tamaño máximo permitido"
                          },
                          "timestamp": "2025-10-21T16:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "Carpeta no encontrada"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500",
            description = "Error al subir archivo a almacenamiento",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = @ExampleObject(
                    value = """
                        {
                          "success": false,
                          "message": "Error subiendo documento a carpeta 550e8400-e29b-41d4-a716-446655440000: Connection timeout",
                          "error": {
                            "code": "DOCUMENT_UPLOAD_ERROR",
                            "message": "Error subiendo documento a carpeta 550e8400-e29b-41d4-a716-446655440000: Connection timeout",
                            "field": "carpetaId",
                            "rejectedValue": "550e8400-e29b-41d4-a716-446655440000"
                          },
                          "timestamp": "2025-10-21T16:00:00"
                        }
                        """
                )
            )
        )
    })
    @PostMapping(value = "/{carpetaId}/documentos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SubirDocumentoResponse>> subirDocumento(
            @Parameter(description = "ID de la carpeta donde se almacenará el documento", required = true)
            @PathVariable String carpetaId,
            
            @Parameter(description = "Archivo a subir (PDF, JPEG, PNG, etc.)", required = true)
            @RequestParam("archivo") MultipartFile archivo,
            
            @Parameter(description = "Título descriptivo del documento", required = true, example = "Diploma Universitario")
            @RequestParam("titulo") String titulo,
            
            @Parameter(description = "Tipo de documento", required = true, 
                      example = "DIPLOMA", 
                      schema = @Schema(allowableValues = {"CEDULA", "DIPLOMA", "ACTA_GRADO", "PROCESADO_LABORAL", "PROCESADO_MEDICO"}))
            @RequestParam("tipoDocumento") String tipoDocumento,
            
            @Parameter(description = "Contexto del documento", required = true,
                      example = "EDUCACION",
                      schema = @Schema(allowableValues = {"EDUCACION", "NOTARIA", "REGISTRADURIA", "SALUD", "LABORAL"}))
            @RequestParam("contextoDocumento") String contextoDocumento) {
        
        log.info("Subiendo documento '{}' a carpeta: {}", titulo, carpetaId);

        var request = new SubirDocumentoConArchivoRequest(
                    carpetaId, titulo, tipoDocumento, contextoDocumento, null
            );
        
        var documento = carpetaService.subirDocumento(request, archivo);
        var response = ResponseUtil.toSubirDocumentoResponse(documento);
        
        return ResponseUtil.created(response, "Documento subido exitosamente");
    }

    @Operation(
        summary = "Obtener documento por ID",
        description = "Obtiene los metadatos completos de un documento específico de la carpeta. " +
                      "No descarga el archivo, solo retorna la información del documento.",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Documento encontrado exitosamente",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Documento encontrado",
                    value = """
                        {
                          "success": true,
                          "data": {
                            "documentoId": "660e8400-e29b-41d4-a716-446655440001",
                            "titulo": "Diploma Universitario",
                            "tipoDocumento": "DIPLOMA",
                            "contextoDocumento": "EDUCACION",
                            "estadoDocumento": "PROCESADO",
                            "fechaRecepcion": "2025-10-21T16:00:00",
                            "fechaUltimaModificacion": "2025-10-21T17:30:00",
                            "esDescargable": true,
                            "formatoArchivo": "application/pdf",
                            "tamanoBytes": 2048000,
                            "hashDocumento": "a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
                          },
                          "timestamp": "2025-10-21T18:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "Documento no encontrado en la carpeta"
        )
    })
    @GetMapping("/{carpetaId}/documentos/{documentoId}")
    public ResponseEntity<ApiResponse<DocumentoResponse>> obtenerDocumento(
            @Parameter(description = "ID de la carpeta", required = true)
            @PathVariable String carpetaId,
            
            @Parameter(description = "ID del documento", required = true)
            @PathVariable String documentoId) {
        
        log.info("Obteniendo documento: {} de carpeta: {}", documentoId, carpetaId);

            ObtenerDocumentoRequest request = new ObtenerDocumentoRequest(carpetaId, documentoId);
        
        return carpetaService.obtenerDocumento(request)
                .map(ResponseUtil::toDocumentoResponse)
                .map(ResponseUtil::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", "documentoId", documentoId));
    }

    /**
     * 3. Ver mis documentos - Obtener documentos de una carpeta con paginación
     */
    @Operation(
        summary = "Obtener documentos de una carpeta con paginación cursor-based",
        description = "Lista documentos almacenados en la carpeta ciudadana con paginación cursor-based. " +
                      "Retorna máximo 20 documentos por página. " +
                      "Usa el campo 'nextCursor' de la respuesta para obtener la siguiente página. " +
                      "El campo 'hasMore' indica si existen más páginas disponibles.",
        tags = {"Carpeta Ciudadana"}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Primera página de documentos obtenida exitosamente (con más páginas disponibles)",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Primera página con más resultados",
                    value = """
                        {
                          "success": true,
                          "message": "Documentos obtenidos exitosamente",
                          "data": {
                            "items": [
                              {
                                "documentoId": "660e8400-e29b-41d4-a716-446655440001",
                                "titulo": "Diploma Universitario",
                                "tipoDocumento": "DIPLOMA",
                                "contextoDocumento": "EDUCACION",
                                "estadoDocumento": "PROCESADO",
                                "fechaRecepcion": "2025-10-21T16:00:00",
                                "fechaUltimaModificacion": "2025-10-21T17:30:00",
                                "esDescargable": true,
                                "formatoArchivo": "application/pdf",
                                "tamanoBytes": 2048000,
                                "hashDocumento": "a3b2c1d4e5f6..."
                              },
                              {
                                "documentoId": "770e8400-e29b-41d4-a716-446655440002",
                                "titulo": "Cédula de Ciudadanía",
                                "tipoDocumento": "CEDULA",
                                "contextoDocumento": "REGISTRADURIA",
                                "estadoDocumento": "PROCESADO",
                                "fechaRecepcion": "2025-10-20T10:00:00",
                                "fechaUltimaModificacion": "2025-10-20T10:00:00",
                                "esDescargable": true,
                                "formatoArchivo": "image/jpeg",
                                "tamanoBytes": 512000,
                                "hashDocumento": "b4c3d2e1f0g9..."
                              }
                            ],
                            "nextCursor": "NzcwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAy",
                            "hasMore": true
                          },
                          "timestamp": "2025-10-21T18:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Última página de documentos (sin más resultados disponibles)",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Última página",
                    value = """
                        {
                          "success": true,
                          "message": "Documentos obtenidos exitosamente",
                          "data": {
                            "items": [
                              {
                                "documentoId": "880e8400-e29b-41d4-a716-446655440003",
                                "titulo": "Acta de Grado",
                                "tipoDocumento": "ACTA_GRADO",
                                "contextoDocumento": "EDUCACION",
                                "estadoDocumento": "PROCESADO",
                                "fechaRecepcion": "2025-10-19T14:00:00",
                                "fechaUltimaModificacion": "2025-10-19T14:00:00",
                                "esDescargable": true,
                                "formatoArchivo": "application/pdf",
                                "tamanoBytes": 1024000,
                                "hashDocumento": "c5d4e3f2g1h0..."
                              }
                            ],
                            "nextCursor": null,
                            "hasMore": false
                          },
                          "timestamp": "2025-10-21T18:00:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Carpeta sin documentos (lista vacía)",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "Sin documentos",
                    value = """
                        {
                          "success": true,
                          "message": "Documentos obtenidos exitosamente",
                          "data": {
                            "items": [],
                            "nextCursor": null,
                            "hasMore": false
                          },
                          "timestamp": "2025-10-21T18:00:00"
                        }
                        """
                )
            )
        )
    })
    @GetMapping("/{carpetaId}/documentos")
    public ResponseEntity<ApiResponse<DocumentosPaginadosResponse>> obtenerDocumentosCarpeta(
            @Parameter(
                description = "ID de la carpeta de la cual se obtendrán los documentos",
                required = true,
                example = "550e8400-e29b-41d4-a716-446655440000"
            )
            @PathVariable String carpetaId,

            @Parameter(
                description = "Cursor de paginación (Base64 encoded). Null o ausente para primera página",
                required = false,
                example = "ZG9jLTAwMw=="
            )
            @RequestParam(required = false) String cursor) {

        log.info("Obteniendo documentos de carpeta: {}, cursor: {}", carpetaId, cursor);

        DocumentosPaginadosResponse response = carpetaService.obtenerDocumentosPaginados(
                carpetaId, cursor, null);

        return ResponseUtil.ok(response, "Documentos obtenidos exitosamente");
    }

    @Operation(
        summary = "Generar URL de descarga para documento",
        description = "Genera una URL temporal y segura (prefirmada) para descargar un documento específico. " +
                     "La URL es válida por un tiempo limitado (por defecto 15 minutos) y no requiere autenticación adicional."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "URL de descarga generada exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "URL generada",
                    value = """
                        {
                            "success": true,
                            "message": "URL de descarga generada exitosamente",
                            "data": {
                                "documentoId": "163c8a62-289c-49e7-b540-a0c31ede1623",
                                "titulo": "Diploma Universitario",
                                "urlDescarga": "http://localhost:9000/carpeta-ciudadana-docs/7fbde089-6964-4979-8957-441f945005b2/163c8a62-289c-49e7-b540-a0c31ede1623/diploma.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
                                "expiraEn": "2025-10-21T12:30:00",
                                "minutosValidez": 15,
                                "mensaje": "URL de descarga generada exitosamente. Esta URL expirará en 15 minutos."
                            },
                            "timestamp": "2025-10-21T12:15:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "Carpeta o documento no encontrado",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Documento no encontrado",
                    value = """
                        {
                            "success": false,
                            "message": "Recurso no encontrado",
                            "error": "Documento con ID 163c8a62-289c-49e7-b540-a0c31ede1623 no encontrado",
                            "timestamp": "2025-10-21T12:15:00"
                        }
                        """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500",
            description = "Error generando URL de descarga",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error en MinIO",
                    value = """
                        {
                            "success": false,
                            "message": "Error al generar URL de descarga",
                            "error": "Error de conexión con el sistema de almacenamiento",
                            "timestamp": "2025-10-21T12:15:00"
                        }
                        """
                )
            )
        )
    })
    @GetMapping("/{carpetaId}/documentos/{documentoId}/descargar")
    public ResponseEntity<ApiResponse<DocumentoUrlResponse>> generarUrlDescarga(
            @Parameter(
                description = "ID de la carpeta que contiene el documento",
                required = true,
                example = "7fbde089-6964-4979-8957-441f945005b2"
            )
            @PathVariable String carpetaId,
            @Parameter(
                description = "ID del documento a descargar",
                required = true,
                example = "163c8a62-289c-49e7-b540-a0c31ede1623"
            )
            @PathVariable String documentoId) {
        
        log.info("Generando URL de descarga para documento: {} en carpeta: {}", documentoId, carpetaId);

        ObtenerDocumentoRequest request = new ObtenerDocumentoRequest(carpetaId, documentoId);
        DocumentoResponse documento = carpetaService.obtenerDocumento(request)
                .map(ResponseUtil::toDocumentoResponse)
                .orElseThrow(() -> new co.edu.eafit.carpeta.ciudadana.exception.ResourceNotFoundException(
                        "Documento", "documentoId", documentoId));
        
        String urlDescarga = carpetaService.generarUrlDescarga(carpetaId, documentoId);
        
        DocumentoUrlResponse response = DocumentoUrlResponse.of(
                documentoId, 
                documento.titulo(), 
                urlDescarga, 
                15
        );
        
        return ResponseUtil.ok(response, "URL de descarga generada exitosamente");
    }
}
