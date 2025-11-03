package co.edu.eafit.carpeta.ciudadana.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface MinioStorageService {

    void uploadFile(String objectName, MultipartFile file, String contentType);

    String generatePresignedUrl(String objectName);

    String generatePresignedUrl(String objectName, int expiryMinutes);

    InputStream getFileAsStream(String objectName);

    void deleteFile(String objectName);

    boolean fileExists(String objectName);

    // Métodos específicos para manejo de archivos por usuario
    void uploadFileForUser(String userId, String fileName, MultipartFile file, String contentType);

    String generatePresignedUrlForUser(String userId, String fileName);

    String generatePresignedUrlForUser(String userId, String fileName, int expiryMinutes);

    InputStream getFileAsStreamForUser(String userId, String fileName);

    void deleteFileForUser(String userId, String fileName);

    boolean fileExistsForUser(String userId, String fileName);
}
