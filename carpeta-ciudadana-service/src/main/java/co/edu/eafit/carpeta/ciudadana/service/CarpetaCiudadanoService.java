package co.edu.eafit.carpeta.ciudadana.service;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentosCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.BuscarCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz del servicio para la gestión de carpetas ciudadanas
 * Define los contratos para las operaciones de negocio
 */
public interface CarpetaCiudadanoService {

    /**
     * Crea una carpeta ciudadana única
     * @param request DTO con los datos para crear la carpeta
     * @return La carpeta creada
     */
    CarpetaCiudadano crearCarpeta(CrearCarpetaRequest request);

    /**
     * Busca una carpeta por su ID
     * @param carpetaId El ID de la carpeta
     * @return Optional con la carpeta encontrada o vacío
     */
    Optional<CarpetaCiudadano> buscarCarpetaPorId(String carpetaId);

    /**
     * Busca una carpeta por la cédula del propietario
     * @param request DTO con la cédula para buscar
     * @return Optional con la carpeta encontrada o vacío
     */
    Optional<CarpetaCiudadano> buscarCarpetaPorCedula(BuscarCarpetaRequest request);

    /**
     * Sube un documento a una carpeta
     * @param request DTO con los datos del documento
     * @param archivo El archivo a subir
     * @return El documento creado
     */
    Documento subirDocumento(SubirDocumentoConArchivoRequest request, MultipartFile archivo);

    /**
     * Obtiene un documento por su ID
     * @param request DTO con los IDs de carpeta y documento
     * @return Optional con el documento encontrado o vacío
     */
    Optional<Documento> obtenerDocumento(ObtenerDocumentoRequest request);

    /**
     * Obtiene todos los documentos de una carpeta
     * @param request DTO con el ID de la carpeta
     * @return Lista de documentos de la carpeta
     */
    List<Documento> obtenerDocumentosCarpeta(ObtenerDocumentosCarpetaRequest request);
    
    /**
     * Genera una URL prefirmada para descargar un documento
     * @param carpetaId ID de la carpeta
     * @param documentoId ID del documento
     * @return URL temporal para descargar el documento
     */
    String generarUrlDescarga(String carpetaId, String documentoId);
}
