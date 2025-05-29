#!/usr/bin/env python3
import requests
import json
import time
import os
import sys
from datetime import datetime

# Get the backend URL from the frontend .env file
def get_backend_url():
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                return line.strip().split('=')[1].strip('"\'')
    return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("Error: Could not find REACT_APP_BACKEND_URL in frontend/.env")
    sys.exit(1)

API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "message" in response.json(), "Response does not contain 'message' field"
        assert response.json()["message"] == "Hello World", f"Expected 'Hello World', got {response.json()['message']}"
        
        print("✅ Health check endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Health check endpoint test failed: {str(e)}")
        return False

def test_status_create():
    """Test creating a status check"""
    print("\n=== Testing Status Create Endpoint ===")
    try:
        client_name = f"test_client_{int(time.time())}"
        payload = {"client_name": client_name}
        
        response = requests.post(f"{API_URL}/status", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "id" in response.json(), "Response does not contain 'id' field"
        assert response.json()["client_name"] == client_name, f"Expected client_name '{client_name}', got {response.json()['client_name']}"
        assert "timestamp" in response.json(), "Response does not contain 'timestamp' field"
        
        print("✅ Status create endpoint test passed")
        return response.json()["id"]
    except Exception as e:
        print(f"❌ Status create endpoint test failed: {str(e)}")
        return None

def test_status_get(expected_id=None):
    """Test getting status checks"""
    print("\n=== Testing Status Get Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/status")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert isinstance(response.json(), list), "Response is not a list"
        
        if expected_id:
            found = False
            for status in response.json():
                if status["id"] == expected_id:
                    found = True
                    break
            assert found, f"Could not find status with id {expected_id} in response"
        
        print("✅ Status get endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Status get endpoint test failed: {str(e)}")
        return False

def test_cors():
    """Test CORS configuration"""
    print("\n=== Testing CORS Configuration ===")
    try:
        headers = {
            "Origin": "http://example.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        # Preflight request
        response = requests.options(f"{API_URL}/", headers=headers)
        print(f"Preflight Status Code: {response.status_code}")
        print(f"Preflight Headers: {dict(response.headers)}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "access-control-allow-origin" in response.headers, "Response does not contain 'Access-Control-Allow-Origin' header"
        # For preflight requests, the server is reflecting the Origin header
        assert response.headers["access-control-allow-origin"] == "http://example.com", f"Expected 'http://example.com', got {response.headers['access-control-allow-origin']}"
        
        # Actual request
        response = requests.get(f"{API_URL}/", headers={"Origin": "http://example.com"})
        print(f"Actual Status Code: {response.status_code}")
        print(f"Actual Headers: {dict(response.headers)}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "access-control-allow-origin" in response.headers, "Response does not contain 'Access-Control-Allow-Origin' header"
        # For actual requests, the server is using "*"
        assert response.headers["access-control-allow-origin"] == "*", f"Expected '*', got {response.headers['access-control-allow-origin']}"
        
        print("✅ CORS configuration test passed")
        return True
    except Exception as e:
        print(f"❌ CORS configuration test failed: {str(e)}")
        return False

def test_mongodb_connection():
    """Test MongoDB connection by checking if data is persisted"""
    print("\n=== Testing MongoDB Connection ===")
    try:
        # Create a status check
        client_name = f"mongo_test_{int(time.time())}"
        payload = {"client_name": client_name}
        
        create_response = requests.post(f"{API_URL}/status", json=payload)
        print(f"Create Status Code: {create_response.status_code}")
        print(f"Create Response: {create_response.json()}")
        
        assert create_response.status_code == 200, f"Expected status code 200, got {create_response.status_code}"
        status_id = create_response.json()["id"]
        
        # Get the status check to verify it was persisted
        get_response = requests.get(f"{API_URL}/status")
        print(f"Get Status Code: {get_response.status_code}")
        print(f"Get Response: {get_response.json()}")
        
        assert get_response.status_code == 200, f"Expected status code 200, got {get_response.status_code}"
        
        found = False
        for status in get_response.json():
            if status["id"] == status_id:
                found = True
                break
        
        assert found, f"Could not find status with id {status_id} in response"
        
        print("✅ MongoDB connection test passed")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and return a summary"""
    results = {}
    
    print("\n=== Starting Backend API Tests ===")
    print(f"Testing API at: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test health check
    results["health_check"] = test_health_check()
    
    # Test status create
    status_id = test_status_create()
    results["status_create"] = status_id is not None
    
    # Test status get
    results["status_get"] = test_status_get(status_id)
    
    # Test CORS
    results["cors"] = test_cors()
    
    # Test MongoDB connection
    results["mongodb_connection"] = test_mongodb_connection()
    
    # Print summary
    print("\n=== Test Summary ===")
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! The backend API is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the logs above for details.")
    
    return results

if __name__ == "__main__":
    run_all_tests()
