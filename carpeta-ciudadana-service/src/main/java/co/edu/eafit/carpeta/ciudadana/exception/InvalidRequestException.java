package co.edu.eafit.carpeta.ciudadana.exception;

/**
 * Excepción lanzada cuando los datos de una petición son inválidos
 */
public class InvalidRequestException extends RuntimeException {
    
    private final String field;

    public InvalidRequestException(String message) {
        super(message);
        this.field = null;
    }

    public InvalidRequestException(String field, String message) {
        super(String.format("Campo '%s' inválido: %s", field, message));
        this.field = field;
    }

    public String getField() {
        return field;
    }
}

