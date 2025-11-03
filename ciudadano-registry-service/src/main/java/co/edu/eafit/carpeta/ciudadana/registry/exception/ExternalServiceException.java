package co.edu.eafit.carpeta.ciudadana.registry.exception;

public class ExternalServiceException extends RuntimeException {

  private final String serviceName;
  private final Integer statusCode;

  public ExternalServiceException(String serviceName, String message) {
    super(String.format("Error en servicio %s: %s", serviceName, message));
    this.serviceName = serviceName;
    this.statusCode = null;
  }

  public ExternalServiceException(String serviceName, String message, Integer statusCode) {
    super(String.format("Error en servicio %s: %s", serviceName, message));
    this.serviceName = serviceName;
    this.statusCode = statusCode;
  }

  public String getServiceName() {
    return serviceName;
  }

  public Integer getStatusCode() {
    return statusCode;
  }
}
