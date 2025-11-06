package co.edu.eafit.carpeta.ciudadana.exception;

public class DocumentUploadException extends RuntimeException {
    
    private final String carpetaId;

    public DocumentUploadException(String carpetaId, String message, Throwable cause) {
        super(String.format("Error subiendo documento a carpeta %s: %s", carpetaId, message), cause);
        this.carpetaId = carpetaId;
    }

    public DocumentUploadException(String carpetaId, String message) {
        super(String.format("Error subiendo documento a carpeta %s: %s", carpetaId, message));
        this.carpetaId = carpetaId;
    }

    public String getCarpetaId() {
        return carpetaId;
    }
}

