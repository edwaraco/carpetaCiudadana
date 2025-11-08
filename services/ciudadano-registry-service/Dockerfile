# Multi-stage build for ciudadano-registry-service
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and checkstyle.xml
COPY pom.xml .
COPY checkstyle.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the JAR from build stage
COPY --from=build /app/target/ciudadano-registry-service-1.0.0.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]
