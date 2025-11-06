#!/usr/bin/env python3
"""
RabbitMQ Consumer - Receives messages from Carpeta Ciudadana queues

This script consumes messages from RabbitMQ queues for testing purposes.
Supports three queues with specific message formats.

Usage:
    python consumer.py
    python consumer.py --host localhost --port 5672 --user admin --password secret
"""

import pika
import json
import argparse
import sys
import signal
from datetime import datetime
from pika.exceptions import AMQPConnectionError

# Connection configuration
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'admin'
RABBITMQ_PASS = 'admin123'

# Available queues
AVAILABLE_QUEUES = [
    'document_verification_request',
    'document_verified_response',
    'test_queue'
]

# Control flag for graceful shutdown
should_stop = False

# Display configuration
MAX_URL_DISPLAY_LENGTH = 80


def signal_handler(sig, frame):
    """Handle interrupt signals for graceful shutdown"""
    global should_stop
    print("\n\n[INFO] Interrupt received. Shutting down gracefully...")
    should_stop = True


def format_message_output(message, delivery_tag, redelivered, queue_name):
    """Format message for display"""
    output = []
    output.append("\n" + "="*60)
    output.append(f"MESSAGE RECEIVED - {datetime.now().strftime('%H:%M:%S')}")
    output.append("="*60)
    
    # Metadata
    output.append(f"[METADATA]")
    output.append(f"  Queue: {queue_name}")
    output.append(f"  Delivery Tag: {delivery_tag}")
    output.append(f"  Redelivered: {'Yes' if redelivered else 'No'}")
    output.append("")
    
    # Message content
    output.append(f"[MESSAGE]")
    if isinstance(message, dict):
        # Format based on queue type
        if queue_name == 'document_verification_request':
            output.append(f"  Citizen ID: {message.get('idCitizen', 'N/A')}")
            output.append(f"  Document Title: {message.get('documentTitle', 'N/A')}")
            url = message.get('UrlDocument', 'N/A')
            if len(url) > MAX_URL_DISPLAY_LENGTH:
                url = url[:MAX_URL_DISPLAY_LENGTH] + "..."
            output.append(f"  Document URL: {url}")
        elif queue_name == 'document_verified_response':
            output.append(f"  Status: {message.get('status', 'N/A')}")
            output.append(f"  Message: {message.get('message', 'N/A')}")
        elif queue_name == 'test_queue':
            output.append(f"  ID: {message.get('id', 'N/A')}")
            output.append(f"  Timestamp: {message.get('timestamp', 'N/A')}")
            output.append(f"  Message: {message.get('message', 'N/A')}")
            if 'data' in message:
                output.append(f"  Data: {json.dumps(message['data'])}")
    else:
        output.append(f"  [WARNING] Message is not valid JSON")
    
    output.append("")
    output.append("[FULL MESSAGE JSON]")
    output.append("-"*60)
    output.append(json.dumps(message, indent=2, ensure_ascii=False))
    output.append("-"*60)
    
    return "\n".join(output)


def callback(ch, method, properties, body, queue_name):
    """Callback executed when a message is received"""
    global should_stop
    
    try:
        # Parse message
        message = json.loads(body)
        
        # Display formatted message
        print(format_message_output(message, method.delivery_tag, method.redelivered, queue_name))
        
        # Acknowledge receipt
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("\n[OK] Message acknowledged\n")
        
    except json.JSONDecodeError as e:
        print(f"\n[ERROR] Failed to parse JSON: {str(e)}")
        print(f"[RAW] {body.decode('utf-8')}\n")
        
        # Reject malformed message (don't requeue)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        print("[ERROR] Message rejected (not requeued)\n")
    
    except Exception as e:
        print(f"\n[ERROR] Failed to process message: {str(e)}")
        
        # Reject and requeue for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        print("[WARNING] Message rejected (requeued)\n")


def display_menu():
    """Display the main menu"""
    print("\n" + "="*60)
    print("RabbitMQ Consumer - Carpeta Ciudadana")
    print("="*60)
    print("\nAvailable queues:")
    print("  1. document_verification_request")
    print("  2. document_verified_response")
    print("  3. test_queue")
    print("  4. Exit")
    print("-"*60)


