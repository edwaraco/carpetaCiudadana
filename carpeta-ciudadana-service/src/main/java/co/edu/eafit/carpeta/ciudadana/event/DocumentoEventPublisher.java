package co.edu.eafit.carpeta.ciudadana.event;

import co.edu.eafit.carpeta.ciudadana.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentoEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publicarDocumentoSubido(DocumentoSubidoEvent event) {
        try {
            log.info("Publicando evento de documento subido: documentoId={}, carpetaId={}", 
                    event.getDocumentoId(), event.getCarpetaId());
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY,
                    event
            );
            
            log.info("Evento publicado exitosamente para documento: {}", event.getDocumentoId());
        } catch (Exception e) {
            log.error("Error publicando evento de documento subido: {}", e.getMessage(), e);
            // No lanzamos la excepción para no afectar el flujo principal
        }
    }
}
