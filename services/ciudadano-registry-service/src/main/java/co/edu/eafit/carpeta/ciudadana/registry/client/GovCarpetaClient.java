package co.edu.eafit.carpeta.ciudadana.registry.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "govcarpeta-api", url = "${govcarpeta.api.base-url}")
public interface GovCarpetaClient {

  @GetMapping("/apis/validateCitizen/{id}")
  ResponseEntity<String> validarCiudadano(@PathVariable("id") Long cedula);

  @PostMapping("/apis/registerCitizen")
  ResponseEntity<String> registrarCiudadano(@RequestBody GovCarpetaRegisterRequest request);

  @DeleteMapping("/apis/unregisterCitizen")
  ResponseEntity<String> desregistrarCiudadano(@RequestBody GovCarpetaUnregisterRequest request);
}
