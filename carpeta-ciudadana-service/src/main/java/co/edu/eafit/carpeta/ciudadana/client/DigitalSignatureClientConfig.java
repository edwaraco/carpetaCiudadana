package co.edu.eafit.carpeta.ciudadana.client;

import feign.Logger;
import feign.Request;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Configuración para el cliente Feign de firma digital
 */
@Configuration
public class DigitalSignatureClientConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
                10, TimeUnit.SECONDS,  // connect timeout
                30, TimeUnit.SECONDS,  // read timeout
                true                   // follow redirects
        );
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new DigitalSignatureErrorDecoder();
    }
}
