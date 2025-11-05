package co.edu.eafit.carpeta.ciudadana.service.impl;

import co.edu.eafit.carpeta.ciudadana.exception.StorageException;
import co.edu.eafit.carpeta.ciudadana.service.MinioStorageService;
import io.minio.*;
import io.minio.http.Method;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class MinioStorageServiceImpl implements MinioStorageService {

  private final MinioClient minioClient;

  @Value("${minio.bucket-name}")
  private String bucketName;

  @Value("${minio.presigned-url-expiry-minutes}")
  private int defaultExpiryMinutes;

  public MinioStorageServiceImpl(MinioClient minioClient) {
    this.minioClient = minioClient;
  }

  @Override
  public void uploadFile(String objectName, MultipartFile file, String contentType) {
    try {
      log.info("Subiendo archivo a MinIO: {}", objectName);

      minioClient.putObject(
          PutObjectArgs.builder().bucket(bucketName).object(objectName).stream(
                  new ByteArrayInputStream(file.getBytes()), file.getSize(), -1)
              .contentType(contentType)
              .build());

      log.info("Archivo subido exitosamente: {}", objectName);

    } catch (Exception e) {
      log.error("Error subiendo archivo a MinIO: {}", e.getMessage(), e);
      throw new StorageException("Error al subir archivo a MinIO: " + e.getMessage(), e);
    }
  }

  @Override
  public String generatePresignedUrl(String objectName) {
    return generatePresignedUrl(objectName, defaultExpiryMinutes);
  }

  @Override
  public String generatePresignedUrl(String objectName, int expiryMinutes) {
    try {
      log.info(
          "Generando URL prefirmada para: {} (expira en {} minutos)", objectName, expiryMinutes);

      String url =
          minioClient.getPresignedObjectUrl(
              GetPresignedObjectUrlArgs.builder()
                  .bucket(bucketName)
                  .object(objectName)
                  .method(Method.GET)
                  .expiry(expiryMinutes, TimeUnit.MINUTES)
                  .build());

      log.info("URL prefirmada generada exitosamente");
      return url;

    } catch (Exception e) {
      log.error("Error generando URL prefirmada: {}", e.getMessage(), e);
      throw new StorageException("Error al generar URL de descarga: " + e.getMessage(), e);
    }
  }

  @Override
  public InputStream getFileAsStream(String objectName) {
    try {
      log.info("Obteniendo archivo como stream: {}", objectName);

      return minioClient.getObject(
          GetObjectArgs.builder().bucket(bucketName).object(objectName).build());

    } catch (Exception e) {
      log.error("Error obteniendo archivo de MinIO: {}", e.getMessage(), e);
      throw new StorageException("Error al obtener archivo: " + e.getMessage(), e);
    }
  }

  @Override
  public void deleteFile(String objectName) {
    try {
      log.info("Eliminando archivo de MinIO: {}", objectName);

      minioClient.removeObject(
          RemoveObjectArgs.builder().bucket(bucketName).object(objectName).build());

      log.info("Archivo eliminado exitosamente: {}", objectName);

    } catch (Exception e) {
      log.error("Error eliminando archivo de MinIO: {}", e.getMessage(), e);
      throw new StorageException("Error al eliminar archivo: " + e.getMessage(), e);
    }
  }

  @Override
  public boolean fileExists(String objectName) {
    try {
      minioClient.statObject(
          StatObjectArgs.builder().bucket(bucketName).object(objectName).build());
      return true;

    } catch (Exception e) {
      log.debug("Archivo no existe: {}", objectName);
      return false;
    }
  }

  @Override
  public void uploadFileForUser(
      String userId, String fileName, MultipartFile file, String contentType) {
    String objectName = String.format("%s/%s", userId, fileName);
    uploadFile(objectName, file, contentType);
  }

  @Override
  public String generatePresignedUrlForUser(String userId, String fileName) {
    String objectName = String.format("%s/%s", userId, fileName);
    return generatePresignedUrl(objectName);
  }

  @Override
  public String generatePresignedUrlForUser(String userId, String fileName, int expiryMinutes) {
    String objectName = String.format("%s/%s", userId, fileName);
    return generatePresignedUrl(objectName, expiryMinutes);
  }

  @Override
  public InputStream getFileAsStreamForUser(String userId, String fileName) {
    String objectName = String.format("%s/%s", userId, fileName);
    return getFileAsStream(objectName);
  }

  @Override
  public void deleteFileForUser(String userId, String fileName) {
    String objectName = String.format("%s/%s", userId, fileName);
    deleteFile(objectName);
  }

  @Override
  public boolean fileExistsForUser(String userId, String fileName) {
    String objectName = String.format("%s/%s", userId, fileName);
    return fileExists(objectName);
  }
}
