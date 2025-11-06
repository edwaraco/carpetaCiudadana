package co.edu.eafit.carpeta.ciudadana.service.impl;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentosCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.BuscarCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentoResponse;
import co.edu.eafit.carpeta.ciudadana.dto.response.DocumentosPaginadosResponse;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
import co.edu.eafit.carpeta.ciudadana.util.CursorUtil;
import co.edu.eafit.carpeta.ciudadana.util.ResponseUtil;
import co.edu.eafit.carpeta.ciudadana.entity.Documento;
import co.edu.eafit.carpeta.ciudadana.entity.HistorialAcceso;
import co.edu.eafit.carpeta.ciudadana.exception.CarpetaAlreadyExistsException;
import co.edu.eafit.carpeta.ciudadana.exception.DocumentUploadException;
import co.edu.eafit.carpeta.ciudadana.exception.ResourceNotFoundException;
import co.edu.eafit.carpeta.ciudadana.exception.StorageException;
import co.edu.eafit.carpeta.ciudadana.repository.CarpetaCiudadanoRepository;
import co.edu.eafit.carpeta.ciudadana.repository.DocumentoRepository;
import co.edu.eafit.carpeta.ciudadana.repository.HistorialAccesoRepository;
import co.edu.eafit.carpeta.ciudadana.mapper.carpeta.CarpetaMapper;
import co.edu.eafit.carpeta.ciudadana.mapper.document.CrearDocumentoMapper;
import co.edu.eafit.carpeta.ciudadana.service.CarpetaCiudadanoService;
import co.edu.eafit.carpeta.ciudadana.service.MinioStorageService;
import co.edu.eafit.carpeta.ciudadana.mapper.historial.HistorialAccesoMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class CarpetaCiudadanoServiceImpl implements CarpetaCiudadanoService {

    private final CarpetaCiudadanoRepository carpetaRepository;
    private final DocumentoRepository documentoRepository;
    private final HistorialAccesoRepository historialRepository;
    private final CarpetaMapper carpetaMapper;
    private final CrearDocumentoMapper crearDocumentoMapper;
    private final HistorialAccesoMapper historialAccesoMapper;
    private final MinioStorageService minioStorageService;

    public CarpetaCiudadanoServiceImpl(
            CarpetaCiudadanoRepository carpetaRepository,
            DocumentoRepository documentoRepository,
            HistorialAccesoRepository historialRepository,
            CarpetaMapper carpetaMapper,
            CrearDocumentoMapper crearDocumentoMapper,
            HistorialAccesoMapper historialAccesoMapper,
            MinioStorageService minioStorageService) {
        this.carpetaRepository = carpetaRepository;
        this.documentoRepository = documentoRepository;
        this.historialRepository = historialRepository;
        this.carpetaMapper = carpetaMapper;
        this.crearDocumentoMapper = crearDocumentoMapper;
        this.historialAccesoMapper = historialAccesoMapper;
        this.minioStorageService = minioStorageService;
    }

    @Override
    public CarpetaCiudadano crearCarpeta(CrearCarpetaRequest request) {
        log.info("Creando carpeta para ciudadano con cédula: {}", request.cedula());

        carpetaRepository.findByPropietarioCedula(request.cedula())
                .ifPresent(carpeta -> {
                    throw new CarpetaAlreadyExistsException(request.cedula());
                });

        CarpetaCiudadano carpeta = carpetaMapper.toEntity(request);

        return carpetaRepository.save(carpeta);
    }

    @Override
    public Optional<CarpetaCiudadano> buscarCarpetaPorId(String carpetaId) {
        return carpetaRepository.findById(carpetaId);
    }

    @Override
    public Optional<CarpetaCiudadano> buscarCarpetaPorCedula(BuscarCarpetaRequest request) {
        return carpetaRepository.findByPropietarioCedula(request.cedula());
    }

    @Override
    public Documento subirDocumento(SubirDocumentoConArchivoRequest request, MultipartFile archivo) {
        log.info("Subiendo documento a carpeta: {}", request.carpetaId());

        carpetaRepository.findById(request.carpetaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Carpeta", "carpetaId", request.carpetaId()));

        try {
            Documento documento = crearDocumentoMapper.toEntity(request, archivo);

            String hashDocumento = calcularHash(archivo.getBytes());
            documento.setHashDocumento(hashDocumento);

            CarpetaCiudadano carpeta = carpetaRepository.findById(request.carpetaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", request.carpetaId()));
            
            String userId = carpeta.getPropietarioCedula();
            String fileName = archivo.getOriginalFilename();

            minioStorageService.uploadFileForUser(userId, fileName, archivo, archivo.getContentType());

            String urlAlmacenamiento = String.format("%s/%s", userId, fileName);
            documento.setUrlAlmacenamiento(urlAlmacenamiento);

            documento = documentoRepository.save(documento);

            actualizarEspacioUtilizado(request.carpetaId(), archivo.getSize());

            HistorialAcceso acceso = historialAccesoMapper.crearAcceso(
                    request.carpetaId(), documento.getDocumentoId(), "SUBIDA", "SISTEMA",
                    "Documento subido exitosamente");
            historialRepository.save(acceso);

            log.info("Documento subido exitosamente: {}", documento.getDocumentoId());
            return documento;

        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error subiendo documento a carpeta {}: {}", request.carpetaId(), e.getMessage(), e);
            throw new DocumentUploadException(request.carpetaId(), e.getMessage(), e);
        }
    }

    @Override
    public Optional<Documento> obtenerDocumento(ObtenerDocumentoRequest request) {
        return documentoRepository.findById(request.carpetaId(), request.documentoId());
    }

    @Override
    public List<Documento> obtenerDocumentosCarpeta(ObtenerDocumentosCarpetaRequest request) {
        return documentoRepository.findByCarpetaId(request.carpetaId());
    }

    /**
     * Obtiene documentos de una carpeta con paginación cursor-based
     *
     * @param carpetaId ID de la carpeta
     * @param cursor Cursor de paginación (Base64 encoded), null para primera página
     * @param pageSize Número de documentos por página (default: 20)
     * @return Respuesta paginada con items, nextCursor y hasMore
     */
    @Override
    public DocumentosPaginadosResponse obtenerDocumentosPaginados(String carpetaId, String cursor, Integer pageSize) {
        log.info("Obteniendo documentos paginados para carpeta: {}, cursor: {}, pageSize: {}",
                 carpetaId, cursor, pageSize);

        int efectivePageSize = Optional.ofNullable(pageSize)
                .filter(size -> size > 0)
                .orElse(20);

        String lastDocumentoId = Optional.ofNullable(cursor)
                .map(CursorUtil::decodeCursor)
                .orElse(null);

        List<Documento> documentos = documentoRepository.findByCarpetaIdPaginated(
                carpetaId, lastDocumentoId, efectivePageSize);

        boolean hasMore = documentos.size() > efectivePageSize;

        List<DocumentoResponse> items = documentos.stream()
                .limit(efectivePageSize)
                .map(ResponseUtil::toDocumentoResponse)
                .toList();

        String nextCursor = Optional.of(documentos)
                .filter(docs -> hasMore)
                .map(docs -> docs.get(efectivePageSize - 1))
                .map(Documento::getDocumentoId)
                .map(CursorUtil::encodeCursor)
                .orElse(null);

        log.info("Documentos paginados obtenidos: {} items, hasMore: {}, nextCursor present: {}",
                 items.size(), hasMore, nextCursor != null);

        return hasMore
                ? DocumentosPaginadosResponse.withMore(items, nextCursor)
                : DocumentosPaginadosResponse.lastPage(items);
    }

    @Override
    public String generarUrlDescarga(String carpetaId, String documentoId) {
        log.info("Generando URL de descarga para documento: {} en carpeta: {}", documentoId, carpetaId);

        Documento documento = documentoRepository.findById(carpetaId, documentoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Documento", "documentoId", documentoId));

        if (!documento.getEsDescargable()) {
            throw new IllegalStateException("El documento no está disponible para descarga");
        }
        
        String[] urlParts = documento.getUrlAlmacenamiento().split("/", 2);
        String userId = urlParts[0];
        String fileName = urlParts[1];
        
        String urlDescarga = minioStorageService.generatePresignedUrlForUser(userId, fileName);

        HistorialAcceso acceso = historialAccesoMapper.crearAcceso(
                carpetaId, documentoId, "DESCARGA", "USUARIO", "URL de descarga generada");
        historialRepository.save(acceso);

        log.info("URL de descarga generada exitosamente para documento: {}", documentoId);
        return urlDescarga;
    }

    private String calcularHash(byte[] contenido) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(contenido);

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error calculando hash: {}", e.getMessage());
            throw new StorageException("Error calculando hash del documento", e);
        }
    }

    @Override
    public void actualizarEstadoDocumento(
            String carpetaId, String documentoId, String nuevoEstado, String motivoRechazo) {
        log.info(
                "Actualizando estado de documento: documentoId={}, carpetaId={}, nuevoEstado={}",
                documentoId,
                carpetaId,
                nuevoEstado);

        Documento documento =
                documentoRepository
                        .findById(carpetaId, documentoId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Documento", "documentoId", documentoId));

        documento.setEstadoDocumento(nuevoEstado);

        documentoRepository.save(documento);

        HistorialAcceso acceso =
                historialAccesoMapper.crearAcceso(
                        carpetaId,
                        documentoId,
                        "ACTUALIZACION_ESTADO",
                        "SISTEMA",
                        String.format("Estado actualizado a: %s", nuevoEstado));
        historialRepository.save(acceso);

        log.info("Estado del documento actualizado exitosamente: {}", documentoId);
    }


    private void actualizarEspacioUtilizado(String carpetaId, long cambioBytes) {
        CarpetaCiudadano carpeta = carpetaRepository.findById(carpetaId)
                .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId));

        carpeta.setEspacioUtilizadoBytes(carpeta.getEspacioUtilizadoBytes() + cambioBytes);
        carpeta.setFechaUltimaModificacion(LocalDateTime.now());
        carpetaRepository.save(carpeta);
    }
}