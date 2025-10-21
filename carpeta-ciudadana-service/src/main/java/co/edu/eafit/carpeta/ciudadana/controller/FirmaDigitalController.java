package co.edu.eafit.carpeta.ciudadana.controller;

import co.edu.eafit.carpeta.ciudadana.dto.request.AutenticarDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerCertificadoValidezRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.VerificarEstadoAutenticacionRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.FirmaDigitalResponse;
import co.edu.eafit.carpeta.ciudadana.service.FirmaDigitalService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Controlador REST para la gestión de autenticación/firma digital de documentos
 * Implementa FR-AF-01 mediante comunicación con microservicio de autenticación
 */
@Slf4j
@RestController
@RequestMapping("/firma-digital")
@CrossOrigin(origins = "*")
public class FirmaDigitalController {

    @Autowired
    private FirmaDigitalService firmaDigitalService;

    /**
     * Solicita la autenticación/firma digital de un documento
     * Implementa FR-AF-01 usando el microservicio de autenticación
     */
    @PostMapping("/{carpetaId}/documentos/{documentoId}/autenticar")
    public ResponseEntity<FirmaDigitalResponse> autenticarDocumento(
            @PathVariable String carpetaId,
            @PathVariable String documentoId,
            @RequestParam("funcionarioSolicitante") String funcionarioSolicitante,
            @RequestParam("entidadSolicitante") String entidadSolicitante) {
        
        log.info("Solicitando autenticación para documento: {} por funcionario: {}", documentoId, funcionarioSolicitante);

        try {
            AutenticarDocumentoRequest request = new AutenticarDocumentoRequest(
                    carpetaId, documentoId, funcionarioSolicitante, entidadSolicitante
            );
            FirmaDigitalResponse response = firmaDigitalService.autenticarDocumento(request);
            
            // Manejar diferentes códigos de respuesta de MinTIC
            if (response.codigoRespuesta() == 200) {
                return ResponseEntity.ok(response);
            } else if (response.codigoRespuesta() == 204) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            } else if (response.codigoRespuesta() == 501) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            } else if (response.codigoRespuesta() == 500) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (IllegalArgumentException e) {
            log.error("Error en autenticación: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new FirmaDigitalResponse(false, null, "Error: " + e.getMessage(), 400, null, null, null, null)
            );
        } catch (IllegalStateException e) {
            log.error("Error de estado en autenticación: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    new FirmaDigitalResponse(false, null, "Error de estado: " + e.getMessage(), 409, null, null, null, null)
            );
        } catch (Exception e) {
            log.error("Error interno en autenticación: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new FirmaDigitalResponse(false, null, "Error interno del servidor", 500, null, null, null, null)
            );
        }
    }

    /**
     * Verifica si un documento está autenticado
     */
    @GetMapping("/{carpetaId}/documentos/{documentoId}/estado")
    public ResponseEntity<Boolean> verificarEstadoAutenticacion(
            @PathVariable String carpetaId,
            @PathVariable String documentoId) {
        
        log.info("Verificando estado de autenticación del documento: {}", documentoId);

        try {
            VerificarEstadoAutenticacionRequest request = new VerificarEstadoAutenticacionRequest(
                    carpetaId, documentoId
            );
            boolean esAutenticado = firmaDigitalService.esDocumentoAutenticado(request);
            return ResponseEntity.ok(esAutenticado);

        } catch (IllegalArgumentException e) {
            log.error("Error verificando estado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(false);
        } catch (Exception e) {
            log.error("Error interno verificando estado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    /**
     * Obtiene el certificado de validez de un documento autenticado
     */
    @GetMapping("/{carpetaId}/documentos/{documentoId}/certificado")
    public ResponseEntity<String> obtenerCertificadoValidez(
            @PathVariable String carpetaId,
            @PathVariable String documentoId) {
        
        log.info("Obteniendo certificado de validez para documento: {}", documentoId);

        try {
            ObtenerCertificadoValidezRequest request = new ObtenerCertificadoValidezRequest(
                    carpetaId, documentoId
            );
            Optional<String> certificadoOpt = firmaDigitalService.obtenerCertificadoValidez(request);
            
            if (certificadoOpt.isPresent()) {
                return ResponseEntity.ok(certificadoOpt.get());
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IllegalArgumentException e) {
            log.error("Error obteniendo certificado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error interno obteniendo certificado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor");
        }
    }
}
