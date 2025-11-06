#!/usr/bin/env python3
"""
RabbitMQ Producer - Envía eventos de prueba al cluster

Este script publica eventos aleatorios a las queues del sistema Carpeta Ciudadana
para validar el funcionamiento del cluster RabbitMQ con Quorum Queues.

Uso:
    python producer.py
    python producer.py --count 10
    python producer.py --queue documento.deletion.queue
"""

import pika
import json
import random
import uuid
from datetime import datetime
import argparse
import sys

# Importar excepciones específicas de pika
from pika.exceptions import AMQPConnectionError, UnroutableError

# Configuración de conexión
# Para Kubernetes, usar port-forward: kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672
# Para obtener credenciales K8s: kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'admin'
RABBITMQ_PASS = 'admin123'

# Queues disponibles del sistema
AVAILABLE_QUEUES = [
    'documento.deletion.queue',
    'minio.cleanup.queue',
    'metadata.cleanup.queue'
]

# Textos aleatorios para generar eventos
SAMPLE_TEXTS = [
    "Eliminación de documento temporal solicitada por el ciudadano",
    "Limpieza de archivo en MinIO bucket carpeta-ciudadana-docs",
    "Actualización de metadata en DynamoDB tras eliminación",
    "Procesamiento de evento de portabilidad de documentos",
    "Sincronización de estado entre MinIO y DynamoDB",
    "Notificación de cambio de estado de documento",
    "Validación de integridad de documento certificado",
    "Auditoría de acceso a carpeta ciudadana",
    "Registro de operación batch de documentos",
    "Evento de replicación entre regiones AWS"
]

DOCUMENT_TYPES = [
    "CEDULA", "PASAPORTE", "REGISTRO_CIVIL", "LICENCIA_CONDUCCION",
    "TARJETA_PROFESIONAL", "TITULO_UNIVERSITARIO", "CERTIFICADO_LABORAL",
    "EXTRACTO_BANCARIO", "FACTURA_SERVICIOS", "CERTIFICADO_MEDICO"
]

OPERATIONS = [
    "DELETE", "CLEANUP", "UPDATE", "SYNC", "VALIDATE", "AUDIT", "REPLICATE"
]


def create_random_event(event_type="documento.deletion.requested"):
    """
    Crea un evento aleatorio con estructura completa
    """
    event_id = str(uuid.uuid4())
    document_id = f"DOC-{random.randint(100000, 999999)}"
    citizen_id = f"CC-{random.randint(10000000, 99999999)}"
    
    event = {
        "eventId": event_id,
        "eventType": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0",
        "payload": {
            "documentId": document_id,
            "citizenId": citizen_id,
            "documentType": random.choice(DOCUMENT_TYPES),
            "operation": random.choice(OPERATIONS),
            "description": random.choice(SAMPLE_TEXTS),
            "metadata": {
                "bucket": "carpeta-ciudadana-docs",
                "region": random.choice(["us-east-1", "us-west-2", "eu-west-1"]),
                "size": random.randint(1024, 10485760),  # 1KB - 10MB
                "mimeType": random.choice(["application/pdf", "image/jpeg", "image/png"])
            }
        },
        "correlationId": str(uuid.uuid4()),
        "causationId": str(uuid.uuid4())
    }
    
    return event


