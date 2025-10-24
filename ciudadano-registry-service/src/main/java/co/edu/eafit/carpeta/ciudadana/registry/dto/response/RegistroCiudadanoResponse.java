package co.edu.eafit.carpeta.ciudadana.registry.dto.response;

import co.edu.eafit.carpeta.ciudadana.registry.entity.RegistroCiudadano;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RegistroCiudadanoResponse {

    private UUID id;
    private Long cedula;
    private String nombreCompleto;
    private String direccion;
    private String email;
    private String operadorId;
    private String operadorNombre;
    private UUID carpetaId;
    private RegistroCiudadano.EstadoRegistro estado;
    private LocalDateTime fechaRegistroGovCarpeta;
    private LocalDateTime fechaCreacion;
    private Boolean activo;
}
