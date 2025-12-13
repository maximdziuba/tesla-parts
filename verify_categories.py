import requests
import json

BASE_URL = "http://127.0.0.1:8000"
HEADERS = {"x-admin-secret": "secret"}

def test_categories():
    print("Testing Categories...")
    
    # 1. Get Categories
    res = requests.get(f"{BASE_URL}/categories/")
    assert res.status_code == 200
    categories = res.json()
    print(f"Fetched {len(categories)} categories.")
    
    # 2. Create Category
    new_cat = {"name": "Test Category"}
    res = requests.post(f"{BASE_URL}/categories/", json=new_cat, headers=HEADERS)
    assert res.status_code == 200
    cat_data = res.json()
    cat_id = cat_data["id"]
    print(f"Created category: {cat_data['name']} (ID: {cat_id})")
    
    # 3. Create Subcategory
    new_sub = {"name": "Test Subcategory", "category_id": cat_id}
    res = requests.post(f"{BASE_URL}/categories/{cat_id}/subcategories/", json=new_sub, headers=HEADERS)
    assert res.status_code == 200
    sub_data = res.json()
    sub_id = sub_data["id"]
    print(f"Created subcategory: {sub_data['name']} (ID: {sub_id})")
    
    # 4. Create Product in Subcategory
    product_data = {
        "name": "Test Product",
        "category": "Test Category",
        "subcategory_id": sub_id,
        "priceUAH": 100,
        "description": "Test Description",
        "inStock": True,
        "image": "https://via.placeholder.com/150"
    }
    res = requests.post(f"{BASE_URL}/products/", data=product_data, headers=HEADERS)
    if res.status_code != 200:
        print(f"Failed to create product: {res.text}")
    assert res.status_code == 200
    prod_data = res.json()
    print(f"Created product: {prod_data['name']} with subcategory_id: {prod_data.get('subcategory_id')}")
    assert prod_data.get("subcategory_id") == sub_id
    
    # 5. Cleanup
    requests.delete(f"{BASE_URL}/products/{prod_data['id']}", headers=HEADERS)
    requests.delete(f"{BASE_URL}/categories/subcategories/{sub_id}", headers=HEADERS)
    requests.delete(f"{BASE_URL}/categories/{cat_id}", headers=HEADERS)
    print("Cleanup complete.")

if __name__ == "__main__":
    try:
        test_categories()
        print("All tests passed!")
    except Exception as e:
        print(f"Test failed: {e}")
