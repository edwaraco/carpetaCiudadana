package co.edu.eafit.carpeta.ciudadana.client;

import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Decodificador de errores personalizado para el cliente Feign
 */
@Slf4j
public class DigitalSignatureErrorDecoder implements ErrorDecoder {

    private final ErrorDecoder defaultErrorDecoder = new Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        log.error("Error en llamada a microservicio de firma digital: {} - Status: {}", 
                methodKey, response.status());

        switch (response.status()) {
            case 400:
                return new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Solicitud inválida al servicio de firma digital");
            case 404:
                return new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Servicio de firma digital no encontrado");
            case 500:
                return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                        "Error interno en el servicio de firma digital");
            case 503:
                return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                        "Servicio de firma digital no disponible");
            default:
                return defaultErrorDecoder.decode(methodKey, response);
        }
    }
}
