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

public interface CarpetaCiudadanoService {

    CarpetaCiudadano crearCarpeta(CrearCarpetaRequest request);

    Optional<CarpetaCiudadano> buscarCarpetaPorId(String carpetaId);

    Optional<CarpetaCiudadano> buscarCarpetaPorCedula(BuscarCarpetaRequest request);

    Documento subirDocumento(SubirDocumentoConArchivoRequest request, MultipartFile archivo);

    Optional<Documento> obtenerDocumento(ObtenerDocumentoRequest request);

    List<Documento> obtenerDocumentosCarpeta(ObtenerDocumentosCarpetaRequest request);

    String generarUrlDescarga(String carpetaId, String documentoId);
}
