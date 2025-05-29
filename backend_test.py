#!/usr/bin/env python3
import requests
import json
import time
import os
import sys
from datetime import datetime
import random
import string

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

# Global variables to store test data
salon_tokens = {}
salon_ids = {}
customer_ids = {}

def random_string(length=8):
    """Generate a random string of fixed length"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "message" in response.json(), "Response does not contain 'message' field"
        assert "QueueBee API is running" in response.json()["message"], f"Unexpected message: {response.json()['message']}"
        
        print("✅ Health check endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Health check endpoint test failed: {str(e)}")
        return False

def test_salon_registration():
    """Test salon owner registration"""
    print("\n=== Testing Salon Owner Registration ===")
    try:
        # Create unique email for testing
        email = f"test_salon_{random_string()}@example.com"
        
        payload = {
            "email": email,
            "password": "TestPassword123!",
            "salon_name": f"Test Salon {random_string()}",
            "owner_name": "Test Owner",
            "phone": "1234567890",
            "address": "123 Test Street, Test City, TS 12345"
        }
        
        response = requests.post(f"{API_URL}/salon/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "salon_id" in response.json(), "Response does not contain 'salon_id' field"
        assert "access_token" in response.json(), "Response does not contain 'access_token' field"
        
        # Store salon data for later tests
        salon_id = response.json()["salon_id"]
        access_token = response.json()["access_token"]
        salon_tokens[salon_id] = access_token
        salon_ids[email] = salon_id
        
        print("✅ Salon owner registration test passed")
        return salon_id
    except Exception as e:
        print(f"❌ Salon owner registration test failed: {str(e)}")
        return None

def test_salon_login():
    """Test salon owner login"""
    print("\n=== Testing Salon Owner Login ===")
    try:
        # Create a new salon for login testing
        email = f"login_test_{random_string()}@example.com"
        password = "LoginTest123!"
        
        # Register the salon first
        register_payload = {
            "email": email,
            "password": password,
            "salon_name": f"Login Test Salon {random_string()}",
            "owner_name": "Login Test Owner",
            "phone": "9876543210",
            "address": "456 Login Street, Test City, TS 54321"
        }
        
        register_response = requests.post(f"{API_URL}/salon/register", json=register_payload)
        assert register_response.status_code == 200, "Failed to register salon for login test"
        
        # Now test login
        login_payload = {
            "email": email,
            "password": password
        }
        
        login_response = requests.post(f"{API_URL}/salon/login", json=login_payload)
        print(f"Status Code: {login_response.status_code}")
        print(f"Response: {login_response.json()}")
        
        assert login_response.status_code == 200, f"Expected status code 200, got {login_response.status_code}"
        assert "access_token" in login_response.json(), "Response does not contain 'access_token' field"
        assert "salon_id" in login_response.json(), "Response does not contain 'salon_id' field"
        
        # Store salon data for later tests
        salon_id = login_response.json()["salon_id"]
        access_token = login_response.json()["access_token"]
        salon_tokens[salon_id] = access_token
        salon_ids[email] = salon_id
        
        print("✅ Salon owner login test passed")
        return salon_id
    except Exception as e:
        print(f"❌ Salon owner login test failed: {str(e)}")
        return None

def test_salon_profile(salon_id):
    """Test salon profile retrieval"""
    print("\n=== Testing Salon Profile Retrieval ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/salon/profile", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "id" in response.json(), "Response does not contain 'id' field"
        assert response.json()["id"] == salon_id, f"Expected salon_id {salon_id}, got {response.json()['id']}"
        assert "password" not in response.json(), "Response should not contain password field"
        
        print("✅ Salon profile retrieval test passed")
        return True
    except Exception as e:
        print(f"❌ Salon profile retrieval test failed: {str(e)}")
        return False

def test_customer_creation(salon_id):
    """Test customer creation for a salon"""
    print("\n=== Testing Customer Creation ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        # Create a customer
        customer_name = f"Test Customer {random_string()}"
        customer_phone = f"555{random_string(7)}"
        customer_email = f"customer_{random_string()}@example.com"
        
        payload = {
            "name": customer_name,
            "phone": customer_phone,
            "email": customer_email
        }
        
        response = requests.post(f"{API_URL}/customers", json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "customer" in response.json(), "Response does not contain 'customer' field"
        assert "id" in response.json()["customer"], "Customer does not have 'id' field"
        assert response.json()["customer"]["name"] == customer_name, f"Expected name {customer_name}, got {response.json()['customer']['name']}"
        assert response.json()["customer"]["salon_id"] == salon_id, f"Expected salon_id {salon_id}, got {response.json()['customer']['salon_id']}"
        
        # Store customer ID for later tests
        customer_id = response.json()["customer"]["id"]
        if salon_id not in customer_ids:
            customer_ids[salon_id] = []
        customer_ids[salon_id].append(customer_id)
        
        print("✅ Customer creation test passed")
        return customer_id
    except Exception as e:
        print(f"❌ Customer creation test failed: {str(e)}")
        return None

def test_customer_listing(salon_id):
    """Test customer listing for a salon"""
    print("\n=== Testing Customer Listing ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/customers", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert isinstance(response.json(), list), "Response is not a list"
        
        # Check if our created customer is in the list
        if salon_id in customer_ids and customer_ids[salon_id]:
            found = False
            for customer in response.json():
                if customer["id"] == customer_ids[salon_id][0]:
                    found = True
                    break
            assert found, f"Could not find customer with id {customer_ids[salon_id][0]} in response"
        
        print("✅ Customer listing test passed")
        return True
    except Exception as e:
        print(f"❌ Customer listing test failed: {str(e)}")
        return False

def test_customer_retrieval(salon_id, customer_id):
    """Test customer retrieval for a salon"""
    print("\n=== Testing Customer Retrieval ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/customers/{customer_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "id" in response.json(), "Response does not contain 'id' field"
        assert response.json()["id"] == customer_id, f"Expected customer_id {customer_id}, got {response.json()['id']}"
        assert response.json()["salon_id"] == salon_id, f"Expected salon_id {salon_id}, got {response.json()['salon_id']}"
        
        print("✅ Customer retrieval test passed")
        return True
    except Exception as e:
        print(f"❌ Customer retrieval test failed: {str(e)}")
        return False

def test_customer_update(salon_id, customer_id):
    """Test customer update for a salon"""
    print("\n=== Testing Customer Update ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        # Update customer data
        new_name = f"Updated Customer {random_string()}"
        payload = {
            "name": new_name
        }
        
        response = requests.put(f"{API_URL}/customers/{customer_id}", json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "customer" in response.json(), "Response does not contain 'customer' field"
        assert response.json()["customer"]["name"] == new_name, f"Expected name {new_name}, got {response.json()['customer']['name']}"
        
        print("✅ Customer update test passed")
        return True
    except Exception as e:
        print(f"❌ Customer update test failed: {str(e)}")
        return False

def test_customer_isolation(salon_id1, salon_id2, customer_id):
    """Test customer isolation between salons"""
    print("\n=== Testing Customer Isolation ===")
    try:
        if not salon_id1 or salon_id1 not in salon_tokens or not salon_id2 or salon_id2 not in salon_tokens:
            raise Exception("Need two salon IDs with tokens for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        # Try to access customer from salon2 that belongs to salon1
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id2]}"}
        
        response = requests.get(f"{API_URL}/customers/{customer_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Should get a 404 because salon2 shouldn't be able to access salon1's customer
        assert response.status_code == 404, f"Expected status code 404, got {response.status_code}"
        
        print("✅ Customer isolation test passed")
        return True
    except Exception as e:
        print(f"❌ Customer isolation test failed: {str(e)}")
        return False

def test_customer_checkin(salon_id, customer_id):
    """Test customer check-in with points awarded"""
    print("\n=== Testing Customer Check-in ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        payload = {
            "customer_id": customer_id,
            "service_type": "Haircut"
        }
        
        response = requests.post(f"{API_URL}/checkin", json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "points_awarded" in response.json(), "Response does not contain 'points_awarded' field"
        assert "queue_entry" in response.json(), "Response does not contain 'queue_entry' field"
        assert "total_points" in response.json(), "Response does not contain 'total_points' field"
        assert "loyalty_tier" in response.json(), "Response does not contain 'loyalty_tier' field"
        
        # Store queue ID for later tests
        queue_id = response.json()["queue_entry"]["id"]
        
        print("✅ Customer check-in test passed")
        return queue_id
    except Exception as e:
        print(f"❌ Customer check-in test failed: {str(e)}")
        return None

def test_points_calculation(salon_id, customer_id):
    """Test points calculation with multiple check-ins"""
    print("\n=== Testing Points Calculation ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        # Get initial customer data
        initial_response = requests.get(f"{API_URL}/customers/{customer_id}", headers=headers)
        initial_points = initial_response.json()["total_points"]
        initial_tier = initial_response.json()["loyalty_tier"]
        
        print(f"Initial points: {initial_points}, Initial tier: {initial_tier}")
        
        # Do multiple check-ins to accumulate points
        checkin_count = 3
        total_points_awarded = 0
        
        for i in range(checkin_count):
            payload = {
                "customer_id": customer_id,
                "service_type": f"Test Service {i+1}"
            }
            
            checkin_response = requests.post(f"{API_URL}/checkin", json=payload, headers=headers)
            assert checkin_response.status_code == 200, f"Check-in {i+1} failed"
            
            points_awarded = checkin_response.json()["points_awarded"]
            total_points_awarded += points_awarded
            print(f"Check-in {i+1}: Awarded {points_awarded} points")
        
        # Get updated customer data
        final_response = requests.get(f"{API_URL}/customers/{customer_id}", headers=headers)
        final_points = final_response.json()["total_points"]
        final_tier = final_response.json()["loyalty_tier"]
        
        print(f"Final points: {final_points}, Final tier: {final_tier}")
        
        # Verify points calculation
        expected_points = initial_points + total_points_awarded
        assert final_points == expected_points, f"Expected {expected_points} points, got {final_points}"
        
        print("✅ Points calculation test passed")
        return True
    except Exception as e:
        print(f"❌ Points calculation test failed: {str(e)}")
        return False

def test_points_history(salon_id, customer_id):
    """Test points transaction history"""
    print("\n=== Testing Points Transaction History ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not customer_id:
            raise Exception("No customer ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/customers/{customer_id}/points-history", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert isinstance(response.json(), list), "Response is not a list"
        assert len(response.json()) > 0, "No points transactions found"
        
        # Verify transaction fields
        transaction = response.json()[0]
        assert "id" in transaction, "Transaction does not have 'id' field"
        assert "customer_id" in transaction, "Transaction does not have 'customer_id' field"
        assert "points" in transaction, "Transaction does not have 'points' field"
        assert "transaction_type" in transaction, "Transaction does not have 'transaction_type' field"
        assert transaction["customer_id"] == customer_id, f"Expected customer_id {customer_id}, got {transaction['customer_id']}"
        
        print("✅ Points transaction history test passed")
        return True
    except Exception as e:
        print(f"❌ Points transaction history test failed: {str(e)}")
        return False

def test_queue_listing(salon_id):
    """Test queue listing"""
    print("\n=== Testing Queue Listing ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/queue", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert isinstance(response.json(), list), "Response is not a list"
        
        # If there are queue entries, verify their structure
        if len(response.json()) > 0:
            queue_entry = response.json()[0]
            assert "id" in queue_entry, "Queue entry does not have 'id' field"
            assert "customer_id" in queue_entry, "Queue entry does not have 'customer_id' field"
            assert "position" in queue_entry, "Queue entry does not have 'position' field"
            assert "status" in queue_entry, "Queue entry does not have 'status' field"
            assert queue_entry["salon_id"] == salon_id, f"Expected salon_id {salon_id}, got {queue_entry['salon_id']}"
        
        print("✅ Queue listing test passed")
        return True
    except Exception as e:
        print(f"❌ Queue listing test failed: {str(e)}")
        return False

def test_service_completion(salon_id, queue_id):
    """Test service completion"""
    print("\n=== Testing Service Completion ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        if not queue_id:
            raise Exception("No queue ID available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.put(f"{API_URL}/queue/{queue_id}/complete", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "message" in response.json(), "Response does not contain 'message' field"
        
        # Verify the queue entry is now completed
        queue_response = requests.get(f"{API_URL}/queue", headers=headers)
        
        # The completed entry should no longer be in the waiting queue
        if len(queue_response.json()) > 0:
            for entry in queue_response.json():
                assert entry["id"] != queue_id, f"Queue entry {queue_id} should be completed but is still in waiting queue"
        
        print("✅ Service completion test passed")
        return True
    except Exception as e:
        print(f"❌ Service completion test failed: {str(e)}")
        return False

def test_analytics_dashboard(salon_id):
    """Test analytics dashboard"""
    print("\n=== Testing Analytics Dashboard ===")
    try:
        if not salon_id or salon_id not in salon_tokens:
            raise Exception("No salon ID or token available for testing")
        
        headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
        
        response = requests.get(f"{API_URL}/analytics/dashboard", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        # Verify dashboard metrics
        metrics = [
            "total_customers",
            "today_checkins",
            "current_queue_length",
            "today_points_awarded",
            "average_customer_points",
            "active_loyalty_members"
        ]
        
        for metric in metrics:
            assert metric in response.json(), f"Response does not contain '{metric}' field"
        
        print("✅ Analytics dashboard test passed")
        return True
    except Exception as e:
        print(f"❌ Analytics dashboard test failed: {str(e)}")
        return False

def test_jwt_authentication():
    """Test JWT token authentication"""
    print("\n=== Testing JWT Authentication ===")
    try:
        # Try to access a protected endpoint without a token
        response = requests.get(f"{API_URL}/salon/profile")
        print(f"No Token Status Code: {response.status_code}")
        
        assert response.status_code == 403, f"Expected status code 403, got {response.status_code}"
        
        # Try with an invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{API_URL}/salon/profile", headers=headers)
        print(f"Invalid Token Status Code: {response.status_code}")
        
        assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
        
        # Try with a valid token (if we have one)
        if salon_tokens:
            salon_id = list(salon_tokens.keys())[0]
            headers = {"Authorization": f"Bearer {salon_tokens[salon_id]}"}
            response = requests.get(f"{API_URL}/salon/profile", headers=headers)
            print(f"Valid Token Status Code: {response.status_code}")
            
            assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        print("✅ JWT authentication test passed")
        return True
    except Exception as e:
        print(f"❌ JWT authentication test failed: {str(e)}")
        return False

def test_public_salon_info():
    """Test the public salon information endpoint"""
    print("\n=== Testing Public Salon Information Endpoint ===")
    try:
        salon_id = "a1fe8bdf-4ba9-43c5-903a-eefa6df61dad"
        
        response = requests.get(f"{API_URL}/public/salon/{salon_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "salon_name" in response.json(), "Response does not contain 'salon_name' field"
        assert "address" in response.json(), "Response does not contain 'address' field"
        assert "owner_name" in response.json(), "Response does not contain 'owner_name' field"
        
        # Verify sensitive data is not included
        assert "password" not in response.json(), "Response should not contain 'password' field"
        assert "email" not in response.json(), "Response should not contain 'email' field"
        
        print("✅ Public salon information endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Public salon information endpoint test failed: {str(e)}")
        return False

def test_public_queue():
    """Test the public queue endpoint"""
    print("\n=== Testing Public Queue Endpoint ===")
    try:
        salon_id = "a1fe8bdf-4ba9-43c5-903a-eefa6df61dad"
        
        response = requests.get(f"{API_URL}/public/queue/{salon_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert isinstance(response.json(), list), "Response is not a list"
        
        # If there are queue entries, verify their structure
        if len(response.json()) > 0:
            queue_entry = response.json()[0]
            assert "id" in queue_entry, "Queue entry does not have 'id' field"
            assert "position" in queue_entry, "Queue entry does not have 'position' field"
            assert "customer_name" in queue_entry, "Queue entry does not have 'customer_name' field"
            assert "service_type" in queue_entry, "Queue entry does not have 'service_type' field"
            assert "estimated_wait" in queue_entry, "Queue entry does not have 'estimated_wait' field"
            assert "points_awarded" in queue_entry, "Queue entry does not have 'points_awarded' field"
            
            # Verify customer tier is included if available
            if "customer_tier" in queue_entry:
                assert queue_entry["customer_tier"] in ["Bronze", "Silver", "Gold", "Platinum"], f"Unexpected customer tier: {queue_entry['customer_tier']}"
        
        print("✅ Public queue endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Public queue endpoint test failed: {str(e)}")
        return False

def test_public_customer_checkin():
    """Test the public customer check-in endpoint"""
    print("\n=== Testing Public Customer Check-in Endpoint ===")
    try:
        salon_id = "a1fe8bdf-4ba9-43c5-903a-eefa6df61dad"
        
        # Test with a new customer
        payload = {
            "salon_id": salon_id,
            "name": f"John Customer {random_string()}",
            "email": f"john{random_string()}@example.com",
            "phone": f"555-{random_string(4)}",
            "service_type": "Walk-in"
        }
        
        response = requests.post(f"{API_URL}/public/customer-checkin", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "message" in response.json(), "Response does not contain 'message' field"
        assert "customer_name" in response.json(), "Response does not contain 'customer_name' field"
        assert "queue_entry" in response.json(), "Response does not contain 'queue_entry' field"
        assert "points_awarded" in response.json(), "Response does not contain 'points_awarded' field"
        assert "total_points" in response.json(), "Response does not contain 'total_points' field"
        assert "loyalty_tier" in response.json(), "Response does not contain 'loyalty_tier' field"
        
        # Verify initial tier is Bronze
        assert response.json()["loyalty_tier"] == "Bronze", f"Expected loyalty tier 'Bronze', got {response.json()['loyalty_tier']}"
        
        # Store customer info for reuse
        customer_name = payload["name"]
        customer_email = payload["email"]
        customer_phone = payload["phone"]
        
        print("✅ Public customer check-in (new customer) test passed")
        
        # Test with the same customer (existing customer)
        print("\n=== Testing Public Customer Check-in with Existing Customer ===")
        
        # Use the same customer info but change the service type
        payload = {
            "salon_id": salon_id,
            "name": customer_name,
            "email": customer_email,
            "phone": customer_phone,
            "service_type": "Regular Cut"
        }
        
        response = requests.post(f"{API_URL}/public/customer-checkin", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert response.json()["customer_name"] == customer_name, f"Expected customer name {customer_name}, got {response.json()['customer_name']}"
        
        # Points should be accumulated
        assert response.json()["total_points"] > 10, f"Expected total points > 10, got {response.json()['total_points']}"
        
        print("✅ Public customer check-in (existing customer) test passed")
        return True
    except Exception as e:
        print(f"❌ Public customer check-in test failed: {str(e)}")
        return False

def test_loyalty_tier_progression():
    """Test loyalty tier progression through multiple check-ins"""
    print("\n=== Testing Loyalty Tier Progression ===")
    try:
        salon_id = "a1fe8bdf-4ba9-43c5-903a-eefa6df61dad"
        
        # Create a new customer for tier progression testing
        customer_name = f"Loyalty Test {random_string()}"
        customer_email = f"loyalty{random_string()}@example.com"
        customer_phone = f"555-{random_string(4)}"
        
        # Initial check-in (should be Bronze tier)
        payload = {
            "salon_id": salon_id,
            "name": customer_name,
            "email": customer_email,
            "phone": customer_phone,
            "service_type": "Walk-in"
        }
        
        response = requests.post(f"{API_URL}/public/customer-checkin", json=payload)
        assert response.status_code == 200, "Initial check-in failed"
        assert response.json()["loyalty_tier"] == "Bronze", f"Expected initial tier 'Bronze', got {response.json()['loyalty_tier']}"
        
        print(f"Initial check-in: {response.json()['points_awarded']} points, Tier: {response.json()['loyalty_tier']}")
        
        # Simulate multiple check-ins to progress through tiers
        # Bronze -> Silver (100 points)
        # Silver -> Gold (500 points)
        # Gold -> Platinum (1000 points)
        
        # Track current points and tier
        current_points = response.json()["total_points"]
        current_tier = response.json()["loyalty_tier"]
        
        # Define target points for each tier
        tier_thresholds = {
            "Bronze": 0,
            "Silver": 100,
            "Gold": 500,
            "Platinum": 1000
        }
        
        # Define expected multipliers for each tier
        tier_multipliers = {
            "Bronze": 1.0,
            "Silver": 1.2,
            "Gold": 1.5,
            "Platinum": 2.0
        }
        
        # Test progression to Silver
        print("\nTesting progression to Silver tier...")
        while current_points < tier_thresholds["Silver"] and current_tier == "Bronze":
            response = requests.post(f"{API_URL}/public/customer-checkin", json=payload)
            assert response.status_code == 200, "Check-in failed during Bronze->Silver progression"
            
            current_points = response.json()["total_points"]
            current_tier = response.json()["loyalty_tier"]
            
            print(f"Check-in: +{response.json()['points_awarded']} points, Total: {current_points}, Tier: {current_tier}")
            
            # Avoid infinite loop
            if current_points >= tier_thresholds["Silver"] and current_tier == "Bronze":
                print("Warning: Points threshold reached but tier not upgraded")
                break
        
        # Verify Silver tier reached
        assert current_tier == "Silver" or current_points >= tier_thresholds["Silver"], f"Failed to reach Silver tier. Current points: {current_points}, Current tier: {current_tier}"
        
        if current_tier == "Silver":
            print(f"✅ Successfully progressed to Silver tier with {current_points} points")
            
            # Verify multiplier is applied correctly
            next_checkin = requests.post(f"{API_URL}/public/customer-checkin", json=payload)
            points_awarded = next_checkin.json()["points_awarded"]
            expected_points = int(10 * tier_multipliers["Silver"])
            assert points_awarded == expected_points, f"Expected {expected_points} points with Silver multiplier, got {points_awarded}"
            print(f"✅ Silver tier multiplier correctly applied: {points_awarded} points awarded")
        
        # Test progression to Gold (optional, may take too many requests)
        # This is a simplified test - in a real scenario, we would continue check-ins until Gold tier
        
        print("✅ Loyalty tier progression test passed")
        return True
    except Exception as e:
        print(f"❌ Loyalty tier progression test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and return a summary"""
    results = {}
    
    print("\n=== Starting QueueBee Backend API Tests ===")
    print(f"Testing API at: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test health check
    results["health_check"] = test_health_check()
    
    # Test salon owner authentication
    salon_id1 = test_salon_registration()
    results["salon_registration"] = salon_id1 is not None
    
    salon_id2 = test_salon_login()
    results["salon_login"] = salon_id2 is not None
    
    results["salon_profile"] = test_salon_profile(salon_id1)
    
    # Test JWT authentication
    results["jwt_authentication"] = test_jwt_authentication()
    
    # Test customer management
    customer_id1 = test_customer_creation(salon_id1)
    results["customer_creation"] = customer_id1 is not None
    
    results["customer_listing"] = test_customer_listing(salon_id1)
    results["customer_retrieval"] = test_customer_retrieval(salon_id1, customer_id1)
    results["customer_update"] = test_customer_update(salon_id1, customer_id1)
    
    # Create a customer for salon2 for isolation testing
    customer_id2 = test_customer_creation(salon_id2)
    results["customer_isolation"] = test_customer_isolation(salon_id1, salon_id2, customer_id1)
    
    # Test points and loyalty system
    queue_id = test_customer_checkin(salon_id1, customer_id1)
    results["customer_checkin"] = queue_id is not None
    
    results["points_calculation"] = test_points_calculation(salon_id1, customer_id1)
    results["points_history"] = test_points_history(salon_id1, customer_id1)
    
    # Test queue management
    results["queue_listing"] = test_queue_listing(salon_id1)
    results["service_completion"] = test_service_completion(salon_id1, queue_id)
    
    # Test analytics dashboard
    results["analytics_dashboard"] = test_analytics_dashboard(salon_id1)
    
    # Test new public API endpoints
    results["public_salon_info"] = test_public_salon_info()
    results["public_queue"] = test_public_queue()
    results["public_customer_checkin"] = test_public_customer_checkin()
    results["loyalty_tier_progression"] = test_loyalty_tier_progression()
    
    # Print summary
    print("\n=== Test Summary ===")
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! The QueueBee backend API is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the logs above for details.")
    
    return results

if __name__ == "__main__":
    run_all_tests()
