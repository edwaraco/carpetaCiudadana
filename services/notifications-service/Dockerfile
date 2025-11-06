# Dockerfile para el Microservicio de Notificaciones
# Multi-stage build para optimizar el tamaño de la imagen

# Etapa 1: Build
FROM golang:1.23-alpine AS builder

# Instalar dependencias de build
RUN apk add --no-cache git ca-certificates tzdata

# Configurar directorio de trabajo
WORKDIR /app

# Copiar go.mod y go.sum para aprovechar Docker layer caching
COPY go.mod go.sum ./

# Descargar dependencias
RUN go mod download

# Copiar código fuente
COPY . .

# Build del binario con optimizaciones para Docker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o notificaciones .

# Etapa 2: Runtime (imagen mínima)
FROM scratch

# Copiar certificados SSL y timezone data desde builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copiar el binario compilado
COPY --from=builder /app/notificaciones /notificaciones

# Variables de entorno por defecto
ENV LISTEN_PORT=8080

# Exponer puerto
EXPOSE 8080

# Usuario no-root para seguridad (opcional, scratch no tiene usuarios)
# USER 1000

# Comando de inicio
ENTRYPOINT ["/notificaciones"]