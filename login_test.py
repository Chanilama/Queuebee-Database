import requests
import json
import sys
import os
import time

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
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def test_login(email, password):
    """Test the login endpoint"""
    print(f"\n=== Testing Login with {email} ===")
    try:
        payload = {
            "email": email,
            "password": password
        }
        print(f"Sending request to: {API_URL}/salon/login")
        print(f"Payload: {json.dumps(payload)}")
        
        response = requests.post(f"{API_URL}/salon/login", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Login successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True, response.json()
        else:
            print(f"Login failed: {response.text}")
            return False, None
    except Exception as e:
        print(f"Error: {str(e)}")
        return False, None

def test_invalid_login():
    """Test login with invalid credentials"""
    print("\n=== Testing Login with Invalid Credentials ===")
    return test_login("testsalon@example.com", "wrongpassword")

def test_register(email, password, salon_name, owner_name, phone, address):
    """Test the registration endpoint"""
    print(f"\n=== Testing Registration with {email} ===")
    try:
        payload = {
            "email": email,
            "password": password,
            "salon_name": salon_name,
            "owner_name": owner_name,
            "phone": phone,
            "address": address
        }
        print(f"Sending request to: {API_URL}/salon/register")
        print(f"Payload: {json.dumps(payload)}")
        
        response = requests.post(f"{API_URL}/salon/register", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Registration successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True, response.json()
        else:
            print(f"Registration failed: {response.text}")
            return False, None
    except Exception as e:
        print(f"Error: {str(e)}")
        return False, None

def check_existing_users():
    """Check if there are existing users in the database"""
    print("\n=== Checking for Existing Users ===")
    try:
        # Try to login with the test credentials
        login_success, _ = test_login("testsalon@example.com", "testpass123")
        
        if login_success:
            print("Found existing user: testsalon@example.com")
            return True
        else:
            print("No existing user found with test credentials")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def main():
    # Test health check
    health_check_success = test_health_check()
    if not health_check_success:
        print("Health check failed. Backend may not be running.")
        return

    # Check for existing users
    has_existing_users = check_existing_users()
    
    if not has_existing_users:
        # Try to register a new account
        print("\n=== Attempting to register a new account ===")
        register_success, register_data = test_register(
            "testsalon@example.com",
            "testpass123",
            "Test Salon Demo",
            "Demo Owner",
            "1234567890",
            "123 Test St"
        )
        
        if register_success:
            print("\n=== Testing Login with Newly Registered Account ===")
            login_success, login_data = test_login("testsalon@example.com", "testpass123")
            if login_success:
                print("Successfully registered and logged in with new account")
            else:
                print("Registration succeeded but login failed with new account")
        else:
            print("Registration failed. Unable to continue testing.")
    else:
        # Test login with invalid credentials
        invalid_login_success, _ = test_invalid_login()
        if invalid_login_success:
            print("WARNING: Login succeeded with incorrect password!")
        else:
            print("Login correctly failed with invalid credentials.")

if __name__ == "__main__":
    main()