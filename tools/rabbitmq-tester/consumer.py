#!/usr/bin/env python3
"""
RabbitMQ Consumer - Recibe y procesa eventos del cluster

Este script consume eventos de las queues del sistema Carpeta Ciudadana
para validar el funcionamiento del cluster RabbitMQ con Quorum Queues.

Uso:
    python consumer.py
    python consumer.py --queue minio.cleanup.queue
    python consumer.py --auto-ack  # Sin confirmación manual
"""

import pika
import json
import argparse
import sys
from datetime import datetime
import signal

# Importar excepciones específicas de pika
from pika.exceptions import AMQPConnectionError

# Configuración de conexión (Leader)
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

# Control de señales para shutdown graceful
should_stop = False


def signal_handler(sig, frame):
    """Manejador de señal para Ctrl+C"""
    global should_stop
    print("\n\n⚠️  Recibida señal de interrupción. Cerrando gracefully...")
    should_stop = True


def format_event_output(event, delivery_tag, redelivered):
    """
    Formatea el evento para visualización bonita
    """
    output = []
    output.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    output.append(f"📬 EVENTO RECIBIDO - {datetime.now().strftime('%H:%M:%S')}")
    output.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Metadata del mensaje
    output.append(f"📊 Metadata:")
    output.append(f"   Delivery Tag: {delivery_tag}")
    output.append(f"   Redelivered: {'Sí ⚠️' if redelivered else 'No'}")
    output.append("")
    
    # Información del evento
    if isinstance(event, dict):
        output.append(f"🆔 Event ID: {event.get('eventId', 'N/A')}")
        output.append(f"📝 Event Type: {event.get('eventType', 'N/A')}")
        output.append(f"🕐 Timestamp: {event.get('timestamp', 'N/A')}")
        output.append(f"📌 Version: {event.get('version', 'N/A')}")
        output.append("")
        
        # Payload
        if 'payload' in event:
            payload = event['payload']
            output.append(f"📦 Payload:")
            output.append(f"   Document ID: {payload.get('documentId', 'N/A')}")
            output.append(f"   Citizen ID: {payload.get('citizenId', 'N/A')}")
            output.append(f"   Document Type: {payload.get('documentType', 'N/A')}")
            output.append(f"   Operation: {payload.get('operation', 'N/A')}")
            output.append("")
            output.append(f"   📄 TEXTO IMPORTANTE:")
            output.append(f"   ╭─────────────────────────────────────────────────╮")
            output.append(f"   │ {payload.get('description', 'N/A'):<47} │")
            output.append(f"   ╰─────────────────────────────────────────────────╯")
            output.append("")
            
            # Metadata adicional
            if 'metadata' in payload:
                meta = payload['metadata']
                output.append(f"   🗂️  Metadata:")
                output.append(f"      Bucket: {meta.get('bucket', 'N/A')}")
                output.append(f"      Region: {meta.get('region', 'N/A')}")
                output.append(f"      Size: {meta.get('size', 0):,} bytes")
                output.append(f"      MIME Type: {meta.get('mimeType', 'N/A')}")
                output.append("")
        
        # IDs de correlación
        output.append(f"🔗 Correlación:")
        output.append(f"   Correlation ID: {event.get('correlationId', 'N/A')}")
        output.append(f"   Causation ID: {event.get('causationId', 'N/A')}")
    else:
        output.append(f"⚠️  Evento no es un JSON válido")
    
    output.append("")
    output.append("━" * 60)
    output.append("")
    
    # JSON completo
    output.append("📋 EVENTO COMPLETO (JSON):")
    output.append("┌" + "─" * 58 + "┐")
    
    json_str = json.dumps(event, indent=2, ensure_ascii=False)
    for line in json_str.split('\n'):
        output.append(f"│ {line:<56} │")
    
    output.append("└" + "─" * 58 + "┘")
    output.append("")
    
    return "\n".join(output)


def callback(ch, method, properties, body, auto_ack=False):
    """
    Callback que se ejecuta cuando se recibe un mensaje
    """
    global should_stop
    
    try:
        # Parsear el evento
        event = json.loads(body)
        
        # Mostrar el evento formateado
        print(format_event_output(event, method.delivery_tag, method.redelivered))
        
        # Confirmar recepción (ACK manual)
        if not auto_ack:
            ch.basic_ack(delivery_tag=method.delivery_tag)
            print("✅ Mensaje confirmado (ACK enviado)\n")
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {str(e)}")
        print(f"   Body raw: {body.decode('utf-8')}\n")
        
        # Rechazar mensaje malformado
        if not auto_ack:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            print("❌ Mensaje rechazado (NACK - no requeue)\n")
    
    except Exception as e:
        print(f"❌ Error procesando mensaje: {str(e)}")
        
        # Rechazar y reencolar para reintento
        if not auto_ack:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            print("⚠️  Mensaje rechazado (NACK - requeue)\n")


def main():
    global should_stop
    
    parser = argparse.ArgumentParser(
        description='Consumidor de eventos de prueba para RabbitMQ Cluster'
    )
    parser.add_argument(
        '--queue',
        type=str,
        default='documento.deletion.queue',
        choices=AVAILABLE_QUEUES,
        help='Queue origen (default: documento.deletion.queue)'
    )
    parser.add_argument(
        '--auto-ack',
        action='store_true',
        help='Usar auto-acknowledgement (default: manual ACK)'
    )
    parser.add_argument(
        '--prefetch',
        type=int,
        default=1,
        help='Número de mensajes a prefetch (default: 1)'
    )
    
    args = parser.parse_args()
    
    # Registrar manejador de señales
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║          RabbitMQ Consumer - Carpeta Ciudadana              ║
╚══════════════════════════════════════════════════════════════╝

📊 Configuración:
   - Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}
   - Queue: {args.queue}
   - ACK Mode: {'Auto' if args.auto_ack else 'Manual'}
   - Prefetch: {args.prefetch}

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
        
        # Configurar QoS (prefetch)
        channel.basic_qos(prefetch_count=args.prefetch)
        print(f"⚙️  QoS configurado: prefetch_count={args.prefetch}\n")
        
        # Verificar que la queue exista
        print(f"🔍 Verificando queue '{args.queue}'...")
        try:
            method_frame = channel.queue_declare(
                queue=args.queue,
                durable=True,
                passive=True  # Solo verificar, no crear
            )
            message_count = method_frame.method.message_count
            print(f"✅ Queue existe")
            print(f"📊 Mensajes pendientes: {message_count}\n")
        except Exception as e:
            print(f"⚠️  Warning: No se pudo verificar la queue: {str(e)}\n")
        
        # Iniciar consumo
        print(f"👂 Escuchando mensajes en '{args.queue}'...")
        print(f"   Presiona Ctrl+C para detener\n")
        print("=" * 60)
        print()
        
        # Configurar consumer
        channel.basic_consume(
            queue=args.queue,
            on_message_callback=lambda ch, method, properties, body: 
                callback(ch, method, properties, body, args.auto_ack),
            auto_ack=args.auto_ack
        )
        
        # Loop de consumo
        while not should_stop:
            try:
                connection.process_data_events(time_limit=1)
            except Exception as e:
                print(f"❌ Error en loop de consumo: {str(e)}")
                break
        
        # Cerrar conexión gracefully
        print("\n🛑 Cerrando consumer...")
        channel.stop_consuming()
        channel.close()
        connection.close()
        
        print("👋 Conexión cerrada\n")
        return 0
        
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
