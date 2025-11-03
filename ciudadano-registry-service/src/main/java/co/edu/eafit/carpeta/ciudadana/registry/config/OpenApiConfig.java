package co.edu.eafit.carpeta.ciudadana.registry.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Ciudadano Registry Service API")
                .description(
                    "Microservicio para gestión de registro de ciudadanos en el sistema de Carpeta Ciudadana")
                .version("1.0.0")
                .contact(
                    new Contact()
                        .name("Equipo Carpeta Ciudadana")
                        .email("carpeta-ciudadana@eafit.edu.co"))
                .license(
                    new License().name("MIT License").url("https://opensource.org/licenses/MIT")))
        .servers(
            List.of(
                new Server().url("http://localhost:8081").description("Servidor de desarrollo"),
                new Server()
                    .url("https://api.carpeta-ciudadana.com")
                    .description("Servidor de producción")));
  }
}
