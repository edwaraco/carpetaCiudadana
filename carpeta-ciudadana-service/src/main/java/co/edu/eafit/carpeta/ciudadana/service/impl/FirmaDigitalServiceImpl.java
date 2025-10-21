package co.edu.eafit.carpeta.ciudadana.service.impl;

import co.edu.eafit.carpeta.ciudadana.client.DigitalSignatureClient;
import co.edu.eafit.carpeta.ciudadana.dto.request.AutenticarDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerCertificadoValidezRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.FirmaDigitalRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.VerificarEstadoAutenticacionRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.FirmaDigitalResponse;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;
import co.edu.eafit.carpeta.ciudadana.repository.DocumentoRepository;
import co.edu.eafit.carpeta.ciudadana.repository.HistorialAccesoRepository;
import co.edu.eafit.carpeta.ciudadana.mapper.historial.HistorialAccesoMapper;
import co.edu.eafit.carpeta.ciudadana.service.FirmaDigitalService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Implementación del servicio para la gestión de autenticación/firma digital de documentos
 * Se comunica con el microservicio de autenticación que implementa FR-AF-01
 * usando la API de MinTIC /apis/authenticateDocument
 */
@Slf4j
@Service
public class FirmaDigitalServiceImpl implements FirmaDigitalService {

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private HistorialAccesoRepository historialRepository;

    @Autowired
    private HistorialAccesoMapper historialAccesoMapper;

    @Autowired
    private DigitalSignatureClient digitalSignatureClient;

    /**
     * Solicita la autenticación/firma digital de un documento
     * Implementa FR-AF-01 usando el microservicio de autenticación
     */
    @Override
    public FirmaDigitalResponse autenticarDocumento(AutenticarDocumentoRequest request) {
        log.info("Solicitando autenticación para documento: {} por funcionario: {}", 
                request.documentoId(), request.funcionarioSolicitante());

        // Verificar que el documento existe
        Documento documento = documentoRepository.findById(request.carpetaId(), request.documentoId())
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));

        // Verificar que el documento está en estado TEMPORAL
        if (!"TEMPORAL".equals(documento.getEstadoDocumento())) {
            throw new IllegalStateException("Solo se pueden autenticar documentos en estado TEMPORAL");
        }

        try {
            // Crear request para el microservicio de autenticación
            FirmaDigitalRequest firmaRequest = new FirmaDigitalRequest(
                    documento.getCarpetaId(),
                    documento.getUrlAlmacenamiento(),
                    documento.getTitulo(),
                    request.funcionarioSolicitante(),
                    request.entidadSolicitante(),
                    "Autenticación de documento para validez legal"
            );

            // Llamar al microservicio de autenticación
            FirmaDigitalResponse response = digitalSignatureClient.autenticarDocumento(firmaRequest);

            // Procesar respuesta según códigos de MinTIC
            if (response.codigoRespuesta() == 200) {
                // Autenticación exitosa
                documento.setFirmadoPor(request.entidadSolicitante());
                documento.setCertificadoValidez(response.certificadoValidez());
                documento.setEstadoDocumento("CERTIFICADO");
                documento.setFechaUltimaModificacion(LocalDateTime.now());

                // Guardar cambios
                documentoRepository.save(documento);

                // Registrar acceso exitoso usando mapper
                HistorialAcceso accesoExitoso = historialAccesoMapper.crearAcceso(
                        request.carpetaId(), request.documentoId(), "AUTENTICACION_EXITOSA", 
                        request.funcionarioSolicitante(), "Documento autenticado exitosamente por " + request.entidadSolicitante());
                historialRepository.save(accesoExitoso);

                log.info("Documento autenticado exitosamente: {}", request.documentoId());
                
            } else if (response.codigoRespuesta() == 204) {
                // Registrar acceso sin contenido usando mapper
                HistorialAcceso accesoSinContenido = historialAccesoMapper.crearAcceso(
                        request.carpetaId(), request.documentoId(), "AUTENTICACION_SIN_CONTENIDO", 
                        request.funcionarioSolicitante(), "Documento no válido para autenticación (204)");
                historialRepository.save(accesoSinContenido);
                
            } else if (response.codigoRespuesta() == 501) {
                // Registrar acceso parámetros incorrectos usando mapper
                HistorialAcceso accesoParametrosIncorrectos = historialAccesoMapper.crearAcceso(
                        request.carpetaId(), request.documentoId(), "AUTENTICACION_PARAMETROS_INCORRECTOS", 
                        request.funcionarioSolicitante(), "Parámetros incorrectos en autenticación (501)");
                historialRepository.save(accesoParametrosIncorrectos);
                
            } else if (response.codigoRespuesta() == 500) {
                // Registrar acceso error aplicación usando mapper
                HistorialAcceso accesoErrorAplicacion = historialAccesoMapper.crearAcceso(
                        request.carpetaId(), request.documentoId(), "AUTENTICACION_ERROR_APLICACION", 
                        request.funcionarioSolicitante(), "Error de aplicación en autenticación (500)");
                historialRepository.save(accesoErrorAplicacion);
            }

            return response;

        } catch (Exception e) {
            log.error("Error en autenticación: {}", e.getMessage());
            
            // Registrar acceso fallido usando mapper
            HistorialAcceso accesoError = historialAccesoMapper.crearAcceso(
                    request.carpetaId(), request.documentoId(), "AUTENTICACION_ERROR", 
                    request.funcionarioSolicitante(), "Error en autenticación: " + e.getMessage());
            historialRepository.save(accesoError);
            
            throw new RuntimeException("Error en autenticación: " + e.getMessage());
        }
    }

    /**
     * Obtiene el certificado de validez de un documento autenticado
     */
    @Override
    public Optional<String> obtenerCertificadoValidez(ObtenerCertificadoValidezRequest request) {
        Documento documento = documentoRepository.findById(request.carpetaId(), request.documentoId())
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));

        if ("CERTIFICADO".equals(documento.getEstadoDocumento())) {
            return Optional.of(documento.getCertificadoValidez());
        }

        return Optional.empty();
    }

    /**
     * Verifica si un documento está autenticado
     */
    @Override
    public boolean esDocumentoAutenticado(VerificarEstadoAutenticacionRequest request) {
        Documento documento = documentoRepository.findById(request.carpetaId(), request.documentoId())
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));

        return "CERTIFICADO".equals(documento.getEstadoDocumento());
    }

}
