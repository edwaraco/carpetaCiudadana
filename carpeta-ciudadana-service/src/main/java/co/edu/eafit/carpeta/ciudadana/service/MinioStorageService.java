package co.edu.eafit.carpeta.ciudadana.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Servicio para gestión de almacenamiento en MinIO
 */
public interface MinioStorageService {
    
    /**
     * Subir un archivo a MinIO
     * @param objectName Ruta completa del objeto (ej: carpetaId/documentoId/archivo.pdf)
     * @param file Archivo a subir
     * @param contentType Tipo de contenido
     */
    void uploadFile(String objectName, MultipartFile file, String contentType);
    
    /**
     * Generar URL prefirmada para descargar un archivo
     * @param objectName Ruta completa del objeto
     * @return URL temporal para descarga
     */
    String generatePresignedUrl(String objectName);
    
    /**
     * Generar URL prefirmada con tiempo de expiración personalizado
     * @param objectName Ruta completa del objeto
     * @param expiryMinutes Minutos hasta que expire la URL
     * @return URL temporal para descarga
     */
    String generatePresignedUrl(String objectName, int expiryMinutes);
    
    /**
     * Obtener un archivo como stream
     * @param objectName Ruta completa del objeto
     * @return InputStream del archivo
     */
    InputStream getFileAsStream(String objectName);
    
    /**
     * Eliminar un archivo de MinIO
     * @param objectName Ruta completa del objeto
     */
    void deleteFile(String objectName);
    
    /**
     * Verificar si un archivo existe
     * @param objectName Ruta completa del objeto
     * @return true si existe, false si no
     */
    boolean fileExists(String objectName);
}

