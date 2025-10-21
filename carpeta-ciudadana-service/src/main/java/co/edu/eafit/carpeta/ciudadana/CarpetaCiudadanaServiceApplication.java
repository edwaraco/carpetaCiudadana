package co.edu.eafit.carpeta.ciudadana;

import co.edu.eafit.carpeta.ciudadana.client.DigitalSignatureClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Aplicación principal del microservicio Carpeta Ciudadana
 * 
 * Este microservicio implementa el Core Domain "Carpeta Personal" del sistema
 * Carpeta Ciudadana, gestionando el repositorio virtual personal de cada ciudadano
 * donde almacenan documentos certificados y no certificados.
 * 
 * Funcionalidades principales:
 * - Crear carpetas ciudadanas únicas
 * - Almacenar documentos certificados sin límite de tamaño
 * - Gestionar documentos temporales (no certificados)
 * - Proporcionar acceso seguro a documentos propios
 * - Permitir compartir documentos con terceros previa autorización
 * - Mantener historial completo de accesos y modificaciones
 * - Generar direcciones de correo permanentes e inmutables
 * - Integración con microservicio de firma digital
 * 
 * Arquitectura:
 * - Persistencia de metadatos en DynamoDB Local
 * - Almacenamiento de archivos en MinIO (S3-compatible)
 * - Comunicación con microservicio de firma digital vía Feign
 * - Arquitectura por capas tradicional (Controller -> Service -> Repository -> Entity)
 */
@SpringBootApplication
@EnableFeignClients(clients = {DigitalSignatureClient.class})
public class CarpetaCiudadanaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarpetaCiudadanaServiceApplication.class, args);
    }
}
