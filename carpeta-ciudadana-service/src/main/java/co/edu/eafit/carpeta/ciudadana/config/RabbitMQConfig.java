package co.edu.eafit.carpeta.ciudadana.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  public static final String EXCHANGE_NAME = "carpeta-ciudadana.exchange";
  public static final String QUEUE_NAME = "documento.subido.queue";
  public static final String ROUTING_KEY = "documento.subido";

  @Bean
  public Exchange documentoExchange() {
    return ExchangeBuilder.topicExchange(EXCHANGE_NAME).durable(true).build();
  }

  @Bean
  public Queue documentoSubidoQueue() {
    return QueueBuilder.durable(QUEUE_NAME).build();
  }

  @Bean
  public Binding documentoSubidoBinding(Queue documentoSubidoQueue, Exchange documentoExchange) {
    return BindingBuilder.bind(documentoSubidoQueue)
        .to(documentoExchange)
        .with(ROUTING_KEY)
        .noargs();
  }

  @Bean
  public MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
    rabbitTemplate.setMessageConverter(jsonMessageConverter());
    return rabbitTemplate;
  }
}
