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
          "Recibido evento de documento autenticado: documentoId={}, carpetaId={}, autenticado={}",
          event.getDocumentoId(),
          event.getCarpetaId(),
          event.getAutenticado());

      String nuevoEstado = event.getAutenticado() ? "AUTENTICADO" : "RECHAZADO";

      carpetaCiudadanoService.actualizarEstadoDocumento(
          event.getCarpetaId(), event.getDocumentoId(), nuevoEstado, event.getMotivoRechazo());

      log.info(
          "Estado del documento actualizado exitosamente: documentoId={}, nuevoEstado={}",
          event.getDocumentoId(),
          nuevoEstado);

    } catch (Exception e) {
      log.error(
          "Error procesando evento de documento autenticado: documentoId={}, error={}",
          event.getDocumentoId(),
          e.getMessage(),
          e);
    }
  }
}
