"""
Example 6: Authenticate with both dummy JWT and dummy URL (full testing mode)

This example demonstrates authenticating a document using both dummy flags.
This allows complete end-to-end testing without any external dependencies.

Use case: Complete isolated testing without auth-service or carpeta-ciudadana-service.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token with dummy payload (signature won't be validated)
# Payload: {"folderId": "test-folder-123", "citizenId": 1234567890, "sub": "test-user-full", "exp": 9999999999}
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6InRlc3QtZm9sZGVyLTEyMyIsImNpdGl6ZW5JZCI6MTIzNDU2Nzg5MCwic3ViIjoidGVzdC11c2VyLWZ1bGwiLCJleHAiOjk5OTk5OTk5OTl9.dummy-signature"

# Request payload with BOTH dummy flags enabled
payload = {
    "documentId": "33333333-3333-3333-3333-333333333333",
    "documentTitle": "Diploma Universitario - Full Dummy Mode",
    "dummyJWT": True,  # Skip JWT validation
    "dummyURL": "https://test-storage.example.com/documents/diploma.pdf?token=abc123&expires=9999999999",  # Skip carpeta-ciudadana-service
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
            print("🧪 FULL TESTING MODE:")
            print("   - JWT validation SKIPPED (dummyJWT=true)")
            print("   - Presigned URL fetch SKIPPED (dummyURL provided)")
            print("   - Only Gov Carpeta API call will be made")
            print(
                "\nCheck RabbitMQ queue 'document_authenticated_response' for results."
            )
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
