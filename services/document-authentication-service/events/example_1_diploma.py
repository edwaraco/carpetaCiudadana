"""
Example 1: Authenticate a diploma document

This example demonstrates authenticating a university diploma document.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token (replace with actual token from auth-service)
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci0xMjMtNDU2IiwiY2l0aXplbklkIjoxMjM0NTY3ODkwLCJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.signature"

# Request payload
payload = {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "documentTitle": "Diploma Grado Ingeniería de Sistemas",
}

# Headers
headers = {"Authorization": f"Bearer {jwt_token}", "Content-Type": "application/json"}


# Make request
def main():
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
        print(f"Status Code: {response.statusCode}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.statusCode == 202:
            print("\n✅ Request accepted! Authentication processing in background.")
            print("Check RabbitMQ queue 'documento.autenticado.queue' for results.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
