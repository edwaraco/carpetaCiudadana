package co.edu.eafit.carpeta.ciudadana.service;

import co.edu.eafit.carpeta.ciudadana.dto.request.AutenticarDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerCertificadoValidezRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.VerificarEstadoAutenticacionRequest;

import co.edu.eafit.carpeta.ciudadana.dto.response.FirmaDigitalResponse;

import java.util.Optional;

/**
 * Interfaz del servicio para la gestión de firma digital
 * Define los contratos para las operaciones de autenticación de documentos
 */
public interface FirmaDigitalService {

    /**
     * Solicita la autenticación/firma digital de un documento
     * @param request DTO con los datos para autenticar el documento
     * @return Respuesta de la autenticación
     */
    FirmaDigitalResponse autenticarDocumento(AutenticarDocumentoRequest request);

    /**
     * Obtiene el certificado de validez de un documento autenticado
     * @param request DTO con los IDs de carpeta y documento
     * @return Optional con el certificado de validez o vacío
     */
    Optional<String> obtenerCertificadoValidez(ObtenerCertificadoValidezRequest request);

    /**
     * Verifica si un documento está autenticado
     * @param request DTO con los IDs de carpeta y documento
     * @return true si el documento está autenticado, false en caso contrario
     */
    boolean esDocumentoAutenticado(VerificarEstadoAutenticacionRequest request);
}
