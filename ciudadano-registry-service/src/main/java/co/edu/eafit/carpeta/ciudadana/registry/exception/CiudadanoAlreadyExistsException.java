package co.edu.eafit.carpeta.ciudadana.registry.exception;

public class CiudadanoAlreadyExistsException extends RuntimeException {
    
    private final Long cedula;
    
    public CiudadanoAlreadyExistsException(Long cedula) {
        super(String.format("Ya existe un ciudadano registrado con cédula: %d", cedula));
        this.cedula = cedula;
    }
    
    public Long getCedula() {
        return cedula;
    }
}