def publish_event(channel, queue_name, event):
    """
    Publica un evento a la queue especificada con confirmación
    """
    try:
        # Habilitar publisher confirms
        channel.confirm_delivery()
        
        # Publicar mensaje directamente a la queue
        channel.basic_publish(
            exchange='',  # Exchange default
            routing_key=queue_name,
            body=json.dumps(event, indent=2),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type='application/json',
                message_id=event['eventId'],
                timestamp=int(datetime.utcnow().timestamp()),
                headers={
                    'eventType': event['eventType'],
                    'version': event['version']
                }
            )
        )
        
        return True
    except UnroutableError:
        print(f"❌ Error: Mensaje no pudo ser enrutado a la queue '{queue_name}'")
        return False
    except Exception as e:
        print(f"❌ Error al publicar: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Productor de eventos de prueba para RabbitMQ Cluster'
    )
    parser.add_argument(
        '--count', 
        type=int, 
        default=1,
        help='Número de eventos a enviar (default: 1)'
    )
    parser.add_argument(
        '--queue',
        type=str,
        default='documento.deletion.queue',
        choices=AVAILABLE_QUEUES,
        help='Queue destino (default: documento.deletion.queue)'
    )
    parser.add_argument(
        '--event-type',
        type=str,
        default='documento.deletion.requested',
        help='Tipo de evento a generar'
    )
    parser.add_argument(
        '--host',
        type=str,
        default='localhost',
        help='RabbitMQ host (default: localhost)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=5672,
        help='RabbitMQ port (default: 5672)'
    )
    parser.add_argument(
        '--user',
        type=str,
        default='admin',
        help='RabbitMQ user (default: admin)'
    )
    parser.add_argument(
        '--password',
        type=str,
        default='admin123',
        help='RabbitMQ password (default: admin123)'
    )
    
    args = parser.parse_args()
    
    # Override global config with command-line args
    global RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS
    RABBITMQ_HOST = args.host
    RABBITMQ_PORT = args.port
    RABBITMQ_USER = args.user
    RABBITMQ_PASS = args.password
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║          RabbitMQ Producer - Carpeta Ciudadana              ║
╚══════════════════════════════════════════════════════════════╝

📊 Configuración:
   - Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}
   - Queue: {args.queue}
   - Eventos: {args.count}
   - Tipo: {args.event_type}

🔄 Conectando al cluster RabbitMQ...
""")
    
    try:
        # Conectar a RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        print("✅ Conexión establecida\n")
        
        # Verificar que la queue exista (quorum queue debe ser declarada previamente)
        print(f"🔍 Verificando queue '{args.queue}'...")
        try:
            channel.queue_declare(
                queue=args.queue,
                durable=True,
                passive=True  # Solo verificar, no crear
            )
            print(f"✅ Queue existe y está disponible\n")
        except Exception as e:
            print(f"⚠️  Warning: No se pudo verificar la queue: {str(e)}")
            print(f"   La queue será creada si no existe\n")
        
        # Enviar eventos
        success_count = 0
        print(f"📤 Enviando {args.count} evento(s)...\n")
        
        for i in range(args.count):
            event = create_random_event(args.event_type)
            
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"📨 Evento #{i+1}/{args.count}")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"   ID: {event['eventId']}")
            print(f"   Tipo: {event['eventType']}")
            print(f"   Documento: {event['payload']['documentId']}")
            print(f"   Operación: {event['payload']['operation']}")
            print(f"   📝 Descripción: {event['payload']['description']}")
            
            if publish_event(channel, args.queue, event):
                print(f"   ✅ Publicado exitosamente")
                success_count += 1
            else:
                print(f"   ❌ Falló la publicación")
            
            print()
        
        # Resumen
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📊 Resumen:")
        print(f"   ✅ Exitosos: {success_count}/{args.count}")
        print(f"   ❌ Fallidos: {args.count - success_count}/{args.count}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        
        # Cerrar conexión
        channel.close()
        connection.close()
        
        print("👋 Conexión cerrada\n")
        
        return 0 if success_count == args.count else 1
        
    except AMQPConnectionError as e:
        print(f"❌ Error de conexión a RabbitMQ: {str(e)}")
        print("\n💡 Verificar:")
        print("   1. RabbitMQ está corriendo: docker compose ps")
        print("   2. Puerto 5672 está accesible")
        print("   3. Credenciales son correctas")
        return 1
    except KeyboardInterrupt:
        print("\n⚠️  Operación cancelada por el usuario")
        return 1
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
