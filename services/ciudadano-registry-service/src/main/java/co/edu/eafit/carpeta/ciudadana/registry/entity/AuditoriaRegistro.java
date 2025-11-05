package co.edu.eafit.carpeta.ciudadana.registry.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaRegistro {

  private String pk; // CIUDADANO#{cedula}
  private String sk; // AUDITORIA#{fecha}#{uuid}
  private Long cedulaCiudadano;
  private AccionAuditoria accion;
  private String operadorId;
  private String operadorNombre;
  private String resultado;
  private Integer codigoRespuesta;
  private String mensajeRespuesta;
  private String detallesAdicionales;
  private String ipOrigen;
  private String userAgent;
  private LocalDateTime fechaAccion;

  @DynamoDbPartitionKey
  @DynamoDbAttribute("PK")
  public String getPk() {
    return pk;
  }

  public void setPk(String pk) {
    this.pk = pk;
  }

  @DynamoDbSortKey
  @DynamoDbAttribute("SK")
  public String getSk() {
    return sk;
  }

  public void setSk(String sk) {
    this.sk = sk;
  }

  @DynamoDbAttribute("cedulaCiudadano")
  public Long getCedulaCiudadano() {
    return cedulaCiudadano;
  }

  public void setCedulaCiudadano(Long cedulaCiudadano) {
    this.cedulaCiudadano = cedulaCiudadano;
  }

  @DynamoDbAttribute("accion")
  public AccionAuditoria getAccion() {
    return accion;
  }

  public void setAccion(AccionAuditoria accion) {
    this.accion = accion;
  }

  @DynamoDbAttribute("operadorId")
  public String getOperadorId() {
    return operadorId;
  }

  public void setOperadorId(String operadorId) {
    this.operadorId = operadorId;
  }

  @DynamoDbAttribute("operadorNombre")
  public String getOperadorNombre() {
    return operadorNombre;
  }

  public void setOperadorNombre(String operadorNombre) {
    this.operadorNombre = operadorNombre;
  }

  @DynamoDbAttribute("resultado")
  public String getResultado() {
    return resultado;
  }

  public void setResultado(String resultado) {
    this.resultado = resultado;
  }

  @DynamoDbAttribute("codigoRespuesta")
  public Integer getCodigoRespuesta() {
    return codigoRespuesta;
  }

  public void setCodigoRespuesta(Integer codigoRespuesta) {
    this.codigoRespuesta = codigoRespuesta;
  }

  @DynamoDbAttribute("mensajeRespuesta")
  public String getMensajeRespuesta() {
    return mensajeRespuesta;
  }

  public void setMensajeRespuesta(String mensajeRespuesta) {
    this.mensajeRespuesta = mensajeRespuesta;
  }

  @DynamoDbAttribute("detallesAdicionales")
  public String getDetallesAdicionales() {
    return detallesAdicionales;
  }

  public void setDetallesAdicionales(String detallesAdicionales) {
    this.detallesAdicionales = detallesAdicionales;
  }

  @DynamoDbAttribute("ipOrigen")
  public String getIpOrigen() {
    return ipOrigen;
  }

  public void setIpOrigen(String ipOrigen) {
    this.ipOrigen = ipOrigen;
  }

  @DynamoDbAttribute("userAgent")
  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  @DynamoDbAttribute("fechaAccion")
  public LocalDateTime getFechaAccion() {
    return fechaAccion;
  }

  public void setFechaAccion(LocalDateTime fechaAccion) {
    this.fechaAccion = fechaAccion;
  }

  public enum AccionAuditoria {
    VALIDACION_CIUDADANO,
    REGISTRO_CIUDADANO,
    DESREGISTRO_CIUDADANO,
    CREACION_CARPETA,
    ERROR_VALIDACION,
    ERROR_REGISTRO,
    ERROR_DESREGISTRO
  }
}
