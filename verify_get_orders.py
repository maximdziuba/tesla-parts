import requests
import json

url = "http://127.0.0.1:8000/orders/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"Orders count: {len(orders)}")
        if len(orders) > 0:
            print("First order sample:")
            print(json.dumps(orders[0], indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")
