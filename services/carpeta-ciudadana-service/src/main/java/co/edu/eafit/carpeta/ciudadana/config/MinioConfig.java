package co.edu.eafit.carpeta.ciudadana.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.external-endpoint}")
    private String externalEndpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    /**
     * MinIO client for internal operations (upload, read, delete)
     * Uses internal endpoint: http://minio:9000
     */
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    /**
     * MinIO client for generating presigned URLs accessible from browser
     * Uses external endpoint: http://localhost:9000 (via port-forward)
     */
    @Bean(name = "minioExternalClient")
    public MinioClient minioExternalClient() {
        return MinioClient.builder()
                .endpoint(externalEndpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
