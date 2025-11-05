# --- Stage 1: Build Stage ---
# Use an official Maven image with Java 21 (Eclipse Temurin) and Maven 3.6
# We use a specific patch version for reproducibility
FROM maven:3.9.11-eclipse-temurin-21-noble AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the pom.xml file first to leverage Docker layer caching
# This way, dependencies are only re-downloaded if pom.xml changes
COPY pom.xml .

# Download all project dependencies
RUN mvn dependency:go-offline

# Copy the rest of your source code
COPY src ./src

# Package the application, skipping tests
# This compiles the code and creates the .jar file
RUN mvn clean package -DskipTests

# --- Stage 2: Run Stage ---
# Use a minimal Java 21 JRE (Java Runtime Environment) image
# Alpine Linux is used for a smaller image size
FROM eclipse-temurin:21-jre-alpine

# Set the working directory
WORKDIR /app

# Copy the built .jar file from the 'builder' stage
# We rename it to app.jar for a consistent entrypoint
COPY --from=builder /app/target/*.jar app.jar

# (Optional) Expose the port your application runs on
EXPOSE 8080

# Define the command to run your application
ENTRYPOINT ["java", "-jar", "app.jar"]
