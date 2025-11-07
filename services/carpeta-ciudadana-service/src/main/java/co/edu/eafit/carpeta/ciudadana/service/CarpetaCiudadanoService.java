package co.edu.eafit.carpeta.ciudadana.service;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentosCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.BuscarCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentosPaginadosResponse;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface CarpetaCiudadanoService {

    CarpetaCiudadano crearCarpeta(CrearCarpetaRequest request);

    Optional<CarpetaCiudadano> buscarCarpetaPorId(String carpetaId);

    Optional<CarpetaCiudadano> buscarCarpetaPorCedula(BuscarCarpetaRequest request);

    Documento subirDocumento(SubirDocumentoConArchivoRequest request, MultipartFile archivo);

    Optional<Documento> obtenerDocumento(ObtenerDocumentoRequest request);

    List<Documento> obtenerDocumentosCarpeta(ObtenerDocumentosCarpetaRequest request);

    /**
     * Obtiene documentos de una carpeta con paginación cursor-based
     *
     * @param carpetaId ID de la carpeta
     * @param cursor Cursor de paginación (Base64 encoded), null para primera página
     * @param pageSize Número de documentos por página (default: 20)
     * @return Respuesta paginada con items, nextCursor y hasMore
     */
    DocumentosPaginadosResponse obtenerDocumentosPaginados(String carpetaId, String cursor, Integer pageSize);

    String generarUrlDescarga(String carpetaId, String documentoId);

    void actualizarEstadoDocumento(
            String carpetaId, String documentoId, String nuevoEstado, String motivoRechazo);

    /**
     * Inicia el proceso de autenticación de un documento
     *
     * @param carpetaId ID de la carpeta
     * @param documentoId ID del documento
     * @return Documento con estado actualizado a EN_AUTENTICACION y URL de descarga
     */
    co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoConUrlResponse iniciarAutenticacionDocumento(String carpetaId, String documentoId);
}
