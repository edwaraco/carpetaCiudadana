"""
Example 3: Authenticate a professional license

This example demonstrates authenticating a professional license document.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token (replace with actual token from auth-service)
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci00NTYtNzg5IiwiY2l0aXplbklkIjo1NTU2NjY3Nzc4LCJzdWIiOiJ1c2VyLTQ1NiIsImV4cCI6OTk5OTk5OTk5OX0.signature"

# Request payload
payload = {
    "documentId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "documentTitle": "Tarjeta Profesional Médico Cirujano",
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
            print("Check RabbitMQ queue 'document_authenticated_response' for results.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
