package co.edu.eafit.carpeta.ciudadana.config;

import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MinioInitializer implements CommandLineRunner {

  @Autowired private MinioClient minioClient;

  @Value("${minio.bucket-name}")
  private String bucketName;

  @Override
  public void run(String... args) throws Exception {
    log.info("Inicializando bucket MinIO: {}", bucketName);

    try {
      boolean bucketExists =
          minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());

      if (!bucketExists) {
        minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
        log.info("Bucket {} creado exitosamente como PRIVADO", bucketName);
        log.info("Los objetos solo serán accesibles mediante URLs prefirmadas");
      } else {
        log.info("Bucket {} ya existe", bucketName);
      }

      try {
        String policy =
            minioClient.getBucketPolicy(GetBucketPolicyArgs.builder().bucket(bucketName).build());
        if (policy != null && !policy.isEmpty()) {
          log.warn(
              "ADVERTENCIA: El bucket {} tiene una política configurada. "
                  + "Asegúrese de que sea privado.",
              bucketName);
        } else {
          log.info("Bucket {} configurado como PRIVADO correctamente", bucketName);
        }
      } catch (Exception e) {
        log.info("Bucket {} es PRIVADO (sin política pública)", bucketName);
      }

    } catch (Exception e) {
      log.error("Error inicializando bucket MinIO: {}", e.getMessage());
      throw new RuntimeException("Error inicializando MinIO", e);
    }

    log.info("Inicialización de MinIO completada");
  }
}
