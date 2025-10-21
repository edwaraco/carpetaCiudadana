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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación del servicio principal para la gestión de carpetas ciudadanas
 * Implementa solo las 4 funcionalidades básicas requeridas:
 * 1. Crear carpetas ciudadanas únicas
 * 2. Almacenar documentos (firmados o no)
 * 3. Ver mis documentos
 * 4. Integración con microservicio de firma digital
 */
@Slf4j
@Service
public class CarpetaCiudadanoServiceImpl implements CarpetaCiudadanoService {

    @Autowired
    private CarpetaCiudadanoRepository carpetaRepository;

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private HistorialAccesoRepository historialRepository;

    @Autowired
    private CarpetaMapper carpetaMapper;

    @Autowired
    private CrearDocumentoMapper crearDocumentoMapper;

    @Autowired
    private HistorialAccesoMapper historialAccesoMapper;

    @Autowired
    private MinioStorageService minioStorageService;

    /**
     * 1. Crear carpeta ciudadana única
     */
    @Override
    public CarpetaCiudadano crearCarpeta(CrearCarpetaRequest request) {
        log.info("Creando carpeta para ciudadano con cédula: {}", request.cedula());

        // Verificar que no exista ya una carpeta para esta cédula
        carpetaRepository.findByPropietarioCedula(request.cedula())
                .ifPresent(carpeta -> {
                    throw new CarpetaAlreadyExistsException(request.cedula());
                });

        // Usar mapper para crear la entidad
        CarpetaCiudadano carpeta = carpetaMapper.toEntity(request);

        return carpetaRepository.save(carpeta);
    }

    /**
     * Buscar carpeta por ID
     */
    @Override
    public Optional<CarpetaCiudadano> buscarCarpetaPorId(String carpetaId) {
        return carpetaRepository.findById(carpetaId);
    }

    /**
     * Buscar carpeta por cédula del propietario
     */
    @Override
    public Optional<CarpetaCiudadano> buscarCarpetaPorCedula(BuscarCarpetaRequest request) {
        return carpetaRepository.findByPropietarioCedula(request.cedula());
    }

    /**
     * 2. Almacenar documentos (firmados o no)
     */
    @Override
    public Documento subirDocumento(SubirDocumentoConArchivoRequest request, MultipartFile archivo) {
        log.info("Subiendo documento a carpeta: {}", request.carpetaId());

        // Verificar que la carpeta existe
        carpetaRepository.findById(request.carpetaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Carpeta", "carpetaId", request.carpetaId()));

        try {
            // Usar mapper para crear la entidad documento PRIMERO (genera el documentoId)
            Documento documento = crearDocumentoMapper.toEntity(request, archivo);
            
            // Calcular hash del archivo
            String hashDocumento = calcularHash(archivo.getBytes());
            documento.setHashDocumento(hashDocumento);

            // Subir archivo a MinIO usando el documentoId generado
            String objectName = String.format("%s/%s/%s", 
                    request.carpetaId(), 
                    documento.getDocumentoId(), // Usar el documentoId del mapper
                    archivo.getOriginalFilename());
            
            // Usar servicio de MinIO para subir archivo
            minioStorageService.uploadFile(objectName, archivo, archivo.getContentType());

            // Asignar URL de almacenamiento
            documento.setUrlAlmacenamiento(objectName);

            // Guardar metadatos en DynamoDB
            documento = documentoRepository.save(documento);

            // Actualizar espacio utilizado en la carpeta
            actualizarEspacioUtilizado(request.carpetaId(), archivo.getSize());

            // Registrar acceso usando mapper
            HistorialAcceso acceso = historialAccesoMapper.crearAcceso(
                    request.carpetaId(), documento.getDocumentoId(), "SUBIDA", "SISTEMA", "Documento subido exitosamente");
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

    /**
     * Obtener documento por ID
     */
    @Override
    public Optional<Documento> obtenerDocumento(ObtenerDocumentoRequest request) {
        return documentoRepository.findById(request.carpetaId(), request.documentoId());
    }

    /**
     * 3. Ver mis documentos - Obtener todos los documentos de una carpeta
     */
    @Override
    public List<Documento> obtenerDocumentosCarpeta(ObtenerDocumentosCarpetaRequest request) {
        return documentoRepository.findByCarpetaId(request.carpetaId());
    }

    /**
     * Genera URL prefirmada para descargar un documento
     */
    @Override
    public String generarUrlDescarga(String carpetaId, String documentoId) {
        log.info("Generando URL de descarga para documento: {} en carpeta: {}", documentoId, carpetaId);
        
        // Verificar que el documento existe
        Documento documento = documentoRepository.findById(carpetaId, documentoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Documento", "documentoId", documentoId));
        
        // Verificar que el documento es descargable
        if (!documento.getEsDescargable()) {
            throw new IllegalStateException("El documento no está disponible para descarga");
        }
        
        // Generar URL prefirmada usando el servicio de MinIO
        String urlDescarga = minioStorageService.generatePresignedUrl(documento.getUrlAlmacenamiento());
        
        // Registrar acceso en historial
        HistorialAcceso acceso = historialAccesoMapper.crearAcceso(
                carpetaId, documentoId, "DESCARGA", "USUARIO", "URL de descarga generada");
        historialRepository.save(acceso);
        
        log.info("URL de descarga generada exitosamente para documento: {}", documentoId);
        return urlDescarga;
    }

    /**
     * Calcula hash SHA-256 del contenido del archivo
     */
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

    /**
     * Actualiza el espacio utilizado en la carpeta
     */
    private void actualizarEspacioUtilizado(String carpetaId, long cambioBytes) {
        CarpetaCiudadano carpeta = carpetaRepository.findById(carpetaId)
                .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId));

        carpeta.setEspacioUtilizadoBytes(carpeta.getEspacioUtilizadoBytes() + cambioBytes);
        carpeta.setFechaUltimaModificacion(LocalDateTime.now());
        carpetaRepository.save(carpeta);
    }
}