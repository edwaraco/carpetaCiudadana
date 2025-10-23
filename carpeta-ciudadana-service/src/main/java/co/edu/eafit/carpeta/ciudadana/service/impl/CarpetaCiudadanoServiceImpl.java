package co.edu.eafit.carpeta.ciudadana.service.impl;

import co.edu.eafit.carpeta.ciudadana.dto.request.CrearCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.SubirDocumentoConArchivoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentoRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.ObtenerDocumentosCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.dto.request.BuscarCarpetaRequest;
import co.edu.eafit.carpeta.ciudadana.entity.CarpetaCiudadano;
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

            String objectName = String.format("%s/%s/%s",
                    request.carpetaId(),
                    documento.getDocumentoId(),
                    archivo.getOriginalFilename());

            minioStorageService.uploadFile(objectName, archivo, archivo.getContentType());

            documento.setUrlAlmacenamiento(objectName);

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

    @Override
    public String generarUrlDescarga(String carpetaId, String documentoId) {
        log.info("Generando URL de descarga para documento: {} en carpeta: {}", documentoId, carpetaId);

        Documento documento = documentoRepository.findById(carpetaId, documentoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Documento", "documentoId", documentoId));

        if (!documento.getEsDescargable()) {
            throw new IllegalStateException("El documento no está disponible para descarga");
        }

        String urlDescarga = minioStorageService.generatePresignedUrl(documento.getUrlAlmacenamiento());

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

    private void actualizarEspacioUtilizado(String carpetaId, long cambioBytes) {
        CarpetaCiudadano carpeta = carpetaRepository.findById(carpetaId)
                .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId));

        carpeta.setEspacioUtilizadoBytes(carpeta.getEspacioUtilizadoBytes() + cambioBytes);
        carpeta.setFechaUltimaModificacion(LocalDateTime.now());
        carpetaRepository.save(carpeta);
    }
}