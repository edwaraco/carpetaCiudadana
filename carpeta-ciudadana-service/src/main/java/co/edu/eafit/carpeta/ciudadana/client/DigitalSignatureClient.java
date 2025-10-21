package co.edu.eafit.carpeta.ciudadana.client;

import co.edu.eafit.carpeta.ciudadana.dto.request.FirmaDigitalRequest;
import co.edu.eafit.carpeta.ciudadana.dto.response.FirmaDigitalResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Cliente Feign para comunicación con el microservicio de autenticación/firma digital
 * Este microservicio implementa la funcionalidad FR-AF-01 usando la API de MinTIC
 */
@FeignClient(
    name = "digital-signature-service",
    url = "${digital-signature.service.url:http://localhost:8081}",
    configuration = DigitalSignatureClientConfig.class
)
public interface DigitalSignatureClient {

    /**
     * Solicita la autenticación/firma digital de un documento
     * Implementa FR-AF-01 usando /apis/authenticateDocument de MinTIC
     */
    @PostMapping("/api/v1/authenticate")
    FirmaDigitalResponse autenticarDocumento(@RequestBody FirmaDigitalRequest request);
}
