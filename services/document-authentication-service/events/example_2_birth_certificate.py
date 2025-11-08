"""
Example 2: Authenticate a birth certificate

This example demonstrates authenticating a birth certificate document.
"""

import httpx
import json

# API endpoint
url = "http://localhost:8083/api/v1/authenticateDocument"

# Sample JWT token (replace with actual token from auth-service)
jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJJZCI6ImZvbGRlci03ODktMDEyIiwiY2l0aXplbklkIjo5ODc2NTQzMjEwLCJzdWIiOiJ1c2VyLTc4OSIsImV4cCI6OTk5OTk5OTk5OX0.signature"

# Request payload
payload = {
    "documentId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "documentTitle": "Registro Civil de Nacimiento",
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
            print("Check RabbitMQ queue 'document_authenticated_response' for results.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
