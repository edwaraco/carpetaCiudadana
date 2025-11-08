"""
Example 4: Authenticate with dummy JWT (skip validation)

This example demonstrates authenticating a document using dummy JWT mode.
The JWT token will be parsed as plain JSON without signature verification.

Use case: Testing without needing valid JWT secrets.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token with dummy payload
# This is a properly formatted JWT but with an invalid signature
# The payload contains: {"folderId": "folder-999-test", "citizenId": 9999999, "sub": "test-user", "exp": 9999999999}
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci05OTktdGVzdCIsImNpdGl6ZW5JZCI6OTk5OTk5OSwic3ViIjoidGVzdC11c2VyIiwiZXhwIjo5OTk5OTk5OTk5fQ.dummy-signature-not-validated"

# Request payload with dummyJWT flag enabled
payload = {
    "documentId": "11111111-1111-1111-1111-111111111111",
    "documentTitle": "Certificado de Estudio - Dummy JWT",
    "dummyJWT": True,  # Skip JWT validation
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
            print("🧪 Using DUMMY JWT mode - signature validation skipped")
            print("Check RabbitMQ queue 'documento.autenticado.queue' for results.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
