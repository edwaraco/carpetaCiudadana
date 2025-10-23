package co.edu.eafit.carpeta.ciudadana.exception;

public class CarpetaAlreadyExistsException extends RuntimeException {
    
    private final String cedula;

    public CarpetaAlreadyExistsException(String cedula) {
        super(String.format("Ya existe una carpeta para el ciudadano con cédula: %s", cedula));
        this.cedula = cedula;
    }

    public String getCedula() {
        return cedula;
    }
}

