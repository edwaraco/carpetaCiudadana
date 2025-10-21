package co.edu.eafit.carpeta.ciudadana.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

/**
 * Configuración para DynamoDB Local
 */
@Configuration
public class DynamoDbConfig {

    @Value("${spring.cloud.aws.dynamodb.endpoint}")
    private String dynamoDbEndpoint;

    @Value("${spring.cloud.aws.dynamodb.region}")
    private String region;

    @Value("${spring.cloud.aws.dynamodb.credentials.access-key}")
    private String accessKey;

    @Value("${spring.cloud.aws.dynamodb.credentials.secret-key}")
    private String secretKey;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder()
                .endpointOverride(URI.create(dynamoDbEndpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
