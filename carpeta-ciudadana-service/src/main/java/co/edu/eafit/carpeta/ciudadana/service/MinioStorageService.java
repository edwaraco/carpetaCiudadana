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
}
