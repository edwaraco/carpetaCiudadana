package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearCarpetaRequest(
    @NotBlank(message = "La cédula es requerida")
        @Pattern(regexp = "^[0-9]{6,12}$", message = "La cédula debe contener entre 6 y 12 dígitos")
        String cedula,
    @NotBlank(message = "El nombre completo es requerido")
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        String nombreCompleto,
    @NotBlank(message = "El operador actual es requerido")
        @Size(min = 2, max = 50, message = "El operador debe tener entre 2 y 50 caracteres")
        String operadorActual,
    @NotBlank(message = "El email de la carpeta es requerido")
        @Email(message = "El email debe tener un formato válido")
        String emailCarpeta) {}
