"""
Example 5: Authenticate with dummy URL (skip carpeta-ciudadana-service call)

This example demonstrates authenticating a document using a dummy presigned URL.
The service will use the provided URL instead of calling carpeta-ciudadana-service.

Use case: Testing without needing carpeta-ciudadana-service running.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token (replace with actual token from auth-service)
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci03NzctODg4IiwiY2l0aXplbklkIjo3Nzc4ODg5OTksInN1YiI6InVzZXItNzc3IiwiZXhwIjo5OTk5OTk5OTk5fQ.signature"

# Request payload with dummyURL provided
payload = {
    "documentId": "22222222-2222-2222-2222-222222222222",
    "documentTitle": "Certificado de Nacimiento - Dummy URL",
    "dummyURL": "https://example-bucket.s3.amazonaws.com/test-document.pdf?signature=test123&expires=9999999999",
}

# Headers
headers = {"Authorization": f"Bearer {jwt_token}", "Content-Type": "application/json"}


# Make request
def main():
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 202:
            print("\n✅ Request accepted! Authentication processing in background.")
            print("🧪 Using DUMMY URL - carpeta-ciudadana-service call skipped")
            print("Check RabbitMQ queue 'document_authenticated_response' for results.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
