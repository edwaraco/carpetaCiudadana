"""
Example 7: Authenticate with dummy JWT only (hybrid mode)

This example uses dummy JWT but fetches real URL from carpeta-ciudadana-service.

Use case: Testing when you don't have valid JWT but carpeta-ciudadana-service is available.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Dummy JWT token that will be parsed without validation
# Payload contains valid-looking folder and citizen IDs
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci1oeWJyaWQtNDU2IiwiY2l0aXplbklkIjo0NDU1NjY3Nzc4LCJzdWIiOiJoeWJyaWQtdXNlciIsImV4cCI6OTk5OTk5OTk5OX0.not-a-real-signature"

# Request payload - only dummyJWT enabled
payload = {
    "documentId": "44444444-4444-4444-4444-444444444444",
    "documentTitle": "Tarjeta de Identidad - Hybrid Mode",
    "dummyJWT": True,  # Skip JWT validation
    # No dummyURL - will fetch from carpeta-ciudadana-service
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
            print("🧪 HYBRID MODE:")
            print("   - JWT validation SKIPPED (dummyJWT=true)")
            print("   - Will fetch presigned URL from carpeta-ciudadana-service")
            print("   - Will call Gov Carpeta API")
            print(
                "\nCheck RabbitMQ queue 'documento.autenticado.queue' for results."
            )
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
