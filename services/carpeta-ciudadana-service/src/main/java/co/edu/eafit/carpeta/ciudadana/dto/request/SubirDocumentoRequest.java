package co.edu.eafit.carpeta.ciudadana.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubirDocumentoRequest(
    @NotBlank(message = "El título del documento es requerido")
    @Size(min = 2, max = 200, message = "El título debe tener entre 2 y 200 caracteres")
    String titulo,
    
    @NotBlank(message = "El tipo de documento es requerido")
    @Size(min = 2, max = 50, message = "El tipo de documento debe tener entre 2 y 50 caracteres")
    String tipoDocumento,
    
    @NotBlank(message = "El contexto del documento es requerido")
    @Size(min = 2, max = 50, message = "El contexto del documento debe tener entre 2 y 50 caracteres")
    String contextoDocumento,
    
    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    String descripcion
) {}
