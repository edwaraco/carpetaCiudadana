package co.edu.eafit.carpeta.ciudadana.registry.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "carpeta-ciudadana-api", url = "${carpeta-ciudadana.api.base-url}")
public interface CarpetaCiudadanaClient {

  @PostMapping("/api/v1/carpetas")
  ResponseEntity<CarpetaCiudadanaApiResponse> crearCarpeta(
      @RequestBody CrearCarpetaRequest request);

  @GetMapping("/api/v1/carpetas/cedula/{cedula}")
  ResponseEntity<CarpetaCiudadanaApiResponse> buscarCarpetaPorCedula(
      @PathVariable("cedula") String cedula);
}
