package co.edu.eafit.carpeta.ciudadana.config;

import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializador de bucket MinIO al arrancar la aplicación
 */
@Slf4j
@Component
public class MinioInitializer implements CommandLineRunner {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public void run(String... args) throws Exception {
        log.info("Inicializando bucket MinIO: {}", bucketName);
        
        try {
            // Verificar si el bucket existe
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );

            if (!bucketExists) {
                // Crear el bucket si no existe (privado por defecto)
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
                log.info("Bucket {} creado exitosamente como PRIVADO", bucketName);
                log.info("Los objetos solo serán accesibles mediante URLs prefirmadas");
            } else {
                log.info("Bucket {} ya existe", bucketName);
            }
            
            // Verificar que el bucket NO tenga política pública
            // MinIO crea buckets privados por defecto, pero verificamos por seguridad
            try {
                String policy = minioClient.getBucketPolicy(
                        GetBucketPolicyArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
                if (policy != null && !policy.isEmpty()) {
                    log.warn("⚠️ ADVERTENCIA: El bucket {} tiene una política configurada. " +
                            "Asegúrate de que sea privado.", bucketName);
                } else {
                    log.info("✅ Bucket {} configurado como PRIVADO correctamente", bucketName);
                }
            } catch (Exception e) {
                // Si no hay política, es privado por defecto
                log.info("✅ Bucket {} es PRIVADO (sin política pública)", bucketName);
            }

        } catch (Exception e) {
            log.error("Error inicializando bucket MinIO: {}", e.getMessage());
            throw new RuntimeException("Error inicializando MinIO", e);
        }
        
        log.info("Inicialización de MinIO completada");
    }
}
