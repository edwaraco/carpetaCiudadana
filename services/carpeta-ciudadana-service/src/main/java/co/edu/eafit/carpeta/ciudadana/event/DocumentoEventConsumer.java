package co.edu.eafit.carpeta.ciudadana.event;

import co.edu.eafit.carpeta.ciudadana.service.CarpetaCiudadanoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentoEventConsumer {

  private final CarpetaCiudadanoService carpetaCiudadanoService;

  @RabbitListener(queues = "documento.autenticado.queue")
  public void consumirDocumentoAutenticado(DocumentoAutenticadoEvent event) {
    try {
      log.info(
          "Recibido evento de documento autenticado: documentoId={}, carpetaId={}, statusCode={}",
          event.getDocumentoId(),
          event.getCarpetaId(),
          event.getStatusCode());

      // Determinar estado basado en el código HTTP
      String nuevoEstado = (event.getStatusCode() >= 200 && event.getStatusCode() < 300) 
          ? "AUTENTICADO" 
          : "RECHAZADO";

      carpetaCiudadanoService.actualizarEstadoDocumento(
          event.getCarpetaId(), event.getDocumentoId(), nuevoEstado, event.getMensaje());

      log.info(
          "Estado del documento actualizado exitosamente: documentoId={}, nuevoEstado={}, mensaje={}",
          event.getDocumentoId(),
          nuevoEstado,
          event.getMensaje());

    } catch (Exception e) {
      log.error(
          "Error procesando evento de documento autenticado: documentoId={}, error={}",
          event.getDocumentoId(),
          e.getMessage(),
          e);
    }
  }
}
