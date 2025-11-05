package co.edu.eafit.carpeta.ciudadana.registry.exception;

public class InvalidRequestException extends RuntimeException {

  private final String field;

  public InvalidRequestException(String message) {
    super(message);
    this.field = null;
  }

  public InvalidRequestException(String message, String field) {
    super(message);
    this.field = field;
  }

  public String getField() {
    return field;
  }
}
