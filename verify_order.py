import requests
import json

url = "http://127.0.0.1:8000/orders/"

# Payload matching the structure I just implemented in api.ts
payload = {
    "items": [
        {
            "id": "prod-123",
            "name": "Test Product",
            "category": "Model 3",
            "priceUAH": 400,
            "priceUSD": 10,
            "image": "http://example.com/img.jpg",
            "description": "Desc",
            "inStock": True,
            "quantity": 2
        }
    ],
    "totalUSD": 20,
    "customer": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "1234567890"
    },
    "delivery": {
        "city": "Kyiv",
        "branch": "Branch 1"
    },
    "paymentMethod": "card"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
