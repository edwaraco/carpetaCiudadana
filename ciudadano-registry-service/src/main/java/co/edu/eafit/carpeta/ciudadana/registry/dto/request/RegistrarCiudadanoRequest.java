package co.edu.eafit.carpeta.ciudadana.registry.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistrarCiudadanoRequest {

    @NotNull(message = "La cédula es obligatoria")
    @Positive(message = "La cédula debe ser un número positivo")
    private Long cedula;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccion;

    @NotBlank(message = "El ID del operador es obligatorio")
    private String operadorId;

    @NotBlank(message = "El nombre del operador es obligatorio")
    private String operadorNombre;
}
