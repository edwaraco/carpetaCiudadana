#!/usr/bin/env python3
"""
RabbitMQ Producer - Sends test messages to Carpeta Ciudadana queues

This script publishes messages to RabbitMQ queues for testing purposes.
Supports three queues with specific message formats.

Usage:
    python producer.py
    python producer.py --host localhost --port 5672 --user admin --password secret
"""

import pika
import json
import random
import uuid
import argparse
import sys
from datetime import datetime
from pika.exceptions import AMQPConnectionError, UnroutableError

# Connection configuration
RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "admin"
RABBITMQ_PASS = "admin123"

# Available queues
AVAILABLE_QUEUES = [
    "document_verification_request",
    "document_verified_response",
    "test_queue",
]

# Sample data for document_verification_request
DOCUMENT_TITLES = [
    "Diploma Grado",
    "Certificado Laboral",
    "Cedula de Ciudadania",
    "Pasaporte",
    "Licencia de Conduccion",
    "Titulo Profesional",
    "Certificado Medico",
    "Extracto Bancario",
]

BUCKET_NAMES = ["carpeta-ciudadana-docs", "carpeta-ciudadana-prod", "carpeta-docs"]

# Citizen ID range (10 digits for Colombian ID)
MIN_CITIZEN_ID = 1000000000
MAX_CITIZEN_ID = 9999999999


def create_verification_request_message():
    """Create a document verification request message"""
    citizen_id = random.randint(MIN_CITIZEN_ID, MAX_CITIZEN_ID)
    bucket = random.choice(BUCKET_NAMES)
    doc_id = str(uuid.uuid4())
    title = random.choice(DOCUMENT_TITLES)

    message = {
        "idCitizen": citizen_id,
        "UrlDocument": f"https://{bucket}.s3.amazonaws.com/{doc_id}.image.jpg?AWSAccessKeyId=<AWS_ACCESS_KEY>&Expires=145671",
        "documentTitle": title,
    }

    return message


def create_verified_response_message():
    """Create a document verified response message"""
    citizen_id = random.randint(MIN_CITIZEN_ID, MAX_CITIZEN_ID)
    status = random.choice([200, 400, 500])
    title = random.choice(DOCUMENT_TITLES)

    if status == 200:
        msg = f"El documento: {title} del ciudadano {citizen_id} ha sido autenticado exitosamente"
    elif status == 400:
        msg = f"El documento: {title} del ciudadano {citizen_id} no pudo ser verificado - error de validacion"
    else:
        msg = f"El documento: {title} del ciudadano {citizen_id} no pudo ser procesado - error del servidor"

    message = {"status": status, "message": msg}

    return message


def create_test_message():
    """Create a simple test message"""
    message = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "message": f"Test message #{random.randint(1, 1000)}",
        "data": {"key1": "value1", "key2": random.randint(1, 100)},
    }

    return message


def publish_message(channel, queue_name, message):
    """Publish a message to the specified queue"""
    try:
        # Enable publisher confirms
        channel.confirm_delivery()

        # Publish message directly to queue
        channel.basic_publish(
            exchange="",
            routing_key=queue_name,
            body=json.dumps(message, indent=2),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type="application/json",
                timestamp=int(datetime.utcnow().timestamp()),
            ),
        )

        return True
    except UnroutableError:
        print(f"[ERROR] Message could not be routed to queue '{queue_name}'")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to publish: {str(e)}")
        return False


def display_menu():
    """Display the main menu"""
    print("\n" + "=" * 60)
    print("RabbitMQ Producer - Carpeta Ciudadana")
    print("=" * 60)
    print("\nAvailable queues:")
    print("  1. document_verification_request")
    print("  2. document_verified_response")
    print("  3. test_queue")
    print("  4. Exit")
    print("-" * 60)


def interactive_mode(channel):
    """Run interactive mode with menu"""
    while True:
        display_menu()
        choice = input("\nSelect queue (1-4): ").strip()

        if choice == "4":
            print("\nExiting...")
            break

        if choice not in ["1", "2", "3"]:
            print("[ERROR] Invalid choice. Please select 1-4.")
            continue

        queue_name = AVAILABLE_QUEUES[int(choice) - 1]

        count_input = input(f"Number of messages to send (default 1): ").strip()
        count = int(count_input) if count_input.isdigit() else 1

        print(f"\n[INFO] Sending {count} message(s) to '{queue_name}'...")
        print("-" * 60)

        success_count = 0

        for i in range(count):
            # Create message based on queue
            if queue_name == "document_verification_request":
                message = create_verification_request_message()
            elif queue_name == "document_verified_response":
                message = create_verified_response_message()
            else:  # test_queue
                message = create_test_message()

            print(f"\n[{i+1}/{count}] Message:")
            print(json.dumps(message, indent=2))

            if publish_message(channel, queue_name, message):
                print(f"[OK] Message {i+1} published successfully")
                success_count += 1
            else:
                print(f"[ERROR] Message {i+1} failed to publish")

        print("\n" + "-" * 60)
        print(
            f"[SUMMARY] Success: {success_count}/{count}, Failed: {count - success_count}/{count}"
        )

        continue_choice = input("\nSend more messages? (y/n): ").strip().lower()
        if continue_choice != "y":
            print("\nExiting...")
            break


def main():
    parser = argparse.ArgumentParser(
        description="RabbitMQ Producer for testing Carpeta Ciudadana queues"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="RabbitMQ host (default: localhost)",
    )
    parser.add_argument(
        "--port", type=int, default=5672, help="RabbitMQ port (default: 5672)"
    )
    parser.add_argument(
        "--user", type=str, default="admin", help="RabbitMQ user (default: admin)"
    )
    parser.add_argument(
        "--password",
        type=str,
        default="admin123",
        help="RabbitMQ password (default: admin123)",
    )
    parser.add_argument(
        "--queue",
        type=str,
        choices=AVAILABLE_QUEUES,
        help="Queue to send to (if not specified, interactive mode is used)",
    )
    parser.add_argument(
        "--count", type=int, default=1, help="Number of messages to send (default: 1)"
    )

    args = parser.parse_args()

    # Override global config
    global RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS
    RABBITMQ_HOST = args.host
    RABBITMQ_PORT = args.port
    RABBITMQ_USER = args.user
    RABBITMQ_PASS = args.password

    print("\n" + "=" * 60)
    print("RabbitMQ Producer - Carpeta Ciudadana")
    print("=" * 60)
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
            blocked_connection_timeout=300,
        )

        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        print("[OK] Connection established\n")

        # Run in command-line mode or interactive mode
        if args.queue:
            queue_name = args.queue
            print(f"[INFO] Sending {args.count} message(s) to '{queue_name}'...")
            print("-" * 60)

            success_count = 0

            for i in range(args.count):
                # Create message based on queue
                if queue_name == "document_verification_request":
                    message = create_verification_request_message()
                elif queue_name == "document_verified_response":
                    message = create_verified_response_message()
                else:  # test_queue
                    message = create_test_message()

                print(f"\n[{i+1}/{args.count}] Message:")
                print(json.dumps(message, indent=2))

                if publish_message(channel, queue_name, message):
                    print(f"[OK] Message {i+1} published successfully")
                    success_count += 1
                else:
                    print(f"[ERROR] Message {i+1} failed to publish")

            print("\n" + "-" * 60)
            print(
                f"[SUMMARY] Success: {success_count}/{args.count}, Failed: {args.count - success_count}/{args.count}"
            )
        else:
            # Interactive mode
            interactive_mode(channel)

        # Close connection
        channel.close()
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
