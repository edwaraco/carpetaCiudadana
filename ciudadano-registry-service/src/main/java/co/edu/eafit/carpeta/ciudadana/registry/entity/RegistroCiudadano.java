package co.edu.eafit.carpeta.ciudadana.registry.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;

import java.time.LocalDateTime;
import java.util.UUID;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroCiudadano {

    private Long cedula; // PK: cédula del ciudadano
    private String sk; // SK: Constante "#" para compatibilidad con tabla existente
    private String nombreCompleto;
    private String direccion;
    private String email;
    private String carpetaId;
    private EstadoRegistro estado;
    private LocalDateTime fechaRegistroGovCarpeta;
    private LocalDateTime fechaDesregistro;
    private String motivoDesregistro;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    @Builder.Default
    private Boolean activo = true;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("cedula")
    public Long getCedula() {
        return cedula;
    }

    public void setCedula(Long cedula) {
        this.cedula = cedula;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() {
        return sk;
    }

    public void setSk(String sk) {
        this.sk = sk;
    }

    @DynamoDbAttribute("nombreCompleto")
    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    @DynamoDbAttribute("direccion")
    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    @DynamoDbAttribute("email")
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @DynamoDbAttribute("carpetaId")
    public String getCarpetaId() {
        return carpetaId;
    }

    public void setCarpetaId(String carpetaId) {
        this.carpetaId = carpetaId;
    }

    @DynamoDbAttribute("estado")
    public EstadoRegistro getEstado() {
        return estado;
    }

    public void setEstado(EstadoRegistro estado) {
        this.estado = estado;
    }

    @DynamoDbAttribute("fechaRegistroGovCarpeta")
    public LocalDateTime getFechaRegistroGovCarpeta() {
        return fechaRegistroGovCarpeta;
    }

    public void setFechaRegistroGovCarpeta(LocalDateTime fechaRegistroGovCarpeta) {
        this.fechaRegistroGovCarpeta = fechaRegistroGovCarpeta;
    }

    @DynamoDbAttribute("fechaDesregistro")
    public LocalDateTime getFechaDesregistro() {
        return fechaDesregistro;
    }

    public void setFechaDesregistro(LocalDateTime fechaDesregistro) {
        this.fechaDesregistro = fechaDesregistro;
    }

    @DynamoDbAttribute("motivoDesregistro")
    public String getMotivoDesregistro() {
        return motivoDesregistro;
    }

    public void setMotivoDesregistro(String motivoDesregistro) {
        this.motivoDesregistro = motivoDesregistro;
    }

    @DynamoDbAttribute("fechaCreacion")
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    @DynamoDbAttribute("fechaActualizacion")
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    @DynamoDbAttribute("activo")
    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public enum EstadoRegistro {
        PENDIENTE_VALIDACION,
        REGISTRADO,
        DESREGISTRADO,
        ERROR_VALIDACION,
        ERROR_REGISTRO
    }
}
