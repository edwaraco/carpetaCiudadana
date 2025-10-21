FROM openjdk:17-jdk-slim

WORKDIR /app

# Copiar el archivo JAR
COPY target/carpeta-ciudadana-service-1.0.0.jar app.jar

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