def interactive_mode(connection):
    """Run interactive mode with menu"""
    global should_stop
    
    while True and not should_stop:
        display_menu()
        choice = input("\nSelect queue to consume (1-4): ").strip()
        
        if choice == '4':
            print("\nExiting...")
            break
        
        if choice not in ['1', '2', '3']:
            print("[ERROR] Invalid choice. Please select 1-4.")
            continue
        
        queue_name = AVAILABLE_QUEUES[int(choice) - 1]
        
        print(f"\n[INFO] Starting consumer for '{queue_name}'...")
        print("[INFO] Press Ctrl+C to stop consuming and return to menu\n")
        print("="*60)
        
        try:
            channel = connection.channel()
            
            # Configure QoS
            channel.basic_qos(prefetch_count=1)
            
            # Check queue
            try:
                method_frame = channel.queue_declare(queue=queue_name, durable=True, passive=True)
                message_count = method_frame.method.message_count
                print(f"[INFO] Queue has {message_count} pending message(s)\n")
            except Exception as e:
                print(f"[WARNING] Could not check queue status: {str(e)}\n")
            
            # Setup consumer
            channel.basic_consume(
                queue=queue_name,
                on_message_callback=lambda ch, method, properties, body: 
                    callback(ch, method, properties, body, queue_name),
                auto_ack=False
            )
            
            # Reset stop flag
            should_stop = False
            
            # Consume messages
            print("[INFO] Listening for messages...\n")
            while not should_stop:
                try:
                    connection.process_data_events(time_limit=1)
                except Exception as e:
                    print(f"[ERROR] Error in consume loop: {str(e)}")
                    break
            
            # Clean up
            channel.stop_consuming()
            channel.close()
            
            # Reset flag for next iteration
            should_stop = False
            
        except Exception as e:
            print(f"[ERROR] Failed to consume from queue: {str(e)}")
            continue


def main():
    global should_stop
    
    parser = argparse.ArgumentParser(
        description='RabbitMQ Consumer for testing Carpeta Ciudadana queues'
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
    parser.add_argument(
        '--queue',
        type=str,
        choices=AVAILABLE_QUEUES,
        help='Queue to consume from (if not specified, interactive mode is used)'
    )
    
    args = parser.parse_args()
    
    # Override global config
    global RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS
    RABBITMQ_HOST = args.host
    RABBITMQ_PORT = args.port
    RABBITMQ_USER = args.user
    RABBITMQ_PASS = args.password
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n" + "="*60)
    print("RabbitMQ Consumer - Carpeta Ciudadana")
    print("="*60)
    print(f"\n[CONFIG] Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
    print(f"[CONFIG] User: {RABBITMQ_USER}")
    print("\n[INFO] Connecting to RabbitMQ cluster...")
    
    try:
        # Connect to RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        
        connection = pika.BlockingConnection(parameters)
        
        print("[OK] Connection established\n")
        
        # Run in command-line mode or interactive mode
        if args.queue:
            queue_name = args.queue
            print(f"[INFO] Starting consumer for '{queue_name}'...")
            print("[INFO] Press Ctrl+C to stop\n")
            print("="*60)
            
            channel = connection.channel()
            
            # Configure QoS
            channel.basic_qos(prefetch_count=1)
            
            # Check queue
            try:
                method_frame = channel.queue_declare(queue=queue_name, durable=True, passive=True)
                message_count = method_frame.method.message_count
                print(f"[INFO] Queue has {message_count} pending message(s)\n")
            except Exception as e:
                print(f"[WARNING] Could not check queue: {str(e)}\n")
            
            # Setup consumer
            channel.basic_consume(
                queue=queue_name,
                on_message_callback=lambda ch, method, properties, body: 
                    callback(ch, method, properties, body, queue_name),
                auto_ack=False
            )
            
            # Consume messages
            print("[INFO] Listening for messages...\n")
            while not should_stop:
                try:
                    connection.process_data_events(time_limit=1)
                except Exception as e:
                    print(f"[ERROR] Error in consume loop: {str(e)}")
                    break
            
            # Clean up
            channel.stop_consuming()
            channel.close()
        else:
            # Interactive mode
            interactive_mode(connection)
        
        # Close connection
        connection.close()
        
        print("\n[INFO] Connection closed\n")
        
        return 0
        
    except AMQPConnectionError as e:
        print(f"[ERROR] Connection failed: {str(e)}")
        print("\n[HELP] Please verify:")
        print("  1. RabbitMQ is running")
        print("  2. Port 5672 is accessible")
        print("  3. Credentials are correct")
        return 1
    except KeyboardInterrupt:
        print("\n\n[INFO] Operation cancelled by user")
        return 1
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
